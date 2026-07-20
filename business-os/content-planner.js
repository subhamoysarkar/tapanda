// Ta Panda Business OS — Content Planner (Kanban + Calendar + Drawer)

document.addEventListener('DOMContentLoaded', () => {
  if (!window.OSData) return;
  const D = window.OSData;
  const items = D.CONTENT_ITEMS;

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
  // Kanban board
  // -----------------------------------------------------------------
  const ACTIONS_BY_STATUS = {
    'generated': [{ key: 'submit', title: 'Submit for Approval', icon: '<polyline points="20 6 9 17 4 12"></polyline>' }, { key: 'delete', title: 'Delete', icon: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' }],
    'awaiting-approval': [{ key: 'approve', title: 'Approve', icon: '<polyline points="20 6 9 17 4 12"></polyline>' }, { key: 'reject', title: 'Reject', icon: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' }],
    'approved': [{ key: 'request-assets', title: 'Request Assets', icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>' }],
    'waiting-assets': [{ key: 'assets-ready', title: 'Mark Assets Ready', icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>' }],
    'ready': [{ key: 'schedule', title: 'Schedule', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' }],
    'scheduled': [{ key: 'publish', title: 'Publish Now', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' }],
    'published': [{ key: 'duplicate', title: 'Duplicate', icon: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' }]
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
  }

  // -----------------------------------------------------------------
  // Item status transitions
  // -----------------------------------------------------------------
  function advanceItem(item, actionKey) {
    const transitions = {
      submit: 'awaiting-approval', approve: 'approved', 'request-assets': 'waiting-assets',
      'assets-ready': 'ready', schedule: 'scheduled', publish: 'published', reject: 'generated'
    };
    if (actionKey === 'delete') {
      const idx = items.indexOf(item);
      if (idx > -1) items.splice(idx, 1);
      window.OS.toast({ type: 'info', title: 'Content deleted', message: `${item.id} was removed.` });
      renderAll();
      return;
    }
    if (actionKey === 'duplicate') {
      const nextNum = Math.max(...items.map((c) => parseInt(c.id.replace('CP-', ''), 10) || 0)) + 1;
      const copy = Object.assign({}, item, { id: 'CP-' + nextNum, status: 'generated', publishDate: null, createdDate: D.TODAY.toISOString() });
      items.unshift(copy);
      window.OS.toast({ type: 'success', title: 'Content duplicated', message: `Created ${copy.id} as a new draft.` });
      renderAll();
      return;
    }
    const newStatus = transitions[actionKey];
    if (!newStatus) return;
    item.status = newStatus;
    if (newStatus === 'scheduled' && !item.publishDate) item.publishDate = D.addDays(D.TODAY, 2).toISOString();
    if (newStatus === 'published') item.publishDate = D.TODAY.toISOString();
    if (item.error && (newStatus === 'ready' || newStatus === 'published')) delete item.error;
    window.OS.toast({ type: 'success', title: 'Status updated', message: `${item.id} moved to ${D.STATUS_META[newStatus].label}.` });
    renderAll();
  }

  // -----------------------------------------------------------------
  // Drawer
  // -----------------------------------------------------------------
  const DRAWER_ACTIONS_BY_STATUS = {
    'generated': [{ key: 'submit', label: 'Submit for Approval', primary: true }, { key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Delete', danger: true }],
    'awaiting-approval': [{ key: 'approve', label: 'Approve', primary: true }, { key: 'reject', label: 'Reject', danger: true }, { key: 'edit', label: 'Edit' }],
    'approved': [{ key: 'request-assets', label: 'Request Assets', primary: true }, { key: 'edit', label: 'Edit' }],
    'waiting-assets': [{ key: 'assets-ready', label: 'Mark Assets Ready', primary: true }, { key: 'edit', label: 'Edit' }],
    'ready': [{ key: 'schedule', label: 'Schedule', primary: true }, { key: 'edit', label: 'Edit' }],
    'scheduled': [{ key: 'publish', label: 'Publish Now', primary: true, success: true }, { key: 'edit', label: 'Reschedule' }],
    'published': [{ key: 'duplicate', label: 'Duplicate' }]
  };

  function openDrawer(id) {
    const item = D.getContentItem(id);
    if (!item) return;
    openItemId = id;
    const type = D.TYPE_META[item.type] || D.TYPE_META['Static Image'];

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
          <div class="cp-detail-row"><span class="cp-detail-label">Topic</span><span class="cp-detail-value">${item.title}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Objective / Pillar</span><span class="cp-detail-value">${item.pillar}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Content Type</span><span class="cp-detail-value">${item.type}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Platform</span><span class="cp-detail-value">${item.platform}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Priority</span><span class="cp-detail-value" style="text-transform:capitalize;">${item.priority}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Hook</span><span class="cp-detail-value">${item.hook || '<em style="color:var(--text-muted);">Not yet generated</em>'}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">CTA</span><span class="cp-detail-value">${item.cta || '<em style="color:var(--text-muted);">Not yet generated</em>'}</span></div>
          ${item.reviewerRemarks ? `<div class="cp-detail-row"><span class="cp-detail-label">Reviewer Remarks</span><span class="cp-detail-value" style="color: var(--status-warning-text);">${item.reviewerRemarks}</span></div>` : ''}
          ${item.error ? `<div class="cp-detail-row"><span class="cp-detail-label">Error</span><span class="cp-detail-value" style="color: var(--status-danger-text);">${item.error}</span></div>` : ''}
        </div>
      </div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Generated Assets<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="cp-asset-block">
            <div class="cp-asset-label">Visual Prompt</div>
            <textarea class="cp-asset-textarea" readonly>${item.imagePromptText || 'Not yet generated by WF03 (AI Prompt Generator).'}</textarea>
          </div>
          <div class="cp-asset-block">
            <div class="cp-asset-label">Caption</div>
            <textarea class="cp-asset-textarea" style="min-height: 120px;" readonly>${item.caption || 'Not yet generated by WF05 (Caption Generator).'}</textarea>
          </div>
          <div class="cp-asset-block">
            <div class="cp-asset-label">Hashtags</div>
            <textarea class="cp-asset-textarea" readonly>${item.hashtags || 'Not yet generated.'}</textarea>
          </div>
          <div class="cp-asset-block">
            <div class="cp-asset-label">SEO Meta Description</div>
            <textarea class="cp-asset-textarea" readonly>${item.seoMeta || 'Not yet generated.'}</textarea>
          </div>
        </div>
      </div>
    `;

    const actions = DRAWER_ACTIONS_BY_STATUS[item.status] || [];
    document.getElementById('cpDrawerActions').innerHTML = actions.map((a) => `
      <button class="btn ${a.primary ? 'btn-primary' : 'btn-ghost'}" data-item-action="${a.key}" data-item-id="${item.id}"
        style="${a.danger ? 'border-color:var(--status-danger-text);color:var(--status-danger-text);' : ''}${a.success ? 'background-color:var(--status-success-bg);color:var(--status-success-text);border-color:var(--status-success-text);' : ''}">
        ${a.label}
      </button>
    `).join('') + `<button class="btn btn-ghost" data-item-action="archive-drawer" data-item-id="${item.id}" title="Archive"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg></button>`;

    document.querySelectorAll('.cp-accordion-header').forEach((h) => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
    });

    window.OS.openDrawer('cpDrawer', 'cpDrawerOverlay');
  }

  document.getElementById('cpCloseDrawer').addEventListener('click', () => window.OS.closeDrawer('cpDrawer', 'cpDrawerOverlay'));
  document.getElementById('cpDrawerOverlay').addEventListener('click', () => window.OS.closeDrawer('cpDrawer', 'cpDrawerOverlay'));

  // -----------------------------------------------------------------
  // Delegated events: card click / action buttons / drag-drop
  // -----------------------------------------------------------------
  const board = document.getElementById('cpKanbanBoard');

  board.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-item-action]');
    if (actionBtn) {
      const item = D.getContentItem(actionBtn.dataset.itemId);
      if (item) advanceItem(item, actionBtn.dataset.itemAction);
      return;
    }
    const card = e.target.closest('.cp-kanban-card');
    if (card) openDrawer(card.dataset.itemId);
  });

  document.getElementById('cpDrawerActions').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-item-action]');
    if (!btn) return;
    const item = D.getContentItem(btn.dataset.itemId);
    if (!item) return;
    if (btn.dataset.itemAction === 'edit') {
      window.OS.toast({ type: 'info', title: 'Inline editing', message: 'Full editing arrives with API integration in Phase 4.' });
      return;
    }
    if (btn.dataset.itemAction === 'archive-drawer') {
      const idx = items.indexOf(item);
      if (idx > -1) items.splice(idx, 1);
      window.OS.toast({ type: 'info', title: 'Archived', message: `${item.id} was archived.` });
      window.OS.closeDrawer('cpDrawer', 'cpDrawerOverlay');
      renderAll();
      return;
    }
    advanceItem(item, btn.dataset.itemAction);
    window.OS.closeDrawer('cpDrawer', 'cpDrawerOverlay');
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
    item.status = newStatus;
    if (newStatus === 'scheduled' && !item.publishDate) item.publishDate = D.addDays(D.TODAY, 2).toISOString();
    if (newStatus === 'published') item.publishDate = D.TODAY.toISOString();
    if (item.error && (newStatus === 'ready' || newStatus === 'published')) delete item.error;
    window.OS.toast({ type: 'success', title: 'Moved', message: `${item.id} moved to ${D.STATUS_META[newStatus].label}.` });
    renderAll();
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
  document.addEventListener('os:data-changed', renderAll);
});
