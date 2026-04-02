---
name: fintech-ui
description: >
  Build production-grade financial SaaS dashboards and portals. Use this skill whenever
  the user is building any surface of the sole-trader / SME financial platform — including
  the marketing / hero page, login / onboarding, main overview dashboard, client portal,
  admin portal, or platform editor. Enforces a unified design language, zero-hardcoding
  policy, and financial-grade typographic crispness across all surfaces. Always trigger
  when the user mentions: dashboard, client portal, admin panel, transaction view, P&L,
  invoices, financial UI, SaaS shell, or any page within this platform.
---

# Fintech UI Skill — Sole Trader Financial Platform

## 0. How This Skill Is Organised

This root file contains the **complete token system and cross-surface rules** that apply
everywhere. Per-surface specifications live in reference files — read the relevant one
alongside this file when building any specific surface.

| Surface | Reference file |
|---------|---------------|
| Marketing / Hero page | `references/surface-marketing.md` |
| Login / Onboarding | `references/surface-auth.md` |
| Main Dashboard (overview) | `references/surface-dashboard.md` |
| Client Portal | `references/surface-client.md` |
| Admin Portal | `references/surface-admin.md` |
| Platform Editor | `references/surface-editor.md` |

**Read this file first. Then read the relevant surface reference. Never skip the token
system — every value in every reference file is defined here.**

---

## 1. Cardinal Rule — Absolute Zero Hardcoding

Every colour, font name, font size, font weight, line-height, letter-spacing, border-radius,
border-width, shadow, blur, opacity, gradient stop, spacing step, z-index, transition duration,
and easing curve must be declared in `design-tokens.js` and consumed from there.

Think of it like a financial ledger: every number in every report traces back to a single
source entry. If the source changes, every report updates. That is the token file.

No raw hex, no raw `px` values, no inline `font-family` strings anywhere except in the token
file itself.

---

## 2. Colour System

### 2.1 Philosophy

- **Palette family:** Ice blue / electric cyan on deep slate. Cold, precise, futuristic.
  Think Bloomberg Terminal clarity crossed with Linear.app restraint.
- **No purple anywhere** in the UI. Not as accent, not as gradient, not as badge.
- **No bright green as UI colour.** Green is reserved exclusively for: positive number
  deltas, "active" / "online" status indicators, and transaction credit lines.
- **Primary accent is cyan** (`#00C2FF`). It is used for: active nav state, primary CTA
  buttons, focused input borders, chart primary series, key data highlights.
- **Contrast is non-negotiable.** On dark: primary text is near-white (`#EDF2F7`).
  On light: primary text is near-black (`#0D1117`). Both exceed WCAG AA at 7:1+ ratio.

### 2.2 Token Definitions

