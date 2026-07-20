// Ta Panda Business OS — Settings (tabs + mock panels)

document.addEventListener('DOMContentLoaded', () => {
  const D = window.OSData;

  // -----------------------------------------------------------------
  // Tabs
  // -----------------------------------------------------------------
  document.getElementById('stTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.os-tab');
    if (!tab) return;
    document.querySelectorAll('.os-tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.os-tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
  });

  // -----------------------------------------------------------------
  // Save buttons (mock)
  // -----------------------------------------------------------------
  document.querySelectorAll('[data-save-panel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.OS.toast({ type: 'success', title: 'Settings saved', message: `${btn.dataset.savePanel} settings updated.` });
    });
  });

  // -----------------------------------------------------------------
  // Brand swatches
  // -----------------------------------------------------------------
  document.querySelectorAll('.st-swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.st-swatch').forEach((s) => s.classList.remove('active'));
      sw.classList.add('active');
    });
  });

  // -----------------------------------------------------------------
  // AI temperature slider
  // -----------------------------------------------------------------
  const tempSlider = document.getElementById('stTempSlider');
  if (tempSlider) {
    tempSlider.addEventListener('input', () => {
      document.getElementById('stTempVal').textContent = tempSlider.value;
    });
  }

  // -----------------------------------------------------------------
  // Workflow list (data-driven from OSData)
  // -----------------------------------------------------------------
  if (D) {
    document.getElementById('stWorkflowList').innerHTML = D.WORKFLOWS.map((w) => `
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${w.id} — ${w.name}</div>
          <div class="settings-row-desc">${w.trigger}</div>
        </div>
        <label class="switch"><input type="checkbox" checked data-wf-toggle="${w.id}"><span class="switch-track"></span></label>
      </div>
    `).join('');

    document.querySelectorAll('[data-wf-toggle]').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        window.OS.toast({ type: toggle.checked ? 'success' : 'warning', title: toggle.checked ? 'Workflow enabled' : 'Workflow disabled', message: `${toggle.dataset.wfToggle} ${toggle.checked ? 'will run on its schedule.' : 'has been paused.'}` });
      });
    });
  }

  // -----------------------------------------------------------------
  // Integrations grid
  // -----------------------------------------------------------------
  const INTEGRATIONS = [
    { name: 'Telegram', connected: true, detail: 'Connected as @tapanda_ops_bot', icon: '<path d="M22 2 11 13"></path><path d="M22 2 15 22 11 13 2 9 22 2z"></path>' },
    { name: 'Facebook', connected: true, detail: 'Connected — Ta Panda Innovation Page', icon: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>' },
    { name: 'Instagram', connected: true, detail: 'Connected — @tapandainnovation', icon: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>' },
    { name: 'Google Business', connected: true, detail: 'Connected — Ta Panda Innovation', icon: '<path d="M21 10.5c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10.5" r="3"></circle>' },
    { name: 'Google Drive', connected: true, detail: 'Connected — Asset backup folder', icon: '<path d="M8 3h8l6 10-4 8H6l-4-8z"></path>' },
    { name: 'Google Sheets', connected: false, detail: 'Not connected', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>' }
  ];
  document.getElementById('stIntegrationGrid').innerHTML = INTEGRATIONS.map((i) => `
    <div class="integration-card">
      <div class="integration-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${i.icon}</svg></div>
      <div class="integration-info">
        <div class="integration-name">${i.name}</div>
        <div class="integration-status ${i.connected ? 'connected' : ''}">${i.detail}</div>
      </div>
      <label class="switch"><input type="checkbox" ${i.connected ? 'checked' : ''} data-integration="${i.name}"><span class="switch-track"></span></label>
    </div>
  `).join('');
  document.querySelectorAll('[data-integration]').forEach((toggle) => {
    toggle.addEventListener('change', () => {
      window.OS.toast({ type: toggle.checked ? 'success' : 'info', title: toggle.checked ? 'Connected' : 'Disconnected', message: `${toggle.dataset.integration} ${toggle.checked ? 'connected.' : 'disconnected.'}` });
    });
  });

  // -----------------------------------------------------------------
  // API Keys (masked, show/hide, copy)
  // -----------------------------------------------------------------
  const KEYS = [
    { name: 'OpenAI API Key', value: 'sk-proj-••••••••••••••••••••••••7f2A' },
    { name: 'Supabase Anon Key', value: 'eyJhbGciOiJIUzI1NiIs••••••••••••••••' },
    { name: 'Higgsfield API Key', value: 'hf_live_••••••••••••••••••••••••9d3C' },
    { name: 'Meta Graph API Token', value: 'EAAG••••••••••••••••••••••••••••••' },
    { name: 'Google Service Account', value: 'AIzaSy••••••••••••••••••••••••••••' }
  ];
  document.getElementById('stApiKeyList').innerHTML = KEYS.map((k, i) => `
    <div class="apikey-row">
      <span class="apikey-name">${k.name}</span>
      <span class="apikey-value" id="stApiKeyVal-${i}">${k.value}</span>
      <div class="st-apikey-actions">
        <button class="icon-btn" data-copy-key="${i}" title="Copy" style="width:28px;height:28px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('[data-copy-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.OS.toast({ type: 'info', title: 'Key copied', message: 'Masked value copied — real key retrieval connects to a secrets vault in Phase 4.' });
    });
  });

  // -----------------------------------------------------------------
  // Users
  // -----------------------------------------------------------------
  document.getElementById('stInviteBtn').addEventListener('click', () => {
    window.OS.toast({ type: 'info', title: 'Invite sent (mock)', message: 'User invitations connect to Supabase Auth in Phase 4.' });
  });

  // -----------------------------------------------------------------
  // Appearance
  // -----------------------------------------------------------------
  function syncThemeSwitch() {
    const isDark = document.body.classList.contains('dark-theme');
    document.querySelectorAll('#stThemeSwitch button').forEach((b) => b.classList.toggle('active', b.dataset.theme === (isDark ? 'dark' : 'light')));
  }
  syncThemeSwitch();
  document.getElementById('stThemeSwitch').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-theme]');
    if (!btn) return;
    const wantDark = btn.dataset.theme === 'dark';
    document.body.classList.toggle('dark-theme', wantDark);
    localStorage.setItem('os-theme', wantDark ? 'dark' : 'light');
    syncThemeSwitch();
  });

  document.getElementById('stDensitySwitch').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-density]');
    if (!btn) return;
    document.querySelectorAll('#stDensitySwitch button').forEach((b) => b.classList.toggle('active', b === btn));
    if (btn.dataset.density === 'compact') {
      window.OS.toast({ type: 'info', title: 'Compact density', message: 'Full compact layout ships with the Phase 4 design pass.' });
    }
  });
});
