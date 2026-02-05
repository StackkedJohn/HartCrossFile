import { supabase } from './supabase'

/**
 * Process an uploaded file and run matching
 * @param {File} file - The uploaded file
 * @param {Array} parsedData - Parsed Excel data (array of arrays, first row is headers)
 * @returns {Object} - Upload record with match results
 */
export async function processUpload(file, parsedData) {
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
    itemNumber: findCol('item#', 'itemno', 'itemnumber', 'itemnum'),
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
      status: 'matching'
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

  // 4. Run matching
  await runMatching(upload.id)

  // 5. Update upload status
  const { data: updatedUpload } = await supabase
    .from('uploads')
    .update({ status: 'review' })
    .eq('id', upload.id)
    .select()
    .single()

  return updatedUpload
}

/**
 * Extract keywords from a description for matching
 * @param {string} text - The text to extract keywords from
 * @returns {string[]} - Array of keywords
 */
function extractKeywords(text) {
  if (!text) return []
  
  // Common words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'per', 'each', 'box', 'bx', 'cs', 'case', 'pk', 'pack', 'kit', 'ea', 'ct', 'count'
  ])
  
  // Extract words, remove special chars, filter short words and stop words
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w))
  
  return [...new Set(words)] // Remove duplicates
}

/**
 * Calculate keyword match score between two texts
 * @param {string[]} keywords - Keywords to search for
 * @param {string} targetText - Text to search in
 * @returns {number} - Score from 0-100
 */
function calculateKeywordScore(keywords, targetText) {
  if (!keywords.length || !targetText) return 0
  
  const targetLower = targetText.toLowerCase()
  let matchedCount = 0
  
  for (const keyword of keywords) {
    if (targetLower.includes(keyword)) {
      matchedCount++
    }
  }
  
  // Score based on percentage of keywords matched, weighted
  const score = Math.round((matchedCount / keywords.length) * 100)
  return Math.min(score, 95) // Cap at 95% for fuzzy matches
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

  // Get unique mfr_numbers to match
  const mfrNumbers = [...new Set(items.map(i => i.mfr_number).filter(Boolean))]

  // Fetch all products that might match by mfr_number (batch query)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, manufacturer_item_code, product_name, item_description, packing_list_description, unit_price, package_type')
    .in('manufacturer_item_code', mfrNumbers)

  if (productsError) {
    console.error('Error fetching products:', productsError)
    throw productsError
  }

  // Create lookup map for products by manufacturer_item_code
  const productMap = new Map()
  products.forEach(p => {
    productMap.set(p.manufacturer_item_code, p)
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

  // Fetch ALL products for keyword matching (we'll need this for tier 2)
  const { data: allProducts, error: allProductsError } = await supabase
    .from('products')
    .select('id, manufacturer_item_code, product_name, item_description, packing_list_description, unit_price, package_type')
    .eq('is_active', true)

  if (allProductsError) {
    console.error('Error fetching all products:', allProductsError)
  }

  // Match each item
  let matchedCount = 0
  let reviewCount = 0

  for (const item of items) {
    let matchStatus = 'no_match'
    let matchedProductId = null
    let matchConfidence = 0
    let matchNotes = null

    // Tier 1: Exact match on manufacturer_item_code (Mfr #)
    if (item.mfr_number) {
      const exactMatch = productMap.get(item.mfr_number)
      if (exactMatch) {
        matchStatus = 'exact'
        matchedProductId = exactMatch.id
        matchConfidence = 100
        matchNotes = 'Exact manufacturer item code match'
        matchedCount++
      } else {
        // Check approved matches
        const approved = approvedMap.get(item.mfr_number)
        if (approved) {
          matchStatus = 'pre_approved'
          matchedProductId = approved.hart_product_id
          matchConfidence = 100
          matchNotes = 'Pre-approved match'
          matchedCount++
        }
      }
    }

    // Tier 2: Keyword match on description → packing_list_description
    if (matchStatus === 'no_match' && item.description && allProducts) {
      const keywords = extractKeywords(item.description)
      
      if (keywords.length > 0) {
        let bestMatch = null
        let bestScore = 0

        for (const product of allProducts) {
          // Match against packing_list_description first, then item_description
          const packingScore = calculateKeywordScore(keywords, product.packing_list_description)
          const itemDescScore = calculateKeywordScore(keywords, product.item_description)
          const productNameScore = calculateKeywordScore(keywords, product.product_name)
          
          // Take the best score from any field
          const score = Math.max(packingScore, itemDescScore, productNameScore)
          
          if (score > bestScore && score >= 40) { // Minimum 40% match threshold
            bestScore = score
            bestMatch = product
          }
        }

        if (bestMatch && bestScore >= 40) {
          matchStatus = 'fuzzy'
          matchedProductId = bestMatch.id
          matchConfidence = bestScore
          matchNotes = `Keyword match on description (${bestScore}% confidence)`
          reviewCount++ // Fuzzy matches still need review
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
