# Hart Medical Brand Redesign - UI Design Specification

**Date**: February 5, 2026
**Project**: CrossFile Product Matching System
**Scope**: Frontend UI redesign to match Hart Medical brand guidelines
**Constraint**: No backend functionality changes

## Design Overview

Transform the current dark teal/navy themed interface to Hart Medical's brand colors, creating a warm, professional, and approachable experience. The redesign maintains all existing functionality while updating only CSS styling.

## Design Decisions

### Theme Direction
**Balanced Neutral** - Light neutral (beige/cream) background with deep red highlights for a warm, approachable, professional aesthetic.

### Brand Expression
**Bold & Prominent** - Deep red used prominently throughout for primary buttons, headers, active states, and key UI elements.

### Visual Style
**Subtle Depth** - Soft shadows on cards and buttons, gentle elevation layers for professional polish without being too heavy.

### Component Styling
**Generous Rounds** - 12-16px border radius for modern, friendly, approachable feel while maintaining professionalism.

---

## 1. Core Color System & Design Tokens

### Brand Color Palette

```css
/* Primary Brand Colors (from brand guidelines) */
--brand-red: #7a0b05;           /* Deep burgundy/maroon - primary brand color */
--brand-red-dark: #5a0804;      /* Darker red for hovers/active states */
--brand-red-light: #9a1508;     /* Lighter red for subtle variations */

--brand-pink: #ead0d5;          /* Soft rose/beige - backgrounds & subtle surfaces */
--brand-pink-light: #f5e5e8;    /* Very light pink for elevated surfaces */
--brand-pink-dark: #ddb8bf;     /* Slightly darker pink for borders */

--brand-white: #ffffff;         /* Pure white for cards & elevated content */
--brand-black: #000000;         /* Pure black for primary text */
```

### Semantic Color Tokens

```css
/* Backgrounds */
--bg-primary: #f5e5e8;          /* Main page background (very light pink) */
--bg-secondary: #ead0d5;        /* Secondary surfaces (brand pink) */
--bg-elevated: #ffffff;         /* Cards, modals, elevated content */

/* Text */
--text-primary: #000000;        /* Primary text (black) */
--text-secondary: #4a4a4a;      /* Secondary text (dark gray) */
--text-muted: #757575;          /* Muted/disabled text (medium gray) */
--text-on-red: #ffffff;         /* Text on red backgrounds (white) */

/* Accents */
--accent-primary: #7a0b05;      /* Primary actions (deep red) */
--accent-hover: #5a0804;        /* Hover states (darker red) */

/* Borders */
--border-light: #ddb8bf;        /* Subtle borders (darker pink) */
--border-medium: #c9a8af;       /* Medium emphasis borders */

/* Shadows */
--shadow-sm: 0 2px 4px rgba(122, 11, 5, 0.08);    /* Subtle shadow */
--shadow-md: 0 4px 12px rgba(122, 11, 5, 0.12);   /* Medium shadow */
--shadow-lg: 0 8px 24px rgba(122, 11, 5, 0.15);   /* Large shadow */
```

### Color Usage Patterns

