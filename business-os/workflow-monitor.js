// Ta Panda Business OS — Workflow Monitor (cards + drawer)

document.addEventListener('DOMContentLoaded', () => {
  if (!window.OSData) return;
  const D = window.OSData;
  const workflows = D.WORKFLOWS;

  function formatDuration(seconds) {
    if (seconds < 60) return Math.round(seconds) + 's';
    const m = Math.floor(seconds / 60), s = Math.round(seconds % 60);
    return m + 'm ' + s + 's';
  }

  function renderSummary() {
    const healthy = workflows.filter((w) => w.state !== 'error' && w.health === 'healthy').length;
    const running = workflows.filter((w) => w.state === 'running').length;
    const errors24h = workflows.reduce((sum, w) => sum + w.errorCount24h, 0);
    const avgSuccess = workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length;

    window.OS.renderKPICards(document.getElementById('wfSummaryStrip'), [
      { label: 'System Health', value: `${healthy}/7`, bg: healthy === 7 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)', color: healthy === 7 ? 'var(--status-success-text)' : 'var(--status-warning-text)', trendText: 'Workflows healthy', icon: '<polyline points="20 6 9 17 4 12"></polyline>' },
      { label: 'Running Now', value: running, bg: 'var(--status-info-bg)', color: 'var(--status-info-text)', trendText: 'Active executions', icon: '<polygon points="5 3 19 12 5 21 5 3"></polygon>' },
      { label: 'Errors (24h)', value: errors24h, bg: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', valueColor: errors24h > 0 ? 'var(--status-danger-text)' : null, trendText: 'Across all workflows', icon: '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' },
      { label: 'Avg Success Rate', value: avgSuccess.toFixed(1) + '%', bg: 'var(--accent-gold-light)', color: 'var(--accent-gold)', trendText: 'Last 30 days', icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>' }
    ]);
  }

  function renderCards() {
    document.getElementById('wfGrid').innerHTML = workflows.map((w) => {
      const statusClass = w.state === 'error' ? 'error' : w.state === 'running' ? 'running' : 'idle';
      const statusLabel = w.state === 'error' ? 'Error' : w.state === 'running' ? 'Running' : 'Idle';
      return `
        <div class="wf-card ${w.state === 'error' ? 'state-error' : ''}" data-wf-id="${w.id}">
          <div class="wf-card-header">
            <div>
              <div class="wf-card-id">${w.id}</div>
              <div class="wf-card-name">${w.name}</div>
            </div>
            <span class="wf-status-pill ${statusClass}"><span class="dot"></span>${statusLabel}</span>
          </div>
          <div class="wf-card-purpose">${w.purpose}</div>
          <div class="wf-card-body">
            <div class="wf-ring-block">
              <div id="wfRing-${w.id}"></div>
              <span class="wf-ring-label">Success</span>
            </div>
            <div class="wf-stat-grid">
              <div class="wf-stat-block"><div class="wf-stat-label">Last Run</div><div class="wf-stat-value">${D.timeAgo(w.lastRun)}</div></div>
              <div class="wf-stat-block"><div class="wf-stat-label">Avg Duration</div><div class="wf-stat-value">${formatDuration(w.avgDuration)}</div></div>
              <div class="wf-stat-block"><div class="wf-stat-label">Exec Time</div><div class="wf-stat-value">${formatDuration(w.lastDuration)}</div></div>
              <div class="wf-stat-block"><div class="wf-stat-label">Errors (24h)</div><div class="wf-stat-value ${w.errorCount24h > 0 ? 'danger' : ''}">${w.errorCount24h}</div></div>
              <div class="wf-stat-block"><div class="wf-stat-label">Nodes</div><div class="wf-stat-value">${w.nodeCount}</div></div>
              <div class="wf-stat-block"><div class="wf-stat-label">Runs (30d)</div><div class="wf-stat-value">${w.totalRuns30d}</div></div>
            </div>
          </div>
          <div class="wf-api-pills">
            ${w.apiStatus.map((a) => `<span class="wf-api-pill ${a.ok ? '' : 'down'}"><span class="dot"></span>${a.name}</span>`).join('')}
          </div>
          <div class="wf-card-footer">
            <button class="btn btn-ghost" data-view-wf="${w.id}">View Details</button>
            <button class="btn btn-ghost wf-connect-btn" data-tooltip="Available in Phase 4" disabled>Connect Live Webhook</button>
          </div>
        </div>
      `;
    }).join('');

    workflows.forEach((w) => {
      OSCharts.radial(document.getElementById('wfRing-' + w.id), w.successRate, { size: 64, thickness: 6 });
    });
  }

  function openDrawer(id) {
    const w = D.getWorkflow(id);
    if (!w) return;
    document.getElementById('wfDrawerTitle').textContent = `${w.id} — ${w.name}`;

    const LOG_ICON = { success: '<polyline points="20 6 9 17 4 12"></polyline>', error: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>', warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>', info: '<circle cx="12" cy="12" r="10"></circle>' };

    document.getElementById('wfDrawerContent').innerHTML = `
      <div class="cp-detail-row"><span class="cp-detail-label">Purpose</span><span class="cp-detail-value">${w.purpose}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Trigger</span><span class="cp-detail-value">${w.trigger}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Integrations</span><span class="cp-detail-value">${w.integrations.join(', ')}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Node Count</span><span class="cp-detail-value">${w.nodeCount}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Success Rate (30d)</span><span class="cp-detail-value">${w.successRate}%</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Total Runs (30d)</span><span class="cp-detail-value">${w.totalRuns30d}</span></div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">API Status<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          ${w.apiStatus.map((a) => `<div class="cp-detail-row"><span class="cp-detail-label">${a.name}</span><span class="cp-detail-value" style="color:${a.ok ? 'var(--status-success-text)' : 'var(--status-danger-text)'}">${a.ok ? 'Operational' : 'Needs attention'}</span></div>`).join('')}
        </div>
      </div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Execution Timeline (Last Run)<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="os-timeline">
            ${w.timeline.map((step) => `
              <div class="os-timeline-step ${step.status}">
                <div class="os-timeline-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${LOG_ICON[step.status] || LOG_ICON.info}</svg></div>
                <div class="os-timeline-content">
                  <div>
                    <div class="os-timeline-title">${step.node}</div>
                  </div>
                  <div class="os-timeline-duration">${step.duration}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Recent Logs<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="log-console">
            ${w.logs.map((l) => `
              <div class="log-line ${l.level}">
                <span class="log-time">${l.time}</span>
                <span class="log-level">${l.level}</span>
                <span class="log-message">${l.message}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('#wfDrawerContent .cp-accordion-header').forEach((h) => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
    });

    document.getElementById('wfDrawerActions').innerHTML = `
      <button class="btn btn-ghost wf-connect-btn" data-tooltip="Available in Phase 4" disabled>Connect Live Webhook</button>
      <button class="btn btn-ghost" id="wfPauseBtn">${w.state === 'error' ? 'Retry Now' : 'Pause Workflow'}</button>
    `;
    document.getElementById('wfPauseBtn').addEventListener('click', () => {
      window.OS.toast({ type: 'info', title: w.state === 'error' ? 'Retry requested' : 'Pause requested', message: 'Live workflow control connects to n8n in Phase 4.' });
    });

    window.OS.openDrawer('wfDrawer', 'wfDrawerOverlay');
  }

  document.getElementById('wfCloseDrawer').addEventListener('click', () => window.OS.closeDrawer('wfDrawer', 'wfDrawerOverlay'));
  document.getElementById('wfDrawerOverlay').addEventListener('click', () => window.OS.closeDrawer('wfDrawer', 'wfDrawerOverlay'));

  document.getElementById('wfGrid').addEventListener('click', (e) => {
    if (e.target.closest('.wf-connect-btn')) return;
    const btn = e.target.closest('[data-view-wf]');
    if (btn) { openDrawer(btn.dataset.viewWf); return; }
    const card = e.target.closest('.wf-card');
    if (card) openDrawer(card.dataset.wfId);
  });

  renderSummary();
  renderCards();
});
