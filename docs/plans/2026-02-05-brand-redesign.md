# Hart Medical Brand Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform CrossFile UI from dark teal theme to Hart Medical brand colors (deep red, soft pink/beige, white, black) using CSS-only changes.

**Architecture:** Systematic CSS updates across 7 stylesheet files, maintaining all existing functionality. Changes follow mobile-first responsive design with CSS custom properties for consistent theming.

**Tech Stack:** CSS3 (Custom Properties, Grid, Flexbox), No JavaScript changes

---

## Task 1: Update Core Design System (App.css)

**Files:**
- Modify: `/src/App.css:3-32` (CSS variables)
- Modify: `/src/App.css:44-86` (body and background)
- Modify: `/src/App.css:88-118` (header)
- Modify: `/src/App.css:136-227` (buttons and banners)
- Modify: `/src/App.css:289-303` (footer)

**Step 1: Update CSS custom properties with Hart Medical brand colors**

In `/src/App.css`, replace lines 3-32:

```css
:root {
  /* Hart Medical Brand Colors */
  --brand-red: #7a0b05;
  --brand-red-dark: #5a0804;
  --brand-red-light: #9a1508;

  --brand-pink: #ead0d5;
  --brand-pink-light: #f5e5e8;
  --brand-pink-dark: #ddb8bf;

  --brand-white: #ffffff;
  --brand-black: #000000;

  /* Semantic tokens */
  --bg-primary: #f5e5e8;
  --bg-secondary: #ead0d5;
  --bg-elevated: #ffffff;

  --text-primary: #000000;
  --text-secondary: #4a4a4a;
  --text-muted: #757575;
  --text-on-red: #ffffff;

  --accent-primary: #7a0b05;
  --accent-hover: #5a0804;

  --border-light: #ddb8bf;
  --border-medium: #c9a8af;

  --success-color: #10b981;
  --success-rgb: 16, 185, 129;

  --shadow-sm: 0 2px 4px rgba(122, 11, 5, 0.08);
  --shadow-md: 0 4px 12px rgba(122, 11, 5, 0.12);
  --shadow-lg: 0 8px 24px rgba(122, 11, 5, 0.15);

  /* Typography scale */
  --font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;

  --tracking-tight: -0.025em;
  --tracking-normal: -0.011em;
  --tracking-wide: 0.025em;
}
```

**Step 2: Test page loads with new colors**

Run: `npm run dev`
Expected: Page loads, colors appear broken (expected at this stage)

**Step 3: Update body background and text colors**

In `/src/App.css`, replace lines 44-55:

```css
body {
  font-family: var(--font-family);
  font-weight: var(--font-weight-normal);
  letter-spacing: var(--tracking-normal);
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```

**Step 4: Update background pattern with brand colors**

In `/src/App.css`, replace lines 66-86:

```css
/* Animated Background Pattern */
.background-pattern {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(122, 11, 5, 0.03), transparent),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(234, 208, 213, 0.4), transparent),
    radial-gradient(ellipse 50% 30% at 20% 80%, rgba(122, 11, 5, 0.02), transparent);
}

.background-pattern::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(122, 11, 5, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(122, 11, 5, 0.02) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
}
```

**Step 5: Update header styling**

In `/src/App.css`, replace lines 88-118:

```css
/* Header */
.header {
  position: relative;
  z-index: 1;
  padding: 2rem 2rem 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-light);
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 1.625rem;
  font-weight: var(--font-weight-semibold);
  color: var(--accent-primary);
  letter-spacing: var(--tracking-tight);
}

.logo i {
  color: var(--accent-primary);
  font-size: 1.25rem;
}

.tagline {
  margin: 0.375rem 0 0;
  font-size: 0.8125rem;
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

**Step 6: Update buttons and banners**

In `/src/App.css`, replace lines 184-227:

```css
.btn-continue {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent-primary);
  border: none;
  border-radius: 12px;
  color: var(--text-on-red);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-continue:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(122, 11, 5, 0.2);
}

.btn-continue:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(122, 11, 5, 0.2);
}