```js
// design-tokens.js

export const tokens = {

  color: {
    // ── BASE SURFACES ──────────────────────────────────────────
    // Dark theme
    bgCanvas:       '#08090C',   // deepest background — the "void"
    bgBase:         '#0D0F14',   // main app background
    bgSurface:      '#13161D',   // card / panel surface
    bgElevated:     '#1A1E28',   // dropdowns, tooltips, modals
    bgSubtle:       '#1F2330',   // hover states, table row stripes

    // Light theme
    bgCanvasLight:  '#EEF1F7',
    bgBaseLight:    '#F4F6FA',
    bgSurfaceLight: '#FFFFFF',
    bgElevatedLight:'#FFFFFF',
    bgSubtleLight:  '#F0F3F8',

    // ── PRIMARY ACCENT — electric cyan ─────────────────────────
    accentPrimary:       '#00C2FF',  // active states, CTA, chart primary
    accentPrimaryHover:  '#00AADD',  // hover of primary
    accentPrimaryMuted:  'rgba(0, 194, 255, 0.12)',  // tinted backgrounds
    accentPrimaryGlow:   'rgba(0, 194, 255, 0.20)',  // glow / shadow

    // ── SEMANTIC COLOURS ────────────────────────────────────────
    // These are the ONLY green and red in the system
    positive:       '#10B981',   // profit, credit, active, online
    positiveMuted:  'rgba(16, 185, 129, 0.12)',
    negative:       '#F43F5E',   // loss, debit, error, offline
    negativeMuted:  'rgba(244, 63, 94, 0.12)',
    warning:        '#F59E0B',   // pending, review needed
    warningMuted:   'rgba(245, 158, 11, 0.12)',
    neutral:        '#64748B',   // unchanged, informational

    // ── TEXT HIERARCHY — exactly 4 levels ──────────────────────
    // Dark theme
    textPrimary:    '#EDF2F7',   // headings, numbers, active labels
    textSecondary:  '#8896AA',   // descriptions, subtitles, nav labels
    textMuted:      '#4A5568',   // timestamps, placeholders, disabled
    textInverse:    '#0D1117',   // text on bright/light backgrounds

    // Light theme
    textPrimaryLight:    '#0D1117',
    textSecondaryLight:  '#4A5568',
    textMutedLight:      '#94A3B8',
    textInverseLight:    '#EDF2F7',

    // ── BORDERS ─────────────────────────────────────────────────
    borderSubtle:   'rgba(255, 255, 255, 0.05)',
    borderMedium:   'rgba(255, 255, 255, 0.09)',
    borderStrong:   'rgba(255, 255, 255, 0.15)',
    borderAccent:   'rgba(0, 194, 255, 0.30)',

    borderSubtleLight:  'rgba(0, 0, 0, 0.06)',
    borderMediumLight:  'rgba(0, 0, 0, 0.10)',
    borderStrongLight:  'rgba(0, 0, 0, 0.16)',
    borderAccentLight:  'rgba(0, 194, 255, 0.40)',

    // ── CHART SERIES — ordered, always consumed in sequence ─────
    chart: [
      '#00C2FF',   // 1. cyan — primary series
      '#10B981',   // 2. emerald — secondary series or positive
      '#F59E0B',   // 3. amber — tertiary
      '#64748B',   // 4. slate — quaternary / comparison
      '#F43F5E',   // 5. rose — negative / warning series
    ],

    // ── CHROMATIC ACCENT PALETTE ────────────────────────────────
    // Used for key card glows, side panel accents, hero highlights.
    // These are RICH, DEEP colours — not UI controls.
    // Each has: base colour, glow (outer), muted (background tint), border tint.
    chromatic: {
      gold: {
        base:   '#F0A500',
        glow:   'rgba(240, 165, 0, 0.22)',
        muted:  'rgba(240, 165, 0, 0.08)',
        border: 'rgba(240, 165, 0, 0.30)',
        // Light mode equivalents (deeper, less luminous)
        baseLight:   '#B87A00',
        glowLight:   'rgba(184, 122, 0, 0.15)',
        mutedLight:  'rgba(184, 122, 0, 0.07)',
        borderLight: 'rgba(184, 122, 0, 0.28)',
      },
      ember: {
        base:   '#FF6B35',
        glow:   'rgba(255, 107, 53, 0.22)',
        muted:  'rgba(255, 107, 53, 0.08)',
        border: 'rgba(255, 107, 53, 0.30)',
        baseLight:   '#C94E1E',
        glowLight:   'rgba(201, 78, 30, 0.15)',
        mutedLight:  'rgba(201, 78, 30, 0.07)',
        borderLight: 'rgba(201, 78, 30, 0.28)',
      },
      cyan: {
        base:   '#00C2FF',
        glow:   'rgba(0, 194, 255, 0.22)',
        muted:  'rgba(0, 194, 255, 0.08)',
        border: 'rgba(0, 194, 255, 0.30)',
        baseLight:   '#0090C4',
        glowLight:   'rgba(0, 144, 196, 0.15)',
        mutedLight:  'rgba(0, 144, 196, 0.07)',
        borderLight: 'rgba(0, 144, 196, 0.28)',
      },
      jade: {
        base:   '#10B981',
        glow:   'rgba(16, 185, 129, 0.22)',
        muted:  'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.30)',
        baseLight:   '#0A8A5F',
        glowLight:   'rgba(10, 138, 95, 0.15)',
        mutedLight:  'rgba(10, 138, 95, 0.07)',
        borderLight: 'rgba(10, 138, 95, 0.28)',
      },
    },

    // ── ROW / ITEM HOVER STATES ──────────────────────────────────
    // These are the ghost fills applied on hover — barely perceptible.
    rowHoverDark:  'rgba(255, 255, 255, 0.028)',  // table row, nav item, list item
    rowHoverLight: 'rgba(0, 0, 0, 0.032)',

    // Pill / badge hover fill — starts transparent, fills on hover
    pillHoverFillDark:  'rgba(255, 255, 255, 0.07)',
    pillHoverFillLight: 'rgba(0, 0, 0, 0.06)',
  },

  // ── TYPOGRAPHY ────────────────────────────────────────────────
  font: {
    // Exactly 2 families
    display: "'Inter', sans-serif",  // All UI — financial dashboards
    mono:    "'JetBrains Mono', monospace",  // Numbers, amounts, codes

    // Note: Inter at weight 300–400 reads sharply on dark backgrounds.
    // Mono for all currency/number values ensures alignment and precision.

    // ── 6 size steps — named by role ────────────────────────────
    sizeXs:   '11px',   // timestamps, micro-labels, badge text
    sizeSm:   '12px',   // nav items, table column headers, secondary labels
    sizeMd:   '14px',   // body copy, table rows, form fields
    sizeLg:   '16px',   // card titles, section headers
    sizeXl:   '24px',   // page titles, KPI values (small)
    size2xl:  '40px',   // hero KPI number (e.g. total balance)

    // ── 3 weight levels ──────────────────────────────────────────
    weightLight:   300,   // large display numbers — thin and sharp
    weightRegular: 400,   // body copy
    weightMedium:  500,   // labels, nav items, button text
    weightSemiBold:600,   // card titles, section headings, KPI labels

    // ── Letter spacing ──────────────────────────────────────────
    trackingTight:  '-0.02em',  // large numbers — tighter is crisper
    trackingNormal: '0em',
    trackingWide:   '0.06em',   // ALL CAPS labels, badge text

    // ── Line heights ─────────────────────────────────────────────
    lineHeading: 1.15,
    lineBody:    1.6,
    lineMono:    1.5,
  },

  // ── SPACING — 8-point grid ────────────────────────────────────
  space: {
    xs:   '4px',
    sm:   '8px',
    md:   '16px',
    lg:   '24px',
    xl:   '32px',
    xxl:  '48px',
    xxxl: '64px',
    hero: '96px',   // marketing page breathing room
  },

  // ── BORDER RADIUS ─────────────────────────────────────────────
  radius: {
    xs:   '4px',    // inline badges, tags
    sm:   '6px',    // buttons, inputs, small cards
    md:   '10px',   // standard cards, dropdowns
    lg:   '14px',   // large cards, panels
    xl:   '20px',   // chart containers, modal overlays
    full: '9999px', // pills, avatars, status dots
  },

  // ── SHADOW / ELEVATION ────────────────────────────────────────
  shadow: {
    xs:    '0 1px 2px rgba(0,0,0,0.3)',
    sm:    '0 1px 4px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)',
    md:    '0 2px 8px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
    lg:    '0 4px 16px rgba(0,0,0,0.45), 0 16px 48px rgba(0,0,0,0.35)',
    glow:  '0 0 24px rgba(0, 194, 255, 0.18), 0 0 8px rgba(0, 194, 255, 0.10)',
    inset: 'inset 0 1px 0 rgba(255,255,255,0.06)',

    // Chromatic card outer glows — applied via box-shadow on the card wrapper.
    // Format: near glow (tight) + far glow (diffuse ambient).
    // Swap to *Light variants in light theme (reduced opacity, cooler).
    glowGold:  '0 0 0 1px rgba(240,165,0,0.22), 0 8px 40px rgba(240,165,0,0.18)',
    glowEmber: '0 0 0 1px rgba(255,107,53,0.22), 0 8px 40px rgba(255,107,53,0.18)',
    glowCyan:  '0 0 0 1px rgba(0,194,255,0.22),  0 8px 40px rgba(0,194,255,0.18)',
    glowJade:  '0 0 0 1px rgba(16,185,129,0.22), 0 8px 40px rgba(16,185,129,0.18)',

    glowGoldLight:  '0 0 0 1px rgba(184,122,0,0.18),  0 8px 32px rgba(184,122,0,0.12)',
    glowEmberLight: '0 0 0 1px rgba(201,78,30,0.18),  0 8px 32px rgba(201,78,30,0.12)',
    glowCyanLight:  '0 0 0 1px rgba(0,144,196,0.18),  0 8px 32px rgba(0,144,196,0.12)',
    glowJadeLight:  '0 0 0 1px rgba(10,138,95,0.18),  0 8px 32px rgba(10,138,95,0.12)',
  },

  // ── GLASSMORPHISM ─────────────────────────────────────────────
  glass: {
    // Backgrounds
    bgSubtle:  'rgba(255,255,255,0.03)',
    bgLight:   'rgba(255,255,255,0.05)',
    bgMedium:  'rgba(255,255,255,0.07)',
    bgStrong:  'rgba(255,255,255,0.10)',

    bgSubtleLight:  'rgba(255,255,255,0.50)',
    bgLightLight:   'rgba(255,255,255,0.70)',
    bgMediumLight:  'rgba(255,255,255,0.82)',
    bgStrongLight:  'rgba(255,255,255,0.92)',

    // Borders
    borderDefault: '1px solid rgba(255,255,255,0.07)',
    borderMedium:  '1px solid rgba(255,255,255,0.11)',
    borderAccent:  '1px solid rgba(0,194,255,0.28)',

    borderDefaultLight: '1px solid rgba(0,0,0,0.07)',
    borderMediumLight:  '1px solid rgba(0,0,0,0.11)',
    borderAccentLight:  '1px solid rgba(0,194,255,0.40)',

    // Backdrop blur values
    blurXs:  'blur(6px)',
    blurSm:  'blur(10px)',
    blurMd:  'blur(18px)',
    blurLg:  'blur(32px)',
    blurXl:  'blur(56px)',   // ambient orbs only

    // Composed backdrop-filter strings
    backdropSm:  'blur(10px) saturate(140%)',
    backdropMd:  'blur(18px) saturate(160%)',
    backdropLg:  'blur(32px) saturate(180%)',
  },

  // ── GRADIENTS ─────────────────────────────────────────────────
  gradient: {
    // CTA button fill
    cta:           'linear-gradient(135deg, #00C2FF 0%, #0094CC 100%)',
    ctaHover:      'linear-gradient(135deg, #1ACEFF 0%, #00AADD 100%)',

    // Card shimmer overlay (::after pseudo-element)
    shimmer:       'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 55%)',

    // Chart area fills (under lines)
    chartCyan:     'linear-gradient(180deg, rgba(0,194,255,0.22) 0%, rgba(0,194,255,0) 100%)',
    chartEmerald:  'linear-gradient(180deg, rgba(16,185,129,0.20) 0%, rgba(16,185,129,0) 100%)',
    chartAmber:    'linear-gradient(180deg, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0) 100%)',
    chartNegative: 'linear-gradient(180deg, rgba(244,63,94,0.20) 0%, rgba(244,63,94,0) 100%)',

    // Ambient background orbs — present on BOTH dark and light themes
    // Dark: vivid, visible. Light: very soft, tinted, barely perceptible.
    orbCyanDark:   'radial-gradient(ellipse 55% 45% at 85% 15%, rgba(0,194,255,0.14) 0%, transparent 70%)',
    orbSlateDark:  'radial-gradient(ellipse 50% 40% at 10% 85%, rgba(0,194,255,0.07) 0%, transparent 70%)',
    orbWarmDark:   'radial-gradient(ellipse 40% 35% at 50% 105%, rgba(16,185,129,0.06) 0%, transparent 70%)',

    orbCyanLight:  'radial-gradient(ellipse 55% 45% at 85% 15%, rgba(0,194,255,0.07) 0%, transparent 70%)',
    orbSlateLight: 'radial-gradient(ellipse 50% 40% at 10% 85%, rgba(0,100,180,0.05) 0%, transparent 70%)',
    orbWarmLight:  'radial-gradient(ellipse 40% 35% at 50% 105%, rgba(16,185,129,0.04) 0%, transparent 70%)',
  },

  // ── MOTION ────────────────────────────────────────────────────
  motion: {
    fast:    '100ms',
    default: '200ms',
    slow:    '360ms',
    easing:  'cubic-bezier(0.4, 0, 0.2, 1)',
    spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',

    // Hover interaction specifics
    rowHoverIn:        '80ms',   // row fill appears almost instantly
    rowHoverOut:       '160ms',  // fades out slightly slower — feels deliberate
    pillFillIn:        '140ms',  // pill bg fades in — not instant, has weight
    pillFillOut:       '220ms',
    tooltipDelay:      '420ms',  // hint appears after this pause, not on touch
    tooltipIn:         '120ms',  // then fades in fast once triggered
    buttonContrastIn:  '180ms',  // CTA contrast inversion on hover
    glowPulse:         '2400ms', // chromatic card glow breathes — never fast
  },

  // ── LAYOUT ────────────────────────────────────────────────────
  layout: {
    sidebarWidth:        '220px',
    sidebarCollapsed:    '68px',
    rightPanelWidth:     '300px',
    topBarHeight:        '56px',
    maxContent:          '1440px',
    contentPaddingH:     '40px',
    contentPaddingV:     '32px',
    cardGap:             '16px',   // gap between cards in a grid
    sectionGap:          '32px',   // gap between page sections
  },

  // ── Z-INDEX ───────────────────────────────────────────────────
  zIndex: {
    base:     0,
    card:     10,
    sticky:   20,
    dropdown: 30,
    overlay:  40,
    modal:    50,
    toast:    60,
    tooltip:  70,
  },
};
```

