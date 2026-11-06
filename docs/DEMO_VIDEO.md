# Zorq Demo Video Specification

**Authority:** This document is the authoritative specification for the Zorq demo video. It applies to the Phase 5.5 first-pass video (optional if the deadline is tight) and the Phase 10 final video.

## Hard limits

- **Maximum length: 3:00 (three minutes).** A video longer than 3:00 fails the gate.
- **Voice:** free Google AI Studio Gemini native speech / text-to-speech, realistic male voice. Suggested voices: **Charon** (informative, clear) or **Orus** (firm, decisive). **Puck** only if the tone fits. No cloned voices. No paid tiers.
- **Presenter identity:** no name, no “I am [name]”, and no personal pronouns tied to a real person. Use neutral third-person or “this project” framing.
- **No narration/visual drift:** narration is generated from the same step timeline that drives the Playwright capture. If a narration line runs long, time the UI action to it.
- **No dead air:** no pause longer than 1.2 seconds without narration or a visible action; cuts at 0.4 seconds or shorter; no dead air at the start or end.
- **No undemonstrable claim:** every scripted claim must be visible or verifiable in the recording.
- **No hex recital:** narration refers to the deployed contract, deployer wallet and contract state contextually. Long hex addresses, transaction hashes, block heights and long numeric IDs are shown on screen, not spelled aloud.

## Narration and sync model

The source of truth is one checked-in step timeline. The timeline drives both:

1. the Playwright browser actions and screen capture; and
2. the narration line timing and TTS generation.

Speech and action therefore cannot drift independently. If a narration line is longer than its planned action window, extend the action or slow the UI interaction to match the narration; do not speed up or cut the audio arbitrarily.

## Structure target (~2:02)

| Time | Segment | Content |
|---|---|---|
| 0:00–0:14 | Problem | Why broad, indefinite data access blocks collaborative ML. |
| 0:14–0:40 | Product one-liner + license primitive | Zorq's job-specific, time-bounded, non-transferable DataLicense and what it binds. |
| 0:40–1:10 | Live demo | Asset -> job -> license -> three-round FL run -> revoke -> next-round exclusion. |
| 1:10–1:37 | Architecture and Portaldot-native evidence | The deployed contract, authoritative chain state and the round snapshot boundary. |
| 1:37–1:54 | Differentiator + limitations | Execution-scoped authorization, fail-closed snapshots, Flower demo adapter, synthetic data, no native FL/ZKP claim. |
| 1:54–2:02 | Close + repo/docs | What Zorq is, where the repository and documentation are, and the testnet-only status. |

The target is approximately 2:02, leaving ample headroom below the hard 3:00 limit.

## Hackathon alignment

Every scripted claim maps to a judging criterion:

| Judging criterion | What the video must show |
|---|---|
| Technical Feasibility | Working wallet flow, deployed contract, real transactions, three completed FL rounds, reproducible tests. |
| Innovation | The DataLicense as an execution-scoped authorization primitive, not a generic access token; round-level snapshots and post-snapshot revocation semantics. |
| Application Value | The asset -> job -> license -> run -> revoke workflow and the concrete problem it solves for data owners and researchers. |
| Portaldot native deployment | Live chain ID `420420777`, contract address, transaction hash and round snapshot block visible in the recording. |

No claim may exceed what the recording demonstrates. If a feature is incomplete, say so plainly and show the limitation.

## Prohibited content

- Real names, personal email addresses, private keys, seed phrases, API keys, tokens or credentials.
- Unverified claims of native Portaldot FL, ZKP, HE, differential privacy or secure aggregation.
- Fabricated metrics, participant counts, customers, partners, benchmarks or adoption.
- Stock footage or imagery implying real customers, hospitals, banks or production deployments.
- Copied footage, music, logos, presenter likeness or verbatim narration from the operator reference video.
- A presenter name, persona or first-person biography.

## Tooling and repository artifacts

- **Playwright** for deterministic browser capture.
- **ffmpeg** for muxing, trimming and encoding.
- **Google AI Studio** free tier for Gemini native speech / TTS.
- Checked-in `docs/demo/narration.md` and `docs/demo/timeline.json`.
- Automation scripts under `scripts/demo-video/`.
- The final video file committed under `docs/demo/` or linked from `README.md` with a stable repository path.
- `docs/demo/REFERENCE_NOTES.md` recording any reference-video review.

Scripts must be idempotent and re-runnable. Re-running a script must reproduce the same timeline and output structure without manual steps.

## Operator reference video

The operator may supply a reference video at `docs/demo/reference/`.

- The reference is committed by the operator. The agent does not fetch, scrape, download or generate it.
- The agent extracts **structural patterns only**: scene order, pacing, transition style, on-screen text density, voice tone, and presence/absence of music.
- The agent records adopted and rejected attributes in `docs/demo/REFERENCE_NOTES.md` before scripting.
- **Prohibited:** copying footage, music, logos, presenter likeness or verbatim narration from the reference.
- **Precedence:** the hard limits in this document (<= 3:00, free Google AI Studio male voice, no presenter name, judging-criteria alignment) override the reference in every conflict.
- **Absence:** if no reference video is present when Phase 5.5 or Phase 10 begins, proceed using this document alone and note the absence in the phase report.
- **Empty directory:** if `docs/demo/reference/` exists but is empty, record it as “pending operator supply”; do not treat empty as “no reference expected.”

## Final gate

The video passes only when all of the following are true:

- [ ] Duration <= 3:00.
- [ ] Free Google AI Studio male voice, with no cloned voice and no paid tier.
- [ ] No presenter name or personal identity.
- [ ] Narration and visuals are driven by the same timeline with no drift.
- [ ] No pause > 1.2s without narration or visible action; no dead air at start or end.
- [ ] Every on-screen claim is verifiable in the recording.
- [ ] Chain ID, contract address, transaction and snapshot block evidence are visible where claimed.
- [ ] Narration does not spell out long hex, block heights or long numeric IDs.
- [ ] No prohibited content or copied reference material.
- [ ] Reproducible from `scripts/demo-video/`.
- [ ] `docs/demo/narration.md`, `docs/demo/timeline.json` and `docs/demo/REFERENCE_NOTES.md` are present (or the absence is recorded).
