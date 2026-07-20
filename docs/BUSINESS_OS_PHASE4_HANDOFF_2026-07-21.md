# Ta Panda Business OS — Phase 4 Session Handoff (2026-07-21)

**Purpose:** everything built, decided, and verified in the 2026-07-21 session, so a fresh session (or a future me) can resume without re-deriving it. Read alongside `docs/BUSINESS_OS_ARCHITECTURE_AND_HANDOFF_2026-07-20.md` (the Phase 3 handoff — frontend structure, bugs fixed, file layout) — this doc picks up exactly where that one left off.

**Status at end of session:** Phase 4 is built, committed, pushed, and the new n8n workflow is active. The gateway is live and serving real data. Write actions (approve/reject/edit/reschedule) are implemented and unit-verified but have **not yet been exercised against a real row** — that's the natural next thing to do together.

---

## 1. What Phase 4 actually is

Phase 3 built all 8 Business OS pages on in-memory mock data. Phase 4's job was wiring them to the real backend described in the companion automation doc (`AUTOMATION_SYSTEM_ARCHITECTURE_2026-07-20.md`, in the separate `Automation_Workspace` repo) — real Google Sheet, real n8n workflows, real Telegram approval flow. The two hard constraints going in:

- **Don't touch WF01–WF07.** They're live production automations running the actual business's content pipeline. Everything new had to be a separate, isolated workflow.
- **The web UI must be a second, equal channel — not a reimplementation.** Any approve/reject/edit from Business OS has to write the *exact same* Status values WF02's Telegram buttons already write, so WF03 onward can't tell (or care) which channel triggered it.

---

## 2. The new n8n workflow: WF08 - Business OS Gateway

**Built via the n8n public API** (the user provided an API key in chat; used only for this session, not stored anywhere in the repo). Workflow id `mOVyBHJYTMKvuHeO`, now **active**.

Before writing a single line of the gateway, the exact real contract was pulled from the actual node JSON of WF01–WF07 (not the simplified diagram in the companion doc) — this resolved two discrepancies flagged in a prior session:

- `Awaiting Approval` and `Edited` **are** real, current, correctly-used states. WF02 itself sets `Awaiting Approval` when it dispatches the Telegram card (not WF01), and `Edited` while a field-edit is mid-flight. Full real state machine:
  ```
  Generated → (WF02 dispatches) → Awaiting Approval → (human) → Approved | Rejected
                                                       ↘ Edited → (field saved) → Generated (loops, re-dispatches)
  Approved → (WF03) → Waiting for Assets → (WF04) → Ready for Publishing
  Ready for Publishing → (WF06 scheduler) → Scheduled → (WF06 cron) → Published
                                                       ↘ Publish Failed → (retry ≤3) → Scheduled (loop)
                                                                        → Publish Failed - Needs Review (terminal)
  ```
- The 3-pillar constraint (*Interior Design Tips & Expert Suggestions* / *Portfolio Presentation* / *Luxury Design Inspiration*) is confirmed live in WF01's actual LLM prompt — historical rows just predate it (2026-07-09).
- WF02's editable fields are exactly `Topic`, `Hook`, `CTA`, `Caption`, `Hashtags` — nothing else.
- Real `Content Type` values are `Static Post` / `Reel` / `Carousel`, not "Static Image" etc.

### Endpoints (both secret-gated via a `?key=` query param — see `os-api.js`)

- **`GET /webhook/bos-content`** — reads all `TPI_Project01_DB` rows, returns them as raw JSON (Sheet headers as keys, no server-side transform). The frontend owns all shape transformation.
- **`POST /webhook/bos-action`** — body `{action, content_id, remarks?, field?, value?, publish_date?, publish_time?}`. Flow: read the current row → validate the requested transition against an explicit allowed-states list (mirrors WF02's own open-states check, so it can't act on a row WF02/WF03/WF06 has already moved past) → write the same literal Status string WF02 writes → respond.
  - `approve` / `reject` / `edit_field` only valid when current Status is `Generated`, `Awaiting Approval`, or `Edited`.
  - `reschedule` only valid when current Status is `Scheduled`, and writes `Publish Date`/`Publish Time` in the exact `DD-Mon-YYYY` / `H:MM AM/PM` format WF06's `Find Due` cron parses with a strict regex — an ISO string would silently make the item never publish.
  - Invalid transitions return 409 with an error message, no write happens.

### CORS approach (worth remembering — non-obvious)

Business OS is a static site with no server of its own, calling a different origin (`automation.tapanda.in`). To avoid CORS headaches without depending on n8n version-specific webhook auth features:
- Secret goes in the **query string**, not a custom header (custom headers force a CORS preflight).
- `POST` body is sent as `Content-Type: text/plain` (JSON content-type also forces preflight; `text/plain` is CORS-"simple").
- A separate `OPTIONS` webhook node on the same path handles the browser's preflight for the POST endpoint anyway, as a belt-and-suspenders measure.
- Every response (including error responses) sets `Access-Control-Allow-Origin: *` — required for the browser to read the response at all, even for "simple" requests.

---

## 3. Frontend changes