---

## 3. Cross-Surface Language Rules

These rules apply to **every surface without exception**: marketing, auth, dashboard,
client portal, admin portal, editor.

### 3.1 Typography Rules
- Display numbers (balances, totals, KPIs): `font.mono`, `font.weightLight`, `font.trackingTight`
- All UI labels, nav, buttons, body: `font.display` (Inter)
- ALL CAPS labels (section headers, table column names): `font.sizeSm`, `font.trackingWide`,
  `font.weightMedium`, `color.textMuted` — used sparingly
- Never mix mono and display in the same text node

### 3.2 Button Rules (universal)

| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| Primary CTA | `gradient.cta` | `textInverse` | none | One per view max |
| Secondary | `glass.bgMedium` | `textPrimary` | `glass.borderMedium` | Supporting actions |
| Ghost | transparent | `accentPrimary` | `borderAccent` | Tertiary actions |
| Danger | `negativeMuted` | `negative` | 1px `negative` at 30% | Destructive actions |
| Disabled | `bgSubtle` | `textMuted` | none | All variants when disabled |

- All buttons: `radius.sm`, `font.sizeMd`, `font.weightMedium`, height `36px` standard / `40px` large
- Focus: `2px` `accentPrimary` outline, `2px` offset — never remove for accessibility

**Primary CTA Hover — Contrast Inversion:**
The primary button does not simply lighten on hover. It inverts contrast:
- Dark mode: button is `gradient.cta` (cyan fill, dark text) → hover → background darkens
  to `gradient.ctaHover`, text stays `textInverse`. Transition: `motion.buttonContrastIn`.