.btn-continue i {
  font-size: 0.75rem;
}

.btn-continue:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
}
```

**Step 7: Update footer**

In `/src/App.css`, replace lines 289-303:

```css
/* Footer */
.footer {
  position: relative;
  z-index: 1;
  padding: 1.5rem 2rem;
  text-align: center;
  border-top: 1px solid var(--border-light);
  background: transparent;
}

.footer p {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}
```

**Step 8: Update focus and selection states**

In `/src/App.css`, replace lines 324-334:

```css
/* Focus styles */
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Selection */
::selection {
  background: rgba(122, 11, 5, 0.2);
  color: var(--text-primary);
}
```

**Step 9: Verify core styles in browser**

Action: Open dev server in browser, check:
- Background is light pink gradient
- Header has white frosted glass effect
- Logo and icons are deep red
- Footer border is pink
- Text is black/dark gray

Expected: Core layout has brand colors

**Step 10: Commit core design system changes**

```bash
git add src/App.css
git commit -m "feat(ui): update core design system to Hart Medical brand

- Replace teal/navy color scheme with red/pink/beige palette
- Update CSS custom properties with brand colors
- Add translucent white header with backdrop blur
- Update background gradient and patterns
- All buttons now use deep red (#7a0b05)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Stepper Component

**Files:**
- Modify: `/src/components/Stepper.css` (entire file)

**Step 1: Read current Stepper styles**

Action: Read `/src/components/Stepper.css` to understand structure

**Step 2: Update Stepper container and step styling**

Replace entire `/src/components/Stepper.css` with:

```css
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--bg-elevated);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: transparent;
  border: 2px solid var(--border-light);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  transition: all 0.2s ease;
}

.step.active {
  color: var(--accent-primary);
  font-weight: var(--font-weight-semibold);
}

.step.active .step-number {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--text-on-red);
}

.step.completed {
  color: var(--accent-primary);
}

.step.completed .step-number {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--text-on-red);
}

.step-connector {
  width: 3rem;
  height: 2px;
  background: var(--border-light);
  transition: all 0.2s ease;
}

.step-connector.completed {
  background: var(--accent-primary);
}

@media (max-width: 768px) {
  .stepper {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .step-text {
    display: none;
  }

  .step-connector {
    width: 1.5rem;
  }
}
```

**Step 3: Test stepper in browser**

Action: Navigate through workflow steps, verify:
- Stepper has white background with subtle shadow
- Active step is deep red
- Completed steps are deep red
- Inactive steps are gray
- Connectors turn red when completed

Expected: Stepper clearly shows progress with brand colors

**Step 4: Commit Stepper changes**

```bash
git add src/components/Stepper.css
git commit -m "feat(ui): update Stepper component to brand colors

- White background with subtle shadow
- Deep red for active/completed steps
- Pink borders for inactive steps
- Responsive design maintained

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update FileUpload Component

**Files:**
- Modify: `/src/components/FileUpload.css` (entire file)

**Step 1: Read current FileUpload styles**

Action: Read `/src/components/FileUpload.css` to understand structure

**Step 2: Update upload container and drag states**

Replace entire `/src/components/FileUpload.css` with:

```css
.upload-container {
  width: 100%;
  max-width: 600px;
}

.upload-area {
  background: var(--bg-elevated);
  border: 2px dashed var(--border-light);
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover {
  background: rgba(122, 11, 5, 0.02);
  border-color: var(--accent-primary);
}

.upload-area.dragging {
  background: rgba(122, 11, 5, 0.03);
  border-color: var(--accent-primary);
  border-style: solid;
  transform: scale(1.02);
}

.upload-icon {
  font-size: 3rem;
  color: var(--accent-primary);
  margin-bottom: 1rem;
}

.upload-content h3 {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.upload-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.file-input {
  display: none;
}

.file-info {
  margin-top: 1.5rem;
  padding: 1rem 1.5rem;
  background: rgba(122, 11, 5, 0.05);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-info i {
  color: var(--accent-primary);
  font-size: 1.5rem;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.file-size {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.remove-file {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.remove-file:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.upload-error {
  margin-top: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.upload-error i {
  color: #ef4444;
  font-size: 1.25rem;
}

.upload-error span {
  color: #991b1b;
  font-size: 0.875rem;
  font-weight: 500;
}

.processing {
  margin-top: 1.5rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.processing-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
```

**Step 3: Test file upload interface**

Action: Test drag-and-drop and file selection:
- Hover over upload area
- Drag file over area
- Select file
- View file info display
- Test remove button

Expected: All states use brand colors appropriately

**Step 4: Commit FileUpload changes**

```bash
git add src/components/FileUpload.css
git commit -m "feat(ui): update FileUpload component to brand colors

- White upload area with dashed pink border
- Deep red icons and accents
- Red hover and drag states
- Light pink file info background
- Error states use red palette

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update ReviewApprove Component

**Files:**
- Modify: `/src/components/ReviewApprove.css` (entire file)

**Step 1: Read current ReviewApprove styles**

Action: Read `/src/components/ReviewApprove.css` to understand structure

**Step 2: Update stats cards with gradient backgrounds**

Create metric cards section in `/src/components/ReviewApprove.css`:

```css
.review-container {
  width: 100%;
  max-width: 1200px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
  color: var(--text-on-red);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

**Step 3: Update table styling**

Add table styles to `/src/components/ReviewApprove.css`:

```css
.review-section {
  margin-bottom: 2rem;
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: var(--font-weight-semibold);
  color: var(--accent-primary);
  margin: 0 0 0.25rem;
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
}

.data-table {
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--accent-primary);
}

th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-on-red);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

tbody tr {
  border-bottom: 1px solid var(--border-light);
  transition: background 0.2s ease;
}

tbody tr:nth-child(even) {
  background: var(--bg-primary);
}

tbody tr:hover {
  background: rgba(122, 11, 5, 0.03);
}

td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}
```

**Step 4: Update status badges**

Add badge styles to `/src/components/ReviewApprove.css`:

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.exact {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge.pre-approved {
  background: rgba(122, 11, 5, 0.1);
  color: var(--accent-primary);
  border: 1px solid rgba(122, 11, 5, 0.3);
}

.status-badge.fuzzy {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-badge.no-match {
  background: rgba(107, 114, 128, 0.1);
  color: #4b5563;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.confidence-score {
  font-weight: var(--font-weight-bold);
}
```

**Step 5: Update action buttons**

Add button styles to `/src/components/ReviewApprove.css`:

```css
.btn-review {
  background: var(--accent-primary);
  color: var(--text-on-red);
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-review:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(122, 11, 5, 0.2);
}

.btn-secondary {
  background: transparent;
  color: var(--accent-primary);
  border: 2px solid var(--accent-primary);
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(122, 11, 5, 0.05);
  border-color: var(--accent-hover);
  color: var(--accent-hover);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
}
```

**Step 6: Test review interface**

Action: Navigate to review step, verify:
- Stats cards have red gradient backgrounds
- Tables have red headers with white text
- Alternating rows use light pink
- Status badges have correct colors
- Buttons use brand red

Expected: Review interface fully branded

**Step 7: Commit ReviewApprove changes**

```bash
git add src/components/ReviewApprove.css
git commit -m "feat(ui): update ReviewApprove component to brand colors

- Red gradient metric cards with white text
- Table headers use deep red background
- Alternating rows with light pink
- Color-coded status badges
- Brand-consistent action buttons

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update ReviewModal Component

**Files:**
- Modify: `/src/components/ReviewModal.css` (entire file)

**Step 1: Read current ReviewModal styles**

Action: Read `/src/components/ReviewModal.css` to understand structure

**Step 2: Update modal backdrop and container**

Replace entire `/src/components/ReviewModal.css` starting with:

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: var(--font-weight-semibold);
  color: var(--accent-primary);
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  line-height: 1;
}

.btn-close:hover {
  background: rgba(122, 11, 5, 0.1);
  color: var(--accent-primary);
}
```

**Step 3: Update modal content and search**

Continue `/src/components/ReviewModal.css`:

```css
.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.mckesson-item {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.mckesson-item h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.item-details {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.item-detail {
  margin-bottom: 0.25rem;
}

.item-detail strong {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.ai-suggestion {
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  background: rgba(122, 11, 5, 0.05);
  border: 1px solid rgba(122, 11, 5, 0.2);
  border-radius: 12px;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.suggestion-header i {
  color: var(--accent-primary);
}

.suggestion-header span {
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--accent-primary);
}

.suggestion-content {
  font-size: 0.875rem;
  color: var(--text-primary);
}

.search-section {
  margin-top: 1.5rem;
}

.search-label {
  display: block;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-elevated);
  border: 2px solid var(--border-light);
  border-radius: 10px;
  font-size: 1rem;
  color: var(--text-primary);
  font-family: inherit;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(122, 11, 5, 0.1);
}

.product-list {
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  border-radius: 10px;
  background: var(--bg-elevated);
}

.product-item {
  padding: 1rem;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-item:last-child {
  border-bottom: none;
}

.product-item:hover {
  background: rgba(122, 11, 5, 0.03);
}

.product-item.selected {
  background: rgba(122, 11, 5, 0.08);
  border-left: 3px solid var(--accent-primary);
}

.product-name {
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.product-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.product-price {
  color: var(--accent-primary);
  font-weight: var(--font-weight-semibold);
}
```

**Step 4: Update modal footer**

Continue `/src/components/ReviewModal.css`:

```css
.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-approve {
  background: var(--accent-primary);
  color: var(--text-on-red);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-approve:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(122, 11, 5, 0.2);
}

.btn-approve:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: transparent;
  color: var(--accent-primary);
  border: 2px solid var(--accent-primary);
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: rgba(122, 11, 5, 0.05);
  border-color: var(--accent-hover);
  color: var(--accent-hover);
}
```

**Step 5: Test modal interaction**

Action: Open review modal, test:
- Modal backdrop and container appearance
- Search input focus states
- Product list selection
- Approve/Cancel buttons
- Close button

Expected: Modal fully branded with smooth interactions

**Step 6: Commit ReviewModal changes**

```bash
git add src/components/ReviewModal.css
git commit -m "feat(ui): update ReviewModal component to brand colors

- White modal with red title and accents
- Search input with red focus state
- Product selection with red highlight
- AI suggestion box with light red background
- Brand-consistent buttons and states

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update Comparison Component

**Files:**
- Modify: `/src/components/Comparison.css` (entire file)

**Step 1: Read current Comparison styles**

Action: Read `/src/components/Comparison.css` to understand structure

**Step 2: Update summary cards**

Replace entire `/src/components/Comparison.css` starting with:

```css
.comparison-container {
  width: 100%;
  max-width: 1200px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
  color: var(--text-on-red);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.card-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.card-label {
  font-size: 0.875rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.savings-note {
  background: rgba(122, 11, 5, 0.05);
  border: 1px solid rgba(122, 11, 5, 0.2);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.savings-note i {
  color: var(--accent-primary);
  font-size: 1.25rem;
}
```

**Step 3: Update comparison table**

Continue `/src/components/Comparison.css`:

```css
.comparison-table {
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  border: 1px solid var(--border-light);
  margin-bottom: 2rem;
}

.table-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-light);
}

.table-title {
  font-size: 1.25rem;
  font-weight: var(--font-weight-semibold);
  color: var(--accent-primary);
  margin: 0 0 0.25rem;
}

.table-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--accent-primary);
}

th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-on-red);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

th:last-child {
  text-align: right;
}

tbody tr {
  border-bottom: 1px solid var(--border-light);
  transition: background 0.2s ease;
}

tbody tr:nth-child(even) {
  background: var(--bg-primary);
}

tbody tr:hover {
  background: rgba(122, 11, 5, 0.03);
}

td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}

td:last-child {
  text-align: right;
}

.product-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.product-sku {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
}

.price-cell {
  font-weight: var(--font-weight-semibold);
}

.savings-positive {
  color: #059669;
  font-weight: var(--font-weight-bold);
}

.savings-negative {
  color: #dc2626;
  font-weight: var(--font-weight-bold);
}

.markup-selector {
  padding: 0.5rem 0.75rem;
  background: var(--bg-elevated);
  border: 2px solid var(--border-light);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--text-primary);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markup-selector:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(122, 11, 5, 0.1);
}
```

**Step 4: Update action buttons**

Continue `/src/components/Comparison.css`:

```css
.action-bar {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-export {
  background: var(--accent-primary);
  color: var(--text-on-red);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-export:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(122, 11, 5, 0.2);
}

.btn-export i {
  font-size: 1rem;
}

.btn-generate {
  background: var(--accent-primary);
  color: var(--text-on-red);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-generate:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(122, 11, 5, 0.2);
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
  }

  .btn-export,
  .btn-generate {
    width: 100%;
    justify-content: center;
  }
}
```

**Step 5: Test comparison view**

Action: Navigate to comparison step, verify:
- Summary cards have red gradients
- Table has red header
- Alternating rows properly styled
- Markup selectors work
- Export/Generate buttons styled correctly
- Savings amounts color-coded

Expected: Comparison fully branded and functional

**Step 6: Commit Comparison changes**

```bash
git add src/components/Comparison.css
git commit -m "feat(ui): update Comparison component to brand colors

- Red gradient summary cards
- Table with red headers and alternating rows
- Light pink alternating rows
- Markup selector with red focus states
- Brand-consistent action buttons
- Color-coded savings indicators

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update Proposal Component

**Files:**
- Modify: `/src/components/Proposal.css` (entire file)

**Step 1: Read current Proposal styles**

Action: Read `/src/components/Proposal.css` to understand structure

**Step 2: Update slide container and navigation**

Replace entire `/src/components/Proposal.css` starting with:

```css
.proposal-container {
  width: 100%;
  max-width: 1000px;
}

.slide-deck {
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.slide {
  padding: 3rem;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.slide-title {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin: 0 0 1.5rem;
  text-align: center;
  letter-spacing: var(--tracking-tight);
}

.slide-content {
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.6;
}

.slide-subtitle {
  font-size: 1.25rem;
  font-weight: var(--font-weight-semibold);
  color: var(--accent-primary);
  margin: 0 0 1rem;
}

.slide-text {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1rem;
  line-height: 1.6;
}

.slide-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
}

.slide-list li {
  padding: 0.75rem 0 0.75rem 2rem;
  position: relative;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.6;
}

.slide-list li::before {
  content: '\2022';
  color: var(--accent-primary);
  font-size: 1.5rem;
  position: absolute;
  left: 0.5rem;
  top: 0.625rem;
}
```

**Step 3: Update stats and highlights**

Continue `/src/components/Proposal.css`:

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.stat-box {
  text-align: center;
  padding: 1.5rem;
  background: rgba(122, 11, 5, 0.05);
  border: 2px solid rgba(122, 11, 5, 0.2);
  border-radius: 12px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.highlight-box {
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
  color: var(--text-on-red);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  margin: 2rem 0;
}

.highlight-value {
  font-size: 3rem;
  font-weight: var(--font-weight-bold);
  margin-bottom: 0.5rem;
  line-height: 1;
}

.highlight-label {
  font-size: 1.125rem;
  opacity: 0.95;
}

.product-comparison {
  margin: 2rem 0;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  margin-bottom: 0.75rem;
}

.comparison-item:last-child {
  margin-bottom: 0;
}

.item-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  flex: 1;
}

.item-savings {
  color: #059669;
  font-weight: var(--font-weight-bold);
  font-size: 1.125rem;
}
```

**Step 4: Update navigation controls**

Continue `/src/components/Proposal.css`:

```css
.slide-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-light);
  background: var(--bg-primary);
}

