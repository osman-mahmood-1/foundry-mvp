# Surface: Overview Dashboard
# Read alongside root SKILL.md — all token values defined there.

## Purpose
The primary authenticated view. A sole trader's financial command centre.
Shows: cash position, income vs expenses, recent transactions, upcoming obligations.

## Layout

```
TOP BAR (sticky, 56px)
  └── [Logo] [Page title] ────────────── [Search] [Notifications] [Avatar]

BODY (sidebar 220px | content flex-grows | right panel 300px)

LEFT SIDEBAR
  ├── Nav: Overview (active), Transactions, Invoices, Clients,
  │         Expenses, Reports, Settings
  ├── [Account selector] — current business account
  └── [Upgrade CTA] if on free tier — bottom pinned

MAIN CONTENT (padding 32px 40px, max-width 1440px)
  ├── SECTION 1: Hero KPI Row (always first)
  │     └── 4 cards: Total Balance | Monthly Income | Monthly Expenses | Net Profit
  │
  ├── SECTION 2: Chart Row (2fr left | 1fr right)
  │     ├── LEFT: Cash flow chart (line, 6-month rolling)
  │     └── RIGHT: Expense breakdown (donut / ring chart)
  │
  ├── SECTION 3: Secondary Metrics Row
  │     └── 3 cards: Outstanding Invoices | Overdue | Upcoming Tax
  │
  └── SECTION 4: Recent Transactions (full-width table)

RIGHT PANEL (300px, sticky scroll)
  ├── Quick Actions (raise invoice, log expense, add client)
  └── Upcoming Events (VAT due, payment due dates)
```

## Component Specs

### Hero KPI Cards
- Grid: `repeat(4, 1fr)` — always 4, never auto-fit (prevents reflow)
- Each card:
  - Label: `font.sizeSm`, `font.weightMedium`, `color.textSecondary`, ALL CAPS, `tracking.wide`
  - Amount: `font.size2xl` (40px), `font.mono`, `font.weightLight`, `color.textPrimary`,
    `tracking.tight` — this number must command the card
  - Delta below amount: badge component (positive/negative rules from root)
  - Subtle icon top-right: 20px, `color.textMuted`
- Card hover: `shadow.md` from `shadow.sm`, transition `motion.default`

**Chromatic assignments (fixed, semantic — see Section 9 of root SKILL.md):**
- Card 1 — Total Balance: `card--gold` → glow source top-right
- Card 2 — Monthly Income: `card--cyan` → glow source bottom-right
- Card 3 — Monthly Expenses: `card--ember` → glow source top-left
- Card 4 — Net Profit: `card--jade` → glow source top-right

These four are the ONLY chromatic cards on the dashboard.
Total Balance card also retains `border: glass.borderAccent` — the chromatic
glow is additive, not a replacement for the accent border treatment.

### Cash Flow Chart
- Title row: card title left, period selector right (Last 3M / 6M / 12M / YTD)
- Chart: dual-line (Income vs Expenses), series 1 = `chart[0]` cyan, series 2 = `chart[4]` rose
- Fill under each line: `gradient.chartCyan` / `gradient.chartNegative`
- X-axis: `font.sizeXs`, `color.textMuted`
- Y-axis: `font.sizeXs`, `font.mono`, `color.textMuted`
- Tooltip: glass card construction, shows exact values in `font.mono`
- No chart borders/gridlines except horizontal dashed `borderSubtle`

### Expense Breakdown (Ring Chart)
- Donut / ring, 60% inner radius (enough space for centre label)
- Centre label: category name `font.sizeSm` + amount `font.sizeLg font.mono`
- Legend below: dot + label + amount, right-aligned amount in `font.mono`
- Colours: consume `color.chart` array in order, max 5 segments, 6th = "Other"

### Secondary Metric Cards
- Smaller than hero — `font.sizeXl` for number, not `size2xl`
- Outstanding Invoices: neutral styling
- Overdue: `border: 1px solid rgba(color.negative, 0.30)` — visual urgency signal
- Upcoming Tax: `border: 1px solid rgba(color.warning, 0.30)`

### Recent Transactions Table
- Full-width card container
- Columns: Date | Description | Category | Amount | Status
- Date: `font.sizeXs`, `font.mono`, `color.textMuted`
- Description: `font.sizeMd`, `color.textPrimary`, truncate with ellipsis at 280px
- Category: badge component (neutral variant)
- Amount: `font.sizeMd`, `font.mono`, right-aligned
  - Credit (income): `color.positive`
  - Debit (expense): `color.textPrimary` — NOT red; red is for anomalies only
- Status: status dot + badge (Cleared / Pending / Reconciled)
- Row hover: `bg.bgSubtle`, transition `motion.fast`
- Load more: ghost button, centred, below table

### Right Panel — Quick Actions
- 3 action buttons stacked: "New Invoice", "Log Expense", "Add Client"
- Primary button style for "New Invoice", secondary for others
- Section title: ALL CAPS label style

### Right Panel — Upcoming Events
- Timeline list, items sorted ascending by date
- Each item: coloured left border (3px, `accentPrimary` / `warning` / `negative`)
- Event name: `font.sizeSm`, `color.textPrimary`
- Date: `font.sizeXs`, `font.mono`, `color.textSecondary`
- Amount (if applicable): `font.sizeSm`, `font.mono`, right-aligned