- Light mode: button is a **dark fill** (`bgBase` / near-black) with `textInverseLight`
  (near-white text) → hover → fills to `accentPrimary` with `textInverse` text.
  This is the "fade to filled colour" behaviour — light button goes dark on hover.

```css
/* Dark mode primary CTA */
.btn-primary {
  background: var(--gradient-cta);
  color: var(--color-text-inverse);
  transition: background var(--motion-button-contrast-in) var(--motion-easing),
              box-shadow var(--motion-button-contrast-in) var(--motion-easing);
}
.btn-primary:hover {
  background: var(--gradient-cta-hover);
  box-shadow: var(--shadow-glow);
}

/* Light mode primary CTA — dark button that warms to accent on hover */
[data-theme="light"] .btn-primary {
  background: var(--color-bg-base);        /* near-black */
  color: var(--color-text-inverse-light);  /* near-white */
}
[data-theme="light"] .btn-primary:hover {
  background: var(--gradient-cta);
  color: var(--color-text-inverse);
}
```

**Secondary / Ghost Hover:** increase glass background by one opacity step.
Never change text colour on hover — only background changes.

### 3.3 Input Field Rules

- Background: `bgSurface` (dark) / `bgSurfaceLight` (light)
- Border default: `glass.borderDefault`
- Border focused: `glass.borderAccent` + `shadow.glow` at 50% opacity
- Border error: `1px solid color.negative`
- Height: `40px` standard
- Font: `font.sizeMd`, `font.weightRegular`, `color.textPrimary`
- Placeholder: `color.textMuted`
- Label above: `font.sizeSm`, `font.weightMedium`, `color.textSecondary`
- Radius: `radius.sm`

