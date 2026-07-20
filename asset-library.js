// Ta Panda Business OS — Asset Library (Gallery / Grid / List + Drawer)

document.addEventListener('DOMContentLoaded', () => {
  if (!window.OSData) return;
  const D = window.OSData;
  const assets = D.ASSETS;

  const ASSET_ICONS = {
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
    video: '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>',
    carousel: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line>',
    thumbnail: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>'
  };
  const TYPE_LABEL = { image: 'Image', video: 'Video', carousel: 'Carousel', thumbnail: 'Thumbnail' };

  const filters = { type: '', usage: '', search: '' };
  let currentView = 'gallery';
  let carouselIndex = 0;
  let openAssetId = null;

  function getFiltered() {
    return assets.filter((a) => {
      if (filters.type && a.type !== filters.type) return false;
      if (filters.usage === 'used' && !(a.usedIn && a.usedIn.length)) return false;
      if (filters.usage === 'unused' && a.usedIn && a.usedIn.length) return false;
      if (filters.search && !a.filename.toLowerCase().includes(filters.search)) return false;
      return true;
    });
  }

  function cardThumbHTML(a) {
    if (a.type === 'video') {
      return `
        <img src="${a.url}" alt="${a.filename}">
        <span class="al-type-badge">Video</span>
        <div class="al-play-overlay"><div class="al-play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg></div></div>
        <span class="al-duration-badge">${a.duration || ''}</span>
      `;
    }
    if (a.type === 'carousel') {
      return `
        <img src="${a.url}" alt="${a.filename}">
        <span class="al-type-badge">Carousel</span>
        <span class="al-slide-count"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect></svg>${a.slides ? a.slides.length : 1}</span>
      `;
    }
    return `<img src="${a.url}" alt="${a.filename}"><span class="al-type-badge">${TYPE_LABEL[a.type]}</span>`;
  }

  function renderResults() {
    const filtered = getFiltered();
    document.getElementById('alCount').textContent = `${filtered.length} asset${filtered.length === 1 ? '' : 's'}`;
    const el = document.getElementById('alResults');

    if (!filtered.length) {
      el.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div><div class="empty-state-title">No assets match your filters</div><div class="empty-state-text">Try clearing filters or search a different term.</div></div></div>';
      return;
    }

    if (currentView === 'list') {
      el.innerHTML = `
        <div class="card" style="overflow-x:auto;">
          <table class="al-list-table">
            <thead><tr><th>Name</th><th>Type</th><th>Dimensions</th><th>Size</th><th>Uploaded</th><th>Used In</th></tr></thead>
            <tbody>
              ${filtered.map((a) => `
                <tr data-asset-id="${a.id}">
                  <td><div class="al-list-name-cell"><img src="${a.url}" class="al-list-thumb" alt=""><span>${a.filename}</span></div></td>
                  <td>${TYPE_LABEL[a.type]}</td>
                  <td>${a.dimensions || '—'}</td>
                  <td>${a.size}</td>
                  <td>${D.fmtDateShort(a.uploadedDate)}</td>
                  <td>${a.usedIn && a.usedIn.length ? a.usedIn.length + ' item' + (a.usedIn.length > 1 ? 's' : '') : '<span style="color:var(--text-muted);">Unused</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      el.querySelectorAll('tr[data-asset-id]').forEach((row) => row.addEventListener('click', () => openDrawer(row.dataset.assetId)));
      return;
    }

    const wrapClass = currentView === 'gallery' ? 'al-gallery' : 'al-grid';
    el.innerHTML = `<div class="${wrapClass}">${filtered.map((a) => `
      <div class="al-card" data-asset-id="${a.id}">
        <div class="al-card-thumb">${cardThumbHTML(a)}</div>
        <div class="al-card-body">
          <div class="al-card-title" title="${a.filename}">${a.filename}</div>
          <div class="al-card-meta"><span>${a.size}</span><span>${a.dimensions || ''}</span></div>
        </div>
      </div>
    `).join('')}</div>`;
    el.querySelectorAll('.al-card').forEach((card) => card.addEventListener('click', () => openDrawer(card.dataset.assetId)));
  }

  // -----------------------------------------------------------------
  // Drawer
  // -----------------------------------------------------------------
  function drawerPreviewHTML(a) {
    if (a.type === 'carousel' && a.slides && a.slides.length > 1) {
      return `
        <div class="al-drawer-preview" id="alCarouselPreview">
          <img src="${a.slides[carouselIndex]}" alt="">
          <button class="al-carousel-nav prev" id="alCarPrev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
          <button class="al-carousel-nav next" id="alCarNext"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
          <div class="al-carousel-dots">${a.slides.map((_, i) => `<span class="al-carousel-dot ${i === carouselIndex ? 'active' : ''}"></span>`).join('')}</div>
        </div>
      `;
    }
    if (a.type === 'video') {
      return `
        <div class="al-drawer-preview">
          <img src="${a.url}" alt="">
          <div class="al-play-overlay"><div class="al-play-icon" style="width:56px;height:56px;"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg></div></div>
          <span class="al-duration-badge">${a.duration || ''}</span>
        </div>
      `;
    }
    return `<div class="al-drawer-preview"><img src="${a.url}" alt=""></div>`;
  }

  function openDrawer(id) {
    const asset = D.getAsset(id);
    if (!asset) return;
    openAssetId = id;
    carouselIndex = 0;
    renderDrawerContent();
    window.OS.openDrawer('alDrawer', 'alDrawerOverlay');
  }

  function renderDrawerContent() {
    const asset = D.getAsset(openAssetId);
    if (!asset) return;

    document.getElementById('alDrawerContent').innerHTML = `
      ${drawerPreviewHTML(asset)}

      <div class="cp-accordion">
        <div class="cp-accordion-header">Metadata<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="cp-detail-row"><span class="cp-detail-label">Asset ID</span><span class="cp-detail-value">#${asset.id}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Filename</span><span class="cp-detail-value">${asset.filename}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Type</span><span class="cp-detail-value">${TYPE_LABEL[asset.type]}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Dimensions</span><span class="cp-detail-value">${asset.dimensions || '—'}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">File Size</span><span class="cp-detail-value">${asset.size}</span></div>
          <div class="cp-detail-row"><span class="cp-detail-label">Uploaded</span><span class="cp-detail-value">${D.fmtDate(asset.uploadedDate)}</span></div>
        </div>
      </div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Used In<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="al-used-in-list">
            ${asset.usedIn && asset.usedIn.length ? asset.usedIn.map((id) => `<a href="content-planner.html" class="al-used-in-badge">#${id}</a>`).join('') : '<span style="color:var(--text-muted);font-size:0.8125rem;">Not used in any content yet.</span>'}
          </div>
        </div>
      </div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Version History<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          ${asset.versions.map((v, i) => `
            <div class="al-version-item">
              <div>
                <div class="al-version-tag">v${v.v}${i === 0 ? ' (current)' : ''}</div>
                <div class="al-version-note">${v.note || ''} — ${D.fmtDateShort(v.date)}</div>
              </div>
              ${i !== 0 ? `<button class="btn btn-ghost btn-sm" data-restore-version="${v.v}">Restore</button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('#alDrawerContent .cp-accordion-header').forEach((h) => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
    });

    if (asset.type === 'carousel' && asset.slides && asset.slides.length > 1) {
      document.getElementById('alCarPrev').addEventListener('click', (e) => { e.stopPropagation(); carouselIndex = (carouselIndex - 1 + asset.slides.length) % asset.slides.length; renderDrawerContent(); });
      document.getElementById('alCarNext').addEventListener('click', (e) => { e.stopPropagation(); carouselIndex = (carouselIndex + 1) % asset.slides.length; renderDrawerContent(); });
    }

    document.querySelectorAll('[data-restore-version]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.OS.toast({ type: 'success', title: 'Version restored', message: `${asset.filename} reverted to v${btn.dataset.restoreVersion}.` });
      });
    });

    document.getElementById('alDrawerActions').innerHTML = `
      <button class="btn btn-ghost" id="alReplaceBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>Replace Asset</button>
      <button class="btn btn-ghost" id="alDownloadBtn">Download</button>
      <button class="btn btn-ghost" id="alDeleteBtn" style="border-color:var(--status-danger-text);color:var(--status-danger-text);">Delete</button>
    `;
    document.getElementById('alReplaceBtn').addEventListener('click', () => {
      window.OS.toast({ type: 'info', title: 'Replace Asset', message: 'File upload connects to Supabase Storage in Phase 4.' });
    });
    document.getElementById('alDownloadBtn').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = asset.url; a.download = asset.filename;
      document.body.appendChild(a); a.click(); a.remove();
    });
    document.getElementById('alDeleteBtn').addEventListener('click', () => {
      const idx = assets.indexOf(asset);
      if (idx > -1) assets.splice(idx, 1);
      window.OS.toast({ type: 'info', title: 'Asset deleted', message: `${asset.filename} was removed from the library.` });
      window.OS.closeDrawer('alDrawer', 'alDrawerOverlay');
      renderResults();
    });
  }

  document.getElementById('alCloseDrawer').addEventListener('click', () => window.OS.closeDrawer('alDrawer', 'alDrawerOverlay'));
  document.getElementById('alDrawerOverlay').addEventListener('click', () => window.OS.closeDrawer('alDrawer', 'alDrawerOverlay'));

  // -----------------------------------------------------------------
  // Toolbar: filters, view switch
  // -----------------------------------------------------------------
  document.getElementById('alFilterType').addEventListener('change', (e) => { filters.type = e.target.value; renderResults(); });
  document.getElementById('alFilterUsage').addEventListener('change', (e) => { filters.usage = e.target.value; renderResults(); });
  document.getElementById('alSearch').addEventListener('input', (e) => { filters.search = e.target.value.toLowerCase(); renderResults(); });

  document.getElementById('alViewSwitch').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (!btn) return;
    currentView = btn.dataset.view;
    document.querySelectorAll('#alViewSwitch button').forEach((b) => b.classList.toggle('active', b === btn));
    renderResults();
  });

  // -----------------------------------------------------------------
  // Upload dropzone (UI-only placeholder)
  // -----------------------------------------------------------------
  const dropzone = document.getElementById('alDropzone');
  const fileInput = document.getElementById('alFileInput');
  function handleFiles(files) {
    if (!files || !files.length) return;
    window.OS.toast({ type: 'info', title: 'Upload queued', message: `${files.length} file${files.length > 1 ? 's' : ''} ready — Supabase Storage upload connects in Phase 4.` });
  }
  dropzone.addEventListener('click', () => fileInput.click());
  document.getElementById('alUploadBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  renderResults();
  document.addEventListener('os:data-changed', renderResults);
});
