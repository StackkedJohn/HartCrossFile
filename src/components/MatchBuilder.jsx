import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { parseSpecsFromCatalog, parseSpecsFromText, scoreSpecMatch } from '../lib/matchingService'
import './MatchBuilder.css'

function MatchBuilder({ onMatchCreated }) {
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: McKesson search
  const [mckSearch, setMckSearch] = useState('')
  const [mckResults, setMckResults] = useState([])
  const [mckLoading, setMckLoading] = useState(false)
  const [mckResultCount, setMckResultCount] = useState(0)
  const [selectedMck, setSelectedMck] = useState(null)
  const [mckSpecs, setMckSpecs] = useState(null)
  const [mckFullProduct, setMckFullProduct] = useState(null)

  // Step 1 filters
  const [filterCategory, setFilterCategory] = useState('')
  const [filterManufacturer, setFilterManufacturer] = useState('')
  const [unmatchedOnly, setUnmatchedOnly] = useState(false)

  // Step 2: Hart suggestions
  const [hartTab, setHartTab] = useState('suggestions')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [hartSearch, setHartSearch] = useState('')
  const [hartResults, setHartResults] = useState([])
  const [hartLoading, setHartLoading] = useState(false)
  const [selectedHart, setSelectedHart] = useState(null)
  const [selectedHartSpecs, setSelectedHartSpecs] = useState(null)

  // Step 3: Confirm
  const [approvalNotes, setApprovalNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(null)

  // Cached data
  const hartProductsCache = useRef(null)
  const matchedMfrNumbers = useRef(new Set())
  const searchTimeout = useRef(null)
  const hartSearchTimeout = useRef(null)

  // Load Hart products + matched MFR numbers on mount
  useEffect(() => {
    const loadCaches = async () => {
      const [hartRes, matchedRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, manufacturer_item_code, manufacturer_name, product_name, item_description, packing_list_description, unit_price, package_type')
          .eq('is_active', true),
        supabase
          .from('approved_matches')
          .select('mckesson_mfr_number')
      ])

      if (hartRes.data) {
        // Pre-parse specs for each Hart product
        hartProductsCache.current = hartRes.data.map(p => ({
          product: p,
          specs: parseSpecsFromText(
            `${p.product_name} ${p.item_description || ''} ${p.packing_list_description || ''}`
          )
        }))
      }

      if (matchedRes.data) {
        matchedMfrNumbers.current = new Set(
          matchedRes.data.map(m => m.mckesson_mfr_number)
        )
      }
    }

    loadCaches()
  }, [])

  // Debounced McKesson search
  const searchMcKesson = useCallback(async (term, category, manufacturer, unmatchedFilter) => {
    if (term.length < 2 && !category && !manufacturer) {
      setMckResults([])
      setMckResultCount(0)
      return
    }

    setMckLoading(true)

    let query = supabase
      .from('mckesson_catalog')
      .select('mckesson_id, name, manufacturer, manufacturer_sku, brand, category, all_specifications', { count: 'exact' })

    if (term.length >= 2) {
      query = query.or(`name.ilike.%${term}%,manufacturer_sku.ilike.%${term}%,brand.ilike.%${term}%`)
    }

    if (category.trim()) {
      query = query.ilike('category', `%${category.trim()}%`)
    }

    if (manufacturer.trim()) {
      query = query.ilike('manufacturer', `%${manufacturer.trim()}%`)
    }

    query = query.limit(50)

    const { data, error, count } = await query

    if (!error) {
      let results = data || []

      // Client-side filter for unmatched only
      if (unmatchedFilter) {
        results = results.filter(item => !matchedMfrNumbers.current.has(item.manufacturer_sku))
      }

      setMckResults(results)
      setMckResultCount(unmatchedFilter ? results.length : (count || 0))
    }
    setMckLoading(false)
  }, [])

  // Trigger search on input changes
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      searchMcKesson(mckSearch, filterCategory, filterManufacturer, unmatchedOnly)
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [mckSearch, filterCategory, filterManufacturer, unmatchedOnly, searchMcKesson])

  // Select McKesson product → parse specs → advance to step 2
  const handleSelectMck = async (item) => {
    setSelectedMck(item)

    // Parse specs from the catalog item
    let specs = {}
    if (item.all_specifications) {
      specs = parseSpecsFromCatalog(item.all_specifications)
    }
    if (!specs.application) {
      const textSpecs = parseSpecsFromText(item.name || '')
      specs = { ...textSpecs, ...Object.fromEntries(
        Object.entries(specs).filter(([, v]) => v)
      )}
    }

    setMckSpecs(specs)
    setMckFullProduct(item)
    setCurrentStep(2)
    setSelectedHart(null)
    setSelectedHartSpecs(null)
    setHartTab('suggestions')

    // Generate suggestions
    generateSuggestions(specs)
  }

  // Generate Hart suggestions based on specs
  const generateSuggestions = (specs) => {
    if (!hartProductsCache.current || !specs.application) {
      setSuggestions([])
      return
    }

    setSuggestionsLoading(true)

    // Score all Hart products against the selected McKesson specs
    const scored = hartProductsCache.current
      .map(({ product, specs: hartSpecs }) => ({
        product,
        hartSpecs,
        score: scoreSpecMatch(specs, hartSpecs)
      }))
      .filter(s => s.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)

    setSuggestions(scored)
    setSuggestionsLoading(false)
  }

  // Hart manual search
  useEffect(() => {
    if (hartTab !== 'search') return
    clearTimeout(hartSearchTimeout.current)
    if (hartSearch.length < 2) {
      setHartResults([])
      return
    }
    hartSearchTimeout.current = setTimeout(async () => {
      setHartLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, product_name, item_description, manufacturer_item_code, unit_price, package_type, packing_list_description')
        .eq('is_active', true)
        .or(`product_name.ilike.%${hartSearch}%,manufacturer_item_code.ilike.%${hartSearch}%,item_description.ilike.%${hartSearch}%`)
        .order('product_name')
        .limit(50)

      if (!error) setHartResults(data || [])
      setHartLoading(false)
    }, 300)
    return () => clearTimeout(hartSearchTimeout.current)
  }, [hartSearch, hartTab])

  // Select Hart product → parse specs → advance to step 3
  const handleSelectHart = (product, existingSpecs) => {
    setSelectedHart(product)
    const specs = existingSpecs || parseSpecsFromText(
      `${product.product_name} ${product.item_description || ''} ${product.packing_list_description || ''}`
    )
    setSelectedHartSpecs(specs)
    setCurrentStep(3)
  }

  // Create match
  const handleCreateMatch = async () => {
    if (!selectedMck || !selectedHart) return

    setCreating(true)
    setCreateSuccess(null)

    const { error } = await supabase
      .from('approved_matches')
      .upsert({
        mckesson_mfr_number: selectedMck.manufacturer_sku,
        mckesson_description: selectedMck.name,
        hart_product_id: selectedHart.id,
        hart_manufacturer_item_code: selectedHart.manufacturer_item_code,
        approved_by: 'admin',
        approval_notes: approvalNotes || 'Created via match builder'
      }, { onConflict: 'mckesson_mfr_number' })

    if (error) {
      console.error('Error creating match:', error)
      setCreateSuccess(false)
    } else {
      setCreateSuccess(true)
      // Update matched set
      matchedMfrNumbers.current.add(selectedMck.manufacturer_sku)
      // Reset
      resetBuilder()
      onMatchCreated()
      setTimeout(() => setCreateSuccess(null), 3000)
    }
    setCreating(false)
  }

  const resetBuilder = () => {
    setCurrentStep(1)
    setSelectedMck(null)
    setSelectedHart(null)
    setSelectedHartSpecs(null)
    setMckSpecs(null)
    setMckFullProduct(null)
    setMckSearch('')
    setMckResults([])
    setHartSearch('')
    setHartResults([])
    setSuggestions([])
    setApprovalNotes('')
  }

  // Compute confidence score between selected products
  const confidenceScore = mckSpecs && selectedHartSpecs
    ? scoreSpecMatch(mckSpecs, selectedHartSpecs)
    : 0

  // Build spec alignment data
  const getSpecAlignment = () => {
    if (!mckSpecs || !selectedHartSpecs) return []

    const allKeys = new Set([...Object.keys(mckSpecs), ...Object.keys(selectedHartSpecs)])
    return Array.from(allKeys).map(key => {
      const mckVal = mckSpecs[key] || null
      const hartVal = selectedHartSpecs[key] || null
      let status = 'missing'
      if (mckVal && hartVal) {
        status = mckVal === hartVal || mckVal.includes(hartVal) || hartVal.includes(mckVal) ? 'match' : 'mismatch'
      } else if (mckVal || hartVal) {
        status = 'partial'
      }

      const labels = {
        application: 'Product Type',
        gauge: 'Gauge',
        length: 'Length',
        size: 'Size',
        volume: 'Volume',
        material: 'Material',
        type: 'Type',
        forUseWith: 'For Use With',
        count: 'Count/Pack'
      }

      return { key, label: labels[key] || key, mckVal, hartVal, status }
    })
  }

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  // Get matched spec attributes as chips for suggestion cards
  const getMatchedChips = (hartSpecs) => {
    if (!mckSpecs) return []
    const chips = []
    const checkPairs = [
      ['application', 'Type'],
      ['gauge', 'Gauge'],
      ['size', 'Size'],
      ['material', 'Material'],
      ['volume', 'Volume'],
      ['length', 'Length'],
      ['count', 'Count']
    ]
    for (const [key, label] of checkPairs) {
      if (mckSpecs[key] && hartSpecs[key]) {
        if (mckSpecs[key] === hartSpecs[key] || mckSpecs[key].includes(hartSpecs[key]) || hartSpecs[key].includes(mckSpecs[key])) {
          chips.push({ label, value: hartSpecs[key], match: true })
        } else {
          chips.push({ label, value: hartSpecs[key], match: false })
        }
      }
    }
    return chips
  }

  return (
    <div className="match-builder-container">
      {/* Success/Error Alerts */}
      {createSuccess === true && (
        <div className="mb-alert success">
          <i className="fa-solid fa-circle-check"></i>
          Match created successfully
        </div>
      )}
      {createSuccess === false && (
        <div className="mb-alert error">
          <i className="fa-solid fa-circle-exclamation"></i>
          Failed to create match. Check the console for details.
        </div>
      )}

      {/* Step 1: Find McKesson Product */}
      <div className="mb-step">
        <div className="mb-step-header">
          <span className={`mb-step-number ${currentStep >= 1 ? 'active' : ''}`}>1</span>
          <div className="mb-step-title">
            <h3>Find McKesson Product</h3>
            <p>Search the McKesson catalog to find the product to match</p>
          </div>
          {selectedMck && (
            <button className="mb-step-change" onClick={() => { setCurrentStep(1); setSelectedHart(null); setSelectedHartSpecs(null) }}>
              Change
            </button>
          )}
        </div>

        {/* Selected McKesson product summary (when collapsed) */}
        {selectedMck && currentStep > 1 && (
          <div className="mb-selected-summary">
            <i className="fa-solid fa-check-circle"></i>
            <div className="mb-selected-info">
              <span className="mb-selected-name">{selectedMck.name}</span>
              <span className="mb-selected-meta">
                MFR: {selectedMck.manufacturer_sku || '—'} · {selectedMck.manufacturer || '—'}
              </span>
            </div>
          </div>
        )}

        {/* Step 1 expanded content */}
        {currentStep === 1 && (
          <div className="mb-step-content slide-in">
            {/* Filter bar */}
            <div className="mb-filters">
              <div className="mb-filter-group">
                <label>Category</label>
                <input
                  type="text"
                  placeholder="e.g. Gloves, Syringes..."
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                />
              </div>
              <div className="mb-filter-group">
                <label>Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. BD, McKesson..."
                  value={filterManufacturer}
                  onChange={e => setFilterManufacturer(e.target.value)}
                />
              </div>
              <div className="mb-filter-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={unmatchedOnly}
                    onChange={e => setUnmatchedOnly(e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  Unmatched only
                </label>
              </div>
            </div>

            {/* Main search */}
            <div className="mb-search-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search by name, MFR SKU, or brand..."
                value={mckSearch}
                onChange={e => setMckSearch(e.target.value)}
                autoFocus
              />
              {mckSearch && (
                <button className="mb-search-clear" onClick={() => setMckSearch('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Result count */}
            {(mckSearch.length >= 2 || filterCategory || filterManufacturer) && !mckLoading && (
              <div className="mb-result-count">
                {mckResultCount} result{mckResultCount !== 1 ? 's' : ''} found
              </div>
            )}

            {/* Results */}
            <div className="mb-results-list">
              {mckLoading ? (
                <div className="mb-loading"><div className="spinner-small"></div> Searching catalog...</div>
              ) : mckResults.length === 0 && (mckSearch.length >= 2 || filterCategory || filterManufacturer) ? (
                <div className="mb-empty">No McKesson products found</div>
              ) : (
                mckResults.map(item => (
                  <div
                    key={item.mckesson_id}
                    className="mb-result-card"
                    onClick={() => handleSelectMck(item)}
                  >
                    <div className="mb-result-main">
                      <span className="mb-result-name">{item.name}</span>
                      <div className="mb-result-tags">
                        {item.manufacturer_sku && (
                          <span className="mb-tag mono">MFR: {item.manufacturer_sku}</span>
                        )}
                        {item.manufacturer && (
                          <span className="mb-tag">{item.manufacturer}</span>
                        )}
                        {item.brand && (
                          <span className="mb-tag">{item.brand}</span>
                        )}
                        {item.category && (
                          <span className="mb-tag muted">{item.category}</span>
                        )}
                      </div>
                    </div>
                    {matchedMfrNumbers.current.has(item.manufacturer_sku) && (
                      <span className="mb-matched-badge">
                        <i className="fa-solid fa-link"></i>
                        Matched
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Expanded detail card when selected (before advancing) */}
            {selectedMck && mckSpecs && (
              <div className="mb-detail-card slide-in">
                <div className="mb-detail-header">
                  <h4>{selectedMck.name}</h4>
                  <div className="mb-detail-meta">
                    {selectedMck.manufacturer_sku && <span>MFR: {selectedMck.manufacturer_sku}</span>}
                    {selectedMck.manufacturer && <span>{selectedMck.manufacturer}</span>}
                    {selectedMck.category && <span>{selectedMck.category}</span>}
                  </div>
                </div>
                {Object.keys(mckSpecs).length > 0 && (
                  <div className="mb-spec-grid">
                    {Object.entries(mckSpecs).map(([key, val]) => (
                      <div key={key} className="mb-spec-item">
                        <span className="mb-spec-label">{key}</span>
                        <span className="mb-spec-value">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Find Hart Match */}
      {currentStep >= 2 && (
        <div className="mb-step slide-in">
          <div className="mb-step-header">
            <span className={`mb-step-number ${currentStep >= 2 ? 'active' : ''}`}>2</span>
            <div className="mb-step-title">
              <h3>Find Hart Match</h3>
              <p>Select a Hart Medical product to pair with the McKesson product</p>
            </div>
            {selectedHart && currentStep > 2 && (
              <button className="mb-step-change" onClick={() => setCurrentStep(2)}>
                Change
              </button>
            )}
          </div>

          {/* Selected Hart product summary (when collapsed) */}
          {selectedHart && currentStep > 2 && (
            <div className="mb-selected-summary">
              <i className="fa-solid fa-check-circle"></i>
              <div className="mb-selected-info">
                <span className="mb-selected-name">{selectedHart.product_name}</span>
                <span className="mb-selected-meta">
                  {selectedHart.manufacturer_item_code} · {selectedHart.package_type || '—'} · ${Number(selectedHart.unit_price || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Step 2 expanded content */}
          {currentStep === 2 && (
            <div className="mb-step-content slide-in">
              {/* Tab bar */}
              <div className="mb-tabs">
                <button
                  className={`mb-tab ${hartTab === 'suggestions' ? 'active' : ''}`}
                  onClick={() => setHartTab('suggestions')}
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  Smart Suggestions
                  {suggestions.length > 0 && (
                    <span className="mb-tab-count">{suggestions.length}</span>
                  )}
                </button>
                <button
                  className={`mb-tab ${hartTab === 'search' ? 'active' : ''}`}
                  onClick={() => setHartTab('search')}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  Search All
                </button>
              </div>

              {/* Suggestions tab */}
              {hartTab === 'suggestions' && (
                <div className="mb-suggestions">
                  {suggestionsLoading ? (
                    <div className="mb-loading"><div className="spinner-small"></div> Analyzing products...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="mb-empty">
                      <i className="fa-solid fa-robot"></i>
                      <p>No matching products found. Try the &quot;Search All&quot; tab for manual search.</p>
                    </div>
                  ) : (
                    suggestions.map(({ product, hartSpecs, score }) => {
                      const chips = getMatchedChips(hartSpecs)
                      return (
                        <div
                          key={product.id}
                          className="mb-suggestion-card"
                          onClick={() => handleSelectHart(product, hartSpecs)}
                        >
                          <div className="mb-suggestion-main">
                            <div className="mb-suggestion-top">
                              <span className="mb-suggestion-name">{product.product_name}</span>
                              <span className={`mb-confidence-badge ${getConfidenceColor(score)}`}>
                                {score}%
                              </span>
                            </div>
                            <div className="mb-suggestion-meta">
                              {product.manufacturer_item_code} · {product.package_type || '—'} · ${Number(product.unit_price || 0).toFixed(2)}
                            </div>
                            {chips.length > 0 && (
                              <div className="mb-suggestion-chips">
                                {chips.map((chip, i) => (
                                  <span key={i} className={`mb-chip ${chip.match ? 'match' : 'no-match'}`}>
                                    {chip.label}: {chip.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <i className="fa-solid fa-chevron-right mb-suggestion-arrow"></i>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* Search All tab */}
              {hartTab === 'search' && (
                <div className="mb-search-tab">
                  <div className="mb-search-wrapper">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      placeholder="Search Hart products by name, SKU, or description..."
                      value={hartSearch}
                      onChange={e => setHartSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="mb-results-list">
                    {hartLoading ? (
                      <div className="mb-loading"><div className="spinner-small"></div> Searching...</div>
                    ) : hartResults.length === 0 && hartSearch.length >= 2 ? (
                      <div className="mb-empty">No Hart products found</div>
                    ) : (
                      hartResults.map(product => (
                        <div
                          key={product.id}
                          className="mb-result-card"
                          onClick={() => handleSelectHart(product)}
                        >
                          <div className="mb-result-main">
                            <span className="mb-result-name">{product.product_name}</span>
                            <div className="mb-result-tags">
                              <span className="mb-tag mono">{product.manufacturer_item_code}</span>
                              <span className="mb-tag">{product.package_type || '—'}</span>
                              <span className="mb-tag">${Number(product.unit_price || 0).toFixed(2)}</span>
                            </div>
                            {product.item_description && (
                              <span className="mb-result-desc">{product.item_description}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {currentStep >= 3 && (
        <div className="mb-step slide-in">
          <div className="mb-step-header">
            <span className={`mb-step-number ${currentStep >= 3 ? 'active' : ''}`}>3</span>
            <div className="mb-step-title">
              <h3>Review & Confirm</h3>
              <p>Compare specifications and confirm the match</p>
            </div>
          </div>

          <div className="mb-step-content">
            {/* Side-by-side comparison */}
            <div className="mb-comparison-grid">
              <div className="mb-compare-card mck">
                <div className="mb-compare-label">McKesson Product</div>
                <h4>{selectedMck?.name}</h4>
                <div className="mb-compare-meta">
                  {selectedMck?.manufacturer_sku && <span>MFR: {selectedMck.manufacturer_sku}</span>}
                  {selectedMck?.manufacturer && <span>{selectedMck.manufacturer}</span>}
                  {selectedMck?.category && <span>{selectedMck.category}</span>}
                </div>
              </div>

              <div className="mb-compare-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

              <div className="mb-compare-card hart">
                <div className="mb-compare-label">Hart Medical</div>
                <h4>{selectedHart?.product_name}</h4>
                <div className="mb-compare-meta">
                  <span>{selectedHart?.manufacturer_item_code}</span>
                  <span>{selectedHart?.package_type || '—'}</span>
                  <span>${Number(selectedHart?.unit_price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="mb-confidence-section">
              <div className="mb-confidence-header">
                <span>Match Confidence</span>
                <span className={`mb-confidence-value ${getConfidenceColor(confidenceScore)}`}>
                  {confidenceScore}%
                </span>
              </div>
              <div className="mb-confidence-bar">
                <div
                  className={`mb-confidence-fill ${getConfidenceColor(confidenceScore)}`}
                  style={{ width: `${confidenceScore}%` }}
                ></div>
              </div>
            </div>

            {/* Spec alignment table */}
            {getSpecAlignment().length > 0 && (
              <div className="mb-spec-table-section">
                <h4 className="mb-spec-table-title">Specification Alignment</h4>
                <table className="mb-spec-table">
                  <thead>
                    <tr>
                      <th>Attribute</th>
                      <th>McKesson</th>
                      <th>Hart</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSpecAlignment().map(({ key, label, mckVal, hartVal, status }) => (
                      <tr key={key} className={`spec-row-${status}`}>
                        <td className="spec-attr">{label}</td>
                        <td>{mckVal || '—'}</td>
                        <td>{hartVal || '—'}</td>
                        <td>
                          {status === 'match' && <i className="fa-solid fa-circle-check spec-icon match"></i>}
                          {status === 'mismatch' && <i className="fa-solid fa-circle-xmark spec-icon mismatch"></i>}
                          {status === 'partial' && <i className="fa-solid fa-circle-minus spec-icon partial"></i>}
                          {status === 'missing' && <i className="fa-solid fa-circle-minus spec-icon missing"></i>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Warnings */}
            {!selectedMck?.manufacturer_sku && (
              <div className="mb-warning">
                <i className="fa-solid fa-triangle-exclamation"></i>
                This McKesson product has no manufacturer SKU. The match may not apply during automated matching.
              </div>
            )}

            {selectedMck?.manufacturer_sku && matchedMfrNumbers.current.has(selectedMck.manufacturer_sku) && (
              <div className="mb-info">
                <i className="fa-solid fa-circle-info"></i>
                MFR # {selectedMck.manufacturer_sku} already has a match. Creating this will overwrite the existing mapping.
              </div>
            )}

            {/* Notes + Create */}
            <div className="mb-confirm-footer">
              <div className="mb-notes-input">
                <label htmlFor="mb-notes">Notes (optional)</label>
                <input
                  id="mb-notes"
                  type="text"
                  placeholder="Why is this match being created..."
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                />
              </div>
              <div className="mb-confirm-actions">
                <button className="mb-btn-secondary" onClick={resetBuilder}>
                  Cancel
                </button>
                <button
                  className="mb-btn-primary"
                  disabled={!selectedMck || !selectedHart || creating}
                  onClick={handleCreateMatch}
                >
                  {creating ? (
                    <>
                      <span className="btn-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plus"></i>
                      Create Match
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchBuilder
