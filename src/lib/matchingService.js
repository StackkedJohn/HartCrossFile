import { supabase } from './supabase'

/**
 * Process an uploaded file and run matching
 * @param {File} file - The uploaded file
 * @param {Array} parsedData - Parsed Excel data (array of arrays, first row is headers)
 * @returns {Object} - Upload record with match results
 */
export async function processUpload(file, parsedData, customerInfo = {}) {
  // 1. Find the header row (McKesson reports have metadata rows at top)
  // Look for a row that contains "Item" and "Mfr" or "Description"
  let headerRowIndex = 0
  
  for (let i = 0; i < Math.min(parsedData.length, 20); i++) {
    const row = parsedData[i]
    const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ')
    
    // Check if this row looks like headers
    if ((rowText.includes('item') && rowText.includes('mfr')) || 
        (rowText.includes('description') && rowText.includes('uom')) ||
        (rowText.includes('manufacturer') && rowText.includes('cost'))) {
      headerRowIndex = i
      console.log('Found header row at index:', i)
      break
    }
  }

  const rawHeaders = parsedData[headerRowIndex]
  const headers = rawHeaders.map(h => String(h || '').toLowerCase().trim().replace(/[^a-z0-9%]/g, ''))
  
  console.log('Raw headers:', rawHeaders)
  console.log('Normalized headers:', headers)

  const dataRows = parsedData.slice(headerRowIndex + 1)

  // Helper to find column by multiple possible patterns
  const findCol = (...patterns) => {
    return headers.findIndex(h => patterns.some(p => h.includes(p)))
  }

  // Map column indices - more flexible matching
  const colMap = {
    itemNumber: findCol('item#', 'itemno', 'itemnumber', 'itemnum', 'item'),
    manufacturer: findCol('manufacturer'),
    mfrNumber: findCol('mfr#', 'mfr', 'mfrno', 'mfrnumber', 'manufactureritem', 'partno', 'part#', 'sku'),
    description: findCol('description', 'desc', 'itemdesc', 'productname'),
    contents: findCol('contents', 'content'),
    uom: findCol('uom', 'unitofmeasure', 'unit'),
    shipQty: findCol('shipqty', 'totalshipqty', 'qty', 'quantity'),
    costPerUnit: findCol('costperunit', 'unitcost', 'cost', 'price', 'unitprice'),
    totalExtPurchase: findCol('totalext', 'extpurchase', 'totalpurchase', 'extended'),
    percentTotal: findCol('%total', 'percent', '%'),
    invoiceCount: findCol('invoicecount', 'invoice', 'invcount'),
  }

  console.log('Column mapping:', colMap)

  // 2. Create upload record
  const { data: upload, error: uploadError } = await supabase
    .from('uploads')
    .insert({
      filename: file.name,
      original_filename: file.name,
      row_count: dataRows.length,
      status: 'matching',
      customer_name: customerInfo.customerName || null,
      customer_position: customerInfo.customerPosition || null,
      company_name: customerInfo.companyName || null
    })
    .select()
    .single()

  if (uploadError) {
    console.error('Error creating upload:', uploadError)
    throw uploadError
  }

  // 3. Process each row and insert into upload_items
  const filteredRows = dataRows.filter(row => row.some(cell => cell !== undefined && cell !== ''))
  
  // Log first row for debugging
  if (filteredRows.length > 0) {
    console.log('First data row (raw):', filteredRows[0])
    console.log('Mfr # column index:', colMap.mfrNumber)
    console.log('Mfr # value from first row:', filteredRows[0][colMap.mfrNumber])
    console.log('Description column index:', colMap.description)
    console.log('Description value from first row:', filteredRows[0][colMap.description])
  }

  const uploadItems = filteredRows.map(row => ({
      upload_id: upload.id,
      item_number: colMap.itemNumber >= 0 ? String(row[colMap.itemNumber] ?? '') : null,
      manufacturer: colMap.manufacturer >= 0 ? String(row[colMap.manufacturer] ?? '') : null,
      mfr_number: colMap.mfrNumber >= 0 ? String(row[colMap.mfrNumber] ?? '').trim() : null,
      description: colMap.description >= 0 ? String(row[colMap.description] ?? '') : null,
      contents: colMap.contents >= 0 ? String(row[colMap.contents] ?? '') : null,
      uom: colMap.uom >= 0 ? String(row[colMap.uom] ?? '') : null,
      ship_qty: colMap.shipQty >= 0 ? parseFloat(row[colMap.shipQty]) || 0 : 0,
      cost_per_unit: colMap.costPerUnit >= 0 ? parseFloat(row[colMap.costPerUnit]) || 0 : 0,
      total_ext_purchase: colMap.totalExtPurchase >= 0 ? parseFloat(row[colMap.totalExtPurchase]) || 0 : 0,
      percent_total_purchases: colMap.percentTotal >= 0 ? parseFloat(row[colMap.percentTotal]) || 0 : 0,
      invoice_count: colMap.invoiceCount >= 0 ? parseInt(row[colMap.invoiceCount]) || 0 : 0,
      match_status: 'pending',
      match_confidence: 0
    }))

  // Insert in batches of 100
  const batchSize = 100
  for (let i = 0; i < uploadItems.length; i += batchSize) {
    const batch = uploadItems.slice(i, i + batchSize)
    const { error: itemsError } = await supabase
      .from('upload_items')
      .insert(batch)

    if (itemsError) {
      console.error('Error inserting items:', itemsError)
      throw itemsError
    }
  }

  // 4. Enrich from McKesson master catalog
  await enrichFromCatalog(upload.id)

  // 5. Run matching
  await runMatching(upload.id)

  // 6. Update upload status
  const { data: updatedUpload } = await supabase
    .from('uploads')
    .update({ status: 'review' })
    .eq('id', upload.id)
    .select()
    .single()

  return updatedUpload
}

