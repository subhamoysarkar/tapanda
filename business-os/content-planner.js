// Ta Panda Business OS — Content Planner (Kanban + Calendar + Drawer)
// Phase 4: writes go through OSData.approveItem/rejectItem/editItemField,
// which call the real WF08 Business OS Gateway. Only actions a human can
// really take from the real pipeline are exposed — every other stage
// transition (submit, asset-ready, schedule, publish) happens automatically
// inside WF01/WF03/WF04/WF06 and is not something the web UI can fake.

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.OSData) return;
  const D = window.OSData;
  await D.ready;
  const items = D.CONTENT_ITEMS;

  const OPEN_STATES = ['generated', 'awaiting-approval'];

  const filters = { status: '', type: '', pillar: '', platform: '', priority: '', search: '', date: null };
  let openItemId = null;
  let calMonthOffset = 0;

  // -----------------------------------------------------------------
  // KPIs
  // -----------------------------------------------------------------
  function renderKPIs() {
    const counts = D.getCounts();
    const kpiItems = D.KPI_DEFS.map((k) => Object.assign({}, k, {
      value: counts[k.key],
      valueColor: (k.key === 'errors' || k.key === 'awaiting-approval') ? k.color : null
    }));
    window.OS.renderKPICards(document.getElementById('cpKpiContainer'), kpiItems);
  }

  // -----------------------------------------------------------------
  // Planning horizon
  // -----------------------------------------------------------------
  function renderHorizon() {
    const horizon = D.getPlanningHorizon();
    const days = Math.round((horizon - D.TODAY) / 86400000);
    document.getElementById('cpHorizonDate').textContent = D.fmtDate(horizon.toISOString(), { day: 'numeric', month: 'long', year: 'numeric' });
    const urgencyEl = document.getElementById('cpHorizonUrgency');
    if (days <= 7) {
      urgencyEl.className = 'cp-status-urgency';
      urgencyEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Only ${Math.max(days, 0)} Days Remaining`;
    } else {
      urgencyEl.className = 'cp-status-urgency calm';
      urgencyEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg> ${days} Days of Buffer`;
    }
  }

  // -----------------------------------------------------------------
  // Calendar
  // -----------------------------------------------------------------
  function renderCalendar() {
    const base = new Date(D.TODAY.getFullYear(), D.TODAY.getMonth() + calMonthOffset, 1);
    const year = base.getFullYear(), month = base.getMonth();
    document.getElementById('cpCalendarTitle').textContent = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const scheduledDates = new Set(items.filter((c) => c.status === 'scheduled' && c.publishDate).map((c) => D.toISODate(new Date(c.publishDate))));
    const publishedDates = new Set(items.filter((c) => c.status === 'published' && c.publishDate).map((c) => D.toISODate(new Date(c.publishDate))));
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = D.toISODate(D.TODAY);

    let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div class="cp-cal-day-name">${d}</div>`).join('');
    for (let i = 0; i < firstDow; i++) html += '<div class="cp-cal-cell empty"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const classes = ['cp-cal-cell'];
      if (dateStr === todayStr) classes.push('today');
      if (publishedDates.has(dateStr)) classes.push('has-published');
      else if (scheduledDates.has(dateStr)) classes.push('has-scheduled');
      if (filters.date === dateStr) classes.push('filter-active');
      html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${day}</div>`;
    }
    document.getElementById('cpCalendarGrid').innerHTML = html;
    document.getElementById('cpClearDateFilter').style.display = filters.date ? 'inline-flex' : 'none';
  }

  // -----------------------------------------------------------------
  // Filter option population (derived from data — stays in sync)
  // -----------------------------------------------------------------
  function populateFilterOptions() {
    function unique(field) { return Array.from(new Set(items.map((i) => i[field]))).sort(); }
    function fill(selectId, values) {
      const select = document.getElementById(selectId);
      const placeholder = select.options[0];
      select.innerHTML = '';
      select.appendChild(placeholder);
      values.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        select.appendChild(opt);
      });
    }
    fill('cpFilterType', unique('type'));
    fill('cpFilterPillar', unique('pillar'));
    fill('cpFilterPlatform', unique('platform'));
  }

  function getFilteredItems() {
    return items.filter((c) => {
      if (filters.type && c.type !== filters.type) return false;
      if (filters.pillar && c.pillar !== filters.pillar) return false;
      if (filters.platform && c.platform !== filters.platform) return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.search && !(c.title.toLowerCase().includes(filters.search) || c.id.toLowerCase().includes(filters.search))) return false;
      if (filters.date && (!c.publishDate || D.toISODate(new Date(c.publishDate)) !== filters.date)) return false;
      return true;
    });
  }

  // -----------------------------------------------------------------
  // Kanban board — only real, human-triggerable actions are shown.
  // Everything else advances automatically inside n8n.
  // -----------------------------------------------------------------
  const ACTIONS_BY_STATUS = {
    'generated': [{ key: 'approve', title: 'Approve', icon: '<polyline points="20 6 9 17 4 12"></polyline>' }, { key: 'reject', title: 'Reject', icon: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' }],
    'awaiting-approval': [{ key: 'approve', title: 'Approve', icon: '<polyline points="20 6 9 17 4 12"></polyline>' }, { key: 'reject', title: 'Reject', icon: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' }]
  };

  function buildCard(item) {
    const type = D.TYPE_META[item.type] || D.TYPE_META['Static Image'];
    const actions = ACTIONS_BY_STATUS[item.status] || [];
    const actionsHtml = actions.map((a) => `<button class="cp-card-action-btn" data-item-action="${a.key}" data-item-id="${item.id}" title="${a.title}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${a.icon}</svg></button>`).join('');
    const dateLabel = item.status === 'published' && item.publishDate
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${D.fmtDateShort(item.publishDate)}`
      : item.status === 'scheduled' && item.publishDate
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${D.fmtDateTime(item.publishDate)}`
      : item.error ? 'Needs attention' : 'Not scheduled';

    return `
      <div class="cp-kanban-card" draggable="true" data-item-id="${item.id}" style="${item.error ? 'border-color:var(--status-danger-text);' : ''}">
        ${actionsHtml ? `<div class="cp-card-actions">${actionsHtml}</div>` : ''}
        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="" class="cp-card-image">` : ''}
        <div class="cp-card-meta">
          <span class="cp-card-id">#${item.id}</span>
          <div class="priority-dot priority-${item.priority}" title="${item.priority} priority"></div>
        </div>
        <div class="cp-card-title">${item.title}</div>
        <div class="cp-card-type"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${type.icon}</svg>${item.type}</div>
        <div class="cp-card-footer">
          <span class="cp-card-objective">${item.pillar}</span>
          <span class="cp-card-date" style="${item.error ? 'color:var(--status-danger-text);' : ''}">${dateLabel}</span>
        </div>
      </div>
    `;
  }

  function renderBoard() {
    const filtered = getFilteredItems();
    const board = document.getElementById('cpKanbanBoard');
    board.innerHTML = D.STATUS_COLUMNS.map((col) => {
      const colItems = filtered.filter((c) => c.status === col.key);
      const hidden = filters.status && filters.status !== col.key;
      return `
        <div class="cp-kanban-col col-${col.key}" style="${hidden ? 'display:none;' : ''}">
          <div class="cp-kanban-col-header">
            <span>${col.label}</span>
            <span class="cp-kanban-col-count">${colItems.length}</span>
          </div>
          <div class="cp-kanban-cards" data-status="${col.key}">
            ${colItems.length ? colItems.map(buildCard).join('') : '<div class="empty-state empty-state-inline"><span class="empty-state-text">No items</span></div>'}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAll() {
    renderKPIs();
    renderHorizon();
    renderCalendar();
    renderBoard();
    window.OS.renderActivityList(document.getElementById('cpActivityList'), D.ACTIVITY_LOG, 5);
    window.OS.renderWorkflowHealthGrid(document.getElementById('cpWorkflowHealthGrid'), D.WORKFLOWS, { verbose: true });
    if (openItemId) {
      const item = D.getContentItem(openItemId);
      if (item) openDrawer(openItemId, { preserveScroll: true });
    }
  }

  // -----------------------------------------------------------------
  // Real actions: approve / reject — write to the actual Sheet via the
  // gateway, exactly mirroring what WF02's Telegram buttons write.
  // -----------------------------------------------------------------
  async function doApprove(item) {
    try {
      await D.approveItem(item.id);
      window.OS.toast({ type: 'success', title: 'Approved', message: `${item.id} approved — WF03 will build its prompt next.` });
    } catch (err) {
      window.OS.toast({ type: 'error', title: 'Approve failed', message: err.message });
    }
  }

  async function doReject(item) {
    const remarks = window.prompt(`Reject ${item.id} — optional reason:`, '');
    if (remarks === null) return; // cancelled
    try {
      await D.rejectItem(item.id, remarks);
      window.OS.toast({ type: 'success', title: 'Rejected', message: `${item.id} marked Rejected.` });
    } catch (err) {
      window.OS.toast({ type: 'error', title: 'Reject failed', message: err.message });
    }
  }

  function handleCardAction(item, actionKey) {
    if (actionKey === 'approve') return doApprove(item);
    if (actionKey === 'reject') return doReject(item);
  }

  // -----------------------------------------------------------------
  // Drawer
  // -----------------------------------------------------------------
  const STATUS_NOTE = {
    'approved': 'Waiting on WF03 (AI Prompt Generator) to build the creative brief — this happens automatically.',
    'waiting-assets': 'Waiting on media upload via Telegram (WF04) — upload the asset there to advance this item.',
    'ready': 'Waiting on WF06 to schedule this into the next open publish slot — happens automatically.',
    'published': 'Published — see the live post links below.',
    'rejected': 'Rejected. This is terminal in the real pipeline.'
  };

  function fieldRow(label, key, item, editable, multiline) {
    const value = item[key] || '';
    if (!editable) {
      return `<div class="cp-detail-row"><span class="cp-detail-label">${label}</span><span class="cp-detail-value">${value || '<em style="color:var(--text-muted);">Not yet generated</em>'}</span></div>`;
    }
    const tag = multiline ? 'textarea' : 'input';
    const extra = multiline ? 'rows="3" style="min-height:80px;"' : `type="text"`;
    return `<div class="cp-detail-row" style="align-items:flex-start;"><span class="cp-detail-label">${label}</span><${tag} class="cp-edit-field" data-edit-key="${key}" ${extra} style="flex:1;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;padding:6px 8px;color:var(--text-primary);font-family:inherit;font-size:0.85rem;">${value}</${tag}>${tag === 'input' ? '' : ''}</div>`;
  }

  function openDrawer(id, opts) {
    const item = D.getContentItem(id);
    if (!item) return;
    openItemId = id;
    const type = D.TYPE_META[item.type] || D.TYPE_META['Static Image'];
    const editable = OPEN_STATES.includes(item.status);

    document.getElementById('cpDrawerContent').innerHTML = `
      <div class="cp-media-preview">
        ${item.thumbnail
          ? `<img src="${item.thumbnail}" alt="Media Preview">`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" width="48" height="48">${type.icon}</svg>`}
        <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${item.type} Preview</div>
      </div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Content Information<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="cp-detail-row"><span class="cp-detail-label">Content ID</span><span class="cp-detail-value">#${item.id}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Strategy ID</span><span class="cp-detail-value">${item.strategyId || '—'}</span></div>
          ${fieldRow('Topic', 'title', item, editable, false)}
          <div class="cp-detail-row"><span class="cp-detail-label">Objective / Pillar</span><span class="cp-detail-value">${item.pillar}${item.objective ? ' · ' + item.objective : ''}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Content Type</span><span class="cp-detail-value">${item.type}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Platform</span><span class="cp-detail-value">${item.platform}</span></div>
          ${fieldRow('Hook', 'hook', item, editable, false)}
          ${fieldRow('CTA', 'cta', item, editable, false)}
          ${item.reviewerRemarks ? `<div class="cp-detail-row"><span class="cp-detail-label">Remarks</span><span class="cp-detail-value" style="color: var(--status-warning-text);">${item.reviewerRemarks}</span></div>` : ''}
          ${item.error ? `<div class="cp-detail-row"><span class="cp-detail-label">Error</span><span class="cp-detail-value" style="color: var(--status-danger-text);">${item.error}</span></div>` : ''}
          ${STATUS_NOTE[item.status] ? `<div class="cp-detail-row"><span class="cp-detail-label">Status</span><span class="cp-detail-value" style="color:var(--text-muted);">${STATUS_NOTE[item.status]}</span></div>` : ''}
          ${item.fbPostUrl ? `<div class="cp-detail-row"><span class="cp-detail-label">Facebook</span><span class="cp-detail-value"><a href="${item.fbPostUrl}" target="_blank" rel="noopener">View post ↗</a></span></div>` : ''}
          ${item.igPostUrl ? `<div class="cp-detail-row"><span class="cp-detail-label">Instagram</span><span class="cp-detail-value"><a href="${item.igPostUrl}" target="_blank" rel="noopener">View post ↗</a></span></div>` : ''}
        </div>
      </div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Caption &amp; Hashtags<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="cp-asset-block">
            <div class="cp-asset-label">Caption</div>
            <textarea class="cp-asset-textarea cp-edit-field" data-edit-key="caption" style="min-height: 120px;" ${editable ? '' : 'readonly'}>${item.caption || (editable ? '' : 'Not yet generated.')}</textarea>
          </div>
          <div class="cp-asset-block">
            <div class="cp-asset-label">Hashtags</div>
            <textarea class="cp-asset-textarea cp-edit-field" data-edit-key="hashtags" ${editable ? '' : 'readonly'}>${item.hashtags || (editable ? '' : 'Not yet generated.')}</textarea>
          </div>
        </div>
      </div>
    `;

    const actionButtons = [];
    if (editable) {
      actionButtons.push('<button class="btn btn-primary" data-item-action="save-edits">Save Changes</button>');
      actionButtons.push('<button class="btn btn-ghost" data-item-action="approve" style="background-color:var(--status-success-bg);color:var(--status-success-text);border-color:var(--status-success-text);">Approve</button>');
      actionButtons.push('<button class="btn btn-ghost" data-item-action="reject" style="border-color:var(--status-danger-text);color:var(--status-danger-text);">Reject</button>');
    }
    if (item.status === 'scheduled') {
      actionButtons.push('<button class="btn btn-primary" data-item-action="reschedule">Reschedule…</button>');
    }
    document.getElementById('cpDrawerActions').innerHTML = actionButtons.join('');

    document.querySelectorAll('.cp-accordion-header').forEach((h) => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
    });

    if (!(opts && opts.preserveScroll)) window.OS.openDrawer('cpDrawer', 'cpDrawerOverlay');
  }

  document.getElementById('cpCloseDrawer').addEventListener('click', () => { openItemId = null; window.OS.closeDrawer('cpDrawer', 'cpDrawerOverlay'); });
  document.getElementById('cpDrawerOverlay').addEventListener('click', () => { openItemId = null; window.OS.closeDrawer('cpDrawer', 'cpDrawerOverlay'); });

  // -----------------------------------------------------------------
  // Delegated events: card click / action buttons / drag-drop
  // -----------------------------------------------------------------
  const board = document.getElementById('cpKanbanBoard');

  board.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-item-action]');
    if (actionBtn) {
      const item = D.getContentItem(actionBtn.dataset.itemId);
      if (item) handleCardAction(item, actionBtn.dataset.itemAction);
      return;
    }
    const card = e.target.closest('.cp-kanban-card');
    if (card) openDrawer(card.dataset.itemId);
  });

  document.getElementById('cpDrawerActions').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-item-action]');
    if (!btn || !openItemId) return;
    const item = D.getContentItem(openItemId);
    if (!item) return;

    if (btn.dataset.itemAction === 'approve') { await doApprove(item); return; }
    if (btn.dataset.itemAction === 'reject') {
      await doReject(item);
      openItemId = null;
      window.OS.closeDrawer('cpDrawer', 'cpDrawerOverlay');
      return;
    }
    if (btn.dataset.itemAction === 'reschedule') {
      const current = item.publishDate ? new Date(item.publishDate) : new Date();
      const input = window.prompt('New publish date/time (YYYY-MM-DD HH:MM, 24h):', D.toISODate(current) + ' ' + String(current.getHours()).padStart(2, '0') + ':' + String(current.getMinutes()).padStart(2, '0'));
      if (!input) return;
      const parsed = new Date(input.replace(' ', 'T'));
      if (isNaN(parsed.getTime())) { window.OS.toast({ type: 'error', title: 'Invalid date', message: 'Use format YYYY-MM-DD HH:MM.' }); return; }
      try {
        await D.rescheduleItem(item.id, parsed);
        window.OS.toast({ type: 'success', title: 'Rescheduled', message: `${item.id} moved to ${D.fmtDateTime(parsed.toISOString())}.` });
      } catch (err) {
        window.OS.toast({ type: 'error', title: 'Reschedule failed', message: err.message });
      }
      return;
    }
    if (btn.dataset.itemAction === 'save-edits') {
      const fields = document.querySelectorAll('#cpDrawer .cp-edit-field');
      const keyMap = { title: 'Topic', hook: 'Hook', cta: 'CTA', caption: 'Caption', hashtags: 'Hashtags' };
      const changed = [];
      fields.forEach((f) => {
        const key = f.dataset.editKey;
        const newVal = f.value;
        if (item[key] !== newVal) changed.push({ key, sheetField: keyMap[key], value: newVal });
      });
      if (!changed.length) { window.OS.toast({ type: 'info', title: 'No changes', message: 'Nothing to save.' }); return; }
      btn.disabled = true;
      try {
        for (const c of changed) {
          await D.editItemField(item.id, c.sheetField, c.value);
        }
        window.OS.toast({ type: 'success', title: 'Saved', message: `${item.id} updated (${changed.length} field${changed.length === 1 ? '' : 's'}).` });
      } catch (err) {
        window.OS.toast({ type: 'error', title: 'Save failed', message: err.message });
      } finally {
        btn.disabled = false;
      }
      return;
    }
  });

  board.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.cp-kanban-card');
    if (!card) return;
    e.dataTransfer.setData('text/plain', card.dataset.itemId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('dragging'), 0);
  });
  board.addEventListener('dragend', (e) => {
    const card = e.target.closest('.cp-kanban-card');
    if (card) card.classList.remove('dragging');
  });
  board.addEventListener('dragover', (e) => {
    const zone = e.target.closest('.cp-kanban-cards');
    if (!zone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    zone.classList.add('drag-over');
  });
  board.addEventListener('dragleave', (e) => {
    const zone = e.target.closest('.cp-kanban-cards');
    if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });
  board.addEventListener('drop', (e) => {
    const zone = e.target.closest('.cp-kanban-cards');
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    const item = D.getContentItem(id);
    const newStatus = zone.dataset.status;
    if (!item || item.status === newStatus) return;
    if (newStatus === 'approved' && OPEN_STATES.includes(item.status)) { doApprove(item); return; }
    if (newStatus === 'rejected' && OPEN_STATES.includes(item.status)) { doReject(item); return; }
    window.OS.toast({ type: 'info', title: 'Automatic stage', message: `${D.STATUS_META[newStatus].label} happens automatically in n8n — it isn't a manual drag action.` });
    renderBoard();
  });

  // -----------------------------------------------------------------
  // Calendar day click (filter by date)
  // -----------------------------------------------------------------
  document.getElementById('cpCalendarGrid').addEventListener('click', (e) => {
    const cell = e.target.closest('.cp-cal-cell:not(.empty)');
    if (!cell) return;
    const date = cell.dataset.date;
    filters.date = filters.date === date ? null : date;
    renderCalendar();
    renderBoard();
  });
  document.getElementById('cpClearDateFilter').addEventListener('click', () => {
    filters.date = null;
    renderCalendar();
    renderBoard();
  });

  // -----------------------------------------------------------------
  // Filter controls
  // -----------------------------------------------------------------
  ['cpFilterStatus', 'cpFilterType', 'cpFilterPillar', 'cpFilterPlatform', 'cpFilterPriority'].forEach((id) => {
    document.getElementById(id).addEventListener('change', (e) => {
      const key = id.replace('cpFilter', '').replace(/^./, (c) => c.toLowerCase());
      filters[key] = e.target.value;
      renderBoard();
    });
  });
  document.getElementById('cpFilterSearch').addEventListener('input', (e) => {
    filters.search = e.target.value.toLowerCase();
    renderBoard();
  });
  document.getElementById('cpClearFilters').addEventListener('click', () => {
    filters.status = ''; filters.type = ''; filters.pillar = ''; filters.platform = ''; filters.priority = ''; filters.search = ''; filters.date = null;
    ['cpFilterStatus', 'cpFilterType', 'cpFilterPillar', 'cpFilterPlatform', 'cpFilterPriority'].forEach((id) => document.getElementById(id).value = '');
    document.getElementById('cpFilterSearch').value = '';
    renderCalendar();
    renderBoard();
  });

  populateFilterOptions();
  renderAll();
  document.addEventListener('os:data-changed', () => { populateFilterOptions(); renderAll(); });
});