### 3.4 Badge / Tag Rules

- Positive: `color.positive` text, `color.positiveMuted` bg, `radius.xs`
- Negative: `color.negative` text, `color.negativeMuted` bg
- Warning: `color.warning` text, `color.warningMuted` bg
- Neutral: `color.textSecondary` text, `color.bgSubtle` bg
- Font: `font.sizeXs`, `font.weightMedium`, `font.trackingWide`, uppercase
- Padding: `2px space.xs` vertical, `space.sm` horizontal

### 3.5 Card Construction (Universal Glass Card)

Every card across every surface uses this exact layering:

```css
.card {
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-backdrop-md);   /* blur(18px) saturate(160%) */
  -webkit-backdrop-filter: var(--glass-backdrop-md);
  border: var(--glass-border-default);
  border-radius: var(--radius-lg);             /* 14px */
  box-shadow: var(--shadow-sm), var(--shadow-inset);
  padding: var(--space-lg);                    /* 24px */
}

/* Top-edge shimmer — always present */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--gradient-shimmer);
  pointer-events: none;
}
```

For light theme cards, swap `glass.bgMedium` → `glass.bgMediumLight` and
`glass.borderDefault` → `glass.borderDefaultLight`.

### 3.6 Ambient Background Orbs

**Present on both dark and light themes.** The only difference is intensity.

```css
/* Applied to .app-bg — behind everything, fixed position */
.orb { position: fixed; pointer-events: none; z-index: 0; }

[data-theme="dark"] .orb-1 { background: var(--gradient-orb-cyan-dark);  ... }
[data-theme="dark"] .orb-2 { background: var(--gradient-orb-slate-dark); ... }
[data-theme="dark"] .orb-3 { background: var(--gradient-orb-warm-dark);  ... }

[data-theme="light"] .orb-1 { background: var(--gradient-orb-cyan-light);  ... }
[data-theme="light"] .orb-2 { background: var(--gradient-orb-slate-light); ... }
[data-theme="light"] .orb-3 { background: var(--gradient-orb-warm-light);  ... }
```

