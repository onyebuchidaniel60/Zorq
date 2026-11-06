# Zorq Visual Design Decision Record

**Status:** Implemented from operator-supplied references.
**Design source:** `docs/design/reference/reference1.webp` and `reference2.webp`.
**Approval loop:** Waived. See `docs/DESIGN_APPROVAL.md`.

## Reference inventory

| Item | Value |
|---|---|
| Reference image 1 | `docs/design/reference/reference1.webp` — full desktop dashboard, 16:9 |
| Reference image 2 | `docs/design/reference/reference2.webp` — close-up of the right-hand card stack |
| Relationship | Image 1 sets composition and hierarchy; image 2 defines surface, spacing, type scale and control treatment at detail level |
| Precedence if they conflict | Image 2 wins for component-level treatment (radii, spacing, type weight, pill/button shapes); image 1 wins for page composition and navigation |
| Date received | Supplied before Phase 1; applied in Phase 7 |

## What was adopted

- Light warm-grey page background with large white surfaces and generous `28px`-class corner radii.
- Thin, icon-only left navigation rail; small black circular brand mark; content starts in a wide card column.
- Black primary pill action; pale grey secondary pills; mint-tinted status chips for healthy/positive states.
- Quiet typography: near-black headings with tight tracking, small muted labels with wide tracking, restrained body copy.
- Dashboard composition: a wide primary card, a stack of narrower cards on the right, large numeric values, subtle divider lines and a vertical rhythm built from 20–24px gaps.
- Card-internal rows with a label, muted metadata, and a right-aligned value or action.
- Rounded profile/session surface in the header area; compact icon controls.

## What was adapted

- The reference is a fitness/profile dashboard. Zorq maps its composition to authorization: assets, jobs, licenses and run snapshots replace health metrics and goals.
- Health toggles and target rows become license/state actions and round-status rows.
- The reference's photographic profile is replaced with a wallet identity chip and connection state; no personal likeness is copied.
- The black brand mark is Zorq's own "Z" mark, not the reference logo.
- Tables collapse to stacked cards on mobile; the reference only shows desktop.
- Added explicit testnet/synthetic-data disclosure, which the reference does not contain.
- Motion is limited to short hover translation and colour transitions; reduced-motion is respected.

## What remained product-specific

- Route structure, role model, license lifecycle, authorization snapshots, permissions and all interaction behaviour remain exactly as specified in `PROJECT_SPEC.md`.
- No reference feature was invented as a product capability. The UI only exposes implemented APIs; incomplete actions remain labelled.
- Synthetic-demo and testnet-only disclosures remain visible.
- Accessibility, keyboard operation, focus visibility, reduced-motion support and responsive behaviour remain mandatory.

## Screen and state coverage

| Screen/state class | Covered by reference? | Notes/extension |
|---|---|---|
| Landing page | Composition only | Extended with Zorq proposition, testnet disclosure and three summary stats |
| App overview/dashboard | Yes — primary reference screen | Mapped to asset/job/license/run summary cards and recent runs |
| Asset list, registration and detail | Partial — list/detail card language | Extended with owner-only metadata and on-chain evidence |
| Job list, creation and detail | Partial | Extended with purpose/model commitments and creator controls |
| License list and detail/revocation | Partial | Extended with validity windows, soulbound notice and terminal revocation |
| Run dashboard, rounds and authorization evidence | Not covered | Extended with a round timeline, snapshot block evidence and allow/deny chips |
| Wallet connect, wrong chain, transaction pending/failed/success | Not covered | Extended with a compact session surface and explicit pending/error copy |
| Loading, empty, validation, error, permission-denied and not-found | Not covered | Extended with white card states consistent with the reference |
| Desktop, tablet and mobile layouts | Desktop only | Tablet/mobile use stacked cards, a horizontal nav and full-width controls |

## Visual implementation notes

- Phase 7 installed and used the Stageshow skill for composition and faux-product-UI polish only.
- Reference imagery was not copied; no footage, logos, likeness or verbatim text is reused.
- The implementation uses system fonts, CSS gradients and simple SVG icons; it introduces no remote asset or tracking dependency.
- If the reference implied a feature the product does not have, the closest behaviour-consistent equivalent was implemented and recorded above.
