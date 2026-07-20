// Ta Panda Business OS — Workflow Monitor (cards + drawer)
// Phase 4: shows the real 6 live n8n workflows. There is no live n8n
// execution telemetry wired up (that would need a separate n8n-API proxy
// endpoint on the gateway) — queue depth and health are derived from real
// CONTENT_ITEMS status counts instead of fabricated run stats.

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.OSData) return;
  const D = window.OSData;
  await D.ready;
  const workflows = D.WORKFLOWS;

  function healthLabel(w) {
    if (w.health === 'critical') return 'Attention';
    if (w.health === 'warning') return 'Busy';
    return 'Active';
  }

  function renderSummary() {
    const healthy = workflows.filter((w) => w.health === 'healthy').length;
    const attention = workflows.filter((w) => w.health === 'critical').length;
    const totalErrors = workflows.reduce((sum, w) => sum + (w.errorItems ? w.errorItems.length : 0), 0);
    const totalQueue = workflows.reduce((sum, w) => sum + (typeof w.queueCount === 'number' ? w.queueCount : 0), 0);

    window.OS.renderKPICards(document.getElementById('wfSummaryStrip'), [
      { label: 'Workflows Healthy', value: `${healthy}/${workflows.length}`, bg: healthy === workflows.length ? 'var(--status-success-bg)' : 'var(--status-warning-bg)', color: healthy === workflows.length ? 'var(--status-success-text)' : 'var(--status-warning-text)', trendText: 'Live n8n automations', icon: '<polyline points="20 6 9 17 4 12"></polyline>' },
      { label: 'Needs Attention', value: attention, bg: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', valueColor: attention > 0 ? 'var(--status-danger-text)' : null, trendText: 'Publish failures', icon: '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' },
      { label: 'Content In Queue', value: totalQueue, bg: 'var(--status-info-bg)', color: 'var(--status-info-text)', trendText: 'Across all stages', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' },
      { label: 'Publish Errors', value: totalErrors, bg: 'var(--accent-gold-light)', color: 'var(--accent-gold)', trendText: 'From real Sheet data', icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>' }
    ]);
  }

  function renderCards() {
    document.getElementById('wfGrid').innerHTML = workflows.map((w) => {
      const statusClass = w.health === 'critical' ? 'error' : 'idle';
      const statusLabel = healthLabel(w);
      const queueText = typeof w.queueCount === 'number' ? `${w.queueCount} item${w.queueCount === 1 ? '' : 's'}` : '—';
      return `
        <div class="wf-card ${w.health === 'critical' ? 'state-error' : ''}" data-wf-id="${w.id}">
          <div class="wf-card-header">
            <div>
              <div class="wf-card-id">${w.id}</div>
              <div class="wf-card-name">${w.name}</div>
            </div>
            <span class="wf-status-pill ${statusClass}"><span class="dot"></span>${statusLabel}</span>
          </div>
          <div class="wf-card-purpose">${w.purpose}</div>
          <div class="wf-card-body">
            <div class="wf-stat-grid" style="grid-template-columns:1fr;">
              <div class="wf-stat-block"><div class="wf-stat-label">Current Queue</div><div class="wf-stat-value">${queueText}</div></div>
              <div class="wf-stat-block"><div class="wf-stat-label">Trigger</div><div class="wf-stat-value" style="font-size:0.8rem;font-weight:500;">${w.trigger}</div></div>
            </div>
          </div>
          <div class="wf-api-pills">
            ${w.integrations.map((name) => `<span class="wf-api-pill"><span class="dot"></span>${name}</span>`).join('')}
          </div>
          <div class="wf-card-footer">
            <button class="btn btn-ghost" data-view-wf="${w.id}">View Details</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function openDrawer(id) {
    const w = D.getWorkflow(id);
    if (!w) return;
    document.getElementById('wfDrawerTitle').textContent = `${w.id} — ${w.name}`;

    const errorRows = (w.errorItems || []).map((c) => `
      <div class="cp-detail-row"><span class="cp-detail-label">#${c.id}</span><span class="cp-detail-value" style="color:var(--status-danger-text);">${c.error}</span></div>
    `).join('');

    document.getElementById('wfDrawerContent').innerHTML = `
      <div class="cp-detail-row"><span class="cp-detail-label">Purpose</span><span class="cp-detail-value">${w.purpose}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Trigger</span><span class="cp-detail-value">${w.trigger}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Integrations</span><span class="cp-detail-value">${w.integrations.join(', ')}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Current Queue</span><span class="cp-detail-value">${typeof w.queueCount === 'number' ? w.queueCount + ' item(s)' : 'Not tracked from content status'}</span></div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Live Data Note<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="cp-detail-row"><span class="cp-detail-value" style="color:var(--text-muted);">Queue depth is derived live from the real TPI_Project01_DB Sheet. Per-execution history (success rate, run duration, node-level logs) isn't wired up yet — that needs a separate n8n execution-API proxy on top of today's read/write gateway.</span></div>
        </div>
      </div>

      ${errorRows ? `
      <div class="cp-accordion">
        <div class="cp-accordion-header">Items Needing Attention<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">${errorRows}</div>
      </div>` : ''}
    `;

    document.querySelectorAll('#wfDrawerContent .cp-accordion-header').forEach((h) => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
    });

    document.getElementById('wfDrawerActions').innerHTML = '';

    window.OS.openDrawer('wfDrawer', 'wfDrawerOverlay');
  }

  document.getElementById('wfCloseDrawer').addEventListener('click', () => window.OS.closeDrawer('wfDrawer', 'wfDrawerOverlay'));
  document.getElementById('wfDrawerOverlay').addEventListener('click', () => window.OS.closeDrawer('wfDrawer', 'wfDrawerOverlay'));

  document.getElementById('wfGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view-wf]');
    if (btn) { openDrawer(btn.dataset.viewWf); return; }
    const card = e.target.closest('.wf-card');
    if (card) openDrawer(card.dataset.wfId);
  });

  function renderAll() {
    renderSummary();
    renderCards();
  }

  renderAll();
  document.addEventListener('os:data-changed', renderAll);
});
