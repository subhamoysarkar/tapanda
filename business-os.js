/*
  Ta Panda Business OS - Shared Chrome & Component Behavior
  Loaded on every OS page, after os-data.js, before the page-specific script.
*/

(function () {
  'use strict';

  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    approval: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>'
  };

  const PAGES = [
    { id: 'dashboard', label: 'Dashboard', href: '/business-os.html', group: 'Overview',
      icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>' },
    { id: 'content-planner', label: 'Content Planner', href: '/business-os/content-planner.html', group: 'Marketing',
      icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>' },
    { id: 'publishing-calendar', label: 'Publishing Calendar', href: '/business-os/publishing-calendar.html', group: 'Marketing',
      icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' },
    { id: 'asset-library', label: 'Asset Library', href: '/business-os/asset-library.html', group: 'Marketing',
      icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>' },
    { id: 'workflow-monitor', label: 'Workflow Monitor', href: '/business-os/workflow-monitor.html', group: 'Operations',
      icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>' },
    { id: 'analytics', label: 'Analytics', href: '/business-os/analytics.html', group: 'Operations',
      icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>' },
    { id: 'prompt-library', label: 'Prompt Library', href: '/business-os/prompt-library.html', group: 'Operations',
      icon: '<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line>' },
    { id: 'settings', label: 'Settings', href: '/business-os/settings.html', group: 'System',
      icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' }
  ];

  // ===================================================================
  // KPI card grid renderer — shared by Dashboard, Content Planner, Analytics
  // items: [{ label, value, icon(svg inner), bg, color, valueColor, trend: 'up'|'down'|'', trendText }]
  // ===================================================================
  function renderKPICards(container, items) {
    if (!container) return;
    const trendIcons = {
      up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>',
      down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>'
    };
    container.innerHTML = items.map((k) => `
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">${k.label}</span>
          <div class="kpi-icon" style="background-color:${k.bg};color:${k.color};">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">${k.icon}</svg>
          </div>
        </div>
        <div class="kpi-value" style="${k.valueColor ? 'color:' + k.valueColor + ';' : ''}">${k.value}</div>
        <div class="kpi-trend ${k.trend === 'up' ? 'trend-up' : k.trend === 'down' ? 'trend-down' : ''}">${trendIcons[k.trend] || ''} ${k.trendText || ''}</div>
      </div>
    `).join('');
  }

  // ===================================================================
  // Recent Activity list renderer — shared by Dashboard, Content Planner
  // ===================================================================
  const ACTIVITY_ICONS = {
    check: '<polyline points="20 6 9 17 4 12"></polyline>',
    error: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
    clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>',
    approve: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>',
    reject: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
  };
  function renderActivityList(container, log, limit) {
    if (!container) return;
    container.className = 'activity-list';
    container.innerHTML = log.slice(0, limit || 5).map((a) => `
      <div class="activity-item">
        <div class="activity-icon" ${a.tone === 'danger' ? 'style="background-color:var(--status-danger-bg);color:var(--status-danger-text);"' : a.tone === 'success' ? 'style="background-color:var(--status-success-bg);color:var(--status-success-text);"' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">${ACTIVITY_ICONS[a.icon] || ACTIVITY_ICONS.clock}</svg>
        </div>
        <div class="activity-content">
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${window.OSData.timeAgo(a.time)}</div>
        </div>
      </div>
    `).join('');
  }

  // ===================================================================
  // Workflow Health grid renderer — shared by Dashboard, Content Planner
  // ===================================================================
  function renderWorkflowHealthGrid(container, workflows, opts) {
    if (!container) return;
    opts = opts || {};
    container.className = 'workflow-health-grid';
    container.innerHTML = workflows.map((w) => {
      const isCritical = w.health === 'critical';
      const queueText = typeof w.queueCount === 'number' ? `${w.queueCount} in queue` : 'Active';
      const statusText = isCritical ? 'Attention' : (w.health === 'warning' ? 'Busy' : 'Active');
      return `
      <a class="health-card" href="/business-os/workflow-monitor.html" style="${isCritical ? 'border-color:var(--status-danger-text);' : ''}">
        <div class="health-header">
          <span class="health-title">${w.id} (${w.name})</span>
          <div class="health-dot ${isCritical ? '' : w.health === 'warning' ? 'yellow' : 'green'}" style="${isCritical ? 'background-color:var(--status-danger-text);' : ''}"></div>
        </div>
        <div class="health-time">${opts.verbose ? statusText + ' — ' + queueText : queueText}</div>
      </a>
    `;
    }).join('');
  }

  // ===================================================================
  // Toasts
  // ===================================================================
  let toastStack = null;
  function ensureToastStack() {
    if (toastStack) return toastStack;
    toastStack = document.createElement('div');
    toastStack.className = 'toast-stack';
    document.body.appendChild(toastStack);
    return toastStack;
  }

  function toast(opts) {
    if (typeof opts === 'string') opts = { message: opts };
    const type = opts.type || 'info';
    const title = opts.title || { success: 'Success', warning: 'Warning', error: 'Error', info: 'Notice' }[type];
    const stack = ensureToastStack();
    const node = document.createElement('div');
    node.className = 'toast ' + type;
    node.innerHTML = `
      <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${opts.message ? `<div class="toast-message">${opts.message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    const remove = () => {
      node.classList.add('leaving');
      setTimeout(() => node.remove(), 200);
    };
    node.querySelector('.toast-close').addEventListener('click', remove);
    stack.appendChild(node);
    setTimeout(remove, opts.duration || 4200);
    return node;
  }

  // ===================================================================
  // Generic modal open/close (works with any .modal-overlay#id)
  // ===================================================================
  function openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('active');
  }
  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('active');
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach((o) => o.classList.remove('active'));
  }

  // ===================================================================
  // Generic drawer open/close (works with any .os-drawer#id + matching overlay)
  // ===================================================================
  function openDrawer(drawerId, overlayId) {
    const drawer = document.getElementById(drawerId);
    const overlay = document.getElementById(overlayId || drawerId + 'Overlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(drawerId, overlayId) {
    const drawer = document.getElementById(drawerId);
    const overlay = document.getElementById(overlayId || drawerId + 'Overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  function closeAllDrawers() {
    document.querySelectorAll('.os-drawer.open').forEach((d) => d.classList.remove('open'));
    document.querySelectorAll('.os-drawer-overlay.active').forEach((o) => o.classList.remove('active'));
    document.body.style.overflow = '';
  }

  // ===================================================================
  // Command palette
  // ===================================================================
  function initCommandPalette() {
    const overlay = document.createElement('div');
    overlay.className = 'cmdk-overlay';
    overlay.id = 'osCmdkOverlay';
    overlay.innerHTML = `
      <div class="cmdk" role="dialog" aria-label="Command palette">
        <div class="cmdk-input-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" class="cmdk-input" id="osCmdkInput" placeholder="Jump to a page or run a command...">
          <span class="cmdk-hint">Esc</span>
        </div>
        <div class="cmdk-list" id="osCmdkList"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#osCmdkInput');
    const list = overlay.querySelector('#osCmdkList');
    const currentPage = document.body.dataset.page;

    const actions = [
      { group: 'Actions', label: 'Toggle theme', icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>', run: () => document.getElementById('themeToggleBtn') && document.getElementById('themeToggleBtn').click() },
      { group: 'Actions', label: 'Toggle sidebar', icon: '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>', run: () => document.getElementById('sidebarToggleBtn') && document.getElementById('sidebarToggleBtn').click() }
    ];

    const items = PAGES.filter((p) => p.id !== currentPage).map((p) => ({ group: p.group, label: 'Go to ' + p.label, icon: p.icon, href: p.href })).concat(actions);

    function render(query) {
      const q = (query || '').toLowerCase().trim();
      const filtered = items.filter((it) => !q || it.label.toLowerCase().includes(q) || it.group.toLowerCase().includes(q));
      if (!filtered.length) {
        list.innerHTML = '<div class="cmdk-empty">No matches found.</div>';
        return;
      }
      let html = '';
      let lastGroup = null;
      filtered.forEach((it, i) => {
        if (it.group !== lastGroup) {
          html += `<div class="cmdk-group-label">${it.group}</div>`;
          lastGroup = it.group;
        }
        html += `<div class="cmdk-item${i === 0 ? ' active' : ''}" data-index="${i}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${it.icon}</svg>${it.label}</div>`;
      });
      list.innerHTML = html;
      list.dataset.count = filtered.length;
      list._filtered = filtered;
    }

    function execute(it) {
      close();
      if (it.href) window.location.href = it.href;
      else if (it.run) it.run();
    }

    function open() {
      overlay.classList.add('active');
      input.value = '';
      render('');
      setTimeout(() => input.focus(), 30);
    }
    function close() {
      overlay.classList.remove('active');
    }

    input.addEventListener('input', () => render(input.value));
    list.addEventListener('click', (e) => {
      const el = e.target.closest('.cmdk-item');
      if (!el) return;
      execute(list._filtered[Number(el.dataset.index)]);
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    input.addEventListener('keydown', (e) => {
      const activeEl = list.querySelector('.cmdk-item.active');
      const all = Array.from(list.querySelectorAll('.cmdk-item'));
      if (!all.length) return;
      let idx = all.indexOf(activeEl);
      if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % all.length; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + all.length) % all.length; }
      else if (e.key === 'Enter') { e.preventDefault(); if (activeEl) execute(list._filtered[Number(activeEl.dataset.index)]); return; }
      else return;
      all.forEach((el) => el.classList.remove('active'));
      all[idx].classList.add('active');
      all[idx].scrollIntoView({ block: 'nearest' });
    });

    window.OS = window.OS || {};
    window.OS.openCommandPalette = open;
    window.OS.closeCommandPalette = close;
  }

  // ===================================================================
  // Notifications panel
  // ===================================================================
  function initNotifications() {
    const bellBtn = document.getElementById('notifBellBtn');
    if (!bellBtn) return;
    let panel = document.getElementById('notifPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'notif-panel';
      panel.id = 'notifPanel';
      bellBtn.parentElement.appendChild(panel);
    }

    function renderPanel() {
      const notifs = (window.OSData && window.OSData.NOTIFICATIONS) || [];
      const unread = notifs.filter((n) => !n.read).length;
      let dot = bellBtn.querySelector('.notif-dot');
      if (unread > 0 && !dot) {
        dot = document.createElement('span');
        dot.className = 'notif-dot';
        bellBtn.appendChild(dot);
      } else if (unread === 0 && dot) {
        dot.remove();
      }

      if (!notifs.length) {
        panel.innerHTML = '<div class="notif-panel-empty">You&rsquo;re all caught up.</div>';
        return;
      }

      const rows = notifs.slice(0, 12).map((n) => `
        <div class="notif-item ${n.type} ${n.read ? '' : 'unread'}">
          <div class="notif-icon">${ICONS[n.type] || ICONS.info}</div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            <div class="notif-message">${n.message}</div>
            <div class="notif-time">${window.OSData.timeAgo(n.time)}</div>
          </div>
        </div>
      `).join('');

      panel.innerHTML = `
        <div class="notif-panel-header">
          <span class="notif-panel-title">Notifications</span>
          <span class="notif-panel-action" id="notifMarkAllRead">Mark all read</span>
        </div>
        ${rows}
      `;

      const markAll = panel.querySelector('#notifMarkAllRead');
      if (markAll) {
        markAll.addEventListener('click', () => {
          notifs.forEach((n) => n.read = true);
          renderPanel();
        });
      }
    }

    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) renderPanel();
    });
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== bellBtn) panel.classList.remove('open');
    });

    renderPanel();
  }

  // ===================================================================
  // Global header search
  // ===================================================================
  function initGlobalSearch() {
    const input = document.querySelector('.header-search input');
    if (!input) return;
    const wrap = input.closest('.header-search');
    let results = document.getElementById('searchResults');
    if (!results) {
      results = document.createElement('div');
      results.className = 'search-results';
      results.id = 'searchResults';
      wrap.appendChild(results);
    }

    function search(query) {
      const q = query.trim().toLowerCase();
      if (!q || !window.OSData) { results.classList.remove('open'); return; }

      const content = window.OSData.CONTENT_ITEMS.filter((c) => c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)).slice(0, 4);
      const prompts = window.OSData.PROMPTS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 3);
      const workflows = window.OSData.WORKFLOWS.filter((w) => w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q)).slice(0, 3);
      const assets = window.OSData.ASSETS.filter((a) => a.filename.toLowerCase().includes(q)).slice(0, 3);

      if (!content.length && !prompts.length && !workflows.length && !assets.length) {
        results.innerHTML = '<div class="search-empty">No results for &ldquo;' + query + '&rdquo;</div>';
        results.classList.add('open');
        return;
      }

      function group(label, items, hrefBase, iconSvg) {
        if (!items.length) return '';
        return `<div class="search-result-group-label">${label}</div>` + items.map((it) => `
          <div class="search-result-item" data-href="${hrefBase}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
            <span>${it.title || it.name || it.filename}</span>
            <span class="search-result-meta">${it.id || ''}</span>
          </div>
        `).join('');
      }

      results.innerHTML =
        group('Content', content, '/business-os/content-planner.html', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>') +
        group('Prompts', prompts, '/business-os/prompt-library.html', '<polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line>') +
        group('Workflows', workflows, '/business-os/workflow-monitor.html', '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>') +
        group('Assets', assets, '/business-os/asset-library.html', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>');
      results.classList.add('open');
    }

    input.addEventListener('input', () => search(input.value));
    input.addEventListener('focus', () => { if (input.value) search(input.value); });
    results.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (item) window.location.href = item.dataset.href;
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) results.classList.remove('open');
    });

    window.OS = window.OS || {};
    window.OS.focusSearch = () => input.focus();
  }

  // ===================================================================
  // Skeleton reveal (brief loading state on first paint)
  // ===================================================================
  function initSkeletonReveal() {
    const content = document.querySelector('.os-content');
    if (!content) return;
    const overlay = document.createElement('div');
    overlay.className = 'skeleton-overlay';
    overlay.innerHTML = `
      <div class="skeleton skeleton-title" style="width:220px;height:24px;"></div>
      <div class="skeleton-row">
        <div class="skeleton skeleton-block" style="height:88px;"></div>
        <div class="skeleton skeleton-block" style="height:88px;"></div>
        <div class="skeleton skeleton-block" style="height:88px;"></div>
        <div class="skeleton skeleton-block" style="height:88px;"></div>
      </div>
      <div class="skeleton-row">
        <div class="skeleton skeleton-block" style="height:220px;"></div>
      </div>
      <div class="skeleton-row">
        <div class="skeleton skeleton-block" style="height:180px;"></div>
        <div class="skeleton skeleton-block" style="height:180px;"></div>
      </div>
    `;
    content.prepend(overlay);
    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 320);
    }, 420);
  }

  // ===================================================================
  // System status pill (header) — reflects live workflow health from OSData
  // ===================================================================
  function initSystemStatusPill() {
    const pill = document.querySelector('.workflow-status');
    const label = pill && pill.querySelector('.status-label');
    const dot = pill && pill.querySelector('.status-dot');
    if (!pill || !label || !dot || !window.OSData) return;

    const workflows = window.OSData.WORKFLOWS;
    const erroring = workflows.filter((w) => w.health === 'critical').length;
    const warning = workflows.filter((w) => w.health === 'warning').length;

    if (erroring > 0) {
      dot.style.backgroundColor = 'var(--status-danger-text)';
      label.textContent = erroring + ' Workflow' + (erroring > 1 ? 's' : '') + ' Need Attention';
    } else if (warning > 0) {
      dot.style.backgroundColor = 'var(--status-warning-text)';
      label.textContent = warning + ' Workflow' + (warning > 1 ? 's' : '') + ' Degraded';
    } else {
      dot.style.backgroundColor = 'var(--status-success-text)';
      label.textContent = 'All Systems Operational';
    }
  }

  // ===================================================================
  // Quick Create modal — injected once, shared by every page's
  // "+ Quick Create" header button ([data-modal-open="quickCreateModal"])
  // ===================================================================
  function initQuickCreateModal() {
    if (document.getElementById('quickCreateModal')) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'quickCreateModal';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Quick Create</span>
          <button class="os-drawer-close" data-modal-close="quickCreateModal" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Content Title</label>
            <input type="text" class="form-input" id="qcTitle" placeholder="e.g. 5 Vastu Tips for a North Facing Home">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Content Type</label>
              <select class="form-select" id="qcType">
                <option>Static Image</option>
                <option>Carousel</option>
                <option>Reel</option>
                <option>Video</option>
                <option>Blog Post</option>
                <option>Youtube Short</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Platform</label>
              <select class="form-select" id="qcPlatform">
                <option>Instagram</option>
                <option>Facebook</option>
                <option>Google Business</option>
                <option>Blog</option>
                <option>YouTube</option>
              </select>
            </div>
          </div>
          <div class="form-hint">Content ideas are generated automatically by WF01 (Strategy Generator) every morning &mdash; there's no real "create idea" action in the live pipeline, so this is disabled rather than faking a Sheet row.</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" data-modal-close="quickCreateModal">Cancel</button>
          <button class="btn btn-primary" id="qcCreateBtn" disabled title="WF01 generates content automatically — not a manual action">Create Content Idea</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal('quickCreateModal'));
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal('quickCreateModal'); });
  }

  // ===================================================================
  // Sidebar active state (data-page driven, works across real navigation)
  // ===================================================================
  function initSidebarActiveState() {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  }

  // ===================================================================
  // Coming Soon nav items — dim + toast instead of dead link
  // ===================================================================
  function initComingSoonNav() {
    document.querySelectorAll('.nav-item[data-soon]').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        toast({ type: 'info', title: item.dataset.soon || 'Coming Soon', message: 'This module is planned for a future phase.' });
      });
    });
  }

  // ===================================================================
  // Escape key closes any open overlay (drawer, modal, cmdk, panels)
  // ===================================================================
  function initEscapeHandler() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closeAllDrawers();
      closeAllModals();
      if (window.OS && window.OS.closeCommandPalette) window.OS.closeCommandPalette();
      document.querySelectorAll('.notif-panel.open').forEach((p) => p.classList.remove('open'));
      document.querySelectorAll('.search-results.open').forEach((p) => p.classList.remove('open'));
      document.querySelectorAll('.dropdown-menu.open').forEach((p) => p.classList.remove('open'));
    });
  }

  // ===================================================================
  // Keyboard shortcuts: Cmd/Ctrl+K, / to focus search
  // ===================================================================
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.OS && window.OS.openCommandPalette && window.OS.openCommandPalette();
        return;
      }
      if (e.key === '/' && !typing) {
        e.preventDefault();
        window.OS && window.OS.focusSearch && window.OS.focusSearch();
      }
    });
  }

  // ===================================================================
  // Init on load
  // ===================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // --- Current Date Injection ---
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      const now = (window.OSData && window.OSData.TODAY) || new Date();
      dateElement.textContent = now.toLocaleDateString('en-US', options);
    }

    // --- Sidebar Toggle ---
    const sidebar = document.getElementById('osSidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebar && sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) sidebar.classList.toggle('mobile-open');
        else sidebar.classList.toggle('collapsed');
      });
    }
    // --- Mobile menu button (header) — opens the sidebar on small screens,
    // since the sidebar's own toggle is hidden off-canvas along with it ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
    }

    // --- Mobile Sidebar Overlay Close ---
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('mobile-open')) {
        const openedByToggle = sidebarToggleBtn && sidebarToggleBtn.contains(e.target);
        const openedByMobileBtn = mobileMenuBtn && mobileMenuBtn.contains(e.target);
        if (!sidebar.contains(e.target) && !openedByToggle && !openedByMobileBtn) {
          sidebar.classList.remove('mobile-open');
        }
      }
    });
    // Close mobile sidebar after choosing a real nav link
    document.querySelectorAll('.nav-item[href]:not([href="#"])').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768 && sidebar) sidebar.classList.remove('mobile-open');
      });
    });

    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      const currentTheme = localStorage.getItem('os-theme') || 'light';
      if (currentTheme === 'dark') document.body.classList.add('dark-theme');

      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('os-theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
      });
    }

    initSidebarActiveState();
    initComingSoonNav();
    initCommandPalette();
    initNotifications();
    initGlobalSearch();
    initSkeletonReveal();
    initEscapeHandler();
    initKeyboardShortcuts();
    initSystemStatusPill();
    document.addEventListener('os:data-changed', initSystemStatusPill);
    initQuickCreateModal();

    // Wire up any [data-modal-open] / [data-modal-close] / [data-drawer-close] triggers declared in page HTML
    document.querySelectorAll('[data-modal-open]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
    });
    document.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
    });
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
    });

    window.OS = Object.assign(window.OS || {}, { toast, openModal, closeModal, closeAllModals, openDrawer, closeDrawer, closeAllDrawers, renderKPICards, renderActivityList, renderWorkflowHealthGrid, PAGES });
  });
})();
