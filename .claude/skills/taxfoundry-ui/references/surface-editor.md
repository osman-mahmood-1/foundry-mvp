# Surface: Platform Editor
# Read alongside root SKILL.md — all token values defined there.

## Purpose
A configuration surface — not a code editor, but a structured UI for the trader to
customise their portal: set their business branding, invoice templates, client portal
appearance, email templates, tax settings, and integrations. Think Notion settings
meets Stripe dashboard configuration.

## Layout — Two-Panel Editor

```
SIDEBAR (220px) — settings categories only (not full app nav)
  ├── Branding
  ├── Invoice Templates
  ├── Client Portal
  ├── Notifications & Email
  ├── Tax & Accounting
  └── Integrations

MAIN AREA — full width (no right panel)
  ├── SETTINGS HEADER (category title + save button)
  └── SETTINGS CONTENT (form panels)
```

## Settings Header (sticky within content area)
- Category title: `font.sizeXl`, `font.weightSemiBold`, `color.textPrimary`
- Breadcrumb: Settings → [Category], `font.sizeSm`, `color.textMuted`
- [Save changes] primary CTA — right-aligned, disabled until changes detected
- Unsaved changes indicator: `color.warning` dot + "Unsaved" label, `font.sizeSm`

## Form Panel Construction
- Each logical group is a card (glass card rules apply)
- Card has: section title (`font.sizeLg`, `font.weightSemiBold`) + optional description
  (`font.sizeMd`, `color.textSecondary`) + form fields below
- Fields follow standard input rules from root SKILL.md
- Field gap: `space.md` (16px) within a group
- Group gap: `space.lg` (24px) between cards
- Never put more than 5 fields in one card without a visual subgroup divider

## Branding Settings
- Logo upload: dashed border drop zone, `borderMedium`, `radius.md`,
  hover: `borderAccent` — "Click to upload or drag and drop"
- Colour picker: small swatch (24×24, `radius.xs`) + hex input (`font.mono`)
  — constrained to their brand accent only, not the platform palette
- Live preview panel: right half of screen when editing branding — shows mini
  invoice or portal header updating in real-time

## Invoice Template Editor
- Template selector: horizontal tab row, each tab is a card thumbnail (preview)
- Selected template: `border: glass.borderAccent`, `shadow.glow`
- Field mapping panel: left side — maps data fields to template slots
- Preview: right side — shows populated template
- This is the one place a simplified code/JSON editor may appear — use mono font,
  `bgCanvas` background, `borderMedium`, `radius.md`

## Integrations Panel
- Grid: `repeat(auto-fill, minmax(240px, 1fr))`
- Integration card: logo + name + description + [Connect] / [Connected ✓] button
- Connected state: [Connected ✓] secondary button with `color.positive` icon
- Not connected: [Connect] ghost button
- "Coming soon" integrations: `color.textMuted`, `opacity: 0.5`, no button

## Dangerous Actions (e.g. delete account, reset data)
- Isolated at bottom of relevant settings section
- Separated by a `borderSubtle` divider with label "Danger Zone"
- Label: `color.negative`, `font.sizeSm`, `font.weightMedium`, `tracking.wide`, uppercase
- Actions: danger button variant only (from root button rules)
- Always require a confirmation modal before executing:
  Modal: glass card, `radius.xl`, type-to-confirm input pattern
