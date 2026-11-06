# Zorq Visual Design Decision Record

**Status:** Final polish implemented from operator-supplied references.
**Primary design source:** `docs/design/reference/reference3.webp`.
**Supporting context:** `docs/design/reference/reference1.webp` and `reference2.webp`.
**Approval loop:** Waived. See `docs/DESIGN_APPROVAL.md`.

## Reference inventory

| Item | Value |
|---|---|
| Reference image 1 | `docs/design/reference/reference1.webp` — earlier light dashboard composition |
| Reference image 2 | `docs/design/reference/reference2.webp` — close-up of light card surfaces and controls |
| Reference image 3 | `docs/design/reference/reference3.webp` — definitive dark dashboard with lime accent |
| Precedence | Image 3 is the primary source of truth. Images 1 and 2 are context for density, radii and card composition. |
| Date received | Image 3 supplied during final polish; applied as a full visual overhaul. |

## What was adopted

- Near-black dashboard canvas with a soft lime outer field and a subtle dot grid.
- One strong acid-lime accent (`#d9ff63`) used for primary actions, active navigation, key metrics and status.
- Compact left icon rail, top dashboard bar, date/status controls and a wallet identity chip.
- Large dashboard greeting, three lime metric cards and a quieter fourth metric.
- Rounded 16–28px surfaces with restrained borders; depth from surface steps rather than heavy shadows.
- Dense but legible data tables, row lists, status pills, monospace identifiers and small uppercase labels.
- Muted olive-gray secondary text and one clear accent per view.
- Public pages reuse the same language: lime ground, near-black content cards, lime links and a dark footer.

## What was adapted

- The reference is a security-operations dashboard. Zorq maps its composition to authorization: assets, jobs, licenses, round snapshots and network state.
- Charts in the reference become real round-progress and snapshot evidence; no fabricated chart data was introduced.
- The reference's alert queue becomes the recent-runs table and participant lists.
- The profile/avatar becomes a wallet identity chip; no personal likeness is copied.
- The reference logo is replaced by Zorq's own wordmark and “Z” mark.
- Mobile tables collapse their least important columns and keep the primary link on the first cell.
- Testnet, synthetic-data and no-native-FL/ZKP disclosures remain visible.

## Stageshow execution notes

- Applied Stageshow's craft rules: one neutral family plus one accent, clear hierarchy, restrained real strings, consistent icon family at one stroke weight, 12px insets, aligned values, no empty bands, no placeholder-looking controls.
- Stageshow's faux-UI kit was not copied into the product; the live app uses its own React components and CSS tokens.
- The reference imagery, logos, likeness and verbatim text were not copied.

## What remained product-specific

- All routes, permissions, license lifecycle, authorization snapshots, API calls, contract interactions and database schemas are unchanged.
- The UI only exposes implemented behavior; no reference feature was invented as a product capability.
- Empty, loading, error, permission-denied and not-found states use the same visual system.
- Keyboard access, focus visibility, reduced-motion support and semantic structure remain mandatory.

## Screen and state coverage

| Screen/state | Reference coverage | Notes |
|---|---|---|
| Landing | Composition and palette | Dark hero, lime stat cards, license binding card |
| App overview | Primary reference screen | Greeting, three lime stats, round activity, recent runs, network card |
| Assets | Table language | Portfolio table, partition states, owner-only metadata |
| Jobs | Table language | Job registry, status, window, cohort, detail actions |
| Licenses | Table language | Token state, validity, revision, revocation detail |
| Run monitor | Extended | Round progress, snapshot blocks, allow/deny evidence, final hash |
| Forms | Component language | Dark fields, inline help, readable empty/error/rejection states |
| Wallet | Top-bar identity | Connect, sign-in, signed-in and error states |
| Public docs/legal | Palette only | Dark document cards on lime ground, readable headers |
| Loading/error/404 | Extended | Same card and lime system |
| Mobile | Not covered | Stacked cards, compact table columns, horizontal nav |
