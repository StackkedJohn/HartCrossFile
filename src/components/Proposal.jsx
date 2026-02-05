import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Proposal.css'

function Proposal({ uploadId, onBack }) {
  const [loading, setLoading] = useState(true)
  const [proposalData, setProposalData] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: ''
  })

  const defaultMarkup = 50

  useEffect(() => {
    async function fetchData() {
      if (!uploadId) return

      setLoading(true)

      try {
        // Get matched items
        const { data: items } = await supabase
          .from('upload_items')
          .select(`
            *,
            matched_product:products(
              id, manufacturer_item_code, product_name, unit_price
            )
          `)
          .eq('upload_id', uploadId)
          .in('match_status', ['exact', 'pre_approved', 'approved'])

        // Get upload info
        const { data: upload } = await supabase
          .from('uploads')
          .select('original_filename')
          .eq('id', uploadId)
          .single()

        // Extract customer name
        let customerName = 'Customer'
        if (upload?.original_filename) {
          customerName = upload.original_filename
            .replace(/\.(xlsx|xls|csv)$/i, '')
            .replace(/\s*(REPORT|report|\(\d+\))\s*/g, '')
            .trim() || 'Customer'
        }

        // Calculate totals
        const markupMultiplier = 1 + (defaultMarkup / 100)
        let currentSpend = 0
        let hartTotal = 0

        const products = (items || [])
          .filter(item => item.matched_product && item.cost_per_unit > 0)
          .map(item => {
            const qty = item.ship_qty || 1
            const mckessonTotal = item.cost_per_unit * qty
            const hartUnitPrice = item.matched_product.unit_price * markupMultiplier
            const hartItemTotal = hartUnitPrice * qty

            currentSpend += mckessonTotal
            hartTotal += hartItemTotal

            return {
              ...item,
              qty,
              mckessonUnitPrice: item.cost_per_unit,
              hartUnitPrice,
              savings: mckessonTotal - hartItemTotal
            }
          })
          .sort((a, b) => b.savings - a.savings)

        const annualCurrentSpend = currentSpend * 12
        const annualHartTotal = hartTotal * 12
        const annualSavings = annualCurrentSpend - annualHartTotal
        const savingsPercent = currentSpend > 0 ? ((currentSpend - hartTotal) / currentSpend) * 100 : 0

        setProposalData({
          customerName,
          products,
          matchedCount: products.length,
          currentSpend,
          hartTotal,
          annualCurrentSpend,
          annualHartTotal,
          annualSavings,
          savingsPercent
        })

        // Set up email form
        setEmailForm({
          to: '',
          subject: `Hart Medical Partnership Proposal - ${customerName}`,
          message: `Dear Team,\n\nThank you for the opportunity to present our proposal. Attached you'll find a comprehensive analysis showing potential savings of ${savingsPercent.toFixed(1)}% on your medical supply spend.\n\nI'd love to schedule a call to discuss further.\n\nBest regards,\nHart Medical Team`
        })

      } catch (error) {
        console.error('Error fetching proposal data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [uploadId])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatCurrencyDecimals = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const totalSlides = 5

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1))
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0))

  const handleSendEmail = () => {
    // Placeholder - would integrate with email service
    alert('Email functionality coming soon! This would send the proposal to: ' + emailForm.to)
    setShowEmailModal(false)
  }

  if (loading) {
    return (
      <div className="proposal-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Generating proposal...</p>
        </div>
      </div>
    )
  }

  if (!proposalData) {
    return (
      <div className="proposal-container">
        <div className="empty-state">
          <i className="fa-solid fa-file-circle-exclamation"></i>
          <h3>Unable to Generate Proposal</h3>
          <p>No matched products found.</p>
          <button className="btn-secondary" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
            Back to Comparison
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="proposal-container">
      {/* Slide Deck */}
      <div className="slide-deck">
        <div className="slides-wrapper" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          
          {/* Slide 1: Title */}
          <div className="slide slide-title">
            <div className="slide-content">
              <div className="title-badge">Partnership Proposal</div>
              <h1>{proposalData.customerName}</h1>
              <p className="subtitle">Prepared by Hart Medical</p>
              <div className="date">{today}</div>
            </div>
            <div className="slide-decoration">
              <div className="decoration-circle"></div>
              <div className="decoration-circle small"></div>
            </div>
          </div>

          {/* Slide 2: Why Partner */}
          <div className="slide slide-why">
            <div className="slide-content">
              <h2>Why Partner with Hart Medical?</h2>
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-number">99.8%</span>
                  <span className="stat-label">Order Accuracy</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24hr</span>
                  <span className="stat-label">Delivery Guarantee</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">15+</span>
                  <span className="stat-label">Years Experience</span>
                </div>
              </div>
              <div className="feature-box">
                <h3><i className="fa-solid fa-users"></i> Your Dedicated Team</h3>
                <p>Direct access to your account manager, technical support specialists, and executive leadership for all your supply chain needs.</p>
              </div>
            </div>
          </div>

          {/* Slide 3: Savings */}
          <div className="slide slide-savings">
            <div className="slide-content">
              <h2>Your Potential Savings</h2>
              <p className="slide-subtitle">Based on {proposalData.matchedCount} matched products</p>
              
              <div className="savings-grid">
                <div className="savings-card current">
                  <span className="savings-label">Current Spend</span>
                  <span className="savings-amount">{formatCurrency(proposalData.annualCurrentSpend)}</span>
                  <span className="savings-period">per year</span>
                </div>
                <div className="savings-card hart">
                  <span className="savings-label">With Hart Medical</span>
                  <span className="savings-amount">{formatCurrency(proposalData.annualHartTotal)}</span>
                  <span className="savings-period">per year</span>
                </div>
                <div className="savings-card total">
                  <span className="savings-label">Projected Annual Savings</span>
                  <span className="savings-amount highlight">{formatCurrency(proposalData.annualSavings)}</span>
                  <span className="savings-percent">{proposalData.savingsPercent.toFixed(1)}% reduction on matched items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 4: Products */}
          <div className="slide slide-products">
            <div className="slide-content">
              <h2>Product Equivalents</h2>
              <div className="product-list-slide">
                {proposalData.products.slice(0, 5).map((item) => (
                  <div key={item.id} className="product-row">
                    <div className="product-info">
                      <span className="product-original">{item.description}</span>
                      <span className="product-hart">{item.matched_product?.product_name}</span>
                    </div>
                    <div className="product-prices">
                      <span className="price-old">{formatCurrencyDecimals(item.mckessonUnitPrice)}</span>
                      <span className="price-new">{formatCurrencyDecimals(item.hartUnitPrice)}</span>
                    </div>
                  </div>
                ))}
                {proposalData.products.length > 5 && (
                  <div className="more-products">
                    + {proposalData.products.length - 5} more products
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Slide 5: Next Steps */}
          <div className="slide slide-cta">
            <div className="slide-content">
              <h2>Next Steps</h2>
              <div className="steps-list">
                <div className="step-item">
                  <span className="step-number">1</span>
                  <span className="step-text">Review proposal and product matches</span>
                </div>
                <div className="step-item">
                  <span className="step-number">2</span>
                  <span className="step-text">Schedule call with your dedicated account team</span>
                </div>
                <div className="step-item">
                  <span className="step-number">3</span>
                  <span className="step-text">Trial order with satisfaction guarantee</span>
                </div>
                <div className="step-item">
                  <span className="step-number">4</span>
                  <span className="step-text">Full transition with white-glove support</span>
                </div>
              </div>
              <div className="cta-box">
                <p>Ready to save <strong>{formatCurrency(proposalData.annualSavings)}</strong> annually?</p>
                <span className="cta-tagline">Contact us today!</span>
              </div>
            </div>
          </div>

        </div>

        {/* Navigation */}
        <div className="slide-nav">
          <button 
            className="nav-btn prev" 
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="slide-dots">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                className={`dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
          <button 
            className="nav-btn next" 
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="proposal-actions">
        <button className="btn-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </button>
        <div className="action-buttons">
          <button className="btn-outline">
            <i className="fa-solid fa-download"></i>
            Download Deck
          </button>
          <button className="btn-primary" onClick={() => setShowEmailModal(true)}>
            <i className="fa-solid fa-envelope"></i>
            Email to Client
          </button>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content email-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Proposal</h2>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>To:</label>
                <input
                  type="email"
                  placeholder="client@company.com"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Message:</label>
                <textarea
                  rows={6}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
              <div className="attachment-note">
                <i className="fa-solid fa-paperclip"></i>
                <span>Proposal_{proposalData.customerName.replace(/\s+/g, '_')}.pdf will be attached</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEmailModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSendEmail}>
                <i className="fa-solid fa-paper-plane"></i>
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Proposal
