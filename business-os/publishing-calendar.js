// Ta Panda Business OS — Publishing Calendar (Month/Week/Agenda + drag reschedule)

document.addEventListener('DOMContentLoaded', () => {
  if (!window.OSData) return;
  const D = window.OSData;

  let currentView = 'month';
  let monthCursor = new Date(D.TODAY.getFullYear(), D.TODAY.getMonth(), 1);
  let weekCursor = startOfWeek(D.TODAY);

  function startOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function calendarItems() {
    return D.CONTENT_ITEMS.filter((c) => c.publishDate && (c.status === 'scheduled' || c.status === 'published'));
  }
  function itemsForDate(dateStr) {
    return calendarItems().filter((c) => D.toISODate(new Date(c.publishDate)) === dateStr)
      .sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
  }

  // -----------------------------------------------------------------
  // Content gap banner (next 14 days with zero scheduled/published items)
  // -----------------------------------------------------------------
  function renderGapBanner() {
    const gaps = [];
    for (let i = 0; i < 14; i++) {
      const date = D.addDays(D.TODAY, i);
      const dateStr = D.toISODate(date);
      if (itemsForDate(dateStr).length === 0) gaps.push(dateStr);
    }
    const banner = document.getElementById('pcGapBanner');
    if (!gaps.length) { banner.style.display = 'none'; return; }
    banner.style.display = 'flex';
    const preview = gaps.slice(0, 3).map((g) => D.fmtDateShort(g)).join(', ');
    document.getElementById('pcGapText').textContent = `${gaps.length} gap day${gaps.length > 1 ? 's' : ''} in the next 14 days (${preview}${gaps.length > 3 ? '…' : ''}) — no content scheduled.`;
  }

  // -----------------------------------------------------------------
  // Heat map, Today's Schedule, Upcoming Queue
  // -----------------------------------------------------------------
  function renderHeatmap() {
    OSCharts.heatmap(document.getElementById('pcHeatmap'), D.ANALYTICS.publicationFrequency);
  }

  function renderTodaySchedule() {
    const todayStr = D.toISODate(D.TODAY);
    const todays = itemsForDate(todayStr);
    const el = document.getElementById('pcTodaySchedule');
    if (!todays.length) {
      el.innerHTML = '<div class="empty-state empty-state-inline"><span class="empty-state-text">Nothing scheduled for today.</span></div>';
      return;
    }
    el.innerHTML = todays.map((c) => `
      <div class="pc-today-item">
        <span class="pc-today-time">${D.fmtTime(c.publishDate)}</span>
        <span class="pc-today-title" title="${c.title}">${c.title}</span>
        <span class="badge ${D.STATUS_META[c.status].badge}" style="flex-shrink:0;">${D.STATUS_META[c.status].label}</span>
      </div>
    `).join('');
  }

  function renderUpcomingQueue() {
    const upcoming = calendarItems().filter((c) => c.status === 'scheduled' && new Date(c.publishDate) >= D.TODAY)
      .sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate)).slice(0, 8);
    const el = document.getElementById('pcUpcomingQueue');
    if (!upcoming.length) {
      el.innerHTML = '<div class="empty-state empty-state-inline"><span class="empty-state-text">Queue is empty.</span></div>';
      return;
    }
    el.innerHTML = upcoming.map((c) => {
      const type = D.TYPE_META[c.type] || D.TYPE_META['Static Image'];
      return `
        <div class="pc-queue-item" draggable="true" data-item-id="${c.id}">
          <div class="pc-queue-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${type.icon}</svg></div>
          <div class="pc-queue-item-body">
            <div class="pc-queue-item-title" title="${c.title}">${c.title}</div>
            <div class="pc-queue-item-date">${D.fmtDateTime(c.publishDate)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // -----------------------------------------------------------------
  // Month view
  // -----------------------------------------------------------------
  function renderMonth() {
    const year = monthCursor.getFullYear(), month = monthCursor.getMonth();
    document.getElementById('pcNavLabel').textContent = monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const gridStart = startOfWeek(new Date(year, month, 1));
    const lastOfMonth = new Date(year, month + 1, 0);
    const gridEnd = new Date(lastOfMonth);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
    const todayStr = D.toISODate(D.TODAY);

    let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div class="pc-month-daylabel">${d}</div>`).join('');
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const dateStr = D.toISODate(cursor);
      const inMonth = cursor.getMonth() === month;
      const dayItems = itemsForDate(dateStr);
      const isGap = inMonth && cursor >= new Date(todayStr) && dayItems.length === 0 && (cursor - D.TODAY) / 86400000 < 14;
      const classes = ['pc-month-cell'];
      if (!inMonth) classes.push('empty');
      if (dateStr === todayStr) classes.push('today');
      if (isGap) classes.push('gap-day');

      const visible = dayItems.slice(0, 3);
      const overflow = dayItems.length - visible.length;
      html += `
        <div class="${classes.join(' ')}" data-date="${dateStr}">
          <div class="pc-month-cell-daynum">${cursor.getDate()}</div>
          <div class="pc-month-cell-events">
            ${visible.map((c) => `<div class="pc-event-pill status-${c.status}" draggable="true" data-item-id="${c.id}" title="${c.title}">${c.title}</div>`).join('')}
            ${overflow > 0 ? `<div class="pc-event-more" data-date="${dateStr}">+${overflow} more</div>` : ''}
          </div>
        </div>
      `;
      cursor.setDate(cursor.getDate() + 1);
    }
    document.getElementById('pcMonthView').innerHTML = `<div class="pc-month-grid">${html}</div>`;
  }

  // -----------------------------------------------------------------
  // Week view
  // -----------------------------------------------------------------
  function renderWeek() {
    const end = D.addDays(weekCursor, 6);
    document.getElementById('pcNavLabel').textContent = weekCursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' + end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const todayStr = D.toISODate(D.TODAY);

    let html = '';
    for (let i = 0; i < 7; i++) {
      const date = D.addDays(weekCursor, i);
      const dateStr = D.toISODate(date);
      const dayItems = itemsForDate(dateStr);
      html += `
        <div class="pc-week-col ${dateStr === todayStr ? 'today' : ''}" data-date="${dateStr}">
          <div class="pc-week-col-header">
            <div class="pc-week-col-dayname">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div class="pc-week-col-daynum">${date.getDate()}</div>
          </div>
          <div class="pc-week-col-events">
            ${dayItems.map((c) => `
              <div class="pc-week-card" draggable="true" data-item-id="${c.id}">
                <div class="pc-week-card-time">${D.fmtTime(c.publishDate)} · <span class="badge ${D.STATUS_META[c.status].badge}" style="font-size:0.625rem;padding:1px 6px;">${D.STATUS_META[c.status].label}</span></div>
                <div class="pc-week-card-title">${c.title}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    document.getElementById('pcWeekView').innerHTML = `<div class="pc-week-grid">${html}</div>`;
  }

  // -----------------------------------------------------------------
  // Agenda view
  // -----------------------------------------------------------------
  function renderAgenda() {
    document.getElementById('pcNavLabel').textContent = 'Upcoming';
    const upcoming = calendarItems().filter((c) => new Date(c.publishDate) >= D.addDays(D.TODAY, -1))
      .sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));

    if (!upcoming.length) {
      document.getElementById('pcAgendaView').innerHTML = '<div class="card"><div class="empty-state"><div class="empty-state-title">Nothing on the agenda</div><div class="empty-state-text">Schedule content from the Content Planner to see it here.</div></div></div>';
      return;
    }

    const groups = [];
    upcoming.forEach((c) => {
      const dateStr = D.toISODate(new Date(c.publishDate));
      let group = groups.find((g) => g.date === dateStr);
      if (!group) { group = { date: dateStr, items: [] }; groups.push(group); }
      group.items.push(c);
    });

    document.getElementById('pcAgendaView').innerHTML = `<div class="pc-agenda-list">${groups.map((g) => `
      <div>
        <div class="pc-agenda-date-label">${g.date === D.toISODate(D.TODAY) ? 'Today — ' : ''}${new Date(g.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div class="pc-agenda-items">
          ${g.items.map((c) => {
            const type = D.TYPE_META[c.type] || D.TYPE_META['Static Image'];
            return `
              <div class="pc-agenda-item" data-item-id="${c.id}">
                <span class="pc-agenda-item-time">${D.fmtTime(c.publishDate)}</span>
                <div class="pc-agenda-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${type.icon}</svg></div>
                <div class="pc-agenda-item-body">
                  <div class="pc-agenda-item-title">${c.title}</div>
                  <div class="pc-agenda-item-meta">${c.type} · ${c.platform} · <span class="badge ${D.STATUS_META[c.status].badge}" style="font-size:0.625rem;padding:1px 6px;">${D.STATUS_META[c.status].label}</span></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')}</div>`;
  }

  // -----------------------------------------------------------------
  // Drawer
  // -----------------------------------------------------------------
  function openItemDrawer(id) {
    const item = D.getContentItem(id);
    if (!item) return;
    const type = D.TYPE_META[item.type] || D.TYPE_META['Static Image'];
    document.getElementById('pcDrawerContent').innerHTML = `
      <div class="cp-media-preview">
        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="">` : `<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" width="48" height="48">${type.icon}</svg>`}
      </div>
      <div class="cp-detail-row"><span class="cp-detail-label">Content ID</span><span class="cp-detail-value">#${item.id}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Title</span><span class="cp-detail-value">${item.title}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Type</span><span class="cp-detail-value">${item.type}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Platform</span><span class="cp-detail-value">${item.platform}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Pillar</span><span class="cp-detail-value">${item.pillar}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Status</span><span class="cp-detail-value"><span class="badge ${D.STATUS_META[item.status].badge}">${D.STATUS_META[item.status].label}</span></span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Publish Date</span><span class="cp-detail-value">${item.publishDate ? D.fmtDateTime(item.publishDate) : '—'}</span></div>
    `;
    const actions = [];
    if (item.status === 'scheduled') {
      actions.push('<button class="btn btn-ghost btn-sm" data-item-action="plus1d">+1 Day</button>');
      actions.push('<button class="btn btn-ghost btn-sm" data-item-action="plus1w">+1 Week</button>');
      actions.push('<button class="btn btn-ghost" style="background-color:var(--status-success-bg);color:var(--status-success-text);border-color:var(--status-success-text);" data-item-action="publish">Publish Now</button>');
      actions.push('<button class="btn btn-ghost" data-item-action="unschedule">Unschedule</button>');
    }
    actions.push('<a class="btn btn-primary" href="/business-os/content-planner.html">Open in Content Planner</a>');
    document.getElementById('pcDrawerActions').innerHTML = actions.join('');
    document.getElementById('pcDrawerActions').dataset.itemId = item.id;
    window.OS.openDrawer('pcDrawer', 'pcDrawerOverlay');
  }

  function openDayDrawer(dateStr) {
    const dayItems = itemsForDate(dateStr);
    document.getElementById('pcDrawerContent').innerHTML = `
      <div class="empty-state-title" style="text-align:left;color:var(--text-primary);margin-bottom:var(--space-2);">${new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      <div class="pc-agenda-items">
        ${dayItems.map((c) => {
          const type = D.TYPE_META[c.type] || D.TYPE_META['Static Image'];
          return `
            <div class="pc-agenda-item" data-item-id="${c.id}">
              <span class="pc-agenda-item-time">${D.fmtTime(c.publishDate)}</span>
              <div class="pc-agenda-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${type.icon}</svg></div>
              <div class="pc-agenda-item-body">
                <div class="pc-agenda-item-title">${c.title}</div>
                <div class="pc-agenda-item-meta">${c.type} · <span class="badge ${D.STATUS_META[c.status].badge}" style="font-size:0.625rem;padding:1px 6px;">${D.STATUS_META[c.status].label}</span></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    document.getElementById('pcDrawerActions').innerHTML = '';
    window.OS.openDrawer('pcDrawer', 'pcDrawerOverlay');
    document.querySelectorAll('#pcDrawerContent .pc-agenda-item').forEach((row) => {
      row.addEventListener('click', () => openItemDrawer(row.dataset.itemId));
    });
  }

  document.getElementById('pcCloseDrawer').addEventListener('click', () => window.OS.closeDrawer('pcDrawer', 'pcDrawerOverlay'));
  document.getElementById('pcDrawerOverlay').addEventListener('click', () => window.OS.closeDrawer('pcDrawer', 'pcDrawerOverlay'));
  document.getElementById('pcDrawerActions').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-item-action]');
    if (!btn) return;
    const item = D.getContentItem(document.getElementById('pcDrawerActions').dataset.itemId);
    if (!item) return;
    if (btn.dataset.itemAction === 'plus1d') item.publishDate = D.addDays(new Date(item.publishDate), 1).toISOString();
    if (btn.dataset.itemAction === 'plus1w') item.publishDate = D.addDays(new Date(item.publishDate), 7).toISOString();
    if (btn.dataset.itemAction === 'publish') { item.status = 'published'; item.publishDate = D.TODAY.toISOString(); }
    if (btn.dataset.itemAction === 'unschedule') { item.status = 'ready'; item.publishDate = null; }
    window.OS.toast({ type: 'success', title: 'Updated', message: `${item.id} was updated.` });
    window.OS.closeDrawer('pcDrawer', 'pcDrawerOverlay');
    renderAll();
  });

  // -----------------------------------------------------------------
  // View switching + navigation
  // -----------------------------------------------------------------
  function showView(view) {
    currentView = view;
    document.getElementById('pcMonthView').style.display = view === 'month' ? '' : 'none';
    document.getElementById('pcWeekView').style.display = view === 'week' ? '' : 'none';
    document.getElementById('pcAgendaView').style.display = view === 'agenda' ? '' : 'none';
    document.querySelectorAll('#pcViewSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    document.getElementById('pcPrev').style.visibility = view === 'agenda' ? 'hidden' : 'visible';
    document.getElementById('pcNext').style.visibility = view === 'agenda' ? 'hidden' : 'visible';
    document.getElementById('pcToday').style.visibility = view === 'agenda' ? 'hidden' : 'visible';
    renderCurrentView();
  }

  function renderCurrentView() {
    if (currentView === 'month') renderMonth();
    else if (currentView === 'week') renderWeek();
    else renderAgenda();
  }

  document.getElementById('pcViewSwitch').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (btn) showView(btn.dataset.view);
  });
  document.getElementById('pcPrev').addEventListener('click', () => {
    if (currentView === 'month') monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1);
    else if (currentView === 'week') weekCursor = D.addDays(weekCursor, -7);
    renderCurrentView();
  });
  document.getElementById('pcNext').addEventListener('click', () => {
    if (currentView === 'month') monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
    else if (currentView === 'week') weekCursor = D.addDays(weekCursor, 7);
    renderCurrentView();
  });
  document.getElementById('pcToday').addEventListener('click', () => {
    monthCursor = new Date(D.TODAY.getFullYear(), D.TODAY.getMonth(), 1);
    weekCursor = startOfWeek(D.TODAY);
    renderCurrentView();
  });

  // -----------------------------------------------------------------
  // Delegated click/drag handlers (shared across month + week containers)
  // -----------------------------------------------------------------
  const mainEl = document.querySelector('.pc-main');

  mainEl.addEventListener('click', (e) => {
    const more = e.target.closest('.pc-event-more');
    if (more) { openDayDrawer(more.dataset.date); return; }
    const pill = e.target.closest('[data-item-id]');
    if (pill) openItemDrawer(pill.dataset.itemId);
  });
  document.getElementById('pcAgendaView').addEventListener('click', (e) => {
    const row = e.target.closest('.pc-agenda-item');
    if (row) openItemDrawer(row.dataset.itemId);
  });

  function bindDragSource(el, root) {
    root.addEventListener('dragstart', (e) => {
      const source = e.target.closest(el);
      if (!source) return;
      e.dataTransfer.setData('text/plain', source.dataset.itemId);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => source.classList.add('dragging'), 0);
    });
    root.addEventListener('dragend', (e) => {
      const source = e.target.closest(el);
      if (source) source.classList.remove('dragging');
    });
  }
  bindDragSource('[draggable="true"]', mainEl);
  bindDragSource('[draggable="true"]', document.getElementById('pcUpcomingQueue'));

  function bindDropZone(selector) {
    mainEl.addEventListener('dragover', (e) => {
      const zone = e.target.closest(selector);
      if (!zone) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });
    mainEl.addEventListener('dragleave', (e) => {
      const zone = e.target.closest(selector);
      if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
    });
    mainEl.addEventListener('drop', (e) => {
      const zone = e.target.closest(selector);
      if (!zone) return;
      e.preventDefault();
      zone.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const item = D.getContentItem(id);
      if (!item || !item.publishDate) return;
      const oldDate = new Date(item.publishDate);
      const newDate = new Date(zone.dataset.date + 'T00:00:00');
      newDate.setHours(oldDate.getHours(), oldDate.getMinutes());
      item.publishDate = newDate.toISOString();
      window.OS.toast({ type: 'success', title: 'Rescheduled', message: `${item.id} moved to ${D.fmtDateShort(item.publishDate)}.` });
      renderAll();
    });
  }
  bindDropZone('.pc-month-cell:not(.empty)');
  bindDropZone('.pc-week-col');

  // -----------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------
  function renderAll() {
    renderGapBanner();
    renderHeatmap();
    renderTodaySchedule();
    renderUpcomingQueue();
    renderCurrentView();
  }

  renderAll();
  document.addEventListener('os:data-changed', renderAll);
});