/**
 * Normalize a unit of measure string for comparison
 * @param {string} uom - The raw UOM string
 * @returns {string} - Normalized UOM
 */
function normalizeUOM(uom) {
  if (!uom) return ''
  const s = uom.toLowerCase().trim()

  // Map common abbreviations to canonical forms
  const aliases = {
    'ea': 'each', 'each': 'each',
    'bx': 'box', 'box': 'box',
    'cs': 'case', 'case': 'case',
    'pk': 'pack', 'pack': 'pack', 'pkg': 'pack', 'package': 'pack',
    'bt': 'bottle', 'btl': 'bottle', 'bottle': 'bottle',
    'bg': 'bag', 'bag': 'bag',
    'rl': 'roll', 'roll': 'roll',
    'tb': 'tube', 'tube': 'tube',
    'ct': 'count', 'count': 'count',
    'dz': 'dozen', 'dozen': 'dozen',
    'pr': 'pair', 'pair': 'pair',
    'vl': 'vial', 'vial': 'vial',
    'can': 'can', 'cn': 'can',
    'kt': 'kit', 'kit': 'kit',
    'sy': 'syringe', 'syringe': 'syringe',
  }

  return aliases[s] || s
}

/**
 * Enrich upload items from the McKesson master catalog.
 * Matches on item_number → mckesson_id to pull in full product name,
 * category, brand, and manufacturer SKU for better Hart matching.
 * @param {string} uploadId - The upload ID to enrich
 */
