import { useState, useEffect } from 'react'
import { getMatchResults } from '../lib/matchingService'
import ReviewModal from './ReviewModal'
import './ReviewApprove.css'

function ReviewApprove({ uploadId, onContinue, onBack }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [matchData, setMatchData] = useState(null)
  const [reviewingItem, setReviewingItem] = useState(null)

  useEffect(() => {
    async function fetchData() {
      if (!uploadId) return

      setLoading(true)
      setError(null)

      try {
        const results = await getMatchResults(uploadId)
        setMatchData(results)
      } catch (err) {
        console.error('Error fetching match results:', err)
        setError(err.message || 'Failed to load match results')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [uploadId])

  const getConfidenceClass = (confidence) => {
    if (confidence >= 80) return 'high'
    if (confidence >= 50) return 'medium'
    return 'low'
  }

  const handleReviewClick = (item) => {
    setReviewingItem(item)
  }

  const handleApproveMatch = (itemId, product) => {
    // Update local state to move item from needsReview to matched
    setMatchData(prev => {
      if (!prev) return prev

      const item = prev.needsReview.find(i => i.id === itemId)
      if (!item) return prev

      const updatedItem = {
        ...item,
        match_status: 'approved',
        matched_product: product,
        match_confidence: 100
      }

      return {
        ...prev,
        needsReview: prev.needsReview.filter(i => i.id !== itemId),
        exactMatches: [...prev.exactMatches, updatedItem],
        stats: {
          ...prev.stats,
          needsReviewCount: prev.stats.needsReviewCount - 1,
          exactCount: prev.stats.exactCount + 1,
          matchedCount: prev.stats.matchedCount + 1
        }
      }
    })
    setReviewingItem(null)
  }

  const handleRejectMatch = (itemId) => {
    // Update local state to remove item from needsReview
    setMatchData(prev => {
      if (!prev) return prev

      return {
        ...prev,
        needsReview: prev.needsReview.filter(i => i.id !== itemId),
        rejected: [...(prev.rejected || []), prev.needsReview.find(i => i.id === itemId)],
        stats: {
          ...prev.stats,
          needsReviewCount: prev.stats.needsReviewCount - 1
        }
      }
    })
    setReviewingItem(null)
  }

  if (loading) {
    return (
      <div className="review-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading match results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="review-container">
        <div className="error-state">
          <i className="fa-solid fa-circle-exclamation"></i>
          <h3>Error Loading Results</h3>
          <p>{error}</p>
          <button className="btn-secondary" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
            Back to Upload
          </button>
        </div>
      </div>
    )
  }

  if (!matchData) {
    return null
  }

  const { exactMatches, preApproved, needsReview, stats } = matchData
  const matchedProducts = [...exactMatches, ...preApproved]

  return (
    <div className="review-container">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card exact">
          <div className="stat-icon">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.exactCount}</span>
            <span className="stat-label">Exact Matches</span>
          </div>
        </div>

        <div className="stat-card preapproved">
          <div className="stat-icon">
            <i className="fa-solid fa-thumbs-up"></i>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.preApprovedCount}</span>
            <span className="stat-label">Pre-Approved</span>
          </div>
        </div>

        <div className="stat-card fuzzy">
          <div className="stat-icon">
            <i className="fa-solid fa-robot"></i>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.fuzzyCount || 0}</span>
            <span className="stat-label">AI Suggested</span>
          </div>
        </div>

        <div className="stat-card review">
          <div className="stat-icon">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.noMatchCount || 0}</span>
            <span className="stat-label">No Match</span>
          </div>
        </div>
      </div>

      {/* Needs Review Section */}
      {needsReview.length > 0 && (
        <div className="table-section">
          <div className="section-header">
            <h2>
              <i className="fa-solid fa-user-shield"></i>
              Items Requiring Admin Approval
            </h2>
            <span className="badge warning">{needsReview.length} items</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table review-table">
              <thead>
                <tr>
                  <th>McKesson Product</th>
                  <th>Suggested Match</th>
                  <th>Confidence</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {needsReview.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="product-cell">
                        <span className="product-name">{item.description || 'No description'}</span>
                        <span className="product-sku">Mfr #: {item.mfr_number || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      {item.matched_product ? (
                        <div className="product-cell suggested">
                          <span className="suggested-label">
                            <i className="fa-solid fa-robot"></i> AI Suggested
                          </span>
                          <span className="product-name">{item.matched_product.product_name}</span>
                          <span className="product-sku">SKU: {item.matched_product.manufacturer_item_code}</span>
                        </div>
                      ) : (
                        <span className="no-match">No match found</span>
                      )}
                    </td>
                    <td>
                      <div className={`confidence-badge ${getConfidenceClass(item.match_confidence)}`}>
                        {item.match_confidence}%
                      </div>
                    </td>
                    <td>
                      <button className="btn-review" onClick={() => handleReviewClick(item)}>
                        <i className="fa-solid fa-pen-to-square"></i>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matched Products Section */}
      {matchedProducts.length > 0 && (
        <div className="table-section">
          <div className="section-header">
            <h2>
              <i className="fa-solid fa-link"></i>
              Matched Products
            </h2>
            <span className="badge success">{matchedProducts.length} items</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table matched-table">
              <thead>
                <tr>
                  <th>McKesson Product</th>
                  <th></th>
                  <th>Hart Medical Product</th>
                  <th>Match Type</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {matchedProducts.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="product-cell">
                        <span className="product-name">{item.description || 'No description'}</span>
                        <span className="product-sku">{item.mfr_number || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="arrow-cell">
                      <i className="fa-solid fa-arrow-right"></i>
                    </td>
                    <td>
                      <div className="product-cell">
                        <span className="product-name">
                          {item.matched_product?.product_name || 'Unknown'}
                        </span>
                        <span className="product-sku">
                          {item.matched_product?.manufacturer_item_code || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`match-type-badge ${item.match_status === 'exact' ? 'exact' : 'preapproved'}`}>
                        {item.match_status === 'exact' ? 'Exact' : 'Pre-Approved'}
                      </span>
                    </td>
                    <td>
                      <span className="qty-value">{item.ship_qty || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No matches message */}
      {matchedProducts.length === 0 && needsReview.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-box-open"></i>
          <h3>No Items Found</h3>
          <p>No items were found in the uploaded file.</p>
        </div>
      )}

      {/* Actions Bar */}
      <div className="actions-bar">
        <button className="btn-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </button>
        <button className="btn-primary" onClick={onContinue}>
          Continue to Comparison
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      {/* Review Modal */}
      {reviewingItem && (
        <ReviewModal
          item={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onApprove={handleApproveMatch}
          onReject={handleRejectMatch}
        />
      )}
    </div>
  )
}

export default ReviewApprove
