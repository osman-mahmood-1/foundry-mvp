# Surface: Admin Portal
# Read alongside root SKILL.md — all token values defined there.

## Purpose
Internal-only surface for the platform operator (you / the product team).
Used to: manage user accounts, monitor platform health, handle support tickets,
review billing, and manage feature flags. Dense data, power-user oriented.
No decorative hero elements — function-first.

## Layout

```
SIDEBAR (220px) — same shell as main dashboard
  ├── Users
  ├── Billing
  ├── Platform Health
  ├── Support Queue
  ├── Feature Flags
  └── Audit Log

TOP BAR — adds: [Admin Mode] pill badge (warning colour) to distinguish from user app

MAIN CONTENT — full width (no right panel)
  └── All sections full-width within max-content 1440px
```

## Admin-Specific Badge
- Top bar contains: `color.warning` background pill, "Admin" text, `font.sizeXs`,
  `font.weightMedium` — always visible so admins know which mode they're in

## Users Table
- Columns: ID | Name | Email | Plan | Joined | Last Active | Status | Actions
- Sortable columns: chevron icon, `color.textMuted`, active sort: `accentPrimary`
- Search + filter row above table: inputs follow standard input rules
- Bulk action bar: slides in above table when rows selected, glass card style,
  shows: "X users selected" + [Export] [Suspend] [Delete] buttons
- Pagination: numeric, not "load more"

## Platform Health
- KPI row: Active Users (30d) | MRR | Churn Rate | Support Open Tickets
- System status cards: each service (API, DB, Storage, Email) — status dot + uptime %
- No charts unless uptime history is added — keep this surface dense and scannable

## Support Queue
- Ticket list: Priority (badge) | Subject | Requester | Created | Status | Assignee
- Priority colours: High=negative, Medium=warning, Low=neutral — badge variant
- Clicking a row expands inline (not navigate away) to show ticket thread

## Feature Flags
- Table: Flag Name | Description | Enabled (toggle) | % Rollout | Last Modified
- Toggle: pill switch, ON=`accentPrimary` fill, OFF=`bgSubtle` fill
- % Rollout: progress bar, `accentPrimaryMuted` fill, `borderMedium` track

## Audit Log
- Read-only, no actions
- Columns: Timestamp | Actor | Action | Entity | IP
- Timestamp + IP: `font.mono`, `font.sizeXs`
- Monospaced columns ensure scannable alignment
- Filter by: date range, actor, action type — standard inputs

## Data Density Note
Admin portal intentionally uses slightly tighter spacing than the user dashboard:
- Table row height: 40px (vs 48px in user dashboard)
- Card padding: `space.md` (16px) internal (vs `space.lg` 24px)
- Section gap: `space.xl` (32px) — same as user dashboard
- These are the only spacing exceptions permitted — document them with a comment