.nav-buttons {
  display: flex;
  gap: 1rem;
}

.btn-nav {
  background: var(--accent-primary);
  color: var(--text-on-red);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-nav:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: scale(1.05);
  box-shadow: 0 3px 8px rgba(122, 11, 5, 0.2);
}

.btn-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-nav i {
  font-size: 1.25rem;
}

.slide-indicators {
  display: flex;
  gap: 0.5rem;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(122, 11, 5, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator-dot.active {
  background: var(--accent-primary);
  transform: scale(1.2);
}

.indicator-dot:hover {
  background: rgba(122, 11, 5, 0.5);
}

.slide-counter {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
}
```

**Step 5: Update action buttons and email modal**

Continue `/src/components/Proposal.css`:

```css
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-email {
  background: var(--accent-primary);
  color: var(--text-on-red);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-email:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(122, 11, 5, 0.2);
}

.btn-download {
  background: transparent;
  color: var(--accent-primary);
  border: 2px solid var(--accent-primary);
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-download:hover {
  background: rgba(122, 11, 5, 0.05);
  border-color: var(--accent-hover);
  color: var(--accent-hover);
}

.email-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.email-modal-content {
  background: var(--bg-elevated);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 100%;
  padding: 2rem;
}

.email-modal h3 {
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  font-weight: var(--font-weight-semibold);
  color: var(--accent-primary);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-elevated);
  border: 2px solid var(--border-light);
  border-radius: 10px;
  font-size: 1rem;
  color: var(--text-primary);
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-muted);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(122, 11, 5, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-send {
  flex: 1;
  background: var(--accent-primary);
  color: var(--text-on-red);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-send:hover {
  background: var(--accent-hover);
}

.btn-cancel-modal {
  flex: 1;
  background: transparent;
  color: var(--accent-primary);
  border: 2px solid var(--accent-primary);
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel-modal:hover {
  background: rgba(122, 11, 5, 0.05);
}

@media (max-width: 768px) {
  .slide {
    padding: 2rem 1.5rem;
    min-height: 400px;
  }

  .slide-title {
    font-size: 1.5rem;
  }

  .highlight-value {
    font-size: 2rem;
  }
}
```

**Step 6: Test proposal slides**

Action: Navigate to proposal step, test:
- All 5 slides render correctly
- Navigation buttons work
- Slide indicators work
- Stats and highlights have red styling
- Email modal opens and closes
- Download button appears

Expected: Complete proposal deck with full branding

**Step 7: Commit Proposal changes**

```bash
git add src/components/Proposal.css
git commit -m "feat(ui): update Proposal component to brand colors

- White slide backgrounds with red titles
- Red gradient highlight boxes
- Light pink stat boxes with red numbers
- Red navigation buttons and indicators
- Brand-consistent email modal
- Fully responsive design maintained

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Visual QA and Cross-Browser Testing

**Files:**
- No file changes
- Testing only

**Step 1: Test complete workflow in Chrome**

Action: Walk through entire application workflow:
1. Upload step - test file upload interface
2. Review step - verify stats, tables, modal
3. Comparison step - check calculations, tables
4. Proposal step - navigate all slides

Expected: All components properly branded, no visual breaks

**Step 2: Test in Firefox**

Action: Repeat full workflow in Firefox
Expected: Identical appearance and functionality

**Step 3: Test in Safari**

Action: Repeat full workflow in Safari
Pay attention to: backdrop-filter support, shadow rendering
Expected: Consistent appearance (backdrop-filter may have fallback)

**Step 4: Test responsive design at 768px**

Action: Resize browser to tablet width
Expected: Layout adapts, touch targets adequate

**Step 5: Test responsive design at 375px**

Action: Resize browser to mobile width
Expected: Single column layouts, readable text, usable buttons

**Step 6: Test accessibility - keyboard navigation**

Action: Navigate entire app using only Tab/Enter/Space
Expected: All interactive elements accessible, focus visible

**Step 7: Test accessibility - color contrast**

Action: Use browser DevTools to check contrast ratios
Expected: All text meets WCAG AA standards (4.5:1 minimum)

**Step 8: Document any issues found**

Create: `/docs/qa-notes.md` if any issues found
Format:
```markdown
# QA Issues - Brand Redesign

## [Browser] - [Issue]
Description
Steps to reproduce
Expected vs Actual
```

**Step 9: Create QA completion note**

```bash
git add docs/qa-notes.md
git commit -m "docs: QA testing complete for brand redesign

Tested across Chrome, Firefox, Safari
Verified responsive design (mobile, tablet, desktop)
Confirmed keyboard navigation and color contrast
All components meet brand guidelines

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Final Review and Documentation Update

**Files:**
- Modify: `/README.md` (optional - add screenshots)
- Create: `/docs/brand-guidelines.md` (reference doc)

**Step 1: Create brand guidelines reference**

Create `/docs/brand-guidelines.md`:

```markdown
# Hart Medical Brand Guidelines - CrossFile Implementation

## Brand Colors

### Primary Palette
- **Deep Red**: `#7a0b05` - Primary brand color
- **Soft Pink**: `#ead0d5` - Background surfaces
- **White**: `#ffffff` - Elevated cards
- **Black**: `#000000` - Primary text

### Usage
- **Buttons**: Deep red background, white text
- **Headers**: Deep red text on light backgrounds
- **Tables**: Red headers with white text
- **Backgrounds**: Light pink gradients
- **Borders**: Darker pink (`#ddb8bf`)

## Typography
- **Font**: Plus Jakarta Sans
- **Headers**: Deep red, semibold/bold
- **Body**: Black, normal weight
- **Muted**: Gray (#757575)

## Component Patterns
- **Border Radius**: 12-16px (generous rounds)
- **Shadows**: Red-tinted, subtle depth
- **Focus States**: Red outline with light red glow
- **Hover States**: Darker red, slight lift

## Accessibility
- Contrast ratios meet WCAG AA
- Focus states clearly visible
- Touch targets minimum 44px

## Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Responsive: 320px - 1920px
```

**Step 2: Commit brand guidelines**

```bash
git add docs/brand-guidelines.md
git commit -m "docs: add Hart Medical brand guidelines reference

Quick reference for maintaining brand consistency
Includes color codes, typography, and component patterns

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 3: Update CLAUDE.md with brand info**

Add section to `/CLAUDE.md` after line 47:

```markdown
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
```

**Step 4: Commit CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with brand redesign details

Add Brand & Design section with color palette and patterns
Reference brand guidelines document

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 5: Run final dev server check**

Action: `npm run dev`
Expected: Application loads without errors, fully branded

**Step 6: Run production build test**

```bash
npm run build
```

Expected: Build completes successfully, no warnings

**Step 7: Create final summary commit**

```bash
git add -A
git commit -m "feat: complete Hart Medical brand redesign

CSS-only redesign from dark teal to light neutral theme
All 7 components updated with brand colors
Zero backend or functionality changes

Changes:
- App.css: Core design system and layout
- FileUpload.css: Upload interface
- Stepper.css: Progress indicator
- ReviewApprove.css: Review workflow and stats
- ReviewModal.css: Product selection modal
- Comparison.css: Cost analysis tables
- Proposal.css: Slide deck presentation

Testing:
- Cross-browser (Chrome, Firefox, Safari)
- Responsive (mobile, tablet, desktop)
- Accessibility (keyboard nav, contrast)

Documentation:
- Brand guidelines reference
- CLAUDE.md updated
- Design specification preserved

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Implementation Complete

**Total Tasks**: 9
**Estimated Time**: 2-3 hours for experienced developer
**Files Modified**: 8 CSS files + 2 documentation files
**Backend Changes**: Zero
**Functionality Changes**: Zero

**Verification Checklist**:
- [ ] All 7 CSS component files updated
- [ ] Core design system matches brand colors
- [ ] Tables have red headers
- [ ] Buttons use deep red
- [ ] Backgrounds use light pink
- [ ] Cross-browser tested
- [ ] Responsive verified
- [ ] Accessibility confirmed
- [ ] Documentation updated
- [ ] Production build passes

**Next Steps**:
1. Push to remote: `git push origin main`
2. Create PR for stakeholder review
3. Deploy to staging for client approval
4. Merge to production after sign-off

---

**End of Implementation Plan**
