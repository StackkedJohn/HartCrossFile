# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crossfile is a product matching and proposal generation system for Hart Medical. It processes McKesson usage reports to identify Hart Medical product equivalents, calculate cost savings, and generate sales proposals.

**Purpose**: Enable sales team to quickly analyze prospect's current supplier usage, match to Hart Medical inventory, and generate professional proposal presentations showing potential cost savings.

## Core Architecture

### Data Flow
1. **Upload** → User uploads McKesson usage report (Excel/CSV)
2. **Matching** → System matches McKesson products to Hart Medical catalog using:
   - Exact manufacturer SKU matching
   - Pre-approved matches database
   - Fuzzy matching algorithm (keyword-based with confidence scoring)
3. **Review** → Admin approves/rejects fuzzy matches, creates new approved match mappings
4. **Output** → System generates comparison report showing line-by-line savings
5. **Proposal** → System creates slide deck presentation for client delivery

### Key Components

**State Management** (`useState` hooks):
- `currentStep`: Workflow stage (upload → review → output → proposal)
- `matchResults`: Successfully matched products
- `pendingApprovals`: Items requiring admin review
- `approvedMatches`: Persistent mapping of MFR SKU → Hart product ID (simulates database)

**Matching Logic** (`processMatching()`, lines 95-148):
- Priority order: exact SKU match → approved matches → fuzzy match → unmatched
- Fuzzy matching uses keyword overlap scoring (minimum 2 keywords, max 85% confidence)
- All fuzzy matches must be manually approved before appearing in final calculations

**Cost Calculations** (`calculateTotals()`, lines 191-209):
- **Critical**: Only matched items included in savings calculation
- Unmatched items tracked separately but excluded from totals
- Prevents inflated savings claims from products Hart doesn't carry

## Brand & Design (Updated 2026-02-05)

**Color Palette**:
- Primary: `#7a0b05` (deep red/burgundy)
- Backgrounds: `#ead0d5` (soft pink), `#f5e5e8` (very light pink)
- Text: `#000000` (black), `#4a4a4a` (dark gray), `#757575` (muted)
- Accents: Deep red for buttons, headers, active states

**Design System**:
- Light neutral theme with warm, approachable aesthetic
- Generous border radius (12-16px) for modern feel
- Subtle shadows with red tint for depth
- Plus Jakarta Sans font family

**Component Patterns**:
- Primary buttons: Red background, white text, 12px radius
- Cards: White background, 16px radius, medium shadow
- Tables: Red headers, alternating light pink rows
- Status badges: Color-coded (green/red/orange/gray)

See `/docs/brand-guidelines.md` for complete reference.

**Header Design Notes:**
- Elegant enhancement implemented 2026-02-05
- Icon wrapped in circular badge for visual prominence
- Feature badges communicate key capabilities at a glance
- See `/docs/header-redesign-spec.md` for full specification

## Data Structures

### Hart Medical Product
```javascript
{ id: 'HM001', sku: 'MFR-GLV-NIT-L', name: string, category: string, price: number, unit: string }
```

### McKesson Usage Item
```javascript
{ lineId: number, mckSku: string, mfrSku: string, description: string, qty: number, unitPrice: number }
```

### Approved Match Record
```javascript
{ hartProductId: string, approvedBy: string, approvedDate: string, note: string }
```
Keyed by manufacturer SKU in `approvedMatches` object.

### Match Result
```javascript
{
  ...mckItem,
  matchType: 'exact' | 'approved' | 'fuzzy' | 'none',
  hartProduct: object | null,
  confidence: 0-100,
  status: 'matched' | 'no-match'
}
```

## UI Workflow States

### Upload Step
- File upload simulation (uses hardcoded `sampleMcKessonData`)
- Displays prospect info (name, contact, email)
- Auto-processes after 1.5s delay

### Review Step
- Top metrics cards: exact matches, pre-approved, needs review, total items
- Pending approvals table (amber background) for fuzzy/unmatched items
- Matched products table showing McKesson → Hart mapping
- "Review" button opens approval modal for product selection

### Output Step (Comparison)
- 4-metric summary: Current spend, Hart price, savings amount, savings %
- Displays note about excluded unmatched items
- Detailed line-item comparison table
- Export/Generate proposal buttons

### Proposal Step (Deck)
5 slides:
1. Title slide with prospect name
2. Value proposition (stats, team info)
3. Savings summary (annual projections, 12x multiplier)
4. Product equivalents (first 5 matches)
5. Next steps + CTA

## Sample Data

- `hartMedicalProducts` (lines 17-30): 12 products across PPE, Injection, Wound Care, etc.
- `sampleMcKessonData` (lines 33-44): 10 line items from fictional "ABC Medical Center"
- `initialApprovedMatches` (lines 47-49): Pre-seeded with one catheter size variant mapping

## Key Business Logic

**Fuzzy Matching Threshold** (line 91): Requires ≥2 keyword matches, caps confidence at 85%

**Approval Workflow**:
- Fuzzy matches → pending approvals table
- Admin can approve suggested match, select alternate product, or mark as no-match
- Approved matches persist for future uploads (would be database in production)

**Savings Calculation Philosophy**:
- Conservative approach: only count savings on products we can actually supply
- Transparent reporting: show unmatched spend separately
- Prevents over-promising to clients

## Development Notes

This is a proof-of-concept React component demonstrating the workflow. Production implementation would require:
- Backend API for file upload/parsing
- Database for Hart product catalog and approved matches
- Authentication/authorization for admin approval workflow
- PDF export functionality (currently buttons non-functional)
- Email integration (currently shows alert)
- Real Excel/CSV parsing (currently uses hardcoded sample data)
