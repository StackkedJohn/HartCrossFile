/**
 * Packaging hierarchy parsing utilities.
 * Parses patterns like "200/BX 10BX/CS" to understand unit conversions.
 */

/**
 * Canonical UOM abbreviations used for hierarchy matching.
 * Maps common abbreviations and full names to a canonical short form.
 */
const UOM_CANONICAL = {
  'ea': 'ea', 'each': 'ea',
  'bx': 'bx', 'box': 'bx',
  'cs': 'cs', 'case': 'cs',
  'pk': 'pk', 'pack': 'pk', 'pkg': 'pk', 'package': 'pk',
  'bg': 'bg', 'bag': 'bg',
  'kt': 'kt', 'kit': 'kt',
  'tu': 'tu', 'tube': 'tu', 'tb': 'tu',
  'rl': 'rl', 'roll': 'rl',
  'ct': 'ct', 'count': 'ct',
  'bt': 'bt', 'btl': 'bt', 'bottle': 'bt',
  'sp': 'sp',
  'pr': 'pr', 'pair': 'pr',
  'vl': 'vl', 'vial': 'vl',
  'dz': 'dz', 'dozen': 'dz',
  'sy': 'sy', 'syringe': 'sy',
  'cn': 'cn', 'can': 'cn',
}

function canonicalUOM(uom) {
  if (!uom) return null
  return UOM_CANONICAL[uom.toLowerCase().trim()] || uom.toLowerCase().trim()
}

/**
 * Parse the packaging hierarchy from product text.
 * Returns an array of levels from innermost to outermost, e.g.:
 *   "200/BX 10BX/CS" → [{ count: 200, uom: 'bx' }, { count: 10, uom: 'cs' }]
 *   "50/PK" → [{ count: 50, uom: 'pk' }]
 *   "2DZ/BX" → [{ count: 24, uom: 'bx' }]  (dozen converted)
 *
 * @param {string} text - Product description text
 * @returns {Array<{count: number, uom: string}>} - Hierarchy levels innermost→outermost
 */
export function parsePackagingHierarchy(text) {
  if (!text) return []

  // Match patterns: "200/BX", "10BX/CS", "50/cs", "2dz/bx", "30TESTS/KT"
  const regex = /(\d+)\s*(dz)?\s*[a-z]*\s*\/\s*(bx|cs|pk|bg|kt|tu|rl|ct|sp|ea|bt|vl|pr|cn)/gi
  const matches = [...text.matchAll(regex)]
  if (matches.length === 0) return []

  return matches.map(m => {
    let count = parseInt(m[1])
    if (m[2] && m[2].toLowerCase() === 'dz') count *= 12
    const uom = canonicalUOM(m[3])
    return { count, uom }
  })
}

/**
 * Get the total individual units inside one of the specified UOM.
 * For "200/BX 10BX/CS":
 *   - getUnitsPerUOM(text, "BX") → 200  (200 items per box)
 *   - getUnitsPerUOM(text, "CS") → 2000 (200*10 items per case)
 *   - getUnitsPerUOM(text, "EA") → 1    (no packaging below EA)
 *
 * If the UOM isn't in the hierarchy, returns the full product
 * of all levels (i.e. total units per outermost packaging).
 *
 * @param {string} text - Product description text
 * @param {string} uom - The unit of measure to get units for
 * @returns {number|null} - Units per that UOM, or null if no hierarchy found
 */
export function getUnitsPerUOM(text, uom) {
  const hierarchy = parsePackagingHierarchy(text)
  if (hierarchy.length === 0) return null

  const targetUOM = canonicalUOM(uom)
  if (!targetUOM) return null

  // Multiply levels from innermost up to (and including) the target UOM level
  let units = 1
  for (const level of hierarchy) {
    units *= level.count
    if (level.uom === targetUOM) {
      return units
    }
  }

  // If we didn't find the target UOM in the hierarchy, return the full product
  return units > 1 ? units : null
}

/**
 * Calculate and format the per-unit price from a total price and product text.
 * If a UOM is provided, calculates units per that UOM (not always the outermost).
 * Returns something like "$0.056/ea (2000 units)" or null if unable to parse.
 *
 * @param {number} price - The price for one of the given UOM
 * @param {string} text - Product description text containing packaging info
 * @param {string} [uom] - Optional UOM to calculate units per
 * @returns {string|null} - Formatted per-unit price string, or null
 */
export function formatUnitPrice(price, text, uom) {
  if (!price) return null

  let units
  if (uom) {
    units = getUnitsPerUOM(text, uom)
  } else {
    // Fallback: multiply all levels for outermost packaging
    const hierarchy = parsePackagingHierarchy(text)
    if (hierarchy.length === 0) return null
    units = hierarchy.reduce((acc, level) => acc * level.count, 1)
  }

  if (!units || units <= 1) return null

  const perUnit = Number(price) / units
  const formatted = perUnit < 0.01
    ? `$${perUnit.toFixed(4)}/ea`
    : perUnit < 1
      ? `$${perUnit.toFixed(3)}/ea`
      : `$${perUnit.toFixed(2)}/ea`
  return `${formatted} (${units} units)`
}

/**
 * Calculate the conversion factor between two UOMs based on a product's
 * packaging hierarchy. Used to convert quantities for apples-to-apples comparison.
 *
 * Example: "200/BX 10BX/CS"
 *   - convertQty(4, "BX", "CS", text) → 0.4  (4 boxes = 0.4 cases)
 *   - convertQty(1, "CS", "BX", text) → 10   (1 case = 10 boxes)
 *
 * @param {number} qty - The original quantity
 * @param {string} fromUOM - The UOM being converted from
 * @param {string} toUOM - The UOM to convert to
 * @param {string} text - Product text containing packaging hierarchy
 * @returns {{ convertedQty: number, ratio: number }|null} - Converted qty and ratio, or null
 */
export function convertQty(qty, fromUOM, toUOM, text) {
  const fromCanon = canonicalUOM(fromUOM)
  const toCanon = canonicalUOM(toUOM)

  if (!fromCanon || !toCanon || fromCanon === toCanon) {
    return { convertedQty: qty, ratio: 1 }
  }

  const fromUnits = getUnitsPerUOM(text, fromUOM)
  const toUnits = getUnitsPerUOM(text, toUOM)

  if (!fromUnits || !toUnits) return null

  // Both are expressed in base units (EA), so the ratio is from/to
  const ratio = fromUnits / toUnits
  return {
    convertedQty: qty * ratio,
    ratio
  }
}
