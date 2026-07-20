/*
  Ta Panda Business OS — Live Backend Adapter (Phase 4)
  -------------------------------------------------------
  Talks to the "WF08 - Business OS Gateway" n8n workflow, which reads/writes
  the real TPI_Project01_DB Google Sheet using the exact same Status
  transitions WF02's Telegram approval buttons already write. This file owns
  every network call and every raw-row -> UI-shape transform; os-data.js
  consumes the transformed result and never talks to the network directly.

  Load this file BEFORE os-data.js.
*/

(function () {
  'use strict';

  const GATEWAY_BASE = 'https://automation.tapanda.in/webhook';
  const GATEWAY_KEY = 'd30af783861313b5ffeecfc50112f4116fd83d669a0b10b5';

  const EDITABLE_FIELDS = ['Topic', 'Hook', 'CTA', 'Caption', 'Hashtags'];

  const CONTENT_TYPE_MAP = {
    'Static Post': 'Static Image',
    'Reel': 'Reel',
    'Carousel': 'Carousel'
  };

  const STATUS_MAP = {
    'Generated': 'generated',
    'Awaiting Approval': 'awaiting-approval',
    'Edited': 'awaiting-approval',
    'Approved': 'approved',
    'Waiting for Assets': 'waiting-assets',
    'Ready for Publishing': 'ready',
    'Scheduled': 'scheduled',
    'Published': 'published',
    'Rejected': 'rejected',
    'Publish Failed': 'scheduled',
    'Publish Failed - Needs Review': 'scheduled'
  };

  const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

  function parseDateTime(dateStr, timeStr) {
    if (!dateStr) return null;
    const trimmed = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(trimmed);
    if (m) {
      const day = parseInt(m[1], 10);
      const mon = MONTHS[m[2]];
      const year = parseInt(m[3], 10);
      let hh = 0, mm = 0;
      if (timeStr) {
        const tm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(timeStr).trim());
        if (tm) {
          hh = parseInt(tm[1], 10) % 12;
          mm = parseInt(tm[2], 10);
          if (/pm/i.test(tm[3])) hh += 12;
        }
      }
      if (mon === undefined) return null;
      const dt = new Date(year, mon, day, hh, mm);
      return isNaN(dt.getTime()) ? null : dt.toISOString();
    }
    return null;
  }

  function parseCreatedDate(contentId) {
    const m = /^CNT-(\d{4})(\d{2})(\d{2})-/.exec(contentId || '');
    if (!m) return new Date().toISOString();
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)).toISOString();
  }

  // Ta Panda always publishes to both FB + IG together (see companion doc) —
  // there is no real per-item platform choice, so this is a display label,
  // not a filter derived from real per-post platform selection.
  function derivePlatform(row) {
    const type = row['Content Type'] || '';
    if (/blog/i.test(type)) return 'Blog';
    return 'Instagram';
  }

  function rowToContentItem(row) {
    const rawStatus = String(row['Status'] || '').trim();
    const status = STATUS_MAP[rawStatus] || 'generated';
    const carouselSlides = [1, 2, 3, 4, 5]
      .map((n) => row['Carousel_Asset URL ' + n])
      .filter(Boolean);
    const assetUrl = row['Asset URL'] || carouselSlides[0] || null;
    const publishErrors = row['Publish Errors'] || null;
    const isFailedPublish = rawStatus === 'Publish Failed' || rawStatus === 'Publish Failed - Needs Review';

    const item = {
      id: row['Content ID'],
      title: row['Topic'] || row['Content ID'],
      type: CONTENT_TYPE_MAP[row['Content Type']] || row['Content Type'] || 'Static Image',
      pillar: row['Content Pillar'] || '',
      objective: row['Objective'] || '',
      platform: derivePlatform(row),
      priority: 'med',
      status: status,
      rawStatus: rawStatus,
      createdDate: parseCreatedDate(row['Content ID']),
      publishDate: parseDateTime(row['Publish Date'], row['Publish Time']),
      hook: row['Hook'] || '',
      cta: row['CTA'] || '',
      caption: row['Caption'] || '',
      hashtags: row['Hashtags'] || '',
      strategyId: row['Strategy ID'] || '',
      reviewerRemarks: row['Remarks'] || null,
      telegramMsgId: row['Telegram Msg ID'] || null,
      thumbnail: assetUrl,
      assetUrl: assetUrl,
      carouselSlides: carouselSlides,
      fbPostUrl: row['FB Post URL'] || null,
      igPostUrl: row['IG Post URL'] || null,
      publishRetryCount: row['Publish Retry Count'] || 0
    };

    if (isFailedPublish || publishErrors) {
      item.error = publishErrors || (rawStatus === 'Publish Failed - Needs Review'
        ? 'Publish failed — needs manual review'
        : 'Publish failed, retrying automatically');
    }

    return item;
  }

  async function fetchContentItems() {
    const url = GATEWAY_BASE + '/bos-content?key=' + encodeURIComponent(GATEWAY_KEY);
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('Gateway read failed: HTTP ' + res.status);
    const rows = await res.json();
    return rows.filter((r) => r['Content ID']).map(rowToContentItem);
  }

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // WF06's publish cron parses "Publish Date"/"Publish Time" with a strict
  // DD-Mon-YYYY / H:MM AM/PM regex (see Find Due node) — any other format
  // makes dueMs() return NaN and the item silently never publishes. Always
  // write through this formatter, never a raw ISO string.
  function formatPublishDateTime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = pad(date.getDate()) + '-' + MONTHS_SHORT[date.getMonth()] + '-' + date.getFullYear();
    let h = date.getHours();
    const m = pad(date.getMinutes());
    const ap = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12; if (h12 === 0) h12 = 12;
    const timeStr = pad(h12) + ':' + m + ' ' + ap;
    return { dateStr, timeStr };
  }

  async function postAction(payload) {
    const url = GATEWAY_BASE + '/bos-action?key=' + encodeURIComponent(GATEWAY_KEY);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    let body = null;
    try { body = await res.json(); } catch (e) { /* ignore */ }
    if (!res.ok) {
      const msg = (body && body.error) ? body.error : ('HTTP ' + res.status);
      throw new Error(msg);
    }
    return body;
  }

  window.OSApi = {
    EDITABLE_FIELDS: EDITABLE_FIELDS,
    fetchContentItems: fetchContentItems,
    approve: (contentId) => postAction({ action: 'approve', content_id: contentId }),
    reject: (contentId, remarks) => postAction({ action: 'reject', content_id: contentId, remarks: remarks }),
    editField: (contentId, field, value) => postAction({ action: 'edit_field', content_id: contentId, field: field, value: value }),
    reschedule: (contentId, jsDate) => {
      const { dateStr, timeStr } = formatPublishDateTime(jsDate);
      return postAction({ action: 'reschedule', content_id: contentId, publish_date: dateStr, publish_time: timeStr });
    }
  };
})();