async function enrichFromCatalog(uploadId) {
  // Get all items for this upload
  const { data: items, error: itemsError } = await supabase
    .from('upload_items')
    .select('id, item_number, mfr_number, description')
    .eq('upload_id', uploadId)

  if (itemsError) {
    console.error('Error fetching items for enrichment:', itemsError)
    throw itemsError
  }

  // Collect unique item numbers for batch lookup
  const itemNumbers = [...new Set(
    items.map(i => i.item_number).filter(n => n && n.trim() !== '')
  )].map(n => parseInt(n)).filter(n => !isNaN(n))

  if (itemNumbers.length === 0) {
    console.log('No valid item numbers found for enrichment, skipping')
    return
  }

  // Batch fetch from mckesson_catalog (Supabase .in() supports up to ~1000 items)
  const catalogMap = new Map()
  const batchSize = 500
  for (let i = 0; i < itemNumbers.length; i += batchSize) {
    const batch = itemNumbers.slice(i, i + batchSize)
    const { data: catalogItems, error: catalogError } = await supabase
      .from('mckesson_catalog')
      .select('mckesson_id, name, short_description, manufacturer, manufacturer_sku, brand, category, all_specifications')
      .in('mckesson_id', batch)

    if (catalogError) {
      console.error('Error fetching catalog items:', catalogError)
      continue
    }

    catalogItems.forEach(c => {
      catalogMap.set(c.mckesson_id, c)
    })
  }

  console.log(`Enrichment: ${catalogMap.size} of ${itemNumbers.length} items found in McKesson catalog`)

  // Update each item with enriched data
  let enrichedCount = 0
  for (const item of items) {
    const itemNum = parseInt(item.item_number)
    if (isNaN(itemNum)) continue

    const catalog = catalogMap.get(itemNum)
    if (!catalog) continue

    const updates = {
      mckesson_catalog_id: catalog.mckesson_id,
      enriched_name: catalog.name,
      enriched_description: catalog.short_description,
      enriched_manufacturer: catalog.manufacturer,
      enriched_brand: catalog.brand,
      enriched_category: catalog.category
    }

    // Store structured specifications for spec-based matching
    if (catalog.all_specifications) {
      updates.enriched_specs = catalog.all_specifications
    }

    // If the upload had no mfr_number but the catalog has one, fill it in
    if (!item.mfr_number && catalog.manufacturer_sku) {
      updates.mfr_number = catalog.manufacturer_sku
      updates.enriched_manufacturer_sku = catalog.manufacturer_sku
    } else {
      updates.enriched_manufacturer_sku = catalog.manufacturer_sku
    }

    await supabase
      .from('upload_items')
      .update(updates)
      .eq('id', item.id)

    enrichedCount++
  }

  console.log(`Enrichment complete: ${enrichedCount} items enriched`)
}

/**
 * Parse product specifications from McKesson catalog JSON
 * @param {Object} specs - The all_specifications JSON from mckesson_catalog
 * @returns {Object} - Normalized specification object
 */
export function parseSpecsFromCatalog(specs) {
  if (!specs) return {}

  const parsed = {}

  // Application / product type (most important)
  if (specs.Application) {
    parsed.application = specs.Application.toLowerCase().trim()
  }

  // Gauge (needles, catheters)
  if (specs.Gauge) {
    const gaugeMatch = specs.Gauge.match(/(\d+)/)
    if (gaugeMatch) parsed.gauge = gaugeMatch[1]
  }

  // Length
  if (specs.Length) {
    parsed.length = specs.Length.toLowerCase().replace(/\s+length$/i, '').trim()
  }

  // Size
  if (specs.Size) {
    parsed.size = specs.Size.toLowerCase().trim()
  }

  // Volume
  if (specs.Volume) {
    parsed.volume = specs.Volume.toLowerCase().trim()
  }

  // Material
  if (specs.Material) {
    parsed.material = specs.Material.toLowerCase().trim()
  }

  // Type
  if (specs.Type) {
    parsed.type = specs.Type.toLowerCase().trim()
  }

  // For Use With
  if (specs['For Use With']) {
    parsed.forUseWith = specs['For Use With'].toLowerCase().trim()
  }

  return parsed
}

/**
 * Parse product specifications from free text (Hart product descriptions)
 * @param {string} text - Product name + description text
 * @returns {Object} - Extracted specification object
 */
