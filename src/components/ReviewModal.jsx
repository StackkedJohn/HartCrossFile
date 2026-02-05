import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './ReviewModal.css'

function ReviewModal({ item, onClose, onApprove, onReject }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, manufacturer_item_code, product_name, item_description, unit_price, category_path_name')
        .eq('is_active', true)
        .order('product_name')
        .limit(100)

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  const handleSearch = async (term) => {
    setSearchTerm(term)
    if (term.length < 2) {
      // Reset to default list
      const { data } = await supabase
        .from('products')
        .select('id, manufacturer_item_code, product_name, item_description, unit_price, category_path_name')
        .eq('is_active', true)
        .order('product_name')
        .limit(100)
      setProducts(data || [])
      return
    }

    const { data, error } = await supabase
      .from('products')
      .select('id, manufacturer_item_code, product_name, item_description, unit_price, category_path_name')
      .eq('is_active', true)
      .or(`product_name.ilike.%${term}%,manufacturer_item_code.ilike.%${term}%,item_description.ilike.%${term}%`)
      .order('product_name')
      .limit(50)

    if (!error) {
      setProducts(data || [])
    }
  }

  const handleApprove = async (product) => {
    setSaving(true)
    try {
      // Update the upload_item with the match
      await supabase
        .from('upload_items')
        .update({
          match_status: 'approved',
          matched_product_id: product.id,
          match_confidence: 100,
          match_notes: 'Manually approved by admin'
        })
        .eq('id', item.id)

      // Add to approved_matches for future reference
      await supabase
        .from('approved_matches')
        .upsert({
          mckesson_mfr_number: item.mfr_number,
          mckesson_description: item.description,
          hart_product_id: product.id,
          hart_manufacturer_item_code: product.manufacturer_item_code,
          approved_by: 'admin',
          approval_notes: 'Approved via review modal'
        }, { onConflict: 'mckesson_mfr_number' })

      onApprove(item.id, product)
    } catch (error) {
      console.error('Error approving match:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleNoMatch = async () => {
    setSaving(true)
    try {
      await supabase
        .from('upload_items')
        .update({
          match_status: 'rejected',
          matched_product_id: null,
          match_confidence: 0,
          match_notes: 'No matching product available'
        })
        .eq('id', item.id)

      onReject(item.id)
    } catch (error) {
      console.error('Error rejecting match:', error)
    } finally {
      setSaving(false)
    }
  }

  const getCategoryShort = (categoryPath) => {
    if (!categoryPath) return ''
    const parts = categoryPath.split('|')
    return parts[0] || ''
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Review Match</h2>
            <p>Select the correct Hart Medical product</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body">
          {/* McKesson Product */}
          <div className="source-product">
            <div className="source-label">McKesson Product</div>
            <div className="source-details">
              <h3>{item.description || 'No description'}</h3>
              <span className="source-sku">MFR SKU: {item.mfr_number || 'N/A'}</span>
              {item.manufacturer && (
                <span className="source-manufacturer">{item.manufacturer}</span>
              )}
            </div>
          </div>

          {/* AI Suggested Match */}
          {item.matched_product && item.match_confidence > 0 && (
            <div className="suggested-match">
              <div className="suggested-header">
                <i className="fa-solid fa-robot"></i>
                <span>AI Suggested Match ({item.match_confidence}% confidence)</span>
              </div>
              <div className="suggested-product">
                <div className="suggested-info">
                  <h4>{item.matched_product.product_name}</h4>
                  <span className="suggested-sku">SKU: {item.matched_product.manufacturer_item_code}</span>
                </div>
                <button 
                  className="btn-approve-suggested"
                  onClick={() => handleApprove(item.matched_product)}
                  disabled={saving}
                >
                  <i className="fa-solid fa-check"></i>
                  Approve
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="product-search">
            <div className="search-label">Or select from all products:</div>
            <div className="search-input-wrapper">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Product List */}
          <div className="product-list">
            {loading ? (
              <div className="loading-products">
                <div className="spinner-small"></div>
                <span>Loading products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="no-products">No products found</div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="product-item-info">
                    <span className="product-item-name">{product.product_name}</span>
                    <span className="product-item-meta">
                      {product.manufacturer_item_code}
                      {getCategoryShort(product.category_path_name) && (
                        <> · {getCategoryShort(product.category_path_name)}</>
                      )}
                    </span>
                  </div>
                  <div className="product-item-price">
                    ${product.unit_price?.toFixed(2) || '0.00'}
                  </div>
                  {selectedProduct?.id === product.id && (
                    <button 
                      className="btn-select-product"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprove(product)
                      }}
                      disabled={saving}
                    >
                      <i className="fa-solid fa-check"></i>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-no-match" 
            onClick={handleNoMatch}
            disabled={saving}
          >
            <i className="fa-solid fa-ban"></i>
            Mark as No Available Match
          </button>
          {selectedProduct && (
            <button 
              className="btn-confirm-match"
              onClick={() => handleApprove(selectedProduct)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Confirm Match'}
              {!saving && <i className="fa-solid fa-arrow-right"></i>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
