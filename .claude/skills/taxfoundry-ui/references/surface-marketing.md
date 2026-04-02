# Surface: Marketing / Hero Page
# Read alongside root SKILL.md — all token values defined there.

## Purpose
Public-facing. Converts a sole trader browsing into a registered user.
Must feel: credible, premium, effortless. Every pixel earns trust.

## Page Structure (single-page scroll)

```
SECTION 1: NAV BAR (sticky)
SECTION 2: HERO
SECTION 3: SOCIAL PROOF / LOGOS
SECTION 4: FEATURES (3-column)
SECTION 5: HOW IT WORKS (step flow)
SECTION 6: PRICING
SECTION 7: TESTIMONIALS
SECTION 8: FINAL CTA
SECTION 9: FOOTER
```

## Nav Bar
- Height: `layout.topBarHeight` (56px), `glass.backdropMd` sticky on scroll
- Left: Logo + wordmark
- Centre: Nav links — font.sizeMd, color.textSecondary, hover: color.textPrimary
- Right: [Log in] ghost button + [Get started] primary CTA button
- Border-bottom: `borderSubtle` on scroll (JS adds class after 40px scroll)

## Hero Section
- Padding: `space.hero` (96px) top, `space.xxl` (48px) bottom
- Max-width: 960px, centred
- Layout: single column, centred text

### Hero Typography
- Pre-headline pill badge: "Now in public beta" or similar
  — `accentPrimaryMuted` background, `accentPrimary` text, `radius.full`,
    `font.sizeXs`, `font.weightMedium`, `tracking.wide`, uppercase
- Headline: 3–5 words max, `font.size2xl` scaled up to `clamp(40px, 6vw, 72px)`,
  `font.weightSemiBold`, `color.textPrimary`, `tracking.tight`, `lineHeading` (1.15)
  — accent word(s) in `color.accentPrimary`
- Subheadline: 1–2 sentences, `font.sizeLg`, `color.textSecondary`, max-width 580px,
  `lineBody` (1.6), centred
- CTA row: [Get started free] primary CTA + [Watch demo] secondary, gap `space.md`
- Below CTA: "No credit card required · Cancel anytime", `font.sizeXs`, `color.textMuted`

### Hero Visual (below text, above fold)
- Platform screenshot or UI mockup inside a device frame
- Frame: glass card construction, `radius.xl`, `shadow.lg`
- Subtle animated orbs behind the frame (same as platform orbs)
- Frame border: `glass.borderMedium` + very faint `accentPrimary` glow at edges

## Features Section
- Section label: ALL CAPS, `font.sizeSm`, `tracking.wide`, `color.accentPrimary`
- Section title: `font.sizeXl`, `font.weightSemiBold`, `color.textPrimary`
- 3-column grid: `repeat(3, 1fr)`, gap `space.xl`
- Feature card: glass card, icon top-left (24px, `accentPrimary`), title `font.sizeLg`,
  description `font.sizeMd` `color.textSecondary`, `lineBody`

## Pricing Section
- 2 or 3 tiers: Free | Pro | Business
- Recommended tier: `border: glass.borderAccent`, `shadow.glow` — visually lifted
- Price: `font.size2xl`, `font.mono`, `font.weightLight`
- Per-period label: `font.sizeSm`, `color.textSecondary`
- Feature list: checkmarks in `color.positive`, `font.sizeMd`, `lineBody`

## Footer
- 4-column grid: Brand | Product | Legal | Social
- Background: `bgCanvas` (darker than page)
- Text: `color.textMuted`, `font.sizeSm`
- Links hover: `color.textSecondary`
- Divider above footer: `borderSubtle`

## Orbs on Marketing Page
- More dramatic than app orbs — larger ellipses, same token gradients
- Orb 1 top-right behind hero (600×450px)
- Orb 2 bottom-left behind features (550×400px)
- Orb 3 mid-right behind pricing (400×300px)
- All: `filter: blur(56px)`, `pointer-events: none`, `z-index: 0`