Orb sizing: 500–700px wide, 350–500px tall ellipses. Use `filter: blur(56px)` NOT
`backdrop-filter` — they are decorative shapes, not glass panels.

### 3.7 Status Indicator Dots

- Size: `8px` circle, `border-radius: full`
- Online/Active: `color.positive` solid fill
- Offline/Inactive: `color.textMuted` solid fill
- Pending: `color.warning`, animated `pulse` keyframe (opacity 1→0.4→1, 2s infinite)
- Never add text to a status dot — pair with a badge label if needed

### 3.8 Dividers

- Between sections: `1px solid color.borderSubtle`, no margin collapse
- Between table rows: `1px solid color.borderSubtle`
- Between nav groups: `1px solid color.borderSubtle`, `margin: space.sm 0`
- Vertical dividers (sidebar separator): same rule

### 3.9 Negative Space Rules (Financial breathing room)

Financial UIs are read, not skimmed. White space is functional, not decorative.

- Minimum card internal padding: `space.lg` (24px) — never reduce
- Minimum gap between cards in a grid: `layout.cardGap` (16px)
- Minimum gap between page sections: `layout.sectionGap` (32px)
- KPI number never touches a border — minimum `space.xl` (32px) clearance
- Table rows: minimum height `48px` — data must breathe
- Sidebar nav items: `space.sm` vertical padding, `space.md` horizontal — not tight
- Content max-width: `layout.maxContent` (1440px), centred — never full-bleed on large screens

---

## 4. Layout Shell (All Authenticated Surfaces)

All authenticated surfaces (dashboard, client portal, admin, editor) share this shell:

```
┌──────────┬─────────────────────────────────────────┐
│          │  TOP BAR (56px, sticky)                  │
│ SIDEBAR  ├─────────────────────────────────────────┤
│ (220px)  │  PAGE CONTENT                           │
│          │  padding: 32px 40px                      │
│          │  max-width: 1440px                       │
│          │  sections separated by 32px gap          │
└──────────┴─────────────────────────────────────────┘
```

The right panel (activity / context) is **optional per surface**. Include it only on:
Overview Dashboard and Client Portal. Admin and Editor use full-width content area.

### 4.1 Financial Grid Columns

- KPI stat row: `repeat(auto-fit, minmax(200px, 1fr))` — minimum 200px per card
- Secondary metric row: `repeat(auto-fit, minmax(280px, 1fr))`
- Chart + sidebar: `2fr 1fr` (chart dominant)
- Full-width chart: `1fr`
- Transaction list: always full-width, never truncated into a card column

---

## 5. Theme Switching

Toggle `data-theme="dark"` / `data-theme="light"` on `<html>`.
CSS vars update. Zero component code changes. Zero layout changes. Zero orb removal.

```css
:root[data-theme="dark"]  { --color-bg-base: #0D0F14; --color-text-primary: #EDF2F7; ... }
:root[data-theme="light"] { --color-bg-base: #F4F6FA; --color-text-primary: #0D1117; ... }
```

---

## 6. Surface Reference Files

Read the appropriate file for full per-surface layout, component inventory, and UX rules:

- **Marketing / Hero:** `references/surface-marketing.md`
- **Auth / Login / Onboarding:** `references/surface-auth.md`
- **Overview Dashboard:** `references/surface-dashboard.md`
- **Client Portal:** `references/surface-client.md`
- **Admin Portal:** `references/surface-admin.md`
- **Platform Editor:** `references/surface-editor.md`

---

## 7. Pre-Build Checklist

- [ ] `design-tokens.js` exists, all values declared, zero raw values elsewhere
- [ ] Both dark and light orbs declared, both render (different intensity)
- [ ] Exactly 4 text colours, 6 font sizes, 2 font families, 3 font weights in use
- [ ] No purple anywhere. No bright green except semantic positive/active uses
- [ ] Primary accent is cyan `#00C2FF` only
- [ ] All currency / numeric values use `font.mono`
- [ ] KPI cards have `space.xl` internal clearance around numbers
- [ ] Buttons match the 5-variant table + contrast-inversion hover rules
- [ ] `data-theme` toggle changes only CSS variable values — no component duplication
- [ ] Table rows minimum 48px height, row hover uses `color.rowHoverDark/Light`
- [ ] All focus states visible (2px cyan outline)
- [ ] Pill/badge hover: background fills in `motion.pillFillIn`, text colour unchanged
- [ ] Hint tooltips have `motion.tooltipDelay` (420ms) before appearing
- [ ] Chromatic cards assigned correct glow colour from the 4-colour palette
- [ ] Chromatic glow applied via `box-shadow` + `::before` pseudo radial gradient
- [ ] Side panels use chromatic border accent on open state
- [ ] All chromatic values reference `color.chromatic.*` tokens — zero raw hex

