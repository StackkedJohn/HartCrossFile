import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Comparison.css'

function Comparison({ uploadId, onContinue, onBack }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comparisonData, setComparisonData] = useState(null)
  const [customerName, setCustomerName] = useState('Customer')
  const [productMarkups, setProductMarkups] = useState({}) // Per-product markup overrides
  const defaultMarkup = 50 // Default 50% markup for all products

  useEffect(() => {
    async function fetchData() {
      if (!uploadId) return

      setLoading(true)
      setError(null)

      try {
        // Get matched items with their products
        const { data: items, error: itemsError } = await supabase
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
          .in('match_status', ['exact', 'pre_approved', 'approved'])

        if (itemsError) throw itemsError

        // Get unmatched items for the note
        const { data: unmatchedItems, error: unmatchedError } = await supabase
          .from('upload_items')
          .select('*')
          .eq('upload_id', uploadId)
          .in('match_status', ['no_match', 'rejected', 'pending', 'fuzzy'])

        if (unmatchedError) throw unmatchedError

        // Get upload info for customer name
        const { data: upload } = await supabase
          .from('uploads')
          .select('original_filename')
          .eq('id', uploadId)
          .single()

        if (upload?.original_filename) {
          // Extract customer name from filename (remove extension and common suffixes)
          const name = upload.original_filename
            .replace(/\.(xlsx|xls|csv)$/i, '')
            .replace(/\s*(REPORT|report|\(\d+\))\s*/g, '')
            .trim()
          setCustomerName(name || 'Customer')
        }

        setComparisonData({
          matchedItems: items || [],
          unmatchedItems: unmatchedItems || []
        })
      } catch (err) {
        console.error('Error fetching comparison data:', err)
        setError(err.message || 'Failed to load comparison data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [uploadId])

  // Calculate totals based on current markup
  const calculateTotals = () => {
    if (!comparisonData?.matchedItems) return null
    
    let currentSpend = 0
    let hartTotal = 0
    let unmatchedSpend = 0

    const itemComparisons = comparisonData.matchedItems
      .filter(item => item.matched_product && item.cost_per_unit > 0)
      .map(item => {
        const qty = item.ship_qty || 1
        const mckessonTotal = item.cost_per_unit * qty
        
        // Use per-product markup if set, otherwise use default
        const itemMarkup = productMarkups[item.id] !== undefined ? productMarkups[item.id] : defaultMarkup
        const markupMultiplier = 1 + (itemMarkup / 100)
        
        const hartUnitPrice = item.matched_product.unit_price * markupMultiplier
        const hartItemTotal = hartUnitPrice * qty
        const savings = mckessonTotal - hartItemTotal

        currentSpend += mckessonTotal
        hartTotal += hartItemTotal

        return {
          ...item,
          qty,
          mckessonUnitPrice: item.cost_per_unit,
          mckessonTotal,
          hartUnitPrice,
          hartTotal: hartItemTotal,
          savings,
          savingsPercent: mckessonTotal > 0 ? (savings / mckessonTotal) * 100 : 0,
          itemMarkup,
          hasCustomMarkup: productMarkups[item.id] !== undefined
        }
      })
      .sort((a, b) => b.savings - a.savings) // Sort by savings (highest first)

    // Calculate unmatched spend
    comparisonData.unmatchedItems.forEach(item => {
      if (item.cost_per_unit && item.ship_qty) {
        unmatchedSpend += item.cost_per_unit * item.ship_qty
      }
    })

    const totalSavings = currentSpend - hartTotal
    const savingsPercent = currentSpend > 0 ? (totalSavings / currentSpend) * 100 : 0

    return {
      currentSpend,
      hartTotal,
      totalSavings,
      savingsPercent,
      unmatchedSpend,
      unmatchedCount: comparisonData.unmatchedItems.length,
      itemComparisons
    }
  }

  const totals = calculateTotals()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="comparison-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Calculating savings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="comparison-container">
        <div className="error-state">
          <i className="fa-solid fa-circle-exclamation"></i>
          <h3>Error Loading Comparison</h3>
          <p>{error}</p>
          <button className="btn-secondary" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
            Back to Review
          </button>
        </div>
      </div>
    )
  }

  if (!totals || totals.itemComparisons.length === 0) {
    return (
      <div className="comparison-container">
        <div className="empty-state">
          <i className="fa-solid fa-scale-balanced"></i>
          <h3>No Matched Items</h3>
          <p>There are no matched products to compare. Please review and approve some matches first.</p>
          <button className="btn-secondary" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
            Back to Review
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="comparison-container">
      {/* Header */}
      <div className="comparison-header">
        <div>
          <h1>Cost Comparison Summary</h1>
          <p className="customer-name">for {customerName}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card current">
          <span className="summary-label">Current Spend (Matched Items)</span>
          <span className="summary-value">{formatCurrency(totals.currentSpend)}</span>
        </div>
        <div className="summary-card hart">
          <span className="summary-label">With Hart Medical</span>
          <span className="summary-value">{formatCurrency(totals.hartTotal)}</span>
          <span className="summary-note">at {defaultMarkup}% default markup</span>
        </div>
        <div className="summary-card savings">
          <span className="summary-label">Your Savings</span>
          <span className="summary-value positive">{formatCurrency(totals.totalSavings)}</span>
        </div>
        <div className="summary-card percent">
          <span className="summary-label">Savings Percentage</span>
          <span className="summary-value highlight">{totals.savingsPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Unmatched Note */}
      {totals.unmatchedCount > 0 && (
        <div className="unmatched-note">
          <i className="fa-solid fa-circle-info"></i>
          <span>
            Note: {totals.unmatchedCount} item{totals.unmatchedCount > 1 ? 's' : ''} 
            ({formatCurrency(totals.unmatchedSpend)}) had no Hart Medical equivalent 
            and are excluded from this comparison.
          </span>
        </div>
      )}

      {/* Detailed Comparison Table */}
      <div className="table-section">
        <div className="section-header">
          <h2>
            <i className="fa-solid fa-list-check"></i>
            Detailed Product Comparison
          </h2>
          <span className="badge success">{totals.itemComparisons.length} items</span>
        </div>

        <div className="table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="right">Qty</th>
                <th className="right">Markup</th>
                <th className="right">McKesson Price</th>
                <th className="right">Hart Price</th>
                <th className="right">Item Savings</th>
              </tr>
            </thead>
            <tbody>
              {totals.itemComparisons.map((item) => (
                <tr key={item.id} className={item.hasCustomMarkup ? 'custom-markup' : ''}>
                  <td>
                    <div className="product-cell">
                      <span className="product-name">
                        {item.matched_product?.product_name || 'Unknown Product'}
                      </span>
                      <span className="product-replaces">
                        Replaces: {item.description || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="right qty-cell">{item.qty}</td>
                  <td className="right markup-cell">
                    <select
                      className={`markup-select ${item.hasCustomMarkup ? 'custom' : ''}`}
                      value={item.itemMarkup}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        if (val === defaultMarkup) {
                          // If selecting the default, remove the override
                          setProductMarkups(prev => {
                            const newMarkups = { ...prev }
                            delete newMarkups[item.id]
                            return newMarkups
                          })
                        } else {
                          setProductMarkups(prev => ({ ...prev, [item.id]: val }))
                        }
                      }}
                    >
                      {[20, 25, 30, 35, 40, 45, 50].map(val => (
                        <option key={val} value={val}>
                          {val}%{val === defaultMarkup && !item.hasCustomMarkup ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="right price-cell">{formatCurrency(item.mckessonTotal)}</td>
                  <td className="right price-cell hart-price">{formatCurrency(item.hartTotal)}</td>
                  <td className="right savings-cell">
                    <span className={item.savings >= 0 ? 'positive' : 'negative'}>
                      {item.savings >= 0 ? '+' : ''}{formatCurrency(item.savings)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3"><strong>Total</strong></td>
                <td className="right"><strong>{formatCurrency(totals.currentSpend)}</strong></td>
                <td className="right"><strong>{formatCurrency(totals.hartTotal)}</strong></td>
                <td className="right">
                  <strong className="positive">+{formatCurrency(totals.totalSavings)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-bar">
        <button className="btn-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </button>
        <div className="action-buttons">
          <button className="btn-outline">
            <i className="fa-solid fa-file-export"></i>
            Export Report
          </button>
          <button className="btn-primary" onClick={onContinue}>
            Generate Proposal Deck
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Comparison
