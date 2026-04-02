# Surface: Client Portal
# Read alongside root SKILL.md — all token values defined there.

## Purpose
A separate, limited view for the sole trader's clients. A client logs in to:
view their invoices, download statements, track payment status, and message the trader.
It must feel like the same platform but scoped — no financial internals exposed.

## Key Differences from Main Dashboard
- No sidebar navigation — top nav only (simpler, client-facing)
- No income/expense charts (those are trader-internal)
- Branding: platform branding + trader's business name prominent
- Right panel replaced by: contact card for the trader

## Layout

```
TOP BAR (56px sticky)
  └── [Trader Logo / Business Name] ──── [Portal label "Client Portal"] ── [Avatar / logout]

PAGE CONTENT (no sidebar — full width with max-width 1080px centred)

  SECTION 1: Welcome banner
  SECTION 2: Invoice Summary KPI row (3 cards)
  SECTION 3: Invoice List (full-width table)
  SECTION 4: Document Downloads
  SECTION 5: Messages (if enabled)
```

## Welcome Banner
- Background: glass card, `border: glass.borderAccent` — warm welcome tone
- "Hello, [Client Name]" — `font.sizeXl`, `font.weightSemiBold`
- Trader business name + contact — `font.sizeMd`, `color.textSecondary`
- Last login timestamp — `font.sizeXs`, `font.mono`, `color.textMuted`

## Invoice Summary KPI Row — 3 Cards
- Total Invoiced | Amount Paid | Outstanding
- Same card construction as dashboard hero KPIs
- Outstanding card: `border: 1px solid rgba(color.warning, 0.30)` if > 0

## Invoice Table
- Columns: Invoice # | Date | Due Date | Description | Amount | Status | Actions
- Invoice #: `font.mono`, `color.accentPrimary` — clickable link style
- Amount: `font.mono`, right-aligned
- Status badge: Paid (positive), Overdue (negative), Pending (warning), Draft (neutral)
- Actions: [View] ghost button + [Download PDF] ghost button — always visible, not on hover
  (clients are less technical — don't hide actions)

## Document Downloads
- Simple list: Statement of account (PDF), individual invoice PDFs
- Each row: file icon + filename + date generated + [Download] ghost button
- Never expose internal file paths or system names

## Messages Panel (if trader enables it)
- Simple thread view — not a full chat product
- Client message bubble: right-aligned, `glass.bgStrong`
- Trader reply: left-aligned, `accentPrimaryMuted` background
- Input: standard input field + [Send] primary CTA
- Font throughout: `font.sizeMd`, `lineBody`

## Access Rules (UI should communicate these)
- Client sees ONLY their own invoices — never another client's data
- No financial summary charts
- "Settings" link is absent from this portal
- Session timeout warning: toast notification at T-5 minutes
