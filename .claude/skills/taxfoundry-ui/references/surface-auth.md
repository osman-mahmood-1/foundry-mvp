# Surface: Auth — Login, Registration, Onboarding
# Read alongside root SKILL.md — all token values defined there.

## Purpose
Entry point to the platform. Must communicate trust, precision, and brand character
immediately. A sole trader deciding whether to hand over their financial data needs to
feel: secure, professional, modern. No clutter. Maximum negative space.

## Login Page Layout

```
FULL VIEWPORT — split layout on desktop, stacked on mobile

LEFT HALF (50vw, min 480px)
  ├── Logo top-left (40px padding)
  ├── CENTRE: Login card
  │     ├── Headline: "Welcome back" — font.sizeXl, font.weightSemiBold
  │     ├── Subline: "Sign in to your account" — font.sizeMd, textSecondary
  │     ├── [Email input]
  │     ├── [Password input] with show/hide toggle
  │     ├── [Forgot password] — ghost text link, font.sizeSm, accentPrimary
  │     ├── [Sign In] — Primary CTA button, full-width
  │     └── [Don't have an account? Sign up] — font.sizeSm, textSecondary + link
  └── Legal / copyright — pinned bottom, font.sizeXs, textMuted

RIGHT HALF (50vw) — decorative, no interactive elements
  ├── Background: bgCanvas (dark) / bgBaseLight (light)
  ├── Ambient orbs — all 3, same as rest of platform
  ├── Feature showcase card (glass card, centred)
  │     ├── Small headline: "Your finances, simplified"
  │     └── 3 feature bullets with checkmark icons (accentPrimary)
  └── Subtle platform screenshot / preview (optional, blurred at edges)
```

### Login Card Specs
- Width: 400px fixed, centred in left half
- Background: `glass.bgMedium` with `glass.backdropMd`
- Border: `glass.borderMedium`
- Radius: `radius.xl` (20px) — slightly more generous than dashboard cards
- Padding: `space.xl` (32px) all sides
- Field gap: `space.md` (16px) between inputs
- CTA button gap: `space.lg` (24px) above button

### Onboarding Flow (post-registration, multi-step)
- Step indicator: horizontal dots or numbered steps, `accentPrimary` for current step
- One concept per screen — never two data-collection goals on one step
- Steps: Business name → Business type → First tax year → Connect bank (optional) → Done
- "Skip for now" on optional steps: ghost button, right-aligned, `color.textMuted`
- Progress text: "Step 2 of 5", `font.sizeSm`, `color.textSecondary`, centred above card
- Completion screen: large `color.positive` checkmark, celebratory headline, CTA to dashboard

## Mobile (< 768px)
- Right half hidden entirely
- Login card is full-width with `space.lg` horizontal margin
- No layout change to card internals
