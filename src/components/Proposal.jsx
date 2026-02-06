import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import pptxgen from 'pptxgenjs'
import './Proposal.css'

const HART_LOGO_URL = 'https://hart-medical.com/cdn/shop/files/Hart_Horizontal_logo.svg?v=1755207154&width=220'
const REP_PHOTO_URL = '/images/nick-hart.png'

// Static sales rep info
const REP = {
  name: 'Nicholas Bomar',
  title: 'Senior Account Executive',
  email: 'nick@hart-medical.com',
  phone: '(601) 555-0142',
  bio: 'With over 12 years of experience in healthcare supply chain management, Nicholas specializes in helping medical facilities optimize their procurement processes. His deep understanding of clinical workflows and product knowledge ensures every client receives tailored solutions that drive real cost savings.'
}

// Brand palette (matches template)
const COLORS = {
  deepRed: '7A0B05',
  darkRed: '5C0804',
  blush: 'EAD0D5',
  blushLight: 'F3E4E8',
  white: 'FFFFFF',
  offWhite: 'FAF7F8',
  lightGray: 'F0EAEC',
  midGray: '8C7D81',
  black: '000000',
  charcoal: '2D2326',
  darkText: '1A1012',
  green: '2E7D32',
}

function Proposal({ uploadId, customerInfo, onBack }) {
  const [loading, setLoading] = useState(true)
  const [proposalData, setProposalData] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' })

  const defaultMarkup = 50

  useEffect(() => {
    async function fetchData() {
      if (!uploadId) return
      setLoading(true)

      try {
        const { data: items } = await supabase
          .from('upload_items')
          .select(`*, matched_product:products(id, manufacturer_item_code, product_name, item_description, unit_price, package_type)`)
          .eq('upload_id', uploadId)
          .in('match_status', ['exact', 'pre_approved', 'approved'])

        const { data: upload } = await supabase
          .from('uploads')
          .select('original_filename, customer_name, customer_position, company_name')
          .eq('id', uploadId)
          .single()

        let companyName = upload?.company_name || customerInfo?.companyName || 'Customer'
        if (companyName === 'Customer' && upload?.original_filename) {
          companyName = upload.original_filename.replace(/\.(xlsx|xls|csv)$/i, '').replace(/\s*(REPORT|report|\(\d+\))\s*/g, '').trim() || 'Customer'
        }
        const contactName = upload?.customer_name || customerInfo?.customerName || ''
        const contactPosition = upload?.customer_position || customerInfo?.customerPosition || ''

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
              ...item, qty,
              mckessonUnitPrice: item.cost_per_unit,
              hartUnitPrice, hartItemTotal,
              mckessonTotal,
              savings: mckessonTotal - hartItemTotal
            }
          })
          .sort((a, b) => b.savings - a.savings)

        const annualCurrentSpend = currentSpend * 12
        const annualHartTotal = hartTotal * 12
        const annualSavings = annualCurrentSpend - annualHartTotal
        const savingsPercent = currentSpend > 0 ? ((currentSpend - hartTotal) / currentSpend) * 100 : 0

        setProposalData({
          companyName, contactName, contactPosition,
          products, matchedCount: products.length,
          currentSpend, hartTotal,
          annualCurrentSpend, annualHartTotal, annualSavings, savingsPercent
        })

        setEmailForm({
          to: '',
          subject: `Hart Medical Partnership Proposal - ${companyName}`,
          message: `Dear ${contactName || 'Team'},\n\nThank you for the opportunity to present our proposal. Attached you'll find a comprehensive analysis showing potential savings of ${savingsPercent.toFixed(1)}% on your medical supply spend.\n\nI'd love to schedule a call to discuss further.\n\nBest regards,\n${REP.name}\n${REP.title}\nHart Medical`
        })
      } catch (error) {
        console.error('Error fetching proposal data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [uploadId])

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  const formatCurrencyDecimals = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)

  const proposalDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  const totalSlides = 7
  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1))
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0))

  // ============ PPTX GENERATION ============
  const generatePPTX = async () => {
    if (!proposalData) return
    setGenerating(true)

    try {
      const pres = new pptxgen()
      pres.layout = 'LAYOUT_16x9'
      pres.author = 'Hart Medical'
      pres.title = `Hart Medical - Savings Proposal for ${proposalData.companyName}`

      const FONTS = { header: 'Georgia', body: 'Calibri' }

      // Helper
      const makeCardShadow = () => ({ type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.08 })

      // --- SLIDE 1: TITLE ---
      const s1 = pres.addSlide()
      s1.background = { color: COLORS.deepRed }
      s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: COLORS.blush } })
      s1.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.8, w: 0.05, h: 1.8, fill: { color: COLORS.blush } })
      s1.addText('HART MEDICAL', { x: 0.85, y: 0.85, w: 5, h: 0.55, fontSize: 16, fontFace: FONTS.header, color: COLORS.blush, charSpacing: 6, bold: true })
      s1.addText('Savings Proposal', { x: 0.85, y: 1.4, w: 6, h: 0.9, fontSize: 44, fontFace: FONTS.header, color: COLORS.white, bold: true })
      s1.addText(`Prepared for ${proposalData.companyName}`, { x: 0.85, y: 2.3, w: 5.5, h: 0.45, fontSize: 18, fontFace: FONTS.body, color: COLORS.blush })
      s1.addShape(pres.shapes.LINE, { x: 0.85, y: 3.1, w: 2.5, h: 0, line: { color: COLORS.blush, width: 1.5 } })
      s1.addText(proposalDate, { x: 0.85, y: 3.3, w: 3, h: 0.35, fontSize: 13, fontFace: FONTS.body, color: COLORS.blush })
      s1.addText('CONFIDENTIAL', { x: 0.85, y: 3.6, w: 3, h: 0.3, fontSize: 10, fontFace: FONTS.body, color: COLORS.white, charSpacing: 4 })
      // Bottom info bar
      s1.addShape(pres.shapes.RECTANGLE, { x: 0, y: 4.85, w: 10, h: 0.78, fill: { color: COLORS.darkRed } })
      if (proposalData.contactName) {
        s1.addText(proposalData.contactName, { x: 0.85, y: 4.95, w: 2.5, h: 0.4, fontSize: 11, fontFace: FONTS.body, color: COLORS.white })
      }
      if (proposalData.contactPosition) {
        s1.addText(proposalData.contactPosition, { x: 3.8, y: 4.95, w: 2.6, h: 0.4, fontSize: 11, fontFace: FONTS.body, color: COLORS.white })
      }
      s1.addText(`${proposalData.matchedCount} Products Analyzed`, { x: 7.2, y: 4.95, w: 2.5, h: 0.4, fontSize: 11, fontFace: FONTS.body, color: COLORS.white })

      // --- SLIDE 2: ABOUT US ---
      const s2 = pres.addSlide()
      s2.background = { color: COLORS.offWhite }
      s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: COLORS.deepRed } })
      s2.addText('ABOUT US', { x: 0.7, y: 0.35, w: 3, h: 0.3, fontSize: 10, fontFace: FONTS.body, color: COLORS.deepRed, charSpacing: 4, bold: true })
      s2.addText('Your Partner in Healthcare Supply Excellence', { x: 0.7, y: 0.65, w: 8.6, h: 0.65, fontSize: 28, fontFace: FONTS.header, color: COLORS.black, bold: true })
      s2.addText('Hart Medical delivers quality products from diagnostic tools to everyday exam room essentials, backed by the personalized service only a family-owned business can provide. We leverage cutting-edge technology and deep industry relationships to ensure our clients receive the best products at the most competitive prices.', { x: 0.7, y: 1.45, w: 8.6, h: 0.75, fontSize: 13, fontFace: FONTS.body, color: COLORS.charcoal, lineSpacingMultiple: 1.4 })

      const valueProps = [
        { title: 'Competitive Pricing', desc: 'Direct manufacturer relationships and volume purchasing power deliver savings of 15-30% compared to traditional distributors.' },
        { title: 'Reliable Fulfillment', desc: 'Next-day delivery on 95% of orders with real-time tracking and dedicated logistics coordination.' },
        { title: 'Quality Assurance', desc: 'Every product vetted against rigorous clinical standards. Full compliance documentation and lot tracking included.' },
        { title: 'Product Breadth', desc: 'Access to over 50,000 SKUs across all major medical categories, from exam gloves to advanced diagnostics.' },
      ]
      const cardW = 4.1, cardH = 1.35, startX = 0.7, startY = 2.45, gapX = 0.4, gapY = 0.35
      valueProps.forEach((vp, i) => {
        const col = i % 2, row = Math.floor(i / 2)
        const cx = startX + col * (cardW + gapX), cy = startY + row * (cardH + gapY)
        s2.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: cardW, h: cardH, fill: { color: COLORS.white }, shadow: makeCardShadow() })
        s2.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: 0.05, h: cardH, fill: { color: COLORS.deepRed } })
        s2.addText(vp.title, { x: cx + 0.25, y: cy + 0.15, w: 3.6, h: 0.35, fontSize: 14, fontFace: FONTS.header, color: COLORS.deepRed, bold: true })
        s2.addText(vp.desc, { x: cx + 0.25, y: cy + 0.48, w: 3.6, h: 0.75, fontSize: 10, fontFace: FONTS.body, color: COLORS.charcoal, lineSpacingMultiple: 1.3 })
      })
      s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.42, w: 10, h: 0.21, fill: { color: COLORS.deepRed } })
      s2.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.42, w: 3.3, h: 0.21, fill: { color: COLORS.blush } })

      // --- SLIDE 3: YOUR SALES REP ---
      const s3 = pres.addSlide()
      s3.background = { color: COLORS.deepRed }
      s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: COLORS.blush } })
      s3.addText('YOUR DEDICATED REPRESENTATIVE', { x: 0.7, y: 0.4, w: 5, h: 0.3, fontSize: 10, fontFace: FONTS.body, color: COLORS.blush, charSpacing: 4, bold: true })
      s3.addText(REP.name, { x: 0.7, y: 0.8, w: 5, h: 0.65, fontSize: 36, fontFace: FONTS.header, color: COLORS.white, bold: true })
      s3.addText(REP.title, { x: 0.7, y: 1.45, w: 5, h: 0.35, fontSize: 16, fontFace: FONTS.body, color: COLORS.blush, italic: true })
      s3.addShape(pres.shapes.LINE, { x: 0.7, y: 2.0, w: 4.5, h: 0, line: { color: COLORS.blush, width: 1 } })
      s3.addText(REP.bio, { x: 0.7, y: 2.2, w: 4.8, h: 1.4, fontSize: 12, fontFace: FONTS.body, color: COLORS.blush, lineSpacingMultiple: 1.5 })
      // Contact cards
      const contactItems = [{ label: REP.phone }, { label: REP.email }]
      contactItems.forEach((item, idx) => {
        const cy = 3.85 + idx * 0.55
        s3.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: cy, w: 4.5, h: 0.42, fill: { color: COLORS.darkRed } })
        s3.addText(item.label, { x: 0.85, y: cy, w: 4.2, h: 0.42, fontSize: 12, fontFace: FONTS.body, color: COLORS.white, valign: 'middle' })
      })
      // Photo
      try {
        s3.addImage({ path: window.location.origin + REP_PHOTO_URL, x: 6.0, y: 0.6, w: 3.3, h: 4.2, sizing: { type: 'cover', w: 3.3, h: 4.2 } })
      } catch {
        s3.addShape(pres.shapes.RECTANGLE, { x: 6.0, y: 0.6, w: 3.3, h: 4.2, fill: { color: COLORS.darkRed } })
      }
      s3.addShape(pres.shapes.RECTANGLE, { x: 6.0, y: 0.6, w: 3.3, h: 0.06, fill: { color: COLORS.blush } })
      s3.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.1, w: 10, h: 0.53, fill: { color: COLORS.darkRed } })
      s3.addText('HART MEDICAL', { x: 0.7, y: 5.15, w: 3, h: 0.42, fontSize: 11, fontFace: FONTS.header, color: COLORS.blush, charSpacing: 4, valign: 'middle' })
      s3.addText('Personalized Service. Proven Results.', { x: 5.5, y: 5.15, w: 4, h: 0.42, fontSize: 11, fontFace: FONTS.body, color: COLORS.blush, italic: true, align: 'right', valign: 'middle' })

      // --- SLIDE 4: SAVINGS OVERVIEW ---
      const s4 = pres.addSlide()
      s4.background = { color: COLORS.offWhite }
      s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: COLORS.deepRed } })
      s4.addText('SAVINGS ANALYSIS', { x: 0.7, y: 0.3, w: 3, h: 0.3, fontSize: 10, fontFace: FONTS.body, color: COLORS.deepRed, charSpacing: 4, bold: true })
      s4.addText('Your Estimated Annual Savings', { x: 0.7, y: 0.6, w: 8, h: 0.55, fontSize: 28, fontFace: FONTS.header, color: COLORS.black, bold: true })

      const kpis = [
        { value: formatCurrency(proposalData.annualSavings), label: 'Estimated Annual Savings', highlight: true },
        { value: `${proposalData.savingsPercent.toFixed(1)}%`, label: 'Average Cost Reduction', highlight: false },
        { value: proposalData.matchedCount.toLocaleString(), label: 'Products Matched', highlight: false },
      ]
      const kpiW = 2.8, kpiGap = 0.2
      kpis.forEach((kpi, idx) => {
        const kx = 0.7 + idx * (kpiW + kpiGap), ky = 1.35
        s4.addShape(pres.shapes.RECTANGLE, { x: kx, y: ky, w: kpiW, h: 1.35, fill: { color: kpi.highlight ? COLORS.deepRed : COLORS.white }, shadow: makeCardShadow() })
        s4.addShape(pres.shapes.RECTANGLE, { x: kx, y: ky, w: 0.06, h: 1.35, fill: { color: kpi.highlight ? COLORS.blush : COLORS.deepRed } })
        s4.addText(kpi.value, { x: kx + 0.15, y: ky + 0.25, w: kpiW - 0.3, h: 0.55, fontSize: 28, fontFace: FONTS.header, color: kpi.highlight ? COLORS.white : COLORS.deepRed, bold: true })
        s4.addText(kpi.label, { x: kx + 0.15, y: ky + 0.85, w: kpiW - 0.3, h: 0.3, fontSize: 10, fontFace: FONTS.body, color: kpi.highlight ? COLORS.blush : COLORS.charcoal })
      })

      // Bar chart
      s4.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 2.95, w: 8.6, h: 2.3, fill: { color: COLORS.white }, shadow: makeCardShadow() })
      s4.addText('Current vs. Proposed Annual Spend', { x: 0.9, y: 3.05, w: 5, h: 0.35, fontSize: 13, fontFace: FONTS.header, color: COLORS.black, bold: true })
      s4.addChart(pres.charts.BAR, [{ name: 'Spend', labels: ['Current Spend', 'With Hart Medical'], values: [proposalData.annualCurrentSpend, proposalData.annualHartTotal] }], {
        x: 0.9, y: 3.4, w: 8.2, h: 1.7,
        barDir: 'col', chartColors: [COLORS.deepRed],
        catAxisLabelColor: COLORS.charcoal, catAxisLabelFontSize: 11,
        valAxisLabelColor: COLORS.darkText, valAxisLabelFontSize: 10,
        valGridLine: { color: COLORS.lightGray, size: 0.5 }, catGridLine: { style: 'none' },
        showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: COLORS.charcoal, dataLabelFontSize: 9,
        showLegend: false, valAxisNumFmt: '$#,##0',
      })
      s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.42, w: 10, h: 0.21, fill: { color: COLORS.deepRed } })
      s4.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.42, w: 3.3, h: 0.21, fill: { color: COLORS.blush } })

      // --- SLIDE 5: PRODUCT COMPARISON TABLE ---
      const s5 = pres.addSlide()
      s5.background = { color: COLORS.offWhite }
      s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: COLORS.deepRed } })
      s5.addText('PRODUCT ANALYSIS', { x: 0.7, y: 0.3, w: 3, h: 0.3, fontSize: 10, fontFace: FONTS.body, color: COLORS.deepRed, charSpacing: 4, bold: true })
      s5.addText('Top Savings Opportunities', { x: 0.7, y: 0.6, w: 8, h: 0.55, fontSize: 28, fontFace: FONTS.header, color: COLORS.black, bold: true })

      const headerOpts = { fill: { color: COLORS.deepRed }, color: COLORS.white, bold: true, fontSize: 10, fontFace: FONTS.body }
      const tableHeader = [
        { text: 'Product', options: headerOpts },
        { text: 'Current\nPrice', options: { ...headerOpts, align: 'center' } },
        { text: 'Hart\nPrice', options: { ...headerOpts, align: 'center' } },
        { text: 'Qty', options: { ...headerOpts, align: 'center' } },
        { text: 'Savings', options: { ...headerOpts, align: 'center' } },
      ]

      const topProducts = proposalData.products.slice(0, 8)
      const tableRows = topProducts.map((item, idx) => {
        const bg = idx % 2 === 0 ? COLORS.blushLight : COLORS.white
        const prodName = (item.enriched_name || item.description || '').substring(0, 45)
        return [
          { text: prodName, options: { fill: { color: bg }, fontSize: 9, fontFace: FONTS.body, color: COLORS.charcoal } },
          { text: formatCurrencyDecimals(item.mckessonUnitPrice), options: { fill: { color: bg }, fontSize: 10, fontFace: FONTS.body, color: COLORS.charcoal, align: 'center' } },
          { text: formatCurrencyDecimals(item.hartUnitPrice), options: { fill: { color: bg }, fontSize: 10, fontFace: FONTS.body, color: COLORS.green, bold: true, align: 'center' } },
          { text: String(item.qty), options: { fill: { color: bg }, fontSize: 10, fontFace: FONTS.body, color: COLORS.charcoal, align: 'center' } },
          { text: formatCurrencyDecimals(item.savings), options: { fill: { color: bg }, fontSize: 10, fontFace: FONTS.body, color: item.savings >= 0 ? COLORS.green : 'EF4444', bold: true, align: 'center' } },
        ]
      })

      // Total row
      const totalSavingsTop = topProducts.reduce((sum, i) => sum + i.savings, 0)
      tableRows.push([
        { text: 'TOTAL', options: { fill: { color: COLORS.blush }, color: COLORS.deepRed, bold: true, fontSize: 10, fontFace: FONTS.body } },
        { text: '', options: { fill: { color: COLORS.blush } } },
        { text: '', options: { fill: { color: COLORS.blush } } },
        { text: '', options: { fill: { color: COLORS.blush } } },
        { text: formatCurrencyDecimals(totalSavingsTop), options: { fill: { color: COLORS.blush }, color: COLORS.deepRed, bold: true, fontSize: 11, fontFace: FONTS.body, align: 'center' } },
      ])

      s5.addTable([tableHeader, ...tableRows], {
        x: 0.5, y: 1.25, w: 9.0,
        colW: [3.5, 1.3, 1.3, 0.9, 1.3],
        border: { pt: 0.5, color: COLORS.lightGray },
      })
      s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.42, w: 10, h: 0.21, fill: { color: COLORS.deepRed } })
      s5.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.42, w: 3.3, h: 0.21, fill: { color: COLORS.blush } })

      // --- SLIDE 6: NEXT STEPS ---
      const s6 = pres.addSlide()
      s6.background = { color: COLORS.white }
      s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: COLORS.deepRed } })
      s6.addText('NEXT STEPS', { x: 0.7, y: 0.3, w: 3, h: 0.3, fontSize: 10, fontFace: FONTS.body, color: COLORS.deepRed, charSpacing: 4, bold: true })
      s6.addText('Your Path to Savings Starts Here', { x: 0.7, y: 0.6, w: 8, h: 0.55, fontSize: 28, fontFace: FONTS.header, color: COLORS.black, bold: true })

      const steps = [
        { num: '01', title: 'Review & Approval', desc: 'Review this proposal with your procurement team. We\'ll schedule a call to address any questions and discuss customizations.' },
        { num: '02', title: 'Account Setup', desc: 'Complete vendor onboarding paperwork. We handle the heavy lifting — compliance docs, tax forms, and system integration.' },
        { num: '03', title: 'Pilot Program', desc: 'Start with a 30-day trial on your top 50 products. Zero risk — if we don\'t beat your current pricing, no obligation.' },
        { num: '04', title: 'Full Transition', desc: 'Scale to full product catalog with dedicated support. Ongoing price monitoring ensures you always have the best rates.' },
      ]
      steps.forEach((step, idx) => {
        const sy = 1.35 + idx * 0.95
        s6.addShape(pres.shapes.OVAL, { x: 0.7, y: sy + 0.05, w: 0.55, h: 0.55, fill: { color: COLORS.deepRed } })
        s6.addText(step.num, { x: 0.7, y: sy + 0.05, w: 0.55, h: 0.55, fontSize: 14, fontFace: FONTS.header, color: COLORS.white, bold: true, align: 'center', valign: 'middle' })
        if (idx < 3) {
          s6.addShape(pres.shapes.LINE, { x: 0.975, y: sy + 0.62, w: 0, h: 0.33, line: { color: COLORS.blush, width: 2 } })
        }
        s6.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: sy, w: 7.8, h: 0.7, fill: { color: COLORS.blushLight } })
        s6.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: sy, w: 0.05, h: 0.7, fill: { color: COLORS.deepRed } })
        s6.addText(step.title, { x: 1.75, y: sy + 0.02, w: 3, h: 0.3, fontSize: 14, fontFace: FONTS.header, color: COLORS.deepRed, bold: true })
        s6.addText(step.desc, { x: 1.75, y: sy + 0.32, w: 7.3, h: 0.35, fontSize: 10, fontFace: FONTS.body, color: COLORS.charcoal })
      })
      s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.42, w: 10, h: 0.21, fill: { color: COLORS.deepRed } })
      s6.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.42, w: 3.3, h: 0.21, fill: { color: COLORS.blush } })

      // --- SLIDE 7: THANK YOU ---
      const s7 = pres.addSlide()
      s7.background = { color: COLORS.deepRed }
      s7.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: COLORS.blush } })
      s7.addText('Thank You', { x: 1.0, y: 0.8, w: 8, h: 1.0, fontSize: 48, fontFace: FONTS.header, color: COLORS.white, bold: true, align: 'center' })
      s7.addText(proposalData.companyName, { x: 1.0, y: 1.7, w: 8, h: 0.5, fontSize: 20, fontFace: FONTS.body, color: COLORS.blush, align: 'center' })
      s7.addShape(pres.shapes.LINE, { x: 3.5, y: 2.4, w: 3, h: 0, line: { color: COLORS.blush, width: 1.5 } })
      s7.addText('Quality products. Honest pricing. A partner you can trust.', { x: 1.0, y: 2.6, w: 8, h: 0.45, fontSize: 15, fontFace: FONTS.body, color: COLORS.blush, italic: true, align: 'center' })
      // Contact box
      s7.addShape(pres.shapes.RECTANGLE, { x: 2.0, y: 3.3, w: 6.0, h: 1.3, fill: { color: COLORS.darkRed }, line: { color: COLORS.blush, width: 1 } })
      s7.addText(REP.name, { x: 2.0, y: 3.4, w: 6.0, h: 0.35, fontSize: 16, fontFace: FONTS.header, color: COLORS.white, bold: true, align: 'center' })
      s7.addText(REP.title, { x: 2.0, y: 3.72, w: 6.0, h: 0.25, fontSize: 11, fontFace: FONTS.body, color: COLORS.blush, align: 'center' })
      s7.addText(`${REP.phone}  |  ${REP.email}`, { x: 2.0, y: 4.0, w: 6.0, h: 0.45, fontSize: 12, fontFace: FONTS.body, color: COLORS.white, align: 'center', valign: 'middle' })
      s7.addText('HART MEDICAL', { x: 0, y: 5.15, w: 10, h: 0.4, fontSize: 11, fontFace: FONTS.header, color: COLORS.blush, charSpacing: 6, align: 'center' })

      await pres.writeFile({ fileName: `Hart_Medical_Proposal_${proposalData.companyName.replace(/\s+/g, '_')}.pptx` })
    } catch (error) {
      console.error('Error generating PPTX:', error)
      alert('Error generating presentation. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSendEmail = () => {
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

  const topProducts = proposalData.products.slice(0, 8)

  return (
    <div className="proposal-container">
      {/* Slide Deck */}
      <div className="slide-deck">
        <div className="slides-wrapper" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>

          {/* Slide 1: Title */}
          <div className="slide slide-title">
            <div className="slide-accent-bar"></div>
            <div className="title-geometric-top"></div>
            <div className="title-geometric-bottom"></div>
            <div className="slide-content">
              <div className="title-header-row">
                <div className="title-logo-block">
                  <img src={HART_LOGO_URL} alt="Hart Medical" />
                </div>
                <span className="title-confidential-badge">CONFIDENTIAL</span>
              </div>
              <div className="title-center-block">
                <div className="title-rule-top"></div>
                <span className="title-overline">SAVINGS PROPOSAL</span>
                <h1>Prepared for<br /><span className="title-client-name">{proposalData.companyName}</span></h1>
                <div className="title-rule-bottom"></div>
                <span className="title-date">{proposalDate}</span>
              </div>
            </div>
            <div className="title-bottom-bar">
              <div className="title-bottom-left">
                {proposalData.contactName && (
                  <div className="title-bottom-item">
                    <span className="title-bottom-label">Prepared for</span>
                    <span className="title-bottom-value">{proposalData.contactName}</span>
                  </div>
                )}
                {proposalData.contactPosition && (
                  <div className="title-bottom-item">
                    <span className="title-bottom-label">Position</span>
                    <span className="title-bottom-value">{proposalData.contactPosition}</span>
                  </div>
                )}
              </div>
              <div className="title-bottom-right">
                <div className="title-bottom-item">
                  <span className="title-bottom-label">Products Analyzed</span>
                  <span className="title-bottom-value">{proposalData.matchedCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 2: About Us */}
          <div className="slide slide-about">
            <div className="slide-accent-bar red"></div>
            <div className="slide-content">
              <span className="section-label">ABOUT US</span>
              <h2>Your Partner in Healthcare Supply Excellence</h2>
              <p className="about-desc">Hart Medical delivers quality products from diagnostic tools to everyday exam room essentials, backed by the personalized service only a family-owned business can provide.</p>
              <div className="value-cards">
                <div className="value-card">
                  <i className="fa-solid fa-dollar-sign"></i>
                  <h3>Competitive Pricing</h3>
                  <p>Direct manufacturer relationships deliver savings of 15-30%.</p>
                </div>
                <div className="value-card">
                  <i className="fa-solid fa-truck-fast"></i>
                  <h3>Reliable Fulfillment</h3>
                  <p>Next-day delivery on 95% of orders with real-time tracking.</p>
                </div>
                <div className="value-card">
                  <i className="fa-solid fa-shield-halved"></i>
                  <h3>Quality Assurance</h3>
                  <p>Every product vetted against rigorous clinical standards.</p>
                </div>
                <div className="value-card">
                  <i className="fa-solid fa-cubes"></i>
                  <h3>Product Breadth</h3>
                  <p>Over 50,000 SKUs across all major medical categories.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 3: Your Sales Rep */}
          <div className="slide slide-rep">
            <div className="slide-accent-bar"></div>
            <div className="slide-content">
              <div className="rep-layout">
                <div className="rep-photo-panel">
                  <div className="rep-photo-frame">
                    <img src={REP_PHOTO_URL} alt={REP.name} />
                  </div>
                  <div className="rep-name-plate">
                    <h2>{REP.name}</h2>
                    <span className="rep-title-text">{REP.title}</span>
                  </div>
                </div>
                <div className="rep-details-panel">
                  <span className="section-label light">YOUR DEDICATED REPRESENTATIVE</span>
                  <div className="rep-bio-block">
                    <p className="rep-bio">{REP.bio}</p>
                  </div>
                  <div className="rep-contact-grid">
                    <div className="rep-contact-item">
                      <div className="rep-contact-icon">
                        <i className="fa-solid fa-phone"></i>
                      </div>
                      <div className="rep-contact-text">
                        <span className="rep-contact-label">Phone</span>
                        <span className="rep-contact-value">{REP.phone}</span>
                      </div>
                    </div>
                    <div className="rep-contact-item">
                      <div className="rep-contact-icon">
                        <i className="fa-solid fa-envelope"></i>
                      </div>
                      <div className="rep-contact-text">
                        <span className="rep-contact-label">Email</span>
                        <span className="rep-contact-value">{REP.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rep-bottom-bar">
              <div className="rep-bottom-inner">
                <img src={HART_LOGO_URL} alt="Hart Medical" className="rep-bottom-logo" />
                <span className="rep-bottom-tagline">Personalized Service. Proven Results.</span>
              </div>
            </div>
          </div>

          {/* Slide 4: Savings Overview */}
          <div className="slide slide-savings-overview">
            <div className="slide-accent-bar red"></div>
            <div className="slide-content">
              <span className="section-label">SAVINGS ANALYSIS</span>
              <h2>Your Estimated Annual Savings</h2>
              <div className="kpi-cards">
                <div className="kpi-card highlight">
                  <span className="kpi-value">{formatCurrency(proposalData.annualSavings)}</span>
                  <span className="kpi-label">Estimated Annual Savings</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-value">{proposalData.savingsPercent.toFixed(1)}%</span>
                  <span className="kpi-label">Average Cost Reduction</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-value">{proposalData.matchedCount.toLocaleString()}</span>
                  <span className="kpi-label">Products Matched</span>
                </div>
              </div>
              <div className="spend-comparison">
                <h3>Current vs. Proposed Annual Spend</h3>
                <div className="spend-bars">
                  <div className="spend-bar-row">
                    <span className="spend-bar-label">Current Spend</span>
                    <div className="spend-bar-track">
                      <div className="spend-bar-fill current" style={{ width: '100%' }}></div>
                    </div>
                    <span className="spend-bar-value">{formatCurrency(proposalData.annualCurrentSpend)}</span>
                  </div>
                  <div className="spend-bar-row">
                    <span className="spend-bar-label">With Hart Medical</span>
                    <div className="spend-bar-track">
                      <div className="spend-bar-fill hart" style={{ width: `${proposalData.annualCurrentSpend > 0 ? (proposalData.annualHartTotal / proposalData.annualCurrentSpend) * 100 : 0}%` }}></div>
                    </div>
                    <span className="spend-bar-value">{formatCurrency(proposalData.annualHartTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 5: Product Comparison */}
          <div className="slide slide-products">
            <div className="slide-accent-bar red"></div>
            <div className="slide-content">
              <span className="section-label">PRODUCT ANALYSIS</span>
              <h2>Top Savings Opportunities</h2>
              <div className="comparison-table-wrapper">
                <table className="proposal-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Price</th>
                      <th>Hart Price</th>
                      <th>Qty</th>
                      <th>Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'alt' : ''}>
                        <td className="product-name-cell">{(item.enriched_name || item.description || '').substring(0, 50)}</td>
                        <td className="center">{formatCurrencyDecimals(item.mckessonUnitPrice)}</td>
                        <td className="center green">{formatCurrencyDecimals(item.hartUnitPrice)}</td>
                        <td className="center">{item.qty}</td>
                        <td className={`center bold ${item.savings >= 0 ? 'green' : 'red'}`}>{formatCurrencyDecimals(item.savings)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>TOTAL ({topProducts.length} items shown)</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="center bold">{formatCurrencyDecimals(topProducts.reduce((sum, i) => sum + i.savings, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {proposalData.products.length > 8 && (
                <p className="more-note">+ {proposalData.products.length - 8} additional products included in full analysis</p>
              )}
            </div>
          </div>

          {/* Slide 6: Next Steps */}
          <div className="slide slide-steps">
            <div className="slide-accent-bar red"></div>
            <div className="slide-content">
              <span className="section-label">NEXT STEPS</span>
              <h2>Your Path to Savings Starts Here</h2>
              <div className="steps-timeline">
                {[
                  { num: '01', title: 'Review & Approval', desc: 'Review this proposal with your procurement team. We\'ll schedule a call to address any questions.' },
                  { num: '02', title: 'Account Setup', desc: 'Complete vendor onboarding. We handle compliance docs, tax forms, and system integration.' },
                  { num: '03', title: 'Pilot Program', desc: 'Start with a 30-day trial on your top 50 products. Zero risk — no obligation if we don\'t deliver.' },
                  { num: '04', title: 'Full Transition', desc: 'Scale to full product catalog with dedicated support and ongoing price monitoring.' },
                ].map((step, idx) => (
                  <div key={idx} className="timeline-step">
                    <div className="step-connector">
                      <div className="step-circle">{step.num}</div>
                      {idx < 3 && <div className="step-line"></div>}
                    </div>
                    <div className="step-card">
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Slide 7: Thank You */}
          <div className="slide slide-thankyou">
            <div className="slide-accent-bar"></div>
            <div className="slide-content">
              <h1>Thank You</h1>
              <p className="thankyou-company">{proposalData.companyName}</p>
              <div className="thankyou-divider"></div>
              <p className="thankyou-tagline">Quality products. Honest pricing. A partner you can trust.</p>
              <div className="thankyou-contact-box">
                <span className="thankyou-name">{REP.name}</span>
                <span className="thankyou-title">{REP.title}</span>
                <span className="thankyou-details">{REP.phone}  |  {REP.email}</span>
              </div>
              <span className="thankyou-brand">HART MEDICAL</span>
            </div>
          </div>

        </div>

        {/* Navigation */}
        <div className="slide-nav">
          <button className="nav-btn prev" onClick={prevSlide} disabled={currentSlide === 0}>
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="slide-dots">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button key={idx} className={`dot ${idx === currentSlide ? 'active' : ''}`} onClick={() => setCurrentSlide(idx)} />
            ))}
          </div>
          <button className="nav-btn next" onClick={nextSlide} disabled={currentSlide === totalSlides - 1}>
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
          <button className="btn-outline" onClick={generatePPTX} disabled={generating}>
            {generating ? (
              <><span className="btn-spinner"></span> Generating...</>
            ) : (
              <><i className="fa-solid fa-download"></i> Download Deck</>
            )}
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
                <input type="email" placeholder="client@company.com" value={emailForm.to} onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input type="text" value={emailForm.subject} onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Message:</label>
                <textarea rows={6} value={emailForm.message} onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))} />
              </div>
              <div className="attachment-note">
                <i className="fa-solid fa-paperclip"></i>
                <span>Proposal_{proposalData.companyName.replace(/\s+/g, '_')}.pptx will be attached</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEmailModal(false)}>Cancel</button>
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