export function parseSpecsFromText(text) {
  if (!text) return {}
  const t = text.toLowerCase()
  const parsed = {}

  // Application / product type - detect from common medical product keywords
  const typePatterns = [
    [/\bneedle\b/, 'needle'],
    [/\bsyringe\b/, 'syringe'],
    [/\bglove\b/, 'glove'],
    [/\bgown\b/, 'gown'],
    [/\bmask\b/, 'mask'],
    [/\bbandage\b/, 'bandage'],
    [/\bgauze\b/, 'gauze'],
    [/\bdressing\b/, 'dressing'],
    [/\bcatheter\b/, 'catheter'],
    [/\bsuture\b/, 'suture'],
    [/\bscalpel\b/, 'scalpel'],
    [/\bsplint\b/, 'splint'],
    [/\btubing\b/, 'tubing'],
    [/\bdrain(?:age)?\b/, 'drainage'],
    [/\belectrode\b/, 'electrode'],
    [/\btest\s*kit\b/, 'test kit'],
    [/\bswab\b/, 'swab'],
    [/\bspecula\b/, 'specula'],
    [/\botoscope\b/, 'otoscope'],
    [/\bthermometer\b/, 'thermometer'],
    [/\boximeter\b/, 'oximeter'],
    [/\bsphyg\b/, 'sphygmomanometer'],
    [/\bstethoscope\b/, 'stethoscope'],
    [/\bwrap\b/, 'wrap'],
    [/\btape\b/, 'tape'],
    [/\bcleanser\b/, 'cleanser'],
    [/\bantiseptic\b/, 'antiseptic'],
    [/\bextension set\b/, 'extension set'],
    [/\biv set\b/, 'iv set'],
    [/\bcollection set\b/, 'collection set'],
    [/\bblood collection\b/, 'blood collection'],
    [/\banalyzer\b/, 'analyzer'],
    [/\bcuvette\b/, 'cuvette'],
    [/\btray\b/, 'tray'],
  ]

  for (const [pattern, typeName] of typePatterns) {
    if (pattern.test(t)) {
      parsed.application = typeName
      break
    }
  }

  // Gauge: "18G", "18 gauge", "18gx1"
  const gaugeMatch = t.match(/\b(\d{1,2})\s*g(?:auge)?(?:\s*x|\b)/i)
  if (gaugeMatch) parsed.gauge = gaugeMatch[1]

  // Length: "1 inch", '1"', "1-1/2 inch", "1.5 inch", '1½"'
  const lengthMatch = t.match(/(\d+(?:[-.]\d+(?:\/\d+)?)?)\s*(?:inch|in\b|"|''|½)/)
  if (lengthMatch) parsed.length = lengthMatch[0].trim()

  // Size: small, medium, large, XL, etc.
  const sizeMatch = t.match(/\b(x{0,2}(?:small|sm|s|medium|med|m|large|lg|l|xl))\b/i)
  if (sizeMatch) {
    const sizeMap = {
      's': 'small', 'sm': 'small', 'small': 'small',
      'm': 'medium', 'med': 'medium', 'medium': 'medium',
      'l': 'large', 'lg': 'large', 'large': 'large',
      'xl': 'x-large', 'xxl': 'xx-large',
    }
    parsed.size = sizeMap[sizeMatch[1].toLowerCase()] || sizeMatch[1].toLowerCase()
  }

  // Volume: "4oz", "500ml", "1 liter"
  const volMatch = t.match(/(\d+(?:\.\d+)?)\s*(oz|ml|cc|liter|litre|gal)/i)
  if (volMatch) parsed.volume = `${volMatch[1]}${volMatch[2].toLowerCase()}`

  // Count per pack: "100/bx", "50/cs", "30/pk"
  const countMatch = t.match(/(\d+)\s*\/\s*(bx|cs|pk|bg|kt|bt|rl)/i)
  if (countMatch) parsed.count = `${countMatch[1]}/${countMatch[2].toLowerCase()}`

  // Material keywords
  const materialPatterns = [
    [/\bnitrile\b/, 'nitrile'], [/\blatex\b/, 'latex'], [/\bvinyl\b/, 'vinyl'],
    [/\bsilicone\b/, 'silicone'], [/\bpolyester\b/, 'polyester'], [/\bnylon\b/, 'nylon'],
    [/\bstainless\s*steel\b/, 'stainless steel'], [/\bpolypropylene\b/, 'polypropylene'],
  ]
  for (const [pattern, mat] of materialPatterns) {
    if (pattern.test(t)) { parsed.material = mat; break }
  }

  return parsed
}

/**
 * Score how well two specification sets match for comparable product matching.
 * Returns 0 if product types don't match (mandatory filter).
 * @param {Object} sourceSpecs - Specs from the McKesson item (enriched)
 * @param {Object} hartSpecs - Specs parsed from Hart product text
 * @returns {number} - Score from 0-95
 */
export function scoreSpecMatch(sourceSpecs, hartSpecs) {
  // If neither has an application/type, fall back
  if (!sourceSpecs.application && !hartSpecs.application) return 0

  // Application/type MUST match — this is the mandatory filter
  if (sourceSpecs.application && hartSpecs.application) {
    // Check if the product types are compatible
    const srcApp = sourceSpecs.application
    const hartApp = hartSpecs.application

    // Direct match or one contains the other
    const typeMatch = srcApp === hartApp ||
      srcApp.includes(hartApp) || hartApp.includes(srcApp)

    if (!typeMatch) return 0
  } else {
    // One side has no application — can't confirm type match
    return 0
  }

  // Base score for matching product type
  let score = 40
  let totalPossibleBonus = 0
  let earnedBonus = 0

  // Gauge match (critical for needles, catheters)
  if (sourceSpecs.gauge) {
    totalPossibleBonus += 20
    if (hartSpecs.gauge === sourceSpecs.gauge) {
      earnedBonus += 20
    }
  }

  // Length match
  if (sourceSpecs.length) {
    totalPossibleBonus += 10
    if (hartSpecs.length && hartSpecs.length.includes(sourceSpecs.length.replace(/\s+/g, ''))) {
      earnedBonus += 10
    }
  }

  // Size match (gloves, gowns)
  if (sourceSpecs.size) {
    totalPossibleBonus += 20
    if (hartSpecs.size === sourceSpecs.size) {
      earnedBonus += 20
    }
  }

  // Volume match
  if (sourceSpecs.volume) {
    totalPossibleBonus += 15
    if (hartSpecs.volume === sourceSpecs.volume) {
      earnedBonus += 15
    }
  }

  // Material match
  if (sourceSpecs.material) {
    totalPossibleBonus += 10
    if (hartSpecs.material === sourceSpecs.material) {
      earnedBonus += 10
    }
  }

  // Count/pack match
  if (sourceSpecs.count) {
    totalPossibleBonus += 10
    if (hartSpecs.count === sourceSpecs.count) {
      earnedBonus += 10
    }
  }

  // If we had specs to compare, scale the bonus
  if (totalPossibleBonus > 0) {
    score += Math.round((earnedBonus / totalPossibleBonus) * 55)
  }

  return Math.min(score, 95)
}

/**
 * Run matching logic for all items in an upload
 * @param {string} uploadId - The upload ID to process
 */
async function runMatching(uploadId) {
  // Get all items for this upload
  const { data: items, error: itemsError } = await supabase
    .from('upload_items')
    .select('*')
    .eq('upload_id', uploadId)

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
    throw itemsError
  }

  // Get unique mfr_numbers to match (include enriched_manufacturer_sku since it may
  // differ from the raw mfr_number and is what approved matches are keyed by)
  const mfrNumbers = [...new Set(
    items.flatMap(i => [i.mfr_number, i.enriched_manufacturer_sku]).filter(Boolean)
  )]

  // Fetch all products that might match by mfr_number (batch query)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, manufacturer_item_code, manufacturer_name, product_name, item_description, packing_list_description, unit_price, package_type')
    .in('manufacturer_item_code', mfrNumbers)

  if (productsError) {
    console.error('Error fetching products:', productsError)
    throw productsError
  }

  // Create lookup map for products by manufacturer_item_code
  // Store arrays since the same mfr code may have multiple package types
  const productMap = new Map()
  products.forEach(p => {
    const existing = productMap.get(p.manufacturer_item_code) || []
    existing.push(p)
    productMap.set(p.manufacturer_item_code, existing)
  })

  // Fetch approved matches
  const { data: approvedMatches, error: approvedError } = await supabase
    .from('approved_matches')
    .select('*')
    .in('mckesson_mfr_number', mfrNumbers)

  if (approvedError) {
    console.error('Error fetching approved matches:', approvedError)
  }

  // Create lookup map for approved matches
  const approvedMap = new Map()
  if (approvedMatches) {
    approvedMatches.forEach(m => {
      approvedMap.set(m.mckesson_mfr_number, m)
    })
  }

  // Fetch ALL Hart products for comparable matching (Tier 2)
  const { data: allProducts, error: allProductsError } = await supabase
    .from('products')
    .select('id, manufacturer_item_code, product_name, item_description, packing_list_description, unit_price, package_type')
    .eq('is_active', true)

  if (allProductsError) {
    console.error('Error fetching all products:', allProductsError)
  }

  // Pre-parse specs for all Hart products (do once, not per-item)
  const hartProductSpecs = (allProducts || []).map(p => ({
    product: p,
    specs: parseSpecsFromText(`${p.product_name} ${p.item_description || ''} ${p.packing_list_description || ''}`)
  }))

  // Match each item
  let matchedCount = 0
  let reviewCount = 0

  for (const item of items) {
    let matchStatus = 'no_match'
    let matchedProductId = null
    let matchConfidence = 0
    let matchNotes = null

    // Resolve the effective manufacturer identifier
    // enriched_manufacturer_sku comes from the McKesson catalog and is what approved_matches stores
    const effectiveMfr = item.mfr_number || item.enriched_manufacturer_sku

    // Pre-approved matches take priority (admin override)
    if (effectiveMfr) {
      const approved = approvedMap.get(effectiveMfr) ||
        (item.enriched_manufacturer_sku && item.enriched_manufacturer_sku !== effectiveMfr
          ? approvedMap.get(item.enriched_manufacturer_sku) : null)
      if (approved) {
        matchStatus = 'pre_approved'
        matchedProductId = approved.hart_product_id
        matchConfidence = 100
        matchNotes = 'Pre-approved match'
        matchedCount++
      }
    }

    // Tier 1: Exact match on manufacturer_item_code (Mfr #)
    if (matchStatus === 'no_match' && effectiveMfr) {
      let exactMatches = productMap.get(effectiveMfr)

      // Also try enriched_manufacturer_sku if it differs from the raw mfr_number
      if (!exactMatches && item.enriched_manufacturer_sku && item.enriched_manufacturer_sku !== effectiveMfr) {
        exactMatches = productMap.get(item.enriched_manufacturer_sku)
      }

      // Validate manufacturer to prevent cross-manufacturer collisions
      // (e.g., mfr# "7109" used by both Dynrex and Ascensia for different products)
      let manufacturerMismatch = false
      if (exactMatches && exactMatches.length > 0 && item.enriched_manufacturer) {
        const uploadMfr = item.enriched_manufacturer.toLowerCase()
        const mfrFiltered = exactMatches.filter(p => {
          if (!p.manufacturer_name) return true // can't verify, keep it
          const hartMfr = p.manufacturer_name.toLowerCase()
          // Check if manufacturer names overlap (handles "BD" vs "Becton Dickinson", etc.)
          return hartMfr.includes(uploadMfr) || uploadMfr.includes(hartMfr) ||
            // Also check first word match for abbreviated names
            hartMfr.split(/\s+/)[0] === uploadMfr.split(/\s+/)[0]
        })
        if (mfrFiltered.length > 0) {
          exactMatches = mfrFiltered
        } else {
          // Manufacturer names don't match via simple comparison, but SKU does.
          // Keep the match for review rather than discarding entirely — handles
          // cases like "BD" vs "Becton Dickinson" that string matching can't resolve.
          manufacturerMismatch = true
        }
      }

      if (exactMatches && exactMatches.length > 0) {
        if (manufacturerMismatch) {
          // SKU matches but manufacturer name seems different — flag for review
          const bestProduct = exactMatches[0]
          matchStatus = 'fuzzy'
          matchedProductId = bestProduct.id
          matchConfidence = 85
          matchNotes = `Mfr code match but manufacturer name mismatch (upload: ${item.enriched_manufacturer}, Hart: ${bestProduct.manufacturer_name || 'N/A'}) — verify correct product`
          reviewCount++
        } else {
          const itemUOM = normalizeUOM(item.uom)

          // Prefer product whose package_type matches the upload UOM
          let bestProduct = null
          let uomMatched = false

          if (itemUOM) {
            bestProduct = exactMatches.find(p => normalizeUOM(p.package_type) === itemUOM)
            if (bestProduct) uomMatched = true
          }

          // Fall back to first product if no UOM match found
          if (!bestProduct) bestProduct = exactMatches[0]

          if (uomMatched) {
            matchStatus = 'exact'
            matchedProductId = bestProduct.id
            matchConfidence = 100
            matchNotes = 'Exact manufacturer item code match (UOM verified)'
            matchedCount++
          } else {
            // Mfr code matches but UOM doesn't — flag for review
            matchStatus = 'fuzzy'
            matchedProductId = bestProduct.id
            matchConfidence = 90
            matchNotes = `Mfr code match but UOM mismatch (upload: ${item.uom || 'N/A'}, Hart: ${bestProduct.package_type || 'N/A'})`
            reviewCount++
          }
        }
      }
    }

    // Tier 2: Specification-based comparable product matching
    if (matchStatus === 'no_match' && hartProductSpecs.length > 0) {
      // Parse specs from enriched catalog data (structured JSON) or from text
      let sourceSpecs = {}
      let specsSource = 'none'

      if (item.enriched_specs) {
        // Best case: structured specs from McKesson master catalog
        sourceSpecs = parseSpecsFromCatalog(item.enriched_specs)
        specsSource = 'catalog specs'
      }

      // If catalog specs didn't yield an application, try parsing from text
      if (!sourceSpecs.application) {
        const textSpecs = parseSpecsFromText(item.enriched_name || item.description || '')
        // Merge: text specs fill in gaps but don't overwrite catalog specs
        sourceSpecs = { ...textSpecs, ...Object.fromEntries(
          Object.entries(sourceSpecs).filter(([, v]) => v)
        )}
        if (textSpecs.application) specsSource = 'text parsing'
      }

      if (sourceSpecs.application) {
        let bestMatch = null
        let bestScore = 0
        let bestSpecs = null

        for (const { product, specs: hartSpecs } of hartProductSpecs) {
          const score = scoreSpecMatch(sourceSpecs, hartSpecs)
          if (score > bestScore) {
            bestScore = score
            bestMatch = product
            bestSpecs = hartSpecs
          }
        }

        if (bestMatch && bestScore >= 40) {
          matchStatus = 'fuzzy'
          matchedProductId = bestMatch.id
          matchConfidence = bestScore

          // Build descriptive match notes showing what matched
          const matchedAttrs = []
          if (sourceSpecs.application) matchedAttrs.push(`type: ${sourceSpecs.application}`)
          if (sourceSpecs.gauge && bestSpecs?.gauge === sourceSpecs.gauge) matchedAttrs.push(`gauge: ${sourceSpecs.gauge}G`)
          if (sourceSpecs.size && bestSpecs?.size === sourceSpecs.size) matchedAttrs.push(`size: ${sourceSpecs.size}`)
          if (sourceSpecs.volume && bestSpecs?.volume === sourceSpecs.volume) matchedAttrs.push(`volume: ${sourceSpecs.volume}`)
          matchNotes = `Comparable match via ${specsSource} (${bestScore}%): ${matchedAttrs.join(', ')}`
          reviewCount++
        } else {
          reviewCount++
        }
      } else {
        reviewCount++
      }
    } else if (matchStatus === 'no_match') {
      reviewCount++
    }

    // Update the item
    await supabase
      .from('upload_items')
      .update({
        match_status: matchStatus,
        matched_product_id: matchedProductId,
        match_confidence: matchConfidence,
        match_notes: matchNotes
      })
      .eq('id', item.id)
  }

  // Update upload counts
  await supabase
    .from('uploads')
    .update({
      matched_count: matchedCount,
      review_count: reviewCount
    })
    .eq('id', uploadId)
}

/**
 * Get match results for an upload
 * @param {string} uploadId - The upload ID
 * @returns {Object} - Categorized match results
 */
export async function getMatchResults(uploadId) {
  // Get all items with their matched products
  const { data: items, error } = await supabase
    .from('upload_items')
    .select(`
      *,
      matched_product:products(
        id,
        manufacturer_item_code,
        product_name,
        item_description,
        unit_price,
        package_type
      )
    `)
    .eq('upload_id', uploadId)

  if (error) {
    console.error('Error fetching match results:', error)
    throw error
  }

  // Categorize results
  const exactMatches = items.filter(i => i.match_status === 'exact')
  const preApproved = items.filter(i => i.match_status === 'pre_approved')
  const fuzzyMatches = items.filter(i => i.match_status === 'fuzzy')
  const noMatch = items.filter(i => i.match_status === 'no_match' || i.match_status === 'pending')
  const needsReview = [...fuzzyMatches, ...noMatch] // Fuzzy matches and no matches both need review
  const approved = items.filter(i => i.match_status === 'approved')
  const rejected = items.filter(i => i.match_status === 'rejected')

  return {
    items,
    exactMatches,
    preApproved,
    fuzzyMatches,
    noMatch,
    needsReview,
    approved,
    rejected,
    stats: {
      total: items.length,
      exactCount: exactMatches.length,
      preApprovedCount: preApproved.length,
      fuzzyCount: fuzzyMatches.length,
      noMatchCount: noMatch.length,
      needsReviewCount: needsReview.length,
      matchedCount: exactMatches.length + preApproved.length + approved.length
    }
  }
}

/**
 * Get the most recent upload
 * @returns {Object} - Most recent upload record
 */
export async function getMostRecentUpload() {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching recent upload:', error)
    throw error
  }

  return data
}