- **Page Backgrounds**: Light pink gradient (#f5e5e8) as primary, white for cards
- **Primary Actions**: Deep red (#7a0b05) buttons with white text
- **Headers/Titles**: Deep red text on light backgrounds
- **Tables/Lists**: White backgrounds with pink/beige alternating rows
- **Borders**: Darker pink (#ddb8bf) for subtle definition
- **Shadows**: Red-tinted shadows for brand cohesion

---

## 2. Typography & Visual Hierarchy

### Font Family
**Plus Jakarta Sans** - Modern, professional sans-serif. Retained from current design.

```css
--font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Font Weights
```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Font Size Scale
```css
--text-xs: 0.75rem;      /* 12px - labels, captions */
--text-sm: 0.875rem;     /* 14px - body small, table data */
--text-base: 1rem;       /* 16px - body text */
--text-lg: 1.125rem;     /* 18px - emphasized text */
--text-xl: 1.25rem;      /* 20px - section headers */
--text-2xl: 1.5rem;      /* 24px - page titles */
--text-3xl: 2rem;        /* 32px - hero text */
```

### Letter Spacing
```css
--tracking-tight: -0.025em;
--tracking-normal: -0.011em;
--tracking-wide: 0.025em;
```

### Text Color Hierarchy

| Element | Color | Weight | Size |
|---------|-------|--------|------|
| Page Titles & Headers | Deep red (#7a0b05) | Semibold/Bold | 2xl-3xl |
| Body Text | Black (#000000) | Normal | base |
| Secondary Text | Dark gray (#4a4a4a) | Normal | sm-base |
| Muted Text | Medium gray (#757575) | Normal | xs-sm |
| Text on Red Buttons | White (#ffffff) | Semibold | sm |

### Typography Patterns

- **Logo**: Deep red with semibold weight
- **Step Headers**: Deep red, size 2xl (24px)
- **Section Titles**: Deep red or black, size xl (20px)
- **Button Text**: White on red, semibold, size sm (14px)
- **Table Headers**: Deep red, semibold, size sm
- **Table Data**: Black, normal weight, size sm

---

## 3. Component Styles & Elevation

### Button Styles

#### Primary Buttons
Main actions like "Continue", "Approve", "Generate Proposal"

```css
background: #7a0b05;              /* Deep red */
color: #ffffff;                   /* White text */
border-radius: 12px;              /* Generous rounds */
padding: 0.75rem 1.5rem;
font-weight: 600;                 /* Semibold */
box-shadow: 0 2px 4px rgba(122, 11, 5, 0.15);

/* Hover state */
background: #5a0804;              /* Darker red */
transform: translateY(-1px);
box-shadow: 0 4px 8px rgba(122, 11, 5, 0.2);

/* Active/Pressed state */
transform: translateY(0);
box-shadow: 0 1px 2px rgba(122, 11, 5, 0.2);

/* Disabled state */
opacity: 0.6;
cursor: not-allowed;
```

#### Secondary Buttons
Less prominent actions like "Cancel", "Back"

```css
background: transparent;
color: #7a0b05;                   /* Red text */
border: 2px solid #7a0b05;
border-radius: 12px;
padding: 0.75rem 1.5rem;
font-weight: 600;

/* Hover state */
background: rgba(122, 11, 5, 0.05);
border-color: #5a0804;
color: #5a0804;
```

#### Tertiary/Ghost Buttons
Minimal actions

```css
background: transparent;
color: #7a0b05;
border: none;
padding: 0.5rem 1rem;
font-weight: 500;

/* Hover state */
text-decoration: underline;
color: #5a0804;
```

### Card & Surface Styles

#### Elevated Cards
Data tables, forms, content blocks

```css
background: #ffffff;              /* White */
border-radius: 16px;
border: 1px solid #ddb8bf;        /* Darker pink border */
box-shadow: 0 4px 12px rgba(122, 11, 5, 0.12);
padding: 1.5rem to 2rem;
```

#### Surface Containers
Less prominent groupings

```css
background: #f5e5e8;              /* Very light pink */
border-radius: 12px;
border: 1px solid #ddb8bf;
padding: 1rem to 1.5rem;
box-shadow: none;
```

#### Modal Overlays

```css
/* Backdrop */
background: rgba(0, 0, 0, 0.5);   /* Dark overlay */

/* Modal Container */
background: #ffffff;
border-radius: 16px;
box-shadow: 0 8px 24px rgba(122, 11, 5, 0.2);
max-width: 600px;
padding: 2rem;
```

### Elevation System

- **Level 0** (flat): No shadow, sits on background
- **Level 1** (subtle): `var(--shadow-sm)` for slight lift
- **Level 2** (cards): `var(--shadow-md)` for clear separation
- **Level 3** (modals): `var(--shadow-lg)` for prominent overlay

---

## 4. Layout & Background Styling

### Page Background

#### Primary Background
```css
/* Option 1: Subtle gradient (recommended) */
background: linear-gradient(135deg, #f5e5e8 0%, #ead0d5 100%);

/* Option 2: Flat color (simpler) */
background: #f5e5e8;              /* Very light pink */
```

#### Background Pattern
Subtle texture for depth (replaces current teal radial gradients)

```css
background:
  radial-gradient(ellipse 80% 50% at 50% -20%, rgba(122, 11, 5, 0.03), transparent),
  radial-gradient(ellipse 60% 40% at 80% 60%, rgba(234, 208, 213, 0.4), transparent),
  radial-gradient(ellipse 50% 30% at 20% 80%, rgba(122, 11, 5, 0.02), transparent);

/* Grid pattern overlay (very subtle) */
background-image:
  linear-gradient(rgba(122, 11, 5, 0.02) 1px, transparent 1px),
  linear-gradient(90deg, rgba(122, 11, 5, 0.02) 1px, transparent 1px);
background-size: 64px 64px;
mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
```

### Header Styling

```css
background: rgba(255, 255, 255, 0.8);  /* Translucent white */
backdrop-filter: blur(10px);           /* Frosted glass effect */
border-bottom: 1px solid #ddb8bf;
padding: 2rem;

/* Logo */
.logo {
  color: #7a0b05;                      /* Deep red text */
  font-weight: 600;
  font-size: 1.625rem;
}

.logo i {
  color: #7a0b05;                      /* Red icon */
}

/* Tagline */
.tagline {
  color: #757575;                      /* Muted gray */
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.8125rem;
}
```

### Footer Styling

```css
background: transparent;
border-top: 1px solid #ddb8bf;        /* Pink border */
color: #757575;                       /* Muted text */
padding: 1.5rem;
text-align: center;
font-size: 0.75rem;
```

### Main Content Container

```css
max-width: 1200px;
margin: 0 auto;
padding: 2rem;
background: transparent;              /* Lets page background show */
```

### Stepper (Progress Indicator)

```css
background: #ffffff;                  /* White card */
border-radius: 12px;
padding: 1rem 1.5rem;
box-shadow: 0 2px 8px rgba(122, 11, 5, 0.08);

/* Active step */
.step.active {
  color: #7a0b05;                     /* Red */
  font-weight: 600;
}

/* Completed step */
.step.completed {
  color: #7a0b05;                     /* Red with checkmark icon */
}

/* Inactive step */
.step.inactive {
  color: #757575;                     /* Muted gray */
}

/* Connector line */
.step-connector {
  background: #ddb8bf;                /* Pink */
}

.step-connector.completed {
  background: #7a0b05;                /* Red */
}
```

---

## 5. Component-Specific Styling

### Tables & Data Displays

#### Table Container
```css
background: #ffffff;                  /* White */
border-radius: 16px;
box-shadow: 0 4px 12px rgba(122, 11, 5, 0.12);
overflow: hidden;
border: 1px solid #ddb8bf;
```

#### Table Headers
```css
background: #7a0b05;                  /* Deep red */
color: #ffffff;                       /* White text */
font-weight: 600;
padding: 1rem;
text-transform: uppercase;
letter-spacing: 0.05em;
font-size: 0.875rem;
```

#### Table Rows
```css
/* Base row */
background: #ffffff;                  /* White */
border-bottom: 1px solid #ddb8bf;

/* Alternating rows */
&:nth-child(even) {
  background: #f5e5e8;                /* Very light pink */
}

/* Hover state */
&:hover {
  background: rgba(122, 11, 5, 0.03);
  cursor: pointer;
}

/* Cell padding */
td, th {
  padding: 0.875rem 1rem;
}
```

### Status Badges & Indicators

#### Exact Match (green for universal recognition)
```css
background: rgba(16, 185, 129, 0.1);
color: #059669;
border: 1px solid rgba(16, 185, 129, 0.3);
border-radius: 8px;
padding: 0.25rem 0.75rem;
font-size: 0.75rem;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
```

#### Pre-Approved (brand red)
```css
background: rgba(122, 11, 5, 0.1);
color: #7a0b05;
border: 1px solid rgba(122, 11, 5, 0.3);
border-radius: 8px;
padding: 0.25rem 0.75rem;
font-size: 0.75rem;
font-weight: 600;
text-transform: uppercase;
```

#### Fuzzy/Needs Review (amber/orange)
```css
background: rgba(245, 158, 11, 0.1);
color: #d97706;
border: 1px solid rgba(245, 158, 11, 0.3);
border-radius: 8px;
padding: 0.25rem 0.75rem;
font-size: 0.75rem;
font-weight: 600;
text-transform: uppercase;
```

#### No Match (neutral gray)
```css
background: rgba(107, 114, 128, 0.1);
color: #4b5563;
border: 1px solid rgba(107, 114, 128, 0.3);
border-radius: 8px;
padding: 0.25rem 0.75rem;
font-size: 0.75rem;
font-weight: 600;
text-transform: uppercase;
```

### Form Inputs & Search

```css
background: #ffffff;
border: 2px solid #ddb8bf;
border-radius: 10px;
padding: 0.75rem 1rem;
color: #000000;
font-size: 1rem;
font-family: inherit;

/* Placeholder */
&::placeholder {
  color: #757575;
  opacity: 1;
}

/* Focus state */
&:focus {
  outline: none;
  border-color: #7a0b05;
  box-shadow: 0 0 0 3px rgba(122, 11, 5, 0.1);
}

/* Disabled state */
&:disabled {
  background: #f5e5e8;
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Success/Error States

#### Success Banner
```css
background: rgba(16, 185, 129, 0.1);
border: 1px solid rgba(16, 185, 129, 0.25);
border-radius: 12px;
padding: 1rem 1.5rem;
display: flex;
align-items: center;
gap: 1rem;

.icon {
  color: #10b981;
  font-size: 1.5rem;
}

.text {
  color: #065f46;
}
```

#### Error Banner
```css
background: rgba(239, 68, 68, 0.1);
border: 1px solid rgba(239, 68, 68, 0.25);
border-radius: 12px;
padding: 1rem 1.5rem;
display: flex;
align-items: center;
gap: 1rem;

.icon {
  color: #ef4444;
  font-size: 1.5rem;
}

.text {
  color: #991b1b;
}
```

### Upload Area (FileUpload Component)

```css
/* Base state */
background: #ffffff;
border: 2px dashed #ddb8bf;
border-radius: 16px;
padding: 3rem;
text-align: center;
cursor: pointer;
transition: all 0.2s ease;

/* Hover state */
&:hover {
  background: rgba(122, 11, 5, 0.02);
  border-color: #7a0b05;
}

/* Drag-over state */
&.drag-over {
  background: rgba(122, 11, 5, 0.03);
  border-color: #7a0b05;
  border-style: solid;
  transform: scale(1.02);
}

/* Icon */
.upload-icon {
  color: #7a0b05;
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Text */
.upload-text {
  color: #000000;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.upload-hint {
  color: #757575;
  font-size: 0.875rem;
}
```

### Metric Cards (Stats in Review/Comparison)

```css
background: linear-gradient(135deg, #7a0b05 0%, #5a0804 100%);
color: #ffffff;
border-radius: 12px;
padding: 1.5rem;
box-shadow: 0 4px 12px rgba(122, 11, 5, 0.2);
text-align: center;

/* Number */
.metric-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

/* Label */
.metric-label {
  font-size: 0.875rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Variant: Light background */
&.light {
  background: #ffffff;
  color: #7a0b05;
  border: 2px solid #7a0b05;
}
```

### Proposal Slides

```css
/* Slide Container */
background: #ffffff;
border-radius: 16px;
box-shadow: 0 8px 24px rgba(122, 11, 5, 0.15);
padding: 3rem;
min-height: 500px;
display: flex;
flex-direction: column;
justify-content: center;

/* Slide Title */
.slide-title {
  color: #7a0b05;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
}

/* Slide Content */
.slide-content {
  color: #000000;
  font-size: 1rem;
  line-height: 1.6;
}

/* Navigation Buttons */
.slide-nav-btn {
  background: #7a0b05;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(122, 11, 5, 0.2);

  &:hover {
    background: #5a0804;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

/* Navigation Dots */
.slide-indicator {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 2rem;
}

.slide-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(122, 11, 5, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    background: #7a0b05;
    transform: scale(1.2);
  }

  &:hover {
    background: rgba(122, 11, 5, 0.5);
  }
}
```

### Icons

**Color Usage**:
- **Primary icons** (upload, checkmarks, arrows): Deep red (#7a0b05)
- **Secondary/inactive icons**: Muted gray (#757575)
- **Icons on red backgrounds**: White (#ffffff)
- **Success icons**: Green (#10b981)
- **Error icons**: Red (#ef4444)
- **Warning icons**: Orange (#f59e0b)

**Size Scale**:
```css
--icon-xs: 0.75rem;   /* 12px */
--icon-sm: 1rem;      /* 16px */
--icon-md: 1.25rem;   /* 20px */
--icon-lg: 1.5rem;    /* 24px */
--icon-xl: 2rem;      /* 32px */
--icon-2xl: 3rem;     /* 48px */
```

---

## Implementation Notes

### File Structure
All changes are CSS-only. Files to modify:
- `/src/App.css` - Core design system and layout
- `/src/components/FileUpload.css` - Upload interface
- `/src/components/Stepper.css` - Progress indicator
- `/src/components/ReviewApprove.css` - Review workflow
- `/src/components/ReviewModal.css` - Product selection modal
- `/src/components/Comparison.css` - Cost analysis
- `/src/components/Proposal.css` - Slide deck

### Zero Backend Changes
- No modifications to `.jsx` files
- No changes to `matchingService.js`
- No database schema changes
- No API endpoint modifications
- All functionality remains identical

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox for layouts
- CSS custom properties (variables) throughout
- Backdrop-filter with fallback
- All transitions use hardware-accelerated properties

### Responsive Considerations
Current implementation already responsive. Maintain:
- Flexible grid layouts
- Max-width containers (1200px)
- Mobile-friendly touch targets (min 44px)
- Readable text sizes on all devices

### Accessibility
Maintain current accessibility:
- Color contrast ratios meet WCAG AA standards
- Focus states clearly visible
- Semantic HTML structure unchanged
- ARIA labels preserved

### Performance
- CSS-only changes have minimal performance impact
- No additional image assets required
- Font family unchanged (Plus Jakarta Sans already loaded)
- Shadow and backdrop-filter effects are GPU-accelerated

---

## Design Rationale

### Why Balanced Neutral?
Medical/healthcare applications benefit from warm, approachable aesthetics. The light neutral palette:
- Reduces eye strain during extended use
- Creates professional, trustworthy impression
- Provides excellent readability for data-heavy interfaces
- Differentiates from cold, clinical dark themes

### Why Bold Red Usage?
Hart Medical's deep burgundy red (#7a0b05) is distinctive:
- Strong brand recognition
- Communicates confidence and reliability
- Creates clear visual hierarchy
- Guides users through workflow steps

### Why Subtle Depth?
Modern enterprise applications balance flat and skeuomorphic:
- Soft shadows create comfortable spatial hierarchy
- Elevation helps users understand interactive elements
- Maintains clean, uncluttered appearance
- Feels polished without being overdone

### Why Generous Rounds?
Border radius affects perceived personality:
- 12-16px creates friendly, approachable feel
- Softens clinical/medical associations
- Aligns with modern design trends
- Makes UI feel more human and less rigid

---

## Next Steps

1. **Implementation Plan**: Create detailed task breakdown for CSS updates
2. **Git Worktree**: Set up isolated workspace for brand redesign
3. **Systematic Updates**: Update CSS files component by component
4. **Visual QA**: Test each component against design spec
5. **Cross-browser Testing**: Verify rendering across browsers
6. **Commit & Review**: Create PR for stakeholder review

---

## Appendix: Quick Reference

### Brand Colors
```
#7a0b05 - Deep Red (Primary)
#ead0d5 - Soft Pink/Beige (Backgrounds)
#ffffff - White (Cards)
#000000 - Black (Text)
```

### Common Patterns
```css
/* Primary Button */
background: #7a0b05; color: #fff; border-radius: 12px; padding: 0.75rem 1.5rem;

/* Card */
background: #fff; border-radius: 16px; box-shadow: 0 4px 12px rgba(122,11,5,0.12);

/* Input */
background: #fff; border: 2px solid #ddb8bf; border-radius: 10px; padding: 0.75rem 1rem;

/* Badge */
background: rgba(122,11,5,0.1); color: #7a0b05; border: 1px solid rgba(122,11,5,0.3);
```

### File Modification Checklist
- [ ] App.css - Design tokens and core styles
- [ ] FileUpload.css - Upload interface
- [ ] Stepper.css - Progress indicator
- [ ] ReviewApprove.css - Review workflow
- [ ] ReviewModal.css - Product selection
- [ ] Comparison.css - Cost analysis
- [ ] Proposal.css - Slide deck

---

**End of Design Specification**
