/*
  Ta Panda Business OS — Shared Mock Data Layer
  ----------------------------------------------
  Single source of truth for every OS page during the Phase 3 (frontend-only)
  build. Every getter here is written the way a real API client would be
  written, so Phase 4 can swap the bodies for fetch() calls against the n8n
  webhooks / Supabase without touching any page-level code.

  Load this file BEFORE any page-specific script and after business-os.js.
*/

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------
  const TODAY = new Date('2026-07-18T09:30:00');

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

  // ---------------------------------------------------------------------
  // Lookup registries (shared badge / icon metadata — avoids re-deriving
  // label/color logic with switch statements on every page)
  // ---------------------------------------------------------------------
  const STATUS_META = {
    'generated':          { label: 'Generated',          badge: 'badge-neutral',  color: 'var(--text-secondary)' },
    'awaiting-approval':  { label: 'Awaiting Approval',  badge: 'badge-warning',  color: 'var(--status-warning-text)' },
    'approved':           { label: 'Approved',           badge: 'badge-info',     color: 'var(--status-info-text)' },
    'waiting-assets':     { label: 'Waiting for Assets', badge: 'badge-danger',   color: 'var(--status-danger-text)' },
    'ready':               { label: 'Ready for Publishing', badge: 'badge-gold', color: 'var(--accent-gold)' },
    'scheduled':           { label: 'Scheduled',         badge: 'badge-info',     color: 'var(--status-info-text)' },
    'published':           { label: 'Published',         badge: 'badge-success',  color: 'var(--status-success-text)' }
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
  // WORKFLOWS — WF01-WF07, real n8n automation names from the brief
  // ---------------------------------------------------------------------
  const WORKFLOWS = [
    {
      id: 'WF01', name: 'Strategy Generator',
      purpose: 'Generates the monthly content strategy, pillars and topic ideas from business goals + trend data.',
      state: 'idle', health: 'healthy',
      lastRun: d(0, 8, 4), avgDuration: 74, lastDuration: 58, successRate: 98.4,
      totalRuns30d: 32, errorCount24h: 0, errorCount7d: 0, nodeCount: 14,
      trigger: 'Schedule — Weekly, Mon 08:00',
      integrations: ['OpenAI', 'Google Sheets'],
      apiStatus: [{ name: 'OpenAI API', ok: true }, { name: 'Google Sheets API', ok: true }],
      logs: [
        { time: fmtDateTime(d(0, 8, 5)), level: 'success', message: 'Workflow completed. 8 strategy items generated for Q3 pillars.' },
        { time: fmtDateTime(d(0, 8, 4)), level: 'info', message: 'Fetching trend signals from Google Trends connector.' },
        { time: fmtDateTime(d(-7, 8, 4)), level: 'success', message: 'Workflow completed. 6 strategy items generated.' },
        { time: fmtDateTime(d(-14, 8, 6)), level: 'success', message: 'Workflow completed. 9 strategy items generated.' }
      ],
      timeline: [
        { node: 'Schedule Trigger', status: 'success', duration: '0.1s' },
        { node: 'Fetch Trends', status: 'success', duration: '4.2s' },
        { node: 'Generate Ideas (GPT-4)', status: 'success', duration: '38.6s' },
        { node: 'Score & Rank', status: 'success', duration: '2.1s' },
        { node: 'Write to Google Sheet', status: 'success', duration: '1.4s' },
        { node: 'Notify Telegram', status: 'success', duration: '0.8s' }
      ]
    },
    {
      id: 'WF02', name: 'Telegram Approval Center',
      purpose: 'Pushes generated content to Telegram for human review and captures approve/reject/edit decisions.',
      state: 'running', health: 'healthy',
      lastRun: d(0, 9, 12), avgDuration: 12, lastDuration: 9, successRate: 99.6,
      totalRuns30d: 214, errorCount24h: 0, errorCount7d: 1, nodeCount: 9,
      trigger: 'Webhook — Telegram Bot Update',
      integrations: ['Telegram', 'Supabase'],
      apiStatus: [{ name: 'Telegram Bot API', ok: true }, { name: 'Supabase', ok: true }],
      logs: [
        { time: fmtDateTime(d(0, 9, 12)), level: 'success', message: 'Approval received for #CP-1012 from @subhamoy.' },
        { time: fmtDateTime(d(0, 7, 40)), level: 'success', message: 'Sent 3 items to Telegram approval queue.' },
        { time: fmtDateTime(d(-1, 18, 2)), level: 'warning', message: 'Retry: Telegram API rate limit hit, resent after 4s.' },
        { time: fmtDateTime(d(-2, 11, 5)), level: 'success', message: 'Rejection received for #CP-0988, routed back to Prompt Generator.' }
      ],
      timeline: [
        { node: 'Telegram Webhook', status: 'success', duration: '0.1s' },
        { node: 'Parse Callback Data', status: 'success', duration: '0.2s' },
        { node: 'Update Content Status', status: 'success', duration: '0.6s' },
        { node: 'Notify Downstream Workflow', status: 'success', duration: '0.4s' }
      ]
    },
    {
      id: 'WF03', name: 'AI Prompt Generator',
      purpose: 'Builds structured image / video / caption prompts for each approved content item.',
      state: 'idle', health: 'warning',
      lastRun: d(0, 6, 20), avgDuration: 145, lastDuration: 210, successRate: 94.1,
      totalRuns30d: 118, errorCount24h: 1, errorCount7d: 3, nodeCount: 11,
      trigger: 'Event — Content Approved',
      integrations: ['OpenAI', 'Supabase'],
      apiStatus: [{ name: 'OpenAI API', ok: true }, { name: 'Supabase', ok: true }],
      logs: [
        { time: fmtDateTime(d(0, 6, 23)), level: 'error', message: 'Timeout generating video prompt for #CP-1025 — retried and succeeded.' },
        { time: fmtDateTime(d(0, 6, 20)), level: 'success', message: 'Generated static image + caption prompt for #CP-1024.' },
        { time: fmtDateTime(d(-1, 14, 12)), level: 'success', message: 'Generated carousel prompt set (5 slides) for #CP-1018.' }
      ],
      timeline: [
        { node: 'Content Approved Trigger', status: 'success', duration: '0.1s' },
        { node: 'Build Context', status: 'success', duration: '1.1s' },
        { node: 'Generate Visual Prompt', status: 'warning', duration: '186.4s' },
        { node: 'Generate Caption Prompt', status: 'success', duration: '18.2s' },
        { node: 'Write to Supabase', status: 'success', duration: '1.0s' }
      ]
    },
    {
      id: 'WF04', name: 'Content Asset Manager',
      purpose: 'Renders / fetches final image and video assets and syncs them to Supabase Storage + the asset library.',
      state: 'idle', health: 'healthy',
      lastRun: d(-1, 20, 5), avgDuration: 96, lastDuration: 88, successRate: 97.2,
      totalRuns30d: 96, errorCount24h: 0, errorCount7d: 2, nodeCount: 13,
      trigger: 'Event — Prompt Ready',
      integrations: ['Higgsfield', 'Supabase Storage', 'Google Drive'],
      apiStatus: [{ name: 'Higgsfield API', ok: true }, { name: 'Supabase Storage', ok: true }, { name: 'Google Drive', ok: true }],
      logs: [
        { time: fmtDateTime(d(-1, 20, 5)), level: 'success', message: '4 new visual assets synced to Asset Library.' },
        { time: fmtDateTime(d(-2, 16, 30)), level: 'success', message: 'Carousel render complete — 5 slides uploaded.' },
        { time: fmtDateTime(d(-3, 9, 15)), level: 'error', message: 'Storage upload failed (413) — asset resized and retried.' }
      ],
      timeline: [
        { node: 'Prompt Ready Trigger', status: 'success', duration: '0.1s' },
        { node: 'Generate / Fetch Asset', status: 'success', duration: '64.0s' },
        { node: 'Optimize to WebP', status: 'success', duration: '8.2s' },
        { node: 'Upload to Storage', status: 'success', duration: '11.6s' },
        { node: 'Register in Asset Library', status: 'success', duration: '1.2s' }
      ]
    },
    {
      id: 'WF05', name: 'Caption Generator',
      purpose: 'Writes platform-tuned captions, hashtags and SEO metadata for each content item.',
      state: 'running', health: 'healthy',
      lastRun: d(0, 9, 28), avgDuration: 22, lastDuration: 19, successRate: 99.1,
      totalRuns30d: 132, errorCount24h: 0, errorCount7d: 0, nodeCount: 8,
      trigger: 'Event — Asset Ready',
      integrations: ['OpenAI', 'Supabase'],
      apiStatus: [{ name: 'OpenAI API', ok: true }, { name: 'Supabase', ok: true }],
      logs: [
        { time: fmtDateTime(d(0, 9, 28)), level: 'success', message: 'Caption + hashtags generated for #CP-1030 (Instagram, Facebook).' },
        { time: fmtDateTime(d(0, 8, 55)), level: 'success', message: 'SEO meta description generated for #CP-1027 (Blog Post).' }
      ],
      timeline: [
        { node: 'Asset Ready Trigger', status: 'success', duration: '0.1s' },
        { node: 'Generate Caption', status: 'success', duration: '9.4s' },
        { node: 'Generate Hashtags', status: 'success', duration: '4.1s' },
        { node: 'Generate SEO Meta', status: 'success', duration: '5.0s' },
        { node: 'Mark Ready for Publishing', status: 'success', duration: '0.5s' }
      ]
    },
    {
      id: 'WF06', name: 'Social Media Publisher',
      purpose: 'Publishes / schedules ready content to Instagram, Facebook, Google Business and YouTube.',
      state: 'error', health: 'critical',
      lastRun: d(0, 7, 2), avgDuration: 18, lastDuration: 6, successRate: 92.8,
      totalRuns30d: 89, errorCount24h: 2, errorCount7d: 4, nodeCount: 10,
      trigger: 'Schedule — Every 15 min',
      integrations: ['Meta Graph API', 'Google Business Profile', 'YouTube Data API'],
      apiStatus: [{ name: 'Meta Graph API', ok: false }, { name: 'Google Business API', ok: true }, { name: 'YouTube Data API', ok: true }],
      logs: [
        { time: fmtDateTime(d(0, 7, 2)), level: 'error', message: 'Failed to publish #CP-0949 to Instagram — Meta Graph API returned 401 (token expired).' },
        { time: fmtDateTime(d(0, 6, 45)), level: 'success', message: 'Published #CP-0948 to Google Business.' },
        { time: fmtDateTime(d(-1, 22, 10)), level: 'error', message: 'Failed to publish #CP-0937 — Meta Graph API rate limited.' }
      ],
      timeline: [
        { node: 'Schedule Trigger', status: 'success', duration: '0.1s' },
        { node: 'Fetch Due Content', status: 'success', duration: '0.6s' },
        { node: 'Publish to Meta', status: 'error', duration: '2.8s' },
        { node: 'Publish to Google Business', status: 'success', duration: '1.9s' },
        { node: 'Update Status + Notify', status: 'success', duration: '0.4s' }
      ]
    },
    {
      id: 'WF07', name: 'Telegram Command Center',
      purpose: 'Handles operator commands from Telegram (status checks, manual triggers, pause/resume workflows).',
      state: 'idle', health: 'healthy',
      lastRun: d(-2, 13, 0), avgDuration: 3, lastDuration: 2, successRate: 100,
      totalRuns30d: 41, errorCount24h: 0, errorCount7d: 0, nodeCount: 6,
      trigger: 'Webhook — Telegram Command',
      integrations: ['Telegram'],
      apiStatus: [{ name: 'Telegram Bot API', ok: true }],
      logs: [
        { time: fmtDateTime(d(-2, 13, 0)), level: 'success', message: '/status command processed — replied with system summary.' },
        { time: fmtDateTime(d(-5, 10, 30)), level: 'success', message: '/pause WF06 command processed.' }
      ],
      timeline: [
        { node: 'Telegram Command Webhook', status: 'success', duration: '0.1s' },
        { node: 'Parse Command', status: 'success', duration: '0.1s' },
        { node: 'Route to Handler', status: 'success', duration: '0.3s' },
        { node: 'Reply to Telegram', status: 'success', duration: '0.4s' }
      ]
    }
  ];

  // ---------------------------------------------------------------------
  // CONTENT ITEMS — spans the full production pipeline
  // ---------------------------------------------------------------------
  const realAsset = (name) => 'digital_marketing_assets/' + name;

  const CONTENT_ITEMS = [
    // -- Generated --------------------------------------------------
    { id: 'CP-1024', title: 'Vastu Tips for East Facing Entrance', type: 'Carousel', pillar: 'Educational', platform: 'Instagram', priority: 'low', status: 'generated', createdDate: d(-1), publishDate: null, hook: 'Your front door might be sabotaging your luck.', cta: 'Save this for your next home tour.', strategyId: 'ST-Q3-26-011' },
    { id: 'CP-1025', title: 'Minimalist Living Room Tour', type: 'Reel', pillar: 'Portfolio', platform: 'Instagram', priority: 'med', status: 'generated', createdDate: d(-1), publishDate: null, hook: 'This 480 sq ft living room feels twice the size.', cta: 'DM us for a free layout consult.', strategyId: 'ST-Q3-26-011' },
    { id: 'CP-1026', title: '5 Signs You Need to Redesign Your Kitchen', type: 'Carousel', pillar: 'Educational', platform: 'Facebook', priority: 'med', status: 'generated', createdDate: d(-1), publishDate: null, hook: 'Sign #3 is the one everyone ignores.', cta: 'Book a free kitchen consult.', strategyId: 'ST-Q3-26-012' },
    { id: 'CP-1027', title: 'Smart Home Integrations in Newtown', type: 'Blog Post', pillar: 'SEO', platform: 'Blog', priority: 'low', status: 'generated', createdDate: d(0), publishDate: null, hook: 'A homeowner’s guide to smart lighting & automation in Kolkata.', cta: 'Read the full guide.', strategyId: 'ST-Q3-26-012' },
    { id: 'CP-1028', title: 'Behind the Scenes: Site Visit Day', type: 'Static Image', pillar: 'Brand Awareness', platform: 'Instagram', priority: 'low', status: 'generated', createdDate: d(0), publishDate: null, hook: 'Where the magic actually happens.', cta: 'Follow along on our journey.', strategyId: 'ST-Q3-26-013' },
    { id: 'CP-1029', title: 'Color Psychology in Bedroom Design', type: 'Carousel', pillar: 'Educational', platform: 'Instagram', priority: 'med', status: 'generated', createdDate: d(0), publishDate: null, hook: 'The wrong wall color is costing you sleep.', cta: 'Swipe for our top 5 palettes.', strategyId: 'ST-Q3-26-013' },

    // -- Awaiting Approval -------------------------------------------
    { id: 'CP-1022', title: 'Luxury Wardrobe Reveal', type: 'Reel', pillar: 'Social Proof', platform: 'Instagram', priority: 'high', status: 'awaiting-approval', createdDate: d(-2), publishDate: null, hook: 'She said this wardrobe changed her mornings.', cta: 'Book a free consultation today!', strategyId: 'ST-Q3-26-010', reviewerRemarks: null },
    { id: 'CP-1023', title: 'Top 5 Lighting Ideas for Small Apartments', type: 'Carousel', pillar: 'Design Advice', platform: 'Instagram', priority: 'med', status: 'awaiting-approval', createdDate: d(-2), publishDate: null, hook: 'Small space, big glow-up.', cta: 'Save this for your next reno.', strategyId: 'ST-Q3-26-010', reviewerRemarks: 'Check slide 3 — gold accent too warm.' },
    { id: 'CP-1030', title: 'Client Testimonial: Sharma Residence', type: 'Youtube Short', pillar: 'Social Proof', platform: 'YouTube', priority: 'high', status: 'awaiting-approval', createdDate: d(-1), publishDate: null, hook: 'They almost didn’t renovate. Here’s why they’re glad they did.', cta: 'Watch the full transformation.', strategyId: 'ST-Q3-26-011' },
    { id: 'CP-1031', title: 'Festive Season Offer Announcement', type: 'Carousel', pillar: 'Sales', platform: 'Instagram', priority: 'high', status: 'awaiting-approval', createdDate: d(-1), publishDate: null, hook: 'Our biggest festive offer yet.', cta: 'Lock your slot before Aug 1.', strategyId: 'ST-Q3-26-011' },
    { id: 'CP-1032', title: 'Vastu Shastra Basics for New Homeowners', type: 'Blog Post', pillar: 'Educational', platform: 'Blog', priority: 'low', status: 'awaiting-approval', createdDate: d(-3), publishDate: null, hook: 'Everything a first-time homeowner needs to know about Vastu.', cta: 'Read the full breakdown.', strategyId: 'ST-Q3-26-009' },

    // -- Approved ------------------------------------------------------
    { id: 'CP-1019', title: 'Home Office Setup for Remote Workers', type: 'Static Image', pillar: 'Design Advice', platform: 'Instagram', priority: 'med', status: 'approved', createdDate: d(-4), publishDate: null, hook: 'Work from home without it looking like it.', cta: 'DM us your dimensions for a free layout.', strategyId: 'ST-Q3-26-008' },
    { id: 'CP-1020', title: 'Before & After: Ballygunge Apartment', type: 'Carousel', pillar: 'Portfolio', platform: 'Facebook', priority: 'high', status: 'approved', createdDate: d(-4), publishDate: null, hook: 'Same 4 walls. Completely different life.', cta: 'See more transformations in our bio.', strategyId: 'ST-Q3-26-008' },
    { id: 'CP-1021', title: 'Sustainable Materials We Swear By', type: 'Static Image', pillar: 'Educational', platform: 'Instagram', priority: 'low', status: 'approved', createdDate: d(-3), publishDate: null, hook: 'Design that’s kind to the planet, too.', cta: 'Ask us about eco-friendly options.', strategyId: 'ST-Q3-26-009' },

    // -- Waiting for Assets ---------------------------------------------
    { id: 'CP-1018', title: '5 Mistakes to Avoid in Kitchen Design', type: 'Static Image', pillar: 'Educational', platform: 'Instagram', priority: 'med', status: 'waiting-assets', createdDate: d(-5), publishDate: null, hook: 'Mistake #4 is in almost every Kolkata kitchen.', cta: 'Book a free kitchen audit.', strategyId: 'ST-Q3-26-007', error: 'Missing final thumbnail render' },
    { id: 'CP-1016', title: 'Balcony Garden Ideas for City Homes', type: 'Carousel', pillar: 'Design Advice', platform: 'Instagram', priority: 'low', status: 'waiting-assets', createdDate: d(-6), publishDate: null, hook: 'Yes, even a 6x4 balcony can be a green escape.', cta: 'Swipe for the full plant list.', strategyId: 'ST-Q3-26-006' },
    { id: 'CP-1017', title: 'Modular Wardrobe vs Carpenter-Made', type: 'Reel', pillar: 'Educational', platform: 'Instagram', priority: 'med', status: 'waiting-assets', createdDate: d(-6), publishDate: null, hook: 'The comparison nobody in the industry wants you to see.', cta: 'Get a free cost estimate.', strategyId: 'ST-Q3-26-006', error: 'Video render pending from WF04' },
    { id: 'CP-1015', title: 'Client Q&A: Budgeting for a Full Home Reno', type: 'Blog Post', pillar: 'Educational', platform: 'Blog', priority: 'low', status: 'waiting-assets', createdDate: d(-7), publishDate: null, hook: 'What does a full home renovation actually cost in 2026?', cta: 'Get a personalized quote.', strategyId: 'ST-Q3-26-005' },

    // -- Ready for Publishing -------------------------------------------
    { id: 'CP-1012', title: 'Founders Story - Subhamoy & Trisha', type: 'Static Image', pillar: 'Brand Awareness', platform: 'Instagram', priority: 'med', status: 'ready', createdDate: d(-8), publishDate: null, hook: 'Meet the minds behind Ta Panda’s precision.', cta: 'Book a free consultation today!', strategyId: 'ST-Q3-26-004', reviewerRemarks: 'Ensure the gold accents match brand guidelines.', caption: 'Designing spaces isn’t just about placing furniture—it’s about engineering an experience.\n\nMeet Subhamoy and Trisha, the founders of Ta Panda Innovation. With a relentless focus on precision and aesthetic intelligence, they’ve built a studio where luxury meets practicality.\n\nEvery sketch is a promise. Every executed project is that promise kept.\n\nAre you ready to transform your space? Book a free consultation via the link in our bio! ✨', hashtags: '#TaPandaInnovation #InteriorDesignKolkata #LuxuryInteriors #DesignFounders #ArchitectureKolkata #PremiumDesign', seoMeta: 'Meet Subhamoy and Trisha, founders of Ta Panda Innovation, Kolkata’s premier interior design studio specializing in precision and luxury.', imagePromptText: 'Professional dual portrait of an Indian male and female interior designer team. Modern, minimalist office setting with subtle gold and black architectural accents. High-end architectural photography style, natural lighting, 85mm lens, depth of field.', thumbnail: 'images/founders.webp' },
    { id: 'CP-1013', title: 'Marble vs Granite: What Should You Choose?', type: 'Carousel', pillar: 'Educational', platform: 'Instagram', priority: 'low', status: 'ready', createdDate: d(-8), publishDate: null, hook: 'The countertop debate, finally settled.', cta: 'Swipe to find your match.', strategyId: 'ST-Q3-26-004' },
    { id: 'CP-1014', title: 'A Day at Ta Panda Studio', type: 'Reel', pillar: 'Brand Awareness', platform: 'Instagram', priority: 'low', status: 'ready', createdDate: d(-9), publishDate: null, hook: 'From mood board to blueprint in 60 seconds.', cta: 'Follow for more behind-the-scenes.', strategyId: 'ST-Q3-26-003' },

    // -- Scheduled --------------------------------------------------------
    { id: 'CP-1008', title: 'Festive Season Offer Announcement', type: 'Carousel', pillar: 'Sales', platform: 'Instagram', priority: 'high', status: 'scheduled', createdDate: d(-10), publishDate: d(-5, 10, 0), hook: 'Our biggest festive offer yet.', cta: 'Lock your slot before Aug 1.' },
    { id: 'CP-1009', title: 'Smart Home Integrations in Newtown', type: 'Blog Post', pillar: 'SEO', platform: 'Blog', priority: 'low', status: 'scheduled', createdDate: d(-10), publishDate: d(-4, 9, 0) },
    { id: 'CP-1010', title: 'Minimalist Kitchen Tips', type: 'Reel', pillar: 'Design Advice', platform: 'Instagram', priority: 'med', status: 'scheduled', createdDate: d(-11), publishDate: d(-1, 8, 30), thumbnail: realAsset('CNT-20260704-001_STATICPOST_20260707111529.jpg') },
    { id: 'CP-1033', title: 'Luxury Bedroom Tour', type: 'Static Image', pillar: 'Portfolio', platform: 'Facebook', priority: 'med', status: 'scheduled', createdDate: d(-9), publishDate: d(2, 11, 0) },
    { id: 'CP-1034', title: '5 Lighting Ideas for Compact Homes', type: 'Carousel', pillar: 'Design Advice', platform: 'Instagram', priority: 'low', status: 'scheduled', createdDate: d(-9), publishDate: d(3, 10, 0), error: 'Missing carousel slide 4/5' },
    { id: 'CP-1035', title: 'Client Testimonial: Roy Family', type: 'Youtube Short', pillar: 'Social Proof', platform: 'YouTube', priority: 'high', status: 'scheduled', createdDate: d(-8), publishDate: d(4, 12, 0) },
    { id: 'CP-1036', title: 'Vastu for South Facing Homes', type: 'Carousel', pillar: 'Educational', platform: 'Instagram', priority: 'med', status: 'scheduled', createdDate: d(-8), publishDate: d(5, 9, 30) },
    { id: 'CP-1037', title: 'Kitchen Renovation Cost Breakdown', type: 'Blog Post', pillar: 'SEO', platform: 'Blog', priority: 'low', status: 'scheduled', createdDate: d(-7), publishDate: d(6, 9, 0) },
    { id: 'CP-1038', title: 'Monsoon-Proofing Your Balcony', type: 'Static Image', pillar: 'Educational', platform: 'Instagram', priority: 'low', status: 'scheduled', createdDate: d(-7), publishDate: d(6, 17, 0) },
    { id: 'CP-1039', title: 'Client Walkthrough: Newtown Duplex', type: 'Reel', pillar: 'Portfolio', platform: 'Instagram', priority: 'high', status: 'scheduled', createdDate: d(-6), publishDate: d(8, 10, 0) },
    { id: 'CP-1040', title: 'Ask the Designer: Q&A Live Recap', type: 'Static Image', pillar: 'Brand Awareness', platform: 'Facebook', priority: 'low', status: 'scheduled', createdDate: d(-6), publishDate: d(9, 14, 0) },
    { id: 'CP-1041', title: 'False Ceiling Trends for 2026', type: 'Carousel', pillar: 'Design Advice', platform: 'Instagram', priority: 'med', status: 'scheduled', createdDate: d(-5), publishDate: d(10, 10, 0) },
    { id: 'CP-1042', title: 'Studio Apartment Hacks', type: 'Reel', pillar: 'Educational', platform: 'Instagram', priority: 'med', status: 'scheduled', createdDate: d(-5), publishDate: d(11, 9, 0) },
    { id: 'CP-1043', title: 'Google Business Q3 Update', type: 'Static Image', pillar: 'Update', platform: 'Google Business', priority: 'low', status: 'scheduled', createdDate: d(-4), publishDate: d(12, 8, 0) },
    { id: 'CP-1044', title: 'Wardrobe Organization Tips', type: 'Carousel', pillar: 'Educational', platform: 'Instagram', priority: 'low', status: 'scheduled', createdDate: d(-4), publishDate: d(10, 15, 0) },
    { id: 'CP-1045', title: 'Top 5 Lighting Ideas', type: 'Carousel', pillar: 'Design Advice', platform: 'Instagram', priority: 'med', status: 'scheduled', createdDate: d(-3), publishDate: d(0, 18, 0), error: 'Error: Missing asset' },

    // -- Published ----------------------------------------------------
    { id: 'CP-0995', title: 'Welcome to Ta Panda Business OS', type: 'Static Image', pillar: 'Update', platform: 'Instagram', priority: 'med', status: 'published', createdDate: d(-12), publishDate: d(-11, 9, 0), thumbnail: 'images/tapanda_favicon.webp' },
    { id: 'CP-0988', title: 'Client Testimonial: Ghosh Residence', type: 'Youtube Short', pillar: 'Social Proof', platform: 'YouTube', priority: 'high', status: 'published', createdDate: d(-14), publishDate: d(-12, 10, 0) },
    { id: 'CP-0949', title: 'Vastu Tips for South West Corner', type: 'Carousel', pillar: 'Educational', platform: 'Instagram', priority: 'med', status: 'published', createdDate: d(-16), publishDate: d(-14, 9, 0), thumbnail: realAsset('CNT-20260709-001_STATICPOST_20260710083953.jpg') },
    { id: 'CP-0937', title: 'Modern Pooja Room Ideas', type: 'Static Image', pillar: 'Design Advice', platform: 'Instagram', priority: 'low', status: 'published', createdDate: d(-17), publishDate: d(-15, 11, 0), thumbnail: realAsset('CNT-20260709-003_STATICPOST_20260710110134.jpg') },
    { id: 'CP-0921', title: 'Founders on Design Philosophy', type: 'Blog Post', pillar: 'Brand Awareness', platform: 'Blog', priority: 'low', status: 'published', createdDate: d(-20), publishDate: d(-18, 9, 0) },
    { id: 'CP-0908', title: 'Carousel: 5 Statement Ceiling Designs', type: 'Carousel', pillar: 'Design Advice', platform: 'Instagram', priority: 'med', status: 'published', createdDate: d(-22), publishDate: d(-20, 10, 0), thumbnail: realAsset('CNT-20260704-003_CAROUSEL_SLIDE1_20260708054533.jpg') }
  ];

  // ---------------------------------------------------------------------
  // ASSETS — Asset Library dataset (mix of real project files + brand assets)
  // ---------------------------------------------------------------------
  const ASSETS = [
    { id: 'AST-2041', filename: 'CNT-20260709-006_STATICPOST.jpg', type: 'image', url: realAsset('CNT-20260709-006_STATICPOST_20260713083313.jpg'), dimensions: '1080x1350', size: '412 KB', uploadedDate: d(-5), usedIn: [], versions: [{ v: 2, date: d(-5), note: 'Color-corrected for brand gold tone' }, { v: 1, date: d(-6), note: 'Initial render' }] },
    { id: 'AST-2040', filename: 'CNT-20260709-003_STATICPOST.jpg', type: 'image', url: realAsset('CNT-20260709-003_STATICPOST_20260710110134.jpg'), dimensions: '1080x1350', size: '388 KB', uploadedDate: d(-8), usedIn: ['CP-0937'], versions: [{ v: 1, date: d(-8), note: 'Initial render' }] },
    { id: 'AST-2039', filename: 'CNT-20260709-001_STATICPOST.jpg', type: 'image', url: realAsset('CNT-20260709-001_STATICPOST_20260710083953.jpg'), dimensions: '1080x1350', size: '401 KB', uploadedDate: d(-8), usedIn: ['CP-0949'], versions: [{ v: 1, date: d(-8), note: 'Initial render' }] },
    { id: 'AST-2038', filename: 'CNT-20260704-006_STATICPOST.jpg', type: 'image', url: realAsset('CNT-20260704-006_STATICPOST_20260709161450.jpg'), dimensions: '1080x1350', size: '395 KB', uploadedDate: d(-13), usedIn: [], versions: [{ v: 1, date: d(-13), note: 'Initial render' }] },
    { id: 'AST-2037', filename: 'CNT-20260704-003_CAROUSEL.jpg', type: 'carousel', url: realAsset('CNT-20260704-003_CAROUSEL_SLIDE1_20260708054533.jpg'), slides: [
        realAsset('CNT-20260704-003_CAROUSEL_SLIDE1_20260708054533.jpg'),
        realAsset('CNT-20260704-003_CAROUSEL_SLIDE2_20260708054541.jpg'),
        realAsset('CNT-20260704-003_CAROUSEL_SLIDE3_20260708054559.jpg'),
        realAsset('CNT-20260704-003_CAROUSEL_SLIDE4_20260708054610.jpg'),
        realAsset('CNT-20260704-003_CAROUSEL_SLIDE5_20260708054632.jpg')
      ], dimensions: '1080x1350', size: '1.9 MB (5 slides)', uploadedDate: d(-14), usedIn: ['CP-0908'], versions: [{ v: 1, date: d(-14), note: 'Initial 5-slide set' }] },
    { id: 'AST-2036', filename: 'CNT-20260704-001_STATICPOST.jpg', type: 'image', url: realAsset('CNT-20260704-001_STATICPOST_20260707111529.jpg'), dimensions: '1080x1350', size: '378 KB', uploadedDate: d(-16), usedIn: ['CP-1010'], versions: [{ v: 1, date: d(-16), note: 'Initial render' }] },
    { id: 'AST-2035', filename: 'founders.webp', type: 'image', url: 'images/founders.webp', dimensions: '1600x1200', size: '210 KB', uploadedDate: d(-30), usedIn: ['CP-1012'], versions: [{ v: 1, date: d(-30), note: 'Studio photoshoot' }] },
    { id: 'AST-2034', filename: 'hero-bg.webp', type: 'image', url: 'images/hero-bg.webp', dimensions: '2560x1440', size: '540 KB', uploadedDate: d(-60), usedIn: [], versions: [{ v: 1, date: d(-60), note: 'Website hero background' }] },
    { id: 'AST-2033', filename: 'social_banner.webp', type: 'image', url: 'images/social_banner.webp', dimensions: '1920x1080', size: '330 KB', uploadedDate: d(-45), usedIn: [], versions: [{ v: 1, date: d(-45), note: 'Social profile banner' }] },
    { id: 'AST-2032', filename: 'value_slide_1.webp', type: 'image', url: 'images/value_slide_1.webp', dimensions: '1080x1350', size: '190 KB', uploadedDate: d(-40), usedIn: [], versions: [{ v: 1, date: d(-40) }] },
    { id: 'AST-2031', filename: 'value_slide_2.webp', type: 'image', url: 'images/value_slide_2.webp', dimensions: '1080x1350', size: '188 KB', uploadedDate: d(-40), usedIn: [], versions: [{ v: 1, date: d(-40) }] },
    { id: 'AST-2030', filename: 'value_slide_3.webp', type: 'image', url: 'images/value_slide_3.webp', dimensions: '1080x1350', size: '195 KB', uploadedDate: d(-40), usedIn: [], versions: [{ v: 1, date: d(-40) }] },
    { id: 'AST-2029', filename: 'Founders_Studio_Walkthrough.mp4', type: 'video', url: 'images/founders.webp', duration: '0:42', dimensions: '1080x1920', size: '18.4 MB', uploadedDate: d(-9), usedIn: ['CP-1014'], versions: [{ v: 1, date: d(-9), note: 'Raw cut from WF04' }] },
    { id: 'AST-2028', filename: 'Ballygunge_Before_After.mp4', type: 'video', url: 'images/projects_bg.webp', duration: '1:05', dimensions: '1080x1920', size: '26.1 MB', uploadedDate: d(-4), usedIn: ['CP-1020'], versions: [{ v: 1, date: d(-4) }] },
    { id: 'AST-2027', filename: 'Sharma_Testimonial.mp4', type: 'video', url: 'images/values_bg.webp', duration: '0:58', dimensions: '1080x1920', size: '22.7 MB', uploadedDate: d(-1), usedIn: ['CP-1030'], versions: [{ v: 1, date: d(-1) }] },
    { id: 'AST-2026', filename: 'tapanda_favicon.webp', type: 'thumbnail', url: 'images/tapanda_favicon.webp', dimensions: '512x512', size: '18 KB', uploadedDate: d(-90), usedIn: ['CP-0995'], versions: [{ v: 1, date: d(-90) }] },
    { id: 'AST-2025', filename: 'value_slide_4.webp', type: 'image', url: 'images/value_slide_4.webp', dimensions: '1080x1350', size: '201 KB', uploadedDate: d(-40), usedIn: [], versions: [{ v: 1, date: d(-40) }] },
    { id: 'AST-2024', filename: 'value_slide_5.webp', type: 'image', url: 'images/value_slide_5.webp', dimensions: '1080x1350', size: '199 KB', uploadedDate: d(-40), usedIn: [], versions: [{ v: 1, date: d(-40) }] }
  ];

  // ---------------------------------------------------------------------
  // PROMPTS — Prompt Library dataset, grouped by category
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
  // NOTIFICATIONS
  // ---------------------------------------------------------------------
  const NOTIFICATIONS = [
    { id: 'N1', type: 'error', title: 'WF06 publish failure', message: 'Social Media Publisher failed to post #CP-0949 to Instagram — Meta token expired.', time: d(0, 7, 2), read: false },
    { id: 'N2', type: 'approval', title: 'Approval needed', message: '5 items are waiting in the Telegram approval queue.', time: d(0, 6, 20), read: false },
    { id: 'N3', type: 'success', title: 'Assets synced', message: 'Content Asset Manager synced 4 new visuals to the Asset Library.', time: d(-1, 20, 5), read: false },
    { id: 'N4', type: 'success', title: 'Published', message: '#CP-0995 published successfully to Instagram.', time: d(-1, 9, 0), read: true },
    { id: 'N5', type: 'warning', title: 'Content gap detected', message: 'No content scheduled for Jul 24 — 6 days from now.', time: d(-1, 8, 0), read: true },
    { id: 'N6', type: 'info', title: 'Strategy generated', message: 'Strategy Generator produced 8 new pillar ideas for Q3.', time: d(-2, 8, 5), read: true },
    { id: 'N7', type: 'warning', title: 'Approval SLA at risk', message: '#CP-1022 has been awaiting approval for 46 hours.', time: d(-2, 12, 0), read: true },
    { id: 'N8', type: 'success', title: 'Workflow healthy', message: 'All 7 workflows completed their scheduled runs without error this week.', time: d(-4, 9, 0), read: true }
  ];

  // ---------------------------------------------------------------------
  // ACTIVITY LOG
  // ---------------------------------------------------------------------
  const ACTIVITY_LOG = [
    { id: 'A1', icon: 'check', tone: 'default', text: '<strong>Caption Generator</strong> generated captions + hashtags for 3 items.', time: d(0, 9, 28) },
    { id: 'A2', icon: 'error', tone: 'danger', text: '<strong>Social Media Publisher</strong> failed to publish #CP-0949 to Instagram.', time: d(0, 7, 2) },
    { id: 'A3', icon: 'clock', tone: 'default', text: '<strong>Strategy Generator</strong> produced 8 new strategy items for Q3.', time: d(0, 8, 5) },
    { id: 'A4', icon: 'check', tone: 'success', text: '<strong>Asset Library</strong> sync completed — 4 new visuals found.', time: d(-1, 20, 5) },
    { id: 'A5', icon: 'check', tone: 'success', text: '<strong>Published</strong> "#CP-0995" successfully to Instagram.', time: d(-1, 9, 0) },
    { id: 'A6', icon: 'approve', tone: 'default', text: '<strong>Approval received</strong> for #CP-1012 from @subhamoy via Telegram.', time: d(-1, 18, 40) },
    { id: 'A7', icon: 'error', tone: 'danger', text: '<strong>Workflow failed</strong> during video rendering for #CP-1025.', time: d(-1, 14, 12) },
    { id: 'A8', icon: 'upload', tone: 'default', text: '<strong>Content Asset Manager</strong> uploaded a 5-slide carousel render.', time: d(-2, 16, 30) },
    { id: 'A9', icon: 'reject', tone: 'default', text: '<strong>Rejection received</strong> for #CP-0988, routed back to Prompt Generator.', time: d(-2, 11, 5) },
    { id: 'A10', icon: 'check', tone: 'success', text: '<strong>Published</strong> "#CP-0988" successfully to YouTube.', time: d(-3, 10, 0) },
    { id: 'A11', icon: 'clock', tone: 'default', text: '<strong>AI Prompt Generator</strong> generated a carousel prompt set (5 slides) for #CP-1018.', time: d(-3, 14, 12) },
    { id: 'A12', icon: 'check', tone: 'default', text: '<strong>Telegram Command Center</strong> processed a /status command.', time: d(-4, 13, 0) }
  ];

  // ---------------------------------------------------------------------
  // ANALYTICS — chart series keyed by range
  // ---------------------------------------------------------------------
  function buildHeatmapWeeks(weeks) {
    const cells = [];
    const start = addDays(TODAY, -(weeks * 7) + 1);
    for (let i = 0; i < weeks * 7; i++) {
      const date = addDays(start, i);
      const dow = date.getDay();
      let count = 0;
      const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      if (dow === 0) count = 0;
      else if (r > 0.55) count = 2;
      else if (r > 0.25) count = 1;
      cells.push({ date: toISODate(date), count });
    }
    return cells;
  }

  const ANALYTICS = {
    '7d': {
      publishingTrend: [{ l: 'Mon', v: 3 }, { l: 'Tue', v: 5 }, { l: 'Wed', v: 2 }, { l: 'Thu', v: 6 }, { l: 'Fri', v: 4 }, { l: 'Sat', v: 7 }, { l: 'Sun', v: 3 }],
      approvalVelocity: [{ l: 'Mon', v: 6.2 }, { l: 'Tue', v: 4.8 }, { l: 'Wed', v: 5.1 }, { l: 'Thu', v: 3.9 }, { l: 'Fri', v: 4.4 }, { l: 'Sat', v: 7.8 }, { l: 'Sun', v: 8.1 }],
      productionVelocity: [{ l: 'Mon', v: 4 }, { l: 'Tue', v: 6 }, { l: 'Wed', v: 5 }, { l: 'Thu', v: 8 }, { l: 'Fri', v: 6 }, { l: 'Sat', v: 3 }, { l: 'Sun', v: 2 }],
      leadGeneration: [{ l: 'Mon', v: 2 }, { l: 'Tue', v: 4 }, { l: 'Wed', v: 3 }, { l: 'Thu', v: 6 }, { l: 'Fri', v: 5 }, { l: 'Sat', v: 8 }, { l: 'Sun', v: 4 }]
    },
    '30d': {
      publishingTrend: [{ l: 'W1', v: 18 }, { l: 'W2', v: 22 }, { l: 'W3', v: 19 }, { l: 'W4', v: 27 }],
      approvalVelocity: [{ l: 'W1', v: 6.1 }, { l: 'W2', v: 5.4 }, { l: 'W3', v: 4.9 }, { l: 'W4', v: 4.2 }],
      productionVelocity: [{ l: 'W1', v: 24 }, { l: 'W2', v: 29 }, { l: 'W3', v: 26 }, { l: 'W4', v: 34 }],
      leadGeneration: [{ l: 'W1', v: 14 }, { l: 'W2', v: 19 }, { l: 'W3', v: 17 }, { l: 'W4', v: 25 }]
    },
    '90d': {
      publishingTrend: [{ l: 'May', v: 62 }, { l: 'Jun', v: 78 }, { l: 'Jul', v: 86 }],
      approvalVelocity: [{ l: 'May', v: 7.4 }, { l: 'Jun', v: 6.0 }, { l: 'Jul', v: 4.8 }],
      productionVelocity: [{ l: 'May', v: 71 }, { l: 'Jun', v: 89 }, { l: 'Jul', v: 96 }],
      leadGeneration: [{ l: 'May', v: 41 }, { l: 'Jun', v: 58 }, { l: 'Jul', v: 63 }]
    },
    contentMix: [
      { l: 'Carousel', v: 34, color: '#c39a5c' },
      { l: 'Reel', v: 24, color: '#8fb4de' },
      { l: 'Static Image', v: 22, color: '#8fcf9f' },
      { l: 'Blog Post', v: 12, color: '#e59a9a' },
      { l: 'Youtube Short', v: 8, color: '#c9a3d9' }
    ],
    platformDistribution: [
      { l: 'Instagram', v: 52, color: '#c9a3d9' },
      { l: 'Facebook', v: 21, color: '#8fb4de' },
      { l: 'Blog', v: 14, color: '#e0b884' },
      { l: 'Google Business', v: 8, color: '#8fcf9f' },
      { l: 'YouTube', v: 5, color: '#e59a9a' }
    ],
    monthlyPerformance: [
      { l: 'Feb', v: 58 }, { l: 'Mar', v: 64 }, { l: 'Apr', v: 71 }, { l: 'May', v: 69 }, { l: 'Jun', v: 82 }, { l: 'Jul', v: 88 }
    ],
    contentTypeAnalysis: [
      { l: 'Carousel', v: 8.4 }, { l: 'Reel', v: 11.2 }, { l: 'Static Image', v: 5.6 }, { l: 'Blog Post', v: 2.1 }, { l: 'Youtube Short', v: 9.8 }
    ],
    publicationFrequency: buildHeatmapWeeks(13)
  };

  // ---------------------------------------------------------------------
  // KPI card definitions — shared by Dashboard + Content Planner
  // ---------------------------------------------------------------------
  const KPI_DEFS = [
    { key: 'generated', label: 'Generated', bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', trend: 'up', trendText: '+12% this week',
      icon: '<polyline points="20 6 9 17 4 12"></polyline>' },
    { key: 'awaiting-approval', label: 'Awaiting Approval', bg: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', trend: '', trendText: 'Since yesterday',
      icon: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>' },
    { key: 'waiting-assets', label: 'Waiting for Assets', bg: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', trend: 'down', trendText: '-2 this week',
      icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>' },
    { key: 'ready', label: 'Ready for Publishing', bg: 'var(--accent-gold-light)', color: 'var(--accent-gold)', trend: '', trendText: 'Needs scheduling',
      icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' },
    { key: 'scheduled', label: 'Scheduled', bg: 'var(--status-info-bg)', color: 'var(--status-info-text)', trend: '', trendText: 'Stable buffer',
      icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' },
    { key: 'published', label: 'Published', bg: 'var(--status-success-bg)', color: 'var(--status-success-text)', trend: 'up', trendText: '+45 this month',
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
    { key: 'published', label: 'Published' }
  ];

  // ---------------------------------------------------------------------
  // Derived KPI counts (kept in sync with CONTENT_ITEMS automatically)
  // ---------------------------------------------------------------------
  function getCounts() {
    const counts = { generated: 0, 'awaiting-approval': 0, approved: 0, 'waiting-assets': 0, ready: 0, scheduled: 0, published: 0, errors: 0 };
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

  // Last day with any scheduled/published content (used by "Content Planned Until")
  function getPlanningHorizon() {
    const future = CONTENT_ITEMS.filter((c) => c.publishDate && c.status === 'scheduled')
      .map((c) => new Date(c.publishDate));
    if (!future.length) return TODAY;
    return new Date(Math.max.apply(null, future));
  }

  window.OSData = {
    TODAY, addDays, addHours, toISODate, fmtDate, fmtDateShort, fmtTime, fmtDateTime, timeAgo,
    STATUS_META, TYPE_META, PLATFORM_META, PROMPT_CATEGORIES, KPI_DEFS, STATUS_COLUMNS,
    WORKFLOWS, CONTENT_ITEMS, ASSETS, PROMPTS, NOTIFICATIONS, ACTIVITY_LOG, ANALYTICS,
    getCounts, getWorkflow, getContentItem, getAsset, getPrompt, getPlanningHorizon
  };
})();