---

## 8. Interaction States — Hover, Fill, Hint

### 8.1 Row Hover (Tables, Lists, Nav Items)

The row hover effect is intentionally ghost-light. Think of it as the row exhaling very
slightly — not a bright flash. It communicates "this is interactive" without drama.

```css
.table-row,
.list-item,
.nav-item {
  background: transparent;
  transition:
    background var(--motion-row-hover-in) var(--motion-easing);
}

.table-row:hover,
.list-item:hover {
  background: var(--color-row-hover-dark);   /* rgba(255,255,255,0.028) */
  /* Light theme: var(--color-row-hover-light) */
  cursor: pointer;
}

/* Hover-out is slightly slower — feels deliberate, not twitchy */
.table-row:not(:hover),
.list-item:not(:hover) {
  transition:
    background var(--motion-row-hover-out) var(--motion-easing);
}
```

**Critical:** the hover fill on rows must be near-invisible. If you can clearly see it
without looking for it, it is too strong. It is a whisper, not a highlight.

### 8.2 Pill / Badge Hover (Status Pills, Filter Tags, Category Badges)

Badges that are interactive (clickable filters, status toggles) transition from a
transparent / outlined state to a filled tint on hover. Non-interactive badges do not
have hover states.

```css
/* Interactive pill — transparent to filled */
.pill-interactive {
  background: transparent;
  border: 1px solid currentColor;   /* colour comes from the badge variant token */
  color: var(--badge-text-colour);  /* e.g. color.positive for "On track" */
  transition:
    background var(--motion-pill-fill-in)  var(--motion-easing),
    box-shadow  var(--motion-pill-fill-in)  var(--motion-easing);
}

.pill-interactive:hover {
  background: var(--badge-muted-colour);   /* e.g. color.positiveMuted */
  box-shadow: 0 0 0 1px var(--badge-border-colour);
}

/* Positive "On track" example */
.pill-on-track {
  color: var(--color-positive);
}
.pill-on-track:hover {
  background: var(--color-positive-muted);   /* rgba(16,185,129,0.12) */
}
```

The text colour of a pill **never changes on hover** — only the background fills in.
This is the same pattern used in Image 1 (Linear): the green text stays green,
the transparent pill background fills to a green tint.

### 8.3 Hint Tooltip (Delayed Reveal)

Hint tooltips appear after a pause — they are context for "what is this?" not a
primary UI element. Showing them instantly would be noise.

```css
/* The tooltip is always in the DOM but invisible until hover delay elapses */
.hint-tooltip {
  opacity: 0;
  pointer-events: none;
  transform: translateY(4px);
  transition:
    opacity  var(--motion-tooltip-in) var(--motion-easing),
    transform var(--motion-tooltip-in) var(--motion-easing);
  /* delay is applied to the parent trigger's hover, not the tooltip itself */
}

.hint-trigger:hover .hint-tooltip {
  transition-delay: var(--motion-tooltip-delay);  /* 420ms — waits before appearing */
  opacity: 1;
  transform: translateY(0);
}

/* When unhover — disappear immediately, no delay */
.hint-trigger:not(:hover) .hint-tooltip {
  transition-delay: 0ms;
  opacity: 0;
  transform: translateY(4px);
}
```

Tooltip visual construction: `glass.bgStrong` background, `glass.backdropSm`,
`glass.borderMedium`, `radius.sm`, `shadow.sm`, `font.sizeSm`, `color.textPrimary`,
`space.sm` padding. Max-width `240px`, never wider.

### 8.4 Primary Button Contrast Inversion (Summary)

- Dark mode: `gradient.cta` → `gradient.ctaHover` on hover (stays light-on-dark)
  + `shadow.glow` appears
- Light mode: near-black fill → `gradient.cta` fill on hover (dark-to-colour transition)
- Both: `motion.buttonContrastIn` (180ms) transition
- Never animate text colour independently — background drives the legibility

---

## 9. Chromatic Card System

### 9.1 Concept

Key cards — specifically the primary KPI cards on the Overview Dashboard, and any
slide-out side panel — carry a chromatic accent: a rich, deep colour that glows behind
the card's border and bleeds softly into the space around it. 

Think of it like a candle inside a glass box: the glass (the card) is still transparent
and cool, but the light source behind it gives it a warm chromatic identity.

Each card is assigned one of 4 accent colours from `color.chromatic`:
- `gold` — Total Balance, primary financial position
- `ember` — Expenses, outflows, cost-related cards
- `cyan` — Revenue, income, primary business metrics (matches platform primary)
- `jade` — Net Profit, positive outcomes

