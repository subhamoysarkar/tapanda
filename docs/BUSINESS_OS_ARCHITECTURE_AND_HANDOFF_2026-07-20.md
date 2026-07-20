# Ta Panda Business OS — Session Handoff & Combined Architecture Reference

**Purpose of this document:** everything learned and built in the 2026-07-20 session, consolidated into one file so a fresh session can resume without re-deriving it. Read this alongside the companion doc it references in §7 (the *real* backend architecture, written by/for the automation side of the project).

**Companion doc (read this too, it's the ground truth for the backend):**
`/Users/isense/Documents/Github/Automation_Workspace/TaPanda_DigitalMarketing/docs/AUTOMATION_SYSTEM_ARCHITECTURE_2026-07-20.md`
That doc was compiled by pulling live structure directly from the n8n instance (`automation.tapanda.in`) on 2026-07-20 and is the authoritative source for everything about WF01–WF07. This handoff doc summarizes it in §7–§9 but does not replace it — go back to the original for exact node-level detail.

---

## 1. The two systems in this repo

| | System 01 — Public Website | System 02 — Business OS |
|---|---|---|
| Purpose | Marketing site + portfolio for Ta Panda Innovation LLP (interior design, Kolkata) | Internal operations dashboard for the content/social-media pipeline |
| Stack | Vanilla HTML/CSS/JS | Vanilla HTML/CSS/JS (no framework, by explicit constraint) |
| Backend | Supabase (portfolio gallery data + storage), Google Apps Script (contact/consultation forms) | **None yet** — Phase 3 built the entire frontend on in-memory mock data. Real backend is n8n + Google Sheets (§7), not Supabase. |
| Key files | `index.html`, `script.js`, `styles.css`, `admin.html`/`admin.js` (password-gated gallery CRM), `supabase-client.js` | `business-os.html` + `business-os/*` (see §2) |
| Status | Live at tapanda.in | Frontend complete (Phase 3), not wired to any backend (Phase 4 not started) |

**Do not confuse the two.** Supabase belongs only to System 01. The Business OS's real backend is the n8n/Google Sheets system in §7 — this was a live back-and-forth correction in this session; don't reintroduce Supabase for Business OS.

---

## 2. Business OS: file structure & URL hierarchy

Deployed as a static site at the repo root (custom domain via `CNAME`, so root-relative paths like `/business-os.css` resolve correctly in production).

```
business-os.html          ← Dashboard, stays at domain root: https://tapanda.in/business-os.html
business-os.css           ← shared design system (~1300 lines)
business-os.js            ← shared chrome: sidebar, header, toasts, modals, drawer, command palette,
                             notifications, global search, skeleton loader, KPI/activity/workflow-health renderers
os-data.js                ← centralized MOCK data layer (see §3) — this is what Phase 4 replaces
charts.js                 ← hand-rolled SVG chart renderers (line/bar/hbar/donut/radial/heatmap), zero deps
dashboard.js               ← Dashboard page logic

business-os/               ← every other page, https://tapanda.in/business-os/<name>.html
  content-planner.{html,css,js}
  publishing-calendar.{html,css,js}
  asset-library.{html,css,js}
  workflow-monitor.{html,css,js}
  analytics.{html,css,js}
  prompt-library.{html,css,js}
  settings.{html,css,js}
```

**Path convention (important, don't regress this):** every cross-file reference — sidebar hrefs, the logo/favicon, shared CSS/JS `<script>`/`<link>` tags, `os-data.js`'s asset URLs, `business-os.js`'s command-palette `PAGES` array and search targets — uses **root-relative absolute paths** (leading `/`), so they resolve identically regardless of a page's folder depth. Page-owned CSS/JS (e.g. `content-planner.css`) stays same-directory relative since it moves with its HTML. Verified via a full network-request sweep: zero 404s across all 8 pages.

All 8 pages share **byte-identical sidebar/header markup** (differing only by `<body data-page="...">`, which drives active-nav-state and the command palette via JS, not hand-set classes).

---

## 3. Business OS: shared design system

- **`os-data.js`** — the mock data layer. Structured *deliberately* to mirror what a real API response would look like (`WORKFLOWS`, `CONTENT_ITEMS`, `ASSETS`, `PROMPTS`, `NOTIFICATIONS`, `ACTIVITY_LOG`, `ANALYTICS`, plus shared lookup registries `STATUS_META`/`TYPE_META`/`KPI_DEFS`/`STATUS_COLUMNS` and getters like `getCounts()`/`getWorkflow()`/`getContentItem()`). Phase 4's main job is swapping the bodies of these for real reads — see §9.
- **`charts.js`** — `OSCharts.{line, bar, hbar, donut, radial, heatmap}`. No charting library; per explicit constraint (no React/Vue/Next either — pure vanilla throughout).
- **`business-os.css`/`business-os.js`** — shared chrome used by every page: toast system, generic modal, generic slide-over drawer (`os-drawer`), Cmd/Ctrl+K command palette, notifications panel, global header search, skeleton loading overlay, empty states, tabs/segmented controls, KPI card renderer (`OS.renderKPICards`), activity list renderer (`OS.renderActivityList`), workflow health grid renderer (`OS.renderWorkflowHealthGrid`), a live system-status pill in the header (reflects `WORKFLOWS` health), and a Quick Create modal (injected by JS, not duplicated per-page HTML).

---

## 4. Business OS: the 8 pages (what's built, all still mock data)

1. **Dashboard** (`business-os.html`) — KPI strip, production pipeline visual, workflow health grid, recent activity, mini calendar, 4 SVG charts, Error Centre, System Health widget, Quick Actions.
2. **Content Planner** — Kanban board (7 columns), **fully functional drag-and-drop** between columns (mutates in-memory array, not persisted), filters (status/type/pillar/platform/priority/search), calendar + "planned until" countdown, item details drawer.
3. **Publishing Calendar** — Month/Week/Agenda views, **functional drag-to-reschedule**, content-gap detection (flags empty days in next 14), publishing heat map (13 weeks), Today's Schedule + Upcoming Queue rails.
4. **Asset Library** — Gallery/Grid/List views, type-aware previews (video play overlay, carousel slide count + built-in slide viewer), filter/search, version history, "Used In" links, upload dropzone (UI-only placeholder).
5. **Workflow Monitor** — one live-styled card per workflow (currently modeled as generic WF01–WF07; **needs remapping to the real 6 active workflows in §7**, since WF05 was deleted and the real system only has 6, not 7), success-rate ring, execution timeline, log console, "Connect Live Webhook" (disabled, Phase 4 placeholder).
6. **Analytics** — KPI strip, 7/30/90-day range switcher, 8 chart widgets, all hand-built SVG.
7. **Prompt Library** — 9 prompt categories, version history, **side-by-side version comparison modal**, editable notes.
8. **Settings** — 11 tabs (System/Publishing/Brand/AI/Workflow/Notifications/Integrations/API Keys/Users/Appearance/Multi-Company). Workflow tab currently lists 7 mock workflows — same remapping note as #5.

**Global features implemented:** dark/light theme toggle (persisted via `localStorage`), collapsible sidebar, mobile-responsive with a hamburger menu (see bug #3 below), Cmd/Ctrl+K command palette, global search, toasts, skeleton loading, "Coming Soon" nav section for 6 unbuilt future modules (Lead Engine, Email Marketing, Competitor Intel, Project Management, CRM, Finance).

---

## 5. Bugs found and fixed this session (don't reintroduce)

1. **Wrong icon reused for "Approved"/"Published"/"Generate Strategy"** — the original hand-built mockup I inherited used a dollar-sign SVG path for all three (copy-paste artifact). Replaced with a thumbs-up, a paper-plane, and a lightning-bolt icon respectively.
2. **Shared drawer/accordion classes (`cp-detail-row`, `cp-accordion`, `cp-media-preview`, `cp-asset-block`) were only defined in `content-planner.css`**, so they rendered broken (huge unstyled SVG chevrons, no grid layout) on every other page that reused them (Publishing Calendar, Asset Library, Workflow Monitor, Prompt Library). Fixed by promoting them into the shared `business-os.css`.
3. **Mobile: the sidebar's own toggle button was hidden off-canvas along with the sidebar**, so there was no way to open it on a phone. Fixed by adding a header-level `mobileMenuBtn` (visible only ≤768px) — then fixed a follow-on bug where the existing "click outside closes sidebar" handler didn't know about the new button and closed the sidebar on the same tap that opened it.
4. **Publishing Calendar had a horizontal overflow bug** in the month/week CSS grids — fixed with `min-width: 0` on grid children (the classic CSS Grid intrinsic-sizing gotcha).
5. **A stale-cache illusion during dev**: several "bugs" during manual browser verification were actually the preview tab serving a cached copy of `business-os.css`/`.js` after edits — not real bugs. Worth remembering if verification ever seems inconsistent with the source.

---

## 6. Deliverables produced this session

- **All 8 Business OS pages**, restructured to the URL hierarchy in §2 (committed: `ef75ac9 "business-os changes"`, on `main`, already pushed).
- **A 10-slide PowerPoint deck** (`Ta-Panda-Business-OS-Phase3-Walkthrough.pptx`, in repo root) — one slide per page pairing a real screenshot with its planned functionality, plus title/closing slides. Committed via PR #1 (`add-business-os-walkthrough-deck` → merged to `main`).
- **Auto-memory files** already saved (independent of this doc, will auto-load in future sessions on this project): `project_backend_architecture.md`, `feedback_security_priority.md`, `MEMORY.md` index, all under `/Users/isense/.claude/projects/-Users-isense-Documents-Github-tapanda/memory/`. This handoff doc is the deliberate, complete version of the same information — treat this file as authoritative if the two ever disagree, since it's newer and more complete.

---

## 7. The real backend (summarized from the companion doc — see that file for full detail)

**No web UI exists today for the content pipeline.** The only human interface is a single Telegram bot/group. **Google Sheet `TPI_Project01_DB` is the single source of truth**; every workflow reads/writes rows there and is triggered by a Sheet change, a Telegram message, or a schedule — not by calling each other's APIs (except 2 internal `executeWorkflow` sub-calls).

**Spreadsheet:** ID `1_EYBVmUvn2miNvr6l0nkTwpKJzLhJHj5ZWr-I3tikxE`, tab `TPI_Project01_DB`, `gid` `851394852`. (This is the same URL the user gave me directly and that I read successfully via a connected Drive tool, `read_file_content` by fileId, no sign-in needed.)

**Live workflows (6, not 7 — WF05 was deleted 2026-07-09, absorbed into WF01):**

| Workflow | Trigger | Job |
|---|---|---|
| **WF01 Strategy Generator** | Daily cron 08:00 | The *only* LLM call in the whole system (`gpt-5-mini`). Generates exactly 7 items/day (4 Static + 2 Reel + 1 Carousel), including final Caption+Hashtags in the same call. Writes rows with `Status=Generated`. |
| **WF02 Telegram Approval Center** | Telegram webhook + Sheets trigger + 10-min recovery sweep | The human approval gate. Posts an inline-keyboard card per `Generated` row. Approve → `Status=Approved`. Reject → `Status=Rejected` (terminal). Edit → field picker, writes new value, bounces back to `Generated`. Forwards non-button messages/media to WF07. |
| **WF03 AI Prompt Generator** | Sheets trigger (`Approved` rows) + recovery | **No LLM call** — deterministic Code-node templates per content type (Static/Carousel/Reel), each producing a creative brief column. Sets `Status=Waiting for Assets`, tells the human what to go create. |
| **WF04 Content Asset Manager** | Sub-workflow only (called by WF07) | Validates the upload, **commits the file directly to this GitHub repo** (`subhamoysarkar/tapanda`, `digital_marketing_assets/`, branch `main`) — not Google Drive (Graph API can't fetch Drive links). Writes `Asset URL`/`Carousel_Asset URL N` as a `raw.githubusercontent.com` link, sets `Status=Ready for Publishing` once all expected slides are in. |
| **WF06 Social Media Publisher** | Sheets trigger + 10-min recovery (scheduler) + 15-min cron (publisher) | Schedules `Ready for Publishing` rows into fixed daily slots (Static/Carousel → 11:00 AM IST, Reel → 07:00 PM IST), `Status=Scheduled`. On the publish cron, posts to FB Page + IG Business account via Graph API v23. **Reels are not auto-published** — falls through to a manual Telegram hand-off, then trusts a human to mark it done. Failed publishes auto-retry up to 3× (`Publish Failed` → requeued `Scheduled`), then `Publish Failed - Needs Review` (terminal, human must intervene). |
| **WF07 Telegram Command Center** | Sub-workflow (called by WF02 for non-button messages) | Menu-driven chat: upload media (walks through Carousel's up-to-5 slides, rolls back partial uploads on cancel — including deleting already-committed GitHub files), check pending approvals, production summary, 7-day publishing calendar. |

**Credentials in use:** OpenAI (WF01 only), Telegram Bot API (one bot, one group `-5109961266`), Google Sheets API (service account, all workflows), GitHub API (PAT, WF04/WF07), Facebook/Instagram Graph API v23 (System User token, WF06). **No Supabase. No REST API/webhook endpoint exists today** besides the Sheet and the Telegram bot.

---

## 8. Real Google Sheet column contract & state machine

**Live columns** (confirmed from the companion doc, supersedes anything I guessed earlier in this session): `Content ID, Strategy ID, Content Type, Content Pillar, Objective, Topic, Hook, CTA, Caption, Hashtags, Status, Remarks, Telegram Msg ID, Static Prompt, Carousel Prompt, Reel Content Prompt, Asset URL, Carousel_Asset URL 1..5, Publish Date, Publish Time, FB Post ID, FB Post URL, IG Media ID, IG Post URL, Publish Errors, Publish Retry Count`.

**Dead-but-not-deleted columns to ignore:** `Reel Script`, `Reel Prompt`, `Reel Thumbnail Prompt`, `Carousel Slide1-5 Prompt` (WF07 still *reads* these only to infer expected carousel slide count), GMB-related columns, `Published URL` (superseded by FB/IG URL columns).

**State machine (per the companion doc's §4):**
```
Generated → (WF02) → Approved → (WF03) → Waiting for Assets
                    ↘ Rejected  (terminal)

Waiting for Assets → (WF04) → Ready for Publishing
Ready for Publishing → (WF06 scheduler) → Scheduled
Scheduled → (WF06 publish cron) → Published
                                ↘ Publish Failed → (retry ≤3) → Scheduled (loop)
                                                  → (after 3) → Publish Failed - Needs Review (terminal)
```
An Edit action in WF02 can bounce an in-flight row back to `Generated`.

**⚠️ Unresolved discrepancy — confirm before mapping Content Planner's Kanban columns:** I read the live sheet directly earlier in this session and saw rows with literal `Status = "Awaiting Approval"` (e.g. `CNT-20260714-002`). The companion doc's state machine above does **not** list "Awaiting Approval" as a distinct state — it goes straight `Generated → Approved`. Possibilities: (a) it's a stale/legacy value from before a naming change, (b) "Generated" rows display as "Awaiting Approval" via some formula I didn't see, (c) the doc's diagram is simplified. **Ask before building** — don't guess a third time on status vocabulary.

**⚠️ Second minor discrepancy:** the companion doc says WF01 now enforces exactly 3 fixed Content Pillars (*Interior Design Tips & Expert Suggestions*, *Portfolio Presentation*, *Luxury Design Inspiration*), but historical rows I read directly use many more pillar values (*Interior Design Mistakes*, *Before & After Transformations*, *Material Selection Tips*, *Space Planning Tips*, *Client Testimonials*, *Budget Planning*, etc.). Likely just pre-2026-07-09 history predating the 3-pillar constraint — fine to treat old rows as historical, but don't hardcode a 3-item pillar list into any UI without confirming.

**Asset URLs are already full `https://raw.githubusercontent.com/subhamoysarkar/tapanda/main/digital_marketing_assets/...` links** in the real sheet — use as-is, no path rewriting needed, and note this repo (`tapanda`) is the same one this Business OS frontend lives in.

---

## 9. Decisions locked in this session (carry these forward, don't re-litigate)

1. **No Supabase for the content engine, ever.** It's Google Sheets + n8n only. (Supabase stays scoped to the unrelated public-site portfolio gallery.)
2. **Security is explicitly deprioritized for now.** Keep the Business OS's future auth as a copy of `admin.html`'s existing hardcoded client-side password overlay — the user was explicit: focus is functionality, not security, for this phase. Don't propose Supabase Auth or real sessions unless the user raises it again. (One nuance that is *not* a security ask but a technical necessity: Sheets **write** access needs a server-side credential of some kind regardless of security posture, since Sheets write auth mechanisms don't support safe client-side embedding — this is about *where code runs*, not about how secure to make it.)
3. **Business OS pages currently have zero login gate at all** (unlike `admin.html`). User confirmed: add the same simple password-gate pattern to Business OS too, for consistency — this is still pending, not yet built.
4. **Telegram stays exactly as it is** for media upload and notifications. The user does **not** want to remove or change WF02/WF07's existing Telegram behavior.
5. **The user wants the Business OS web UI to become a second, equal channel for edits/approvals** — not routed through Telegram, so Telegram callbacks aren't the only way to approve/edit content. This aligns with (is independently validated by) the companion doc's own §7 recommendation: *"Do not duplicate the Telegram approval flow... if the web app wants an 'approve from the browser' button, it should write the same Status=Approved the Telegram button writes, not reimplement separate approval logic."* Both channels must write through the exact same column/status contract in §8 so downstream workflows can't tell (or care) which channel made the change.
6. **The companion doc explicitly confirms no webhook/API layer exists today.** Building the write path (and likely the read path too, for the same server-side-credential reason) is **new n8n build work**, not just a wiring exercise on the frontend side. Don't scope Phase 4 as "just connect the frontend" — a webhook-triggered wrapper workflow (or similar) needs to be designed and built in n8n first.

---

## 10. Phase 4 — where to pick this up

Rough shape agreed so far (not yet built, not yet fully detailed):

1. **Reconcile the two open discrepancies in §8** with the user before writing any status-mapping code.
2. **Add the password gate** to all 8 Business OS pages (copy `admin.html`'s pattern).
3. **Design + build a small n8n webhook wrapper** (new work, per §9.6) that:
   - **Read side:** returns current Sheet rows as JSON, so `os-data.js`'s mock arrays get replaced by a real `fetch()` on page load.
   - **Write side:** accepts an approve/reject/edit/schedule action from the Business OS and performs the *exact same* Sheet write WF02's Telegram callback already performs, so WF03 onward triggers identically regardless of origin channel.
4. **Remap Workflow Monitor / Settings' workflow list** from the mock's 7 generic WF01–WF07 entries to the real 6 active workflows (§7 table) — names, purposes, and node-level detail should come from the companion doc, not be re-invented.
5. **Point Asset Library / Content Planner drawers at real `Asset URL`/`Carousel_Asset URL` values** — no transformation needed, they're already full raw GitHub URLs.
6. Decide whether reads also need to go through the webhook wrapper or can use a more direct (but still server-side-credentialed) path — open question, low stakes either way given the security stance in §9.2.

## 11. Where things live (quick reference)

- Business OS pages: repo root + `business-os/` (see §2)
- Real backend architecture (authoritative): `/Users/isense/Documents/Github/Automation_Workspace/TaPanda_DigitalMarketing/docs/AUTOMATION_SYSTEM_ARCHITECTURE_2026-07-20.md`
- This handoff doc: `docs/BUSINESS_OS_ARCHITECTURE_AND_HANDOFF_2026-07-20.md` (you are here)
- Pre-existing site architecture doc (System 01, predates Business OS, still accurate for the public site): `docs/PROJECT_ARCHITECTURE.md`
- Dev log convention: `PROJECT_LOG.md` (root) — has entries for the Phase 3 build and the URL restructuring
- Walkthrough deck: `Ta-Panda-Business-OS-Phase3-Walkthrough.pptx` (repo root)
- Live Google Sheet: `https://docs.google.com/spreadsheets/d/1_EYBVmUvn2miNvr6l0nkTwpKJzLhJHj5ZWr-I3tikxE/edit?gid=851394852#gid=851394852` — readable directly via the connected Drive tool (`read_file_content` by fileId), no sign-in prompt needed.
