# Zorq Visual Design Decision Record

**Status:** Awaiting operator reference image.  
**Design source:** `docs/design/reference/` (operator-supplied; do not fetch, generate or substitute).  
**Approval loop:** Waived. See `docs/DESIGN_APPROVAL.md`.

## Reference

| Item | Value |
|---|---|
| Reference image path | `docs/design/reference/` — currently missing; operator supply required before Phase 7 |
| Reference author/source | Operator-supplied |
| Date received | Not yet received |
| Screens/states covered | To be recorded at Phase 6 handoff |
| Screens/states not covered | To be recorded at Phase 6 handoff; propose an extension here and proceed |

## What was adopted verbatim

To be recorded in Phase 6/7 after the reference is supplied. Record only visual attributes: composition, navigation hierarchy, spacing rhythm, typography feel, colour treatment, density, surface treatment, motion and status presentation.

## What was adapted

To be recorded in Phase 6/7. For each adaptation, state the reference attribute, the product constraint that required adaptation, and the resulting Zorq-specific treatment. Do not copy protected logos, proprietary artwork, presenter likeness or exact branded compositions.

## What remained product-specific

- Zorq's route structure, role model, license lifecycle, authorization snapshots and all interaction behaviour stay exactly as specified in `PROJECT_SPEC.md`.
- Data-visibility rules, permission boundaries, API schemas, contract interactions and state transitions are not changed by visual work.
- Synthetic-demo and testnet-only disclosures remain visible.
- Accessibility, keyboard operation, focus visibility, reduced-motion support and responsive behaviour remain mandatory.

## Screen and state coverage

| Screen/state class | Covered by reference? | Notes/extension |
|---|---|---|
| Landing page | To be recorded | — |
| App overview/dashboard | To be recorded | — |
| Asset list, registration and detail | To be recorded | — |
| Job list, creation and detail | To be recorded | — |
| License list and detail/revocation confirmation | To be recorded | — |
| Run dashboard, rounds and authorization evidence | To be recorded | — |
| Wallet connect, wrong chain, transaction pending/failed/success | To be recorded | — |
| Loading, empty, validation, error, permission-denied and not-found | To be recorded | — |
| Desktop, tablet and mobile layouts | To be recorded | — |

If the reference does not cover a primary screen or state, the agent proposes an extension in this table that stays within the frozen product behaviour and proceeds. No mockup or approval round is required.

## Visual implementation notes

- Phase 7 installs Stageshow only for composition, motion, density and faux-product-UI polish consistent with the reference: `npx skills add benjitaylor/skills --skill stageshow`.
- Stageshow must not override the reference direction or introduce behaviour changes.
- If the reference implies a feature the product does not have, record the gap here and implement the closest behaviour-consistent equivalent.
- If no behaviour-consistent equivalent exists, stop and report the specific blocker under `AGENTS.md` §1.1 and §8.

## Approval record

Not applicable. The mockup and approval loop is covered by the operator waiver. This document is a reference-and-adaptation record, not an approval artifact.