These assignments are **fixed** — not random, not interchangeable. The colour carries
semantic meaning: gold = wealth/status, ember = outflow/cost, cyan = platform/neutral,
jade = positive growth.

### 9.2 Construction — Three Layers

A chromatic card is built with three stacked layers:

**Layer 1 — The card itself** (standard glass card — no changes to its construction)

**Layer 2 — Chromatic box-shadow** (on the card's outer wrapper)
```css
/* Applied directly to the card element */
.card--gold  { box-shadow: var(--shadow-glow-gold);  }
.card--ember { box-shadow: var(--shadow-glow-ember); }
.card--cyan  { box-shadow: var(--shadow-glow-cyan);  }
.card--jade  { box-shadow: var(--shadow-glow-jade);  }

/* Light theme variants */
[data-theme="light"] .card--gold  { box-shadow: var(--shadow-glow-gold-light);  }
/* ...etc */
```

The `box-shadow` has two parts:
- Inner ring: `0 0 0 1px rgba(colour, 0.22)` — a thin glowing border line
- Outer diffuse: `0 8px 40px rgba(colour, 0.18)` — the ambient halo around the card

**Layer 3 — Pseudo-element radial gradient** (the "candle flame" behind the card)
```css
.card--chromatic {
  position: relative;
  overflow: visible;  /* critical — allows the glow to escape the card boundary */
}

.card--chromatic::after {
  content: '';
  position: absolute;
  /* Positioned outside the card — top-right corner is the light source */
  top: -40%;
  right: -20%;
  width: 80%;
  height: 80%;
  background: radial-gradient(
    ellipse at center,
    var(--chromatic-glow-colour) 0%,   /* e.g. color.chromatic.gold.glow */
    transparent 70%
  );
  filter: blur(32px);
  pointer-events: none;
  z-index: -1;   /* sits behind the card */
  opacity: 0.7;
}
```

The pseudo-element position (top-right vs top-left vs bottom) can vary per card
to avoid all four cards looking identical. Suggested positions:
- `gold` card: top-right source
- `ember` card: top-left source
- `cyan` card: bottom-right source
- `jade` card: top-right source

### 9.3 Chromatic Border Gradient

For extra richness on the key card or side panel, the border itself can carry a
gradient rather than a flat rgba value:

```css
.card--chromatic-gold {
  border: none;   /* remove standard border */
  background-clip: padding-box;
  position: relative;
}

/* Gradient border via ::before positioned wrapper */
.card--chromatic-gold::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: calc(var(--radius-lg) + 1px);
  background: linear-gradient(
    135deg,
    rgba(240, 165, 0, 0.40) 0%,
    rgba(240, 165, 0, 0.08) 50%,
    rgba(240, 165, 0, 0.00) 100%
  );
  z-index: -1;
}
```

This creates a border that is vivid in one corner and fades to nothing — exactly the
effect visible in Image 2 (each KPI card has a stronger glow on one edge).

### 9.4 Side Panel Chromatic Treatment

When a side panel opens (e.g. transaction detail, invoice preview, client record):
- The panel's left border carries a 3px chromatic accent: `border-left: 3px solid color.chromatic.[colour].base`
- The panel header background uses `color.chromatic.[colour].muted` as a very subtle tint
- The `::after` radial gradient is positioned top-left (light source from the hinge)
- The outer glow (`box-shadow`) is applied to the panel container, not the cards inside it

### 9.5 Rules — What Is and Isn't Chromatic

| Element | Chromatic? | Notes |
|---------|-----------|-------|
| Hero KPI cards (4) | ✅ Yes | Gold, Ember, Cyan, Jade assigned |
| Secondary metric cards | ❌ No | Standard glass only |
| Chart containers | ❌ No | Chart colours handle visual identity |
| Side panels | ✅ Yes | One colour per panel, matching its content |
| Transaction table | ❌ No | Row hover is sufficient |
| Nav sidebar | ❌ No | Chromatic is for content, not chrome |
| Modals | ✅ Conditional | Only for confirmations / key decision moments |
| Login card | ❌ No | Trust requires restraint |

### 9.6 Light Mode Chromatic Adjustments

On light mode, chromatic glows must be significantly reduced — not removed.
- `box-shadow` uses the `*Light` variants (lower opacity: 0.12–0.15 vs 0.18–0.22)
- The `::after` pseudo radial gradient opacity drops from `0.7` to `0.35`
- The gradient border uses `*borderLight` values from the chromatic token
- The effect is still present and visible but does not overpower the crisp white surface

The same chromatic *colour* is used on both themes — what changes is only intensity.
Gold stays gold. Ember stays ember. The accent adapts to be legible on its background.
