// Ta Panda Business OS — Executive Dashboard rendering

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.OSData) return;
  const D = window.OSData;
  await D.ready;

  function renderKPIs() {
    const counts = D.getCounts();
    const container = document.getElementById('kpiContainer');
    const items = D.KPI_DEFS.map((k) => Object.assign({}, k, {
      value: counts[k.key],
      valueColor: (k.key === 'errors' || k.key === 'awaiting-approval') ? k.color : null
    }));
    window.OS.renderKPICards(container, items);
  }

  function renderActivity() {
    window.OS.renderActivityList(document.getElementById('activityList'), D.ACTIVITY_LOG, 5);
  }

  function renderWorkflowHealth() {
    window.OS.renderWorkflowHealthGrid(document.getElementById('workflowHealthGrid'), D.WORKFLOWS, { verbose: true });
  }

  function renderPlanningHorizon() {
    const horizon = D.getPlanningHorizon();
    const days = Math.round((horizon - D.TODAY) / 86400000);
    document.getElementById('planningHorizonDate').textContent = D.fmtDate(horizon.toISOString());
    document.getElementById('planningHorizonBuffer').textContent = '+' + Math.max(days, 0) + ' days buffer';
  }

  function renderMiniCalendar() {
    const cal = document.getElementById('miniCalendar');
    const label = document.getElementById('miniCalendarLabel');
    const today = D.TODAY;
    const year = today.getFullYear(), month = today.getMonth();
    label.textContent = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const eventDates = new Set(D.CONTENT_ITEMS.filter((c) => c.publishDate).map((c) => D.toISODate(new Date(c.publishDate))));
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = D.toISODate(today);

    let html = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => `<div class="cal-day-header">${d}</div>`).join('');
    for (let i = 0; i < firstDow; i++) html += '<div class="cal-day empty"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const classes = ['cal-day'];
      if (dateStr === todayStr) classes.push('active');
      else if (eventDates.has(dateStr)) classes.push('has-event');
      html += `<div class="${classes.join(' ')}">${day}</div>`;
    }
    cal.innerHTML = html;
  }

  function renderCharts() {
    const range = D.ANALYTICS['30d'];
    OSCharts.line(document.getElementById('chartPublishingTrend'), range.publishingTrend.map((p) => ({ l: p.l, v: p.v })), { height: 200 });
    OSCharts.donut(document.getElementById('chartContentMix'), D.ANALYTICS.contentMix, { size: 140, centerValue: D.CONTENT_ITEMS.length, centerLabel: 'Total' });
    OSCharts.bar(document.getElementById('chartProductionVelocity'), range.productionVelocity, { height: 200, color: 'var(--text-muted)' });
    OSCharts.bar(document.getElementById('chartApprovalTime'), range.approvalVelocity, { height: 200, formatValue: (v) => v + 'h' });
  }

  function renderErrorCentre() {
    const errored = D.CONTENT_ITEMS.filter((c) => c.error);
    document.getElementById('errorCentreCount').textContent = errored.length;

    const list = document.getElementById('errorCentreList');
    if (!errored.length) {
      list.innerHTML = '<div class="empty-state empty-state-inline"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div><div class="empty-state-title">No active errors</div><div class="empty-state-text">Everything is running smoothly.</div></div>';
      return;
    }

    let html = '';
    errored.forEach((c) => {
      html += `
        <div class="error-centre-item">
          <div>
            <div class="error-centre-text">${c.title}</div>
            <div class="error-centre-id">${c.id} — ${c.error}</div>
          </div>
          <div class="error-centre-actions">
            <a href="/business-os/content-planner.html" class="btn btn-ghost btn-sm">Resolve</a>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
  }

  function renderSystemHealth() {
    const apiMap = new Map();
    D.WORKFLOWS.forEach((w) => (w.apiStatus || []).forEach((a) => apiMap.set(a.name, a.ok)));
    const grid = document.getElementById('systemHealthGrid');
    let html = `
      <div class="system-health-pill">
        <div class="system-health-pill-header"><span>Uptime (30d)</span></div>
        <div class="system-health-status" style="font-size:1.1rem;font-weight:700;color:var(--text-primary);">99.4%</div>
      </div>
    `;
    apiMap.forEach((ok, name) => {
      html += `
        <div class="system-health-pill">
          <div class="system-health-pill-header">
            <span>${name}</span>
            <div class="health-dot ${ok ? 'green' : ''}" style="${ok ? '' : 'background-color:var(--status-danger-text);'}"></div>
          </div>
          <div class="system-health-status">${ok ? 'Operational' : 'Needs attention'}</div>
        </div>
      `;
    });
    grid.innerHTML = html;
  }

  function renderRecentContent() {
    const items = D.CONTENT_ITEMS.slice().sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate)).slice(0, 6);
    const tbody = document.getElementById('recentContentBody');
    tbody.innerHTML = items.map((c) => {
      const meta = D.STATUS_META[c.status];
      return `
        <tr>
          <td>
            <div class="thumbnail-cell">
              ${c.thumbnail ? `<img src="${c.thumbnail}" class="table-thumbnail" alt="">` : '<div class="table-thumbnail"></div>'}
              <span style="font-weight: 500;">${c.title}</span>
            </div>
          </td>
          <td>#${c.id}</td>
          <td>${c.type}</td>
          <td>${c.pillar}</td>
          <td><span class="badge ${c.error ? 'badge-danger' : meta.badge}">${c.error ? 'Error: ' + c.error : meta.label}</span></td>
          <td>${c.publishDate ? D.fmtDate(c.publishDate) : '—'}</td>
        </tr>
      `;
    }).join('');
  }

  function renderAll() {
    renderKPIs();
    renderActivity();
    renderWorkflowHealth();
    renderPlanningHorizon();
    renderMiniCalendar();
    renderCharts();
    renderErrorCentre();
    renderSystemHealth();
    renderRecentContent();
  }

  renderAll();
  document.addEventListener('os:data-changed', renderAll);
});