- **`os-api.js`** (new) — the only file that touches the network. Fetches from the gateway, transforms raw Sheet rows into the shape pages already expected from Phase 3's mock data, and owns the strict date formatter for reschedule writes.
- **`os-data.js`** (rewritten) — `CONTENT_ITEMS` now loads live via `window.OSData.ready`, a promise every page's `DOMContentLoaded` handler awaits before its first render. `WORKFLOWS` is the real 6 (WF05 was absorbed into WF01 on 2026-07-09) with queue-depth and health **derived from real `CONTENT_ITEMS` counts** — there's no n8n execution-history proxy built yet, so per-run stats (success rate, durations, logs) are honestly omitted rather than fabricated. `ASSETS`/`NOTIFICATIONS`/`ACTIVITY_LOG` are mutated in place (not reassigned) — a real bug caught mid-session: `asset-library.js` captures `const assets = D.ASSETS` once at load time, and reassigning that array after the async fetch would have silently orphaned the reference, permanently showing zero assets.
- **Content Planner / Publishing Calendar** — only actions that exist in the real pipeline are exposed: approve, reject, edit the 5 editable fields, reschedule a `Scheduled` item. Every Phase-3-mock "manual" action that doesn't correspond to anything real (submit, mark-assets-ready, publish-now, unschedule, duplicate, delete) was removed rather than left as a working-but-fake button.
- **Workflow Monitor / Settings** — remapped to the real 6 workflows, real purpose/trigger/integrations text (sourced from the companion doc + direct node inspection, not reinvented).
- **Analytics / Dashboard** — content-mix, platform-mix, and publishing-trend charts compute from real data; metrics with no real source at all (leads generated, approval time, engagement) show "Not tracked" instead of a fabricated number.
- **`os-auth.js`** (new) — password gate on all 8 pages, same pattern as `admin.html`. **Password: `tapanda-os-2026`.**

## 4. Verification done this session

- Structural: n8n accepted the workflow JSON without validation errors (both webhook nodes, all Code/IF/Sheets nodes, all connections).
- Logic: the exact "Find Row & Validate Transition" Code-node logic was dry-run in Python against real sample rows pulled from the live Sheet before the workflow was even created — approve/reject/edit on open-state rows passed, the same actions on `Published`/`Waiting for Assets` rows correctly rejected with 409.
- End-to-end (post-activation, this session): `GET /webhook/bos-content` confirmed live — 35 real rows, correct headers, correct statuses.
- Browser: all 8 pages loaded in a local static-file preview with the gateway *unreachable* (pre-activation) — password gate worked, every page degraded to a clean zeroed state with an error toast, zero unexpected console errors. A simulated write call was confirmed to throw cleanly rather than corrupt local state.
- **Not yet done: a live write** (approve/reject/edit/reschedule) against a real row. Every write actually moves real content through the real pipeline (e.g. approving a `Generated` item triggers WF03 for real, which could cascade to Telegram/WF04), so this was deliberately left for a session where the user is present to pick which real row to test on.

## 5. Known gaps (honest, not hidden)

- **No live n8n execution telemetry.** Workflow Monitor shows real queue depth (derived from Sheet data) but not real success rates / run durations / node-level logs — that would need a second gateway endpoint proxying n8n's own execution API. Not built; scoped as a possible future addition.
- **Prompt Library stays mock.** The real system has no reusable-prompt-template concept (WF03 builds prompts deterministically per item, not from a versioned library) — nothing to wire it to.
- **Some Analytics series are permanently empty by design**: leads generated, approval velocity — no CRM or per-item timestamp history exists to compute them from.
- **Asset Library has no version history / file size / pixel dimensions** — the real system doesn't track any of that per asset, only the URL.

## 6. Two things that needed the user directly

Both were hard-blocked by the Claude Code harness's own safety classifier — independent of in-chat approval, and correctly not routed around via another tool:
1. Activating WF08 in the n8n editor — **done by the user**, confirmed active via API re-check.
2. `git push origin main` — **done by the user**, confirmed `origin/main` matches local `HEAD` at commit `03aa3f6`.

## 7. Where things live

- Gateway workflow: n8n editor at `automation.tapanda.in`, "WF08 - Business OS Gateway", id `mOVyBHJYTMKvuHeO`.
- New frontend files: `os-api.js`, `os-auth.js` (repo root).
- Rewritten: `os-data.js`, `business-os.js`, `dashboard.js`, all of `business-os/*.js`, all 8 `business-os*.html` pages (password gate markup + script tags).
- This doc: `docs/BUSINESS_OS_PHASE4_HANDOFF_2026-07-21.md`.
- Prior handoff (Phase 3 + backend architecture summary): `docs/BUSINESS_OS_ARCHITECTURE_AND_HANDOFF_2026-07-20.md`.
- Commit: `03aa3f6` "Business OS Phase 4: wire the real n8n/Sheets backend", on `main`, pushed.

## 8. Where to pick this up next

1. **First live write test**, together — pick one real `Generated` or `Awaiting Approval` row, approve or reject it from Business OS, confirm the Sheet updates and WF03/Telegram behave as expected.
2. Decide whether the n8n execution-telemetry proxy (real success rates/logs in Workflow Monitor) is worth building.
3. Everything else in the app (Content Planner drag/edit, Publishing Calendar reschedule, Asset Library, Analytics) is ready to use as soon as (1) builds confidence.
