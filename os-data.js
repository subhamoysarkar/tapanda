/*
  Ta Panda Business OS — Shared Data Layer (Phase 4 — live backend)
  --------------------------------------------------------------------
  CONTENT_ITEMS now loads from the real TPI_Project01_DB Google Sheet via
  os-api.js / the WF08 Business OS Gateway n8n workflow. Everything else
  that has no real backend equivalent (Prompt Library, some Analytics
  series) stays clearly-labeled reference/mock data — see PROMPTS and the
  ANALYTICS block below for what's real vs. illustrative.

  Load order: os-api.js, then this file, then business-os.js, then the
  page-specific script. Every page must `await window.OSData.ready` before
  its first render call (CONTENT_ITEMS/WORKFLOWS start populated with
  real static shape but item data arrives async).
*/

(function () {
  'use strict';

  const TODAY = new Date();

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }
  function addHours(date, n) {
    const d = new Date(date);
    d.setHours(d.getHours() + n);
    return d;
  }
  function iso(date) {
    return date.toISOString();
  }
  function d(offsetDays, hour, minute) {
    const dt = addDays(TODAY, offsetDays);
    if (hour !== undefined) dt.setHours(hour, minute || 0, 0, 0);
    return iso(dt);
  }
  function fmtDate(isoStr, opts) {
    const dt = new Date(isoStr);
    return dt.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function fmtDateShort(isoStr) {
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function fmtTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function fmtDateTime(isoStr) {
    return fmtDateShort(isoStr) + ', ' + fmtTime(isoStr);
  }
  function timeAgo(isoStr) {
    const diffMs = TODAY - new Date(isoStr);
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.round(hrs / 24);
    if (days < 7) return days + 'd ago';
    return fmtDateShort(isoStr);
  }
  function toISODate(date) {
    const dt = new Date(date);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function sameDay(isoStr, ref) {
    if (!isoStr) return false;
    const a = new Date(isoStr), b = ref;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // ---------------------------------------------------------------------
  // Lookup registries
  // ---------------------------------------------------------------------
  const STATUS_META = {
    'generated':          { label: 'Generated',          badge: 'badge-neutral',  color: 'var(--text-secondary)' },
    'awaiting-approval':  { label: 'Awaiting Approval',  badge: 'badge-warning',  color: 'var(--status-warning-text)' },
    'approved':           { label: 'Approved',           badge: 'badge-info',     color: 'var(--status-info-text)' },
    'waiting-assets':     { label: 'Waiting for Assets', badge: 'badge-danger',   color: 'var(--status-danger-text)' },
    'ready':               { label: 'Ready for Publishing', badge: 'badge-gold', color: 'var(--accent-gold)' },
    'scheduled':           { label: 'Scheduled',         badge: 'badge-info',     color: 'var(--status-info-text)' },
    'published':           { label: 'Published',         badge: 'badge-success',  color: 'var(--status-success-text)' },
    'rejected':             { label: 'Rejected',          badge: 'badge-danger',   color: 'var(--status-danger-text)' }
  };

  const TYPE_META = {
    'Static Image': { icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>' },
    'Carousel':     { icon: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line>' },
    'Reel':         { icon: '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>' },
    'Video':        { icon: '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>' },
    'Blog Post':    { icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>' },
    'Youtube Short':{ icon: '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>' }
  };

  const PLATFORM_META = {
    'Instagram':      { color: '#c9a3d9' },
    'Facebook':       { color: '#8fb4de' },
    'Google Business':{ color: '#8fcf9f' },
    'Blog':           { color: '#e0b884' },
    'YouTube':        { color: '#e59a9a' }
  };

  // ---------------------------------------------------------------------
  // WORKFLOWS — the real 6 live n8n workflows (WF05 was absorbed into
  // WF01 on 2026-07-09). Identity/purpose/trigger/integrations are real,
  // sourced from the automation team's architecture doc + direct workflow
  // inspection. queueCount/health are derived live from real CONTENT_ITEMS
  // below (recomputeDerived()) — there is no live n8n execution telemetry
  // wired up yet (that would need a separate n8n-API proxy endpoint), so
  // per-run stats (success rate, durations, node-level logs) are
  // intentionally not shown rather than faked.
  // ---------------------------------------------------------------------
  const WORKFLOWS = [
    {
      id: 'WF01', name: 'Strategy Generator',
      purpose: 'The only LLM call in the system (gpt-5-mini). Generates exactly 7 items/day (4 Static, 2 Reel, 1 Carousel) across 3 content pillars, with caption + hashtags already written, and writes Status=Generated.',
      trigger: 'Schedule — Daily 08:00 IST',
      integrations: ['OpenAI (gpt-5-mini)', 'Google Sheets']
    },
    {
      id: 'WF02', name: 'Telegram Approval Center',
      purpose: 'The human approval gate. Posts an inline-keyboard card per Generated row to Telegram. Approve → Status=Approved. Reject → Status=Rejected (terminal). Edit → field picker, bounces back to Generated. Reminders every 30 min (max 5), then escalates.',
      trigger: 'Telegram webhook + Sheets trigger + 10-min recovery sweep',
      integrations: ['Telegram Bot API', 'Google Sheets']
    },
    {
      id: 'WF03', name: 'AI Prompt Generator',
      purpose: 'No LLM call — deterministic templates per content type (Static/Carousel/Reel) build the creative brief. Triggers on Status=Approved, sets Status=Waiting for Assets.',
      trigger: 'Sheets trigger (Approved rows) + recovery',
      integrations: ['Google Sheets']
    },
    {
      id: 'WF04', name: 'Content Asset Manager',
      purpose: 'Sub-workflow called by WF07 when media is uploaded via Telegram. Validates the upload, commits the file to this GitHub repo (digital_marketing_assets/), writes the raw.githubusercontent.com URL back to the Sheet, sets Status=Ready for Publishing once all slides are in.',
      trigger: 'Sub-workflow only (called by WF07)',
      integrations: ['GitHub API', 'Google Sheets', 'Telegram Bot API']
    },
    {
      id: 'WF06', name: 'Social Media Publisher',
      purpose: 'Schedules Ready for Publishing rows into fixed daily slots (Static/Carousel → 11:00 AM IST, Reel → 7:00 PM IST). On the publish cron, posts to the FB Page + IG Business account via Graph API v23. Reels hand off to a human via Telegram instead of auto-publishing. Failed publishes retry up to 3×, then Publish Failed - Needs Review.',
      trigger: 'Sheets trigger + 10-min recovery (scheduler) + 15-min cron (publisher)',
      integrations: ['Facebook/Instagram Graph API v23', 'Google Sheets', 'Telegram Bot API']
    },
    {
      id: 'WF07', name: 'Telegram Command Center',
      purpose: "Menu-driven chat sub-workflow: upload media (walks through a Carousel's up to 5 slides, rolls back partial uploads on cancel), check pending approvals, production summary, 7-day publishing calendar.",
      trigger: 'Sub-workflow (called by WF02 for non-button Telegram messages)',
      integrations: ['Telegram Bot API', 'Google Sheets']
    }
  ];

  // ---------------------------------------------------------------------
  // CONTENT ITEMS — populated live from the real Sheet by init() below.
  // Kept as a stable array reference so every page that captured
  // `OSData.CONTENT_ITEMS` at load time keeps seeing updates.
  // ---------------------------------------------------------------------
  const CONTENT_ITEMS = [];

  // ---------------------------------------------------------------------
  // ASSETS — derived from real CONTENT_ITEMS (there is no separate asset
  // entity in the real system — no version history / file size / pixel
  // dimensions are tracked, so those fields are intentionally omitted
  // rather than fabricated).
  // ---------------------------------------------------------------------
  const ASSETS = [];

  function deriveAssets() {
    const out = [];
    CONTENT_ITEMS.forEach((item) => {
      if (item.carouselSlides && item.carouselSlides.length) {
        out.push({
          id: 'AST-' + item.id, filename: item.id + '_CAROUSEL', type: 'carousel',
          url: item.carouselSlides[0], slides: item.carouselSlides,
          uploadedDate: item.publishDate || item.createdDate, usedIn: [item.id], versions: []
        });
      } else if (item.assetUrl) {
        out.push({
          id: 'AST-' + item.id, filename: item.id + '_' + (item.type || 'ASSET').toUpperCase().replace(/\s+/g, ''),
          type: 'image', url: item.assetUrl,
          uploadedDate: item.publishDate || item.createdDate, usedIn: [item.id], versions: []
        });
      }
    });
    return out;
  }

  // ---------------------------------------------------------------------
  // PROMPTS — Prompt Library. The real system has no reusable prompt
  // *library* concept (WF03 builds prompts deterministically per item,
  // stored per-row, not as versioned templates) — this stays illustrative
  // reference data until/unless a real prompt-template store exists.
  // ---------------------------------------------------------------------
  const PROMPT_CATEGORIES = [
    'Strategy Generator', 'Static Prompt', 'Carousel Prompt', 'Reel Script',
    'Video Prompt', 'Thumbnail Prompt', 'Caption Prompt', 'Hashtag Prompt', 'SEO Prompt'
  ];

  const PROMPTS = [
    { id: 'PR-101', category: 'Strategy Generator', name: 'Monthly Pillar Strategy', tags: ['strategy', 'planning'], updated: d(-2), currentVersion: 3,
      versions: [
        { v: 3, date: d(-2), text: 'You are Ta Panda’s content strategist. Given last month’s performance data and the current design trend feed, propose 8 content pillars balancing Educational, Portfolio, Social Proof, Brand Awareness and Sales objectives for a Kolkata-based luxury interior design studio. Output as structured JSON with topic, objective, and suggested content type.' },
        { v: 2, date: d(-30), text: 'You are Ta Panda’s content strategist. Given last month’s performance data, propose 6 content pillars for a Kolkata-based interior design studio. Output as a numbered list.' },
        { v: 1, date: d(-60), text: 'Generate 5 content ideas for an interior design Instagram page.' }
      ], notes: 'v3 adds trend-feed grounding — noticeably fewer generic ideas since switching.' },
    { id: 'PR-102', category: 'Strategy Generator', name: 'Competitor Gap Finder', tags: ['strategy', 'competitor'], updated: d(-10), currentVersion: 1,
      versions: [{ v: 1, date: d(-10), text: 'Compare our last 30 days of published content against 3 competitor Instagram accounts. Identify content types and pillars we are under-indexed on. Output a gap list.' }], notes: '' },
    { id: 'PR-103', category: 'Static Prompt', name: 'Portrait / Founder Static', tags: ['image', 'brand'], updated: d(-8), currentVersion: 2,
      versions: [
        { v: 2, date: d(-8), text: 'Professional dual portrait of an Indian male and female interior designer team. Modern, minimalist office setting with subtle gold and black architectural accents. High-end architectural photography style, natural lighting, 85mm lens, depth of field.' },
        { v: 1, date: d(-40), text: 'Portrait photo of two interior designers in an office.' }
      ], notes: 'v2 locks the gold/black brand palette explicitly — big quality jump.' },
    { id: 'PR-104', category: 'Static Prompt', name: 'Product / Room Static', tags: ['image', 'portfolio'], updated: d(-5), currentVersion: 1,
      versions: [{ v: 1, date: d(-5), text: 'Ultra-realistic architectural photograph of a minimalist living room, warm neutral palette with brushed gold accents, soft natural daylight from a large window, 35mm lens, shallow depth of field, magazine editorial quality.' }], notes: '' },
    { id: 'PR-105', category: 'Carousel Prompt', name: '5-Slide Educational Carousel', tags: ['carousel', 'educational'], updated: d(-6), currentVersion: 2,
      versions: [
        { v: 2, date: d(-6), text: 'Generate a 5-slide Instagram carousel: Slide 1 hook headline over a room photo, Slides 2-4 one design tip each with a short supporting caption, Slide 5 CTA to book a free consultation. Maintain consistent gold/black brand framing on every slide.' },
        { v: 1, date: d(-35), text: 'Generate a 5-slide Instagram carousel about interior design tips.' }
      ], notes: '' },
    { id: 'PR-106', category: 'Reel Script', name: '30s Portfolio Walkthrough', tags: ['reel', 'portfolio'], updated: d(-3), currentVersion: 1,
      versions: [{ v: 1, date: d(-3), text: 'Write a 30-second reel voiceover script walking through a before/after home transformation. Hook in first 2 seconds, 3 quick cuts showing the transformation, close on a CTA to book a consultation. Tone: confident, warm, aspirational.' }], notes: '' },
    { id: 'PR-107', category: 'Video Prompt', name: 'Cinematic Room Reveal', tags: ['video'], updated: d(-4), currentVersion: 1,
      versions: [{ v: 1, date: d(-4), text: 'Cinematic slow dolly-in shot revealing a finished luxury living room, golden hour lighting, shallow depth of field, subtle camera shake for realism, 4 second duration, architectural film style.' }], notes: '' },
    { id: 'PR-108', category: 'Thumbnail Prompt', name: 'YouTube Short Thumbnail', tags: ['thumbnail'], updated: d(-7), currentVersion: 1,
      versions: [{ v: 1, date: d(-7), text: 'Bold, high-contrast YouTube Shorts thumbnail: before/after split composition, large readable headline text overlay in the brand gold color, expressive client reaction photo on one side.' }], notes: '' },
    { id: 'PR-109', category: 'Caption Prompt', name: 'Brand Voice Caption Writer', tags: ['caption'], updated: d(-1), currentVersion: 2,
      versions: [
        { v: 2, date: d(-1), text: 'Write an Instagram caption in Ta Panda’s brand voice: confident, warm, precise. Open with a hook line, 2-3 short paragraphs of value or story, end with a clear CTA. Keep under 150 words. Avoid generic design clichés.' },
        { v: 1, date: d(-25), text: 'Write an Instagram caption for an interior design post.' }
      ], notes: '' },
    { id: 'PR-110', category: 'Hashtag Prompt', name: 'Local + Niche Hashtag Mix', tags: ['hashtags', 'seo'], updated: d(-12), currentVersion: 1,
      versions: [{ v: 1, date: d(-12), text: 'Generate 12 hashtags mixing branded (#TaPandaInnovation), local (#InteriorDesignKolkata, #KolkataHomes), and niche design hashtags relevant to the post topic. Avoid banned or shadowbanned tags.' }], notes: '' },
    { id: 'PR-111', category: 'SEO Prompt', name: 'Blog Meta Description Writer', tags: ['seo', 'blog'], updated: d(-9), currentVersion: 1,
      versions: [{ v: 1, date: d(-9), text: 'Write an SEO meta description (max 155 characters) for the given blog post, including the target keyword naturally, written to maximize click-through from Google search results.' }], notes: '' }
  ];

  // ---------------------------------------------------------------------
  // NOTIFICATIONS / ACTIVITY LOG — derived from real CONTENT_ITEMS signals
  // (the Sheet has no event history, only current state, so these are
  // "current state summaries" rather than a true chronological event feed).
  // ---------------------------------------------------------------------
  const NOTIFICATIONS = [];
  const ACTIVITY_LOG = [];

  function deriveNotificationsAndActivity() {
    const notifications = [];
    const activity = [];
    let nid = 1, aid = 1;

    const awaitingCount = CONTENT_ITEMS.filter((c) => c.status === 'awaiting-approval').length;
    if (awaitingCount > 0) {
      notifications.push({ id: 'N' + nid++, type: 'approval', title: 'Approval needed', message: `${awaitingCount} item${awaitingCount === 1 ? '' : 's'} waiting for review.`, time: TODAY.toISOString(), read: false });
    }
    const errorItems = CONTENT_ITEMS.filter((c) => c.error);
    errorItems.forEach((c) => {
      notifications.push({ id: 'N' + nid++, type: 'error', title: 'Publish failure', message: `${c.id}: ${c.error}`, time: TODAY.toISOString(), read: false });
      activity.push({ id: 'A' + aid++, icon: 'error', tone: 'danger', text: `<strong>Social Media Publisher</strong> failed to publish #${c.id}.`, time: TODAY.toISOString() });
    });
    const waitingAssets = CONTENT_ITEMS.filter((c) => c.status === 'waiting-assets').length;
    if (waitingAssets > 0) {
      notifications.push({ id: 'N' + nid++, type: 'warning', title: 'Assets needed', message: `${waitingAssets} item${waitingAssets === 1 ? '' : 's'} waiting on media uploads.`, time: TODAY.toISOString(), read: true });
    }

    CONTENT_ITEMS.filter((c) => c.status === 'published' && sameDay(c.publishDate, TODAY))
      .slice(0, 5)
      .forEach((c) => activity.push({ id: 'A' + aid++, icon: 'check', tone: 'success', text: `<strong>Published</strong> "${c.id}" — ${c.title}.`, time: c.publishDate || TODAY.toISOString() }));

    CONTENT_ITEMS.filter((c) => c.status === 'generated' && sameDay(c.createdDate, TODAY))
      .slice(0, 3)
      .forEach((c) => activity.push({ id: 'A' + aid++, icon: 'clock', tone: 'default', text: `<strong>Strategy Generator</strong> produced "${c.title}".`, time: c.createdDate }));

    activity.sort((a, b) => new Date(b.time) - new Date(a.time));
    return { notifications, activity: activity.slice(0, 12) };
  }

  // ---------------------------------------------------------------------
  // ANALYTICS — content-mix / platform-mix / publishing-trend are
  // computed live from real CONTENT_ITEMS. approvalVelocity and
  // leadGeneration have no real data source in this system (no CRM / no
  // per-item timestamp history) and are left as empty series rather than
  // fabricated numbers.
  // ---------------------------------------------------------------------
  let ANALYTICS = { '7d': {}, '30d': {}, '90d': {}, contentMix: [], platformDistribution: [], monthlyPerformance: [], contentTypeAnalysis: [], publicationFrequency: [] };

  const TYPE_COLORS = { 'Carousel': '#c39a5c', 'Reel': '#8fb4de', 'Static Image': '#8fcf9f', 'Blog Post': '#e59a9a', 'Youtube Short': '#c9a3d9' };
  const PLATFORM_COLORS = { 'Instagram': '#c9a3d9', 'Facebook': '#8fb4de', 'Blog': '#e0b884', 'Google Business': '#8fcf9f', 'YouTube': '#e59a9a' };

  function buildHeatmapWeeks(weeks) {
    const cells = [];
    const start = addDays(TODAY, -(weeks * 7) + 1);
    const byDate = {};
    CONTENT_ITEMS.forEach((c) => {
      if (c.status === 'published' && c.publishDate) {
        const key = toISODate(new Date(c.publishDate));
        byDate[key] = (byDate[key] || 0) + 1;
      }
    });
    for (let i = 0; i < weeks * 7; i++) {
      const date = addDays(start, i);
      const key = toISODate(date);
      cells.push({ date: key, count: byDate[key] || 0 });
    }
    return cells;
  }

  function pct(count, total) {
    return total ? Math.round((count / total) * 1000) / 10 : 0;
  }

  function recomputeAnalytics() {
    const total = CONTENT_ITEMS.length;
    const byType = {};
    const byPlatform = {};
    CONTENT_ITEMS.forEach((c) => {
      byType[c.type] = (byType[c.type] || 0) + 1;
      byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1;
    });
    const contentMix = Object.keys(byType).map((k) => ({ l: k, v: pct(byType[k], total), color: TYPE_COLORS[k] || '#8899aa' }));
    const platformDistribution = Object.keys(byPlatform).map((k) => ({ l: k, v: pct(byPlatform[k], total), color: PLATFORM_COLORS[k] || '#8899aa' }));

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const publishingTrend7d = [];
    const productionTrend7d = [];
    for (let i = 6; i >= 0; i--) {
      const day = addDays(TODAY, -i);
      publishingTrend7d.push({ l: dayLabels[day.getDay()], v: CONTENT_ITEMS.filter((c) => c.status === 'published' && sameDay(c.publishDate, day)).length });
      productionTrend7d.push({ l: dayLabels[day.getDay()], v: CONTENT_ITEMS.filter((c) => sameDay(c.createdDate, day)).length });
    }

    // Weekly buckets over the last 4 weeks (real data currently only spans
    // a couple of weeks since the Sheet is young — earlier weeks show 0).
    const publishingTrend30d = [];
    const productionTrend30d = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = addDays(TODAY, -(w * 7) - 6);
      const weekEnd = addDays(TODAY, -(w * 7));
      const inWeek = (dateStr) => dateStr && new Date(dateStr) >= weekStart && new Date(dateStr) <= weekEnd;
      publishingTrend30d.push({ l: 'W' + (4 - w), v: CONTENT_ITEMS.filter((c) => c.status === 'published' && inWeek(c.publishDate)).length });
      productionTrend30d.push({ l: 'W' + (4 - w), v: CONTENT_ITEMS.filter((c) => inWeek(c.createdDate)).length });
    }

    ANALYTICS = {
      '7d': { publishingTrend: publishingTrend7d, approvalVelocity: [], productionVelocity: productionTrend7d, leadGeneration: [] },
      '30d': { publishingTrend: publishingTrend30d, approvalVelocity: [], productionVelocity: productionTrend30d, leadGeneration: [] },
      '90d': { publishingTrend: publishingTrend30d, approvalVelocity: [], productionVelocity: productionTrend30d, leadGeneration: [] },
      contentMix, platformDistribution,
      monthlyPerformance: productionTrend30d,
      contentTypeAnalysis: [],
      publicationFrequency: buildHeatmapWeeks(13)
    };
  }

  // ---------------------------------------------------------------------
  // KPI card definitions
  // ---------------------------------------------------------------------
  const KPI_DEFS = [
    { key: 'generated', label: 'Generated', bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', trend: '', trendText: 'Today',
      icon: '<polyline points="20 6 9 17 4 12"></polyline>' },
    { key: 'awaiting-approval', label: 'Awaiting Approval', bg: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', trend: '', trendText: 'Needs review',
      icon: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>' },
    { key: 'waiting-assets', label: 'Waiting for Assets', bg: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', trend: '', trendText: 'Needs upload',
      icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>' },
    { key: 'ready', label: 'Ready for Publishing', bg: 'var(--accent-gold-light)', color: 'var(--accent-gold)', trend: '', trendText: 'Needs scheduling',
      icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' },
    { key: 'scheduled', label: 'Scheduled', bg: 'var(--status-info-bg)', color: 'var(--status-info-text)', trend: '', trendText: 'In the queue',
      icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' },
    { key: 'published', label: 'Published', bg: 'var(--status-success-bg)', color: 'var(--status-success-text)', trend: '', trendText: 'All time',
      icon: '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>' },
    { key: 'errors', label: 'Errors', bg: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', trend: '', trendText: 'Requires attention',
      icon: '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' }
  ];

  const STATUS_COLUMNS = [
    { key: 'generated', label: 'Generated' },
    { key: 'awaiting-approval', label: 'Awaiting Approval' },
    { key: 'approved', label: 'Approved' },
    { key: 'waiting-assets', label: 'Waiting for Assets' },
    { key: 'ready', label: 'Ready for Publishing' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'published', label: 'Published' },
    { key: 'rejected', label: 'Rejected' }
  ];

  // ---------------------------------------------------------------------
  // Derived counts / lookups
  // ---------------------------------------------------------------------
  function getCounts() {
    const counts = { generated: 0, 'awaiting-approval': 0, approved: 0, 'waiting-assets': 0, ready: 0, scheduled: 0, published: 0, rejected: 0, errors: 0 };
    CONTENT_ITEMS.forEach((item) => {
      if (counts[item.status] !== undefined) counts[item.status]++;
      if (item.error) counts.errors++;
    });
    return counts;
  }

  function getWorkflow(id) {
    return WORKFLOWS.find((w) => w.id === id);
  }
  function getContentItem(id) {
    return CONTENT_ITEMS.find((c) => c.id === id);
  }
  function getAsset(id) {
    return ASSETS.find((a) => a.id === id);
  }
  function getPrompt(id) {
    return PROMPTS.find((p) => p.id === id);
  }

  function getPlanningHorizon() {
    const future = CONTENT_ITEMS.filter((c) => c.publishDate && c.status === 'scheduled')
      .map((c) => new Date(c.publishDate));
    if (!future.length) return TODAY;
    return new Date(Math.max.apply(null, future));
  }

  // ---------------------------------------------------------------------
  // Live data load + write actions
  // ---------------------------------------------------------------------
  function recomputeDerived() {
    ASSETS.length = 0;
    ASSETS.push.apply(ASSETS, deriveAssets());
    const na = deriveNotificationsAndActivity();
    NOTIFICATIONS.length = 0;
    NOTIFICATIONS.push.apply(NOTIFICATIONS, na.notifications);
    ACTIVITY_LOG.length = 0;
    ACTIVITY_LOG.push.apply(ACTIVITY_LOG, na.activity);
    recomputeAnalytics();

    const byStatus = (keys) => CONTENT_ITEMS.filter((c) => keys.includes(c.status)).length;
    const errorItems = CONTENT_ITEMS.filter((c) => c.error);
    const queue = {
      WF01: CONTENT_ITEMS.filter((c) => c.status === 'generated' && sameDay(c.createdDate, TODAY)).length,
      WF02: byStatus(['awaiting-approval']),
      WF03: byStatus(['approved']),
      WF04: byStatus(['waiting-assets']),
      WF06: byStatus(['ready', 'scheduled']),
      WF07: null
    };
    WORKFLOWS.forEach((w) => {
      w.queueCount = queue[w.id];
      w.errorItems = w.id === 'WF06' ? errorItems : [];
      w.health = w.errorItems.length > 0 ? 'critical' : (w.queueCount != null && w.queueCount > 8 ? 'warning' : 'healthy');
    });

    window.OSData.ASSETS = ASSETS;
    window.OSData.NOTIFICATIONS = NOTIFICATIONS;
    window.OSData.ACTIVITY_LOG = ACTIVITY_LOG;
    window.OSData.ANALYTICS = ANALYTICS;
  }

  function patchLocalItem(id, patch) {
    const item = getContentItem(id);
    if (item) Object.assign(item, patch);
    recomputeDerived();
  }

  function notifyChanged(detail) {
    document.dispatchEvent(new CustomEvent('os:data-changed', { detail: detail || {} }));
  }

  async function loadContentItems() {
    try {
      const items = await window.OSApi.fetchContentItems();
      CONTENT_ITEMS.length = 0;
      CONTENT_ITEMS.push.apply(CONTENT_ITEMS, items);
    } finally {
      // Always leave WORKFLOWS/ASSETS/etc. in a self-consistent (even if
      // zeroed) derived state, whether the fetch succeeded or not.
      recomputeDerived();
    }
  }

  async function refresh() {
    await loadContentItems();
    notifyChanged({ type: 'refresh' });
  }

  async function approveItem(id) {
    await window.OSApi.approve(id);
    patchLocalItem(id, { status: 'approved', rawStatus: 'Approved' });
    notifyChanged({ type: 'content-item-updated', id: id });
  }

  async function rejectItem(id, remarks) {
    await window.OSApi.reject(id, remarks);
    patchLocalItem(id, { status: 'rejected', rawStatus: 'Rejected', reviewerRemarks: remarks || 'Rejected via Business OS' });
    notifyChanged({ type: 'content-item-updated', id: id });
  }

  const EDIT_FIELD_TO_ITEM_KEY = { Topic: 'title', Hook: 'hook', CTA: 'cta', Caption: 'caption', Hashtags: 'hashtags' };

  async function editItemField(id, field, value) {
    await window.OSApi.editField(id, field, value);
    const patch = {};
    if (EDIT_FIELD_TO_ITEM_KEY[field]) patch[EDIT_FIELD_TO_ITEM_KEY[field]] = value;
    patchLocalItem(id, patch);
    notifyChanged({ type: 'content-item-updated', id: id });
  }

  async function rescheduleItem(id, jsDate) {
    await window.OSApi.reschedule(id, jsDate);
    patchLocalItem(id, { publishDate: jsDate.toISOString() });
    notifyChanged({ type: 'content-item-updated', id: id });
  }

  window.OSData = {
    TODAY, addDays, addHours, toISODate, fmtDate, fmtDateShort, fmtTime, fmtDateTime, timeAgo,
    STATUS_META, TYPE_META, PLATFORM_META, PROMPT_CATEGORIES, KPI_DEFS, STATUS_COLUMNS,
    WORKFLOWS, CONTENT_ITEMS, ASSETS, PROMPTS, NOTIFICATIONS, ACTIVITY_LOG, ANALYTICS,
    getCounts, getWorkflow, getContentItem, getAsset, getPrompt, getPlanningHorizon,
    approveItem, rejectItem, editItemField, rescheduleItem, refresh,
    ready: null
  };

  window.OSData.ready = loadContentItems().catch((err) => {
    console.error('OSData: failed to load live content from gateway', err);
    if (window.OS && window.OS.toast) {
      window.OS.toast({ type: 'error', title: 'Live data unavailable', message: err.message || 'Could not reach the Business OS gateway.' });
    }
  });
})();
