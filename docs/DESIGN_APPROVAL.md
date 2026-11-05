# Zorq Final UI Design — Waiver Record

**Status:** WAIVED — no mockup or design-approval loop applies.

## Waiver

The operator explicitly granted a waiver of the mockup and approval loop for the Zorq MVP.

- The design source is the operator-supplied reference image committed under `docs/design/reference/`.
- No mockups are produced for approval.
- No approval is required to enter Phase 7.
- Phase 7 implements the reference image directly with the Stageshow skill.
- The agent records the reference, the adopted attributes, the adapted attributes and any uncovered screens/states in `docs/DESIGN_DECISIONS.md`.

## Behaviour and architecture boundary

The waiver covers visual direction only. It does not authorize product-behaviour, API, data-model, permission or architecture changes.

- Visual-only adaptations are logged in `docs/DESIGN_DECISIONS.md` and `AI_HANDOFF.md`'s Decision Log, and the agent continues.
- If the reference image cannot be implemented without a product-behaviour, API, data-model, permission or architecture change, the agent records the gap and implements the closest behaviour-consistent equivalent.
- If no behaviour-consistent equivalent exists, the agent stops and reports the specific blocker under `AGENTS.md` §1.1 and §8.

## Record

| Item | Value |
|---|---|
| Mockup production | Waived by the operator |
| Approval loop | Waived by the operator |
| Design source | Operator-supplied reference image in `docs/design/reference/` |
| Phase 7 entry | No approval required |
| Visual deviations | Recorded in `docs/DESIGN_DECISIONS.md` |
| Behaviour/API/architecture changes | Not authorized by this waiver; log and continue with the closest behaviour-consistent equivalent, or stop if none exists |
