import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import MatchBuilder from './MatchBuilder'
import './AdminPanel.css'

function AdminPanel() {
  // Existing matches state
  const [matches, setMatches] = useState([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [matchSearch, setMatchSearch] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [matchPage, setMatchPage] = useState(0)
  const PAGE_SIZE = 20

  // Edit state
  const [editingMatch, setEditingMatch] = useState(null)
  const [editProducts, setEditProducts] = useState([])
  const [editSearch, setEditSearch] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null)

  // Fetch existing approved matches
  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true)

    let query = supabase
      .from('approved_matches')
      .select(`
        *,
        product:products(product_name, unit_price, package_type, manufacturer_item_code)
      `, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(matchPage * PAGE_SIZE, (matchPage + 1) * PAGE_SIZE - 1)

    if (matchSearch.trim()) {
      const term = `%${matchSearch.trim()}%`
      query = query.or(`mckesson_mfr_number.ilike.${term},mckesson_description.ilike.${term},hart_manufacturer_item_code.ilike.${term}`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching matches:', error)
    } else {
      setMatches(data || [])
      setMatchCount(count || 0)
    }
    setMatchesLoading(false)
  }, [matchPage, matchSearch])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  // Debounced match search
  useEffect(() => {
    setMatchPage(0)
  }, [matchSearch])

  // Edit match - search Hart products
  const handleEditSearch = async (term) => {
    setEditSearch(term)
    if (term.length < 2) {
      setEditProducts([])
      return
    }

    setEditLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, product_name, item_description, manufacturer_item_code, unit_price, package_type')
      .eq('is_active', true)
      .or(`product_name.ilike.%${term}%,manufacturer_item_code.ilike.%${term}%,item_description.ilike.%${term}%`)
      .order('product_name')
      .limit(30)

    if (!error) {
      setEditProducts(data || [])
    }
    setEditLoading(false)
  }

  const handleEditSave = async (matchId, newProduct) => {
    const { error } = await supabase
      .from('approved_matches')
      .update({
        hart_product_id: newProduct.id,
        hart_manufacturer_item_code: newProduct.manufacturer_item_code,
        approval_notes: `Updated mapping to ${newProduct.product_name}`
      })
      .eq('id', matchId)

    if (error) {
      console.error('Error updating match:', error)
      return
    }

    setEditingMatch(null)
    setEditSearch('')
    setEditProducts([])
    fetchMatches()
  }

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('approved_matches')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting match:', error)
      return
    }

    setDeletingId(null)
    fetchMatches()
  }

  const totalPages = Math.ceil(matchCount / PAGE_SIZE)

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>
            <i className="fa-solid fa-gear"></i>
            Pre-Approved Match Management
          </h1>
          <p className="admin-subtitle">View, edit, delete, and create pre-approved product match mappings</p>
        </div>
      </div>

      {/* Section 1: Existing Approved Matches */}
      <div className="admin-section">
        <div className="section-header">
          <h2>
            <i className="fa-solid fa-link"></i>
            Existing Approved Matches
          </h2>
          <span className="badge success">{matchCount} matches</span>
        </div>

        <div className="admin-search-bar">
          <div className="search-input-wrapper">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search by MFR #, description, or Hart SKU..."
              value={matchSearch}
              onChange={(e) => setMatchSearch(e.target.value)}
            />
            {matchSearch && (
              <button className="search-clear" onClick={() => setMatchSearch('')}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          {matchesLoading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Loading matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-box-open"></i>
              <h3>{matchSearch ? 'No matches found' : 'No approved matches yet'}</h3>
              <p>{matchSearch ? 'Try a different search term' : 'Create your first match below'}</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>McKesson MFR #</th>
                  <th>McKesson Description</th>
                  <th>Hart Product</th>
                  <th>Hart SKU</th>
                  <th>Approved By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>
                      <span className="mono-text">{match.mckesson_mfr_number}</span>
                    </td>
                    <td>
                      <span className="desc-text">{match.mckesson_description || '—'}</span>
                    </td>
                    <td>
                      <div className="product-cell">
                        <span className="product-name">{match.product?.product_name || '—'}</span>
                        {match.product?.package_type && (
                          <span className="product-meta">{match.product.package_type} · ${Number(match.product.unit_price || 0).toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="mono-text">{match.hart_manufacturer_item_code}</span>
                    </td>
                    <td>{match.approved_by || '—'}</td>
                    <td className="date-cell">
                      {match.updated_at ? new Date(match.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-icon edit"
                          title="Edit match"
                          onClick={() => {
                            setEditingMatch(match)
                            setEditSearch('')
                            setEditProducts([])
                          }}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        {deletingId === match.id ? (
                          <div className="confirm-delete">
                            <button className="btn-icon confirm-yes" onClick={() => handleDelete(match.id)} title="Confirm delete">
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button className="btn-icon confirm-no" onClick={() => setDeletingId(null)} title="Cancel">
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-icon delete"
                            title="Delete match"
                            onClick={() => setDeletingId(match.id)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn-page"
              disabled={matchPage === 0}
              onClick={() => setMatchPage(p => p - 1)}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <span className="page-info">
              Page {matchPage + 1} of {totalPages}
            </span>
            <button
              className="btn-page"
              disabled={matchPage >= totalPages - 1}
              onClick={() => setMatchPage(p => p + 1)}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingMatch && (
        <div className="modal-overlay" onClick={() => setEditingMatch(null)}>
          <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit Match</h2>
                <p>Change the Hart product for: <strong>{editingMatch.mckesson_mfr_number}</strong></p>
              </div>
              <button className="modal-close" onClick={() => setEditingMatch(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="current-match-info">
                <span className="current-label">Current match:</span>
                <span>{editingMatch.product?.product_name || editingMatch.hart_manufacturer_item_code}</span>
              </div>

              <div className="edit-search-wrapper">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Search Hart products..."
                  value={editSearch}
                  onChange={(e) => handleEditSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="edit-product-list">
                {editLoading ? (
                  <div className="loading-inline"><div className="spinner-small"></div> Searching...</div>
                ) : editProducts.length === 0 && editSearch.length >= 2 ? (
                  <div className="no-results-inline">No products found</div>
                ) : (
                  editProducts.map(product => (
                    <div
                      key={product.id}
                      className="edit-product-item"
                      onClick={() => handleEditSave(editingMatch.id, product)}
                    >
                      <div className="edit-product-info">
                        <span className="edit-product-name">{product.product_name}</span>
                        <span className="edit-product-meta">
                          {product.manufacturer_item_code} · {product.package_type || '—'} · ${Number(product.unit_price || 0).toFixed(2)}
                        </span>
                      </div>
                      <i className="fa-solid fa-arrow-right"></i>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Create New Match */}
      <div className="admin-section">
        <div className="section-header">
          <h2>
            <i className="fa-solid fa-plus-circle"></i>
            Create New Pre-Approved Match
          </h2>
        </div>

        <MatchBuilder onMatchCreated={fetchMatches} />
      </div>
    </div>
  )
}

export default AdminPanel
