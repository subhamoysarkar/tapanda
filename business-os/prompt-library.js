// Ta Panda Business OS — Prompt Library (categories, search, versions, compare)

document.addEventListener('DOMContentLoaded', () => {
  if (!window.OSData) return;
  const D = window.OSData;
  const prompts = D.PROMPTS;

  let categoryFilter = '';
  let search = '';
  let openPromptId = null;
  let selectedVersions = [];

  function getFiltered() {
    return prompts.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (search) {
        const hay = (p.name + ' ' + p.category + ' ' + p.tags.join(' ') + ' ' + p.versions[0].text).toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }

  function renderRail() {
    const rail = document.getElementById('plCategoryRail');
    const allCount = prompts.length;
    let html = `<div class="pl-category-item ${categoryFilter === '' ? 'active' : ''}" data-category="">All Prompts<span class="pl-category-count">${allCount}</span></div>`;
    D.PROMPT_CATEGORIES.forEach((cat) => {
      const count = prompts.filter((p) => p.category === cat).length;
      html += `<div class="pl-category-item ${categoryFilter === cat ? 'active' : ''}" data-category="${cat}">${cat}<span class="pl-category-count">${count}</span></div>`;
    });
    rail.innerHTML = html;
    rail.querySelectorAll('.pl-category-item').forEach((item) => {
      item.addEventListener('click', () => {
        categoryFilter = item.dataset.category;
        renderRail();
        renderList();
      });
    });
  }

  function renderList() {
    const filtered = getFiltered();
    document.getElementById('plCount').textContent = `${filtered.length} prompt${filtered.length === 1 ? '' : 's'}`;
    const list = document.getElementById('plPromptList');

    if (!filtered.length) {
      list.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-state-title">No prompts match</div><div class="empty-state-text">Try a different category or search term.</div></div></div>';
      return;
    }

    list.innerHTML = filtered.map((p) => {
      const current = p.versions[0];
      return `
        <div class="pl-prompt-card" data-prompt-id="${p.id}">
          <div class="pl-prompt-card-header">
            <div>
              <div class="pl-prompt-name">${p.name}</div>
              <div class="pl-prompt-category">${p.category}</div>
            </div>
            <span class="pl-prompt-version">v${p.currentVersion}</span>
          </div>
          <div class="pl-prompt-preview">${current.text}</div>
          <div class="pl-prompt-footer">
            <div class="pl-tag-list">${p.tags.map((t) => `<span class="pl-tag">${t}</span>`).join('')}</div>
            <span class="pl-updated">Updated ${D.fmtDateShort(p.updated)}</span>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.pl-prompt-card').forEach((card) => {
      card.addEventListener('click', () => openDrawer(card.dataset.promptId));
    });
  }

  function renderDrawer() {
    const p = D.getPrompt(openPromptId);
    if (!p) return;
    const current = p.versions[0];
    document.getElementById('plDrawerTitle').textContent = p.name;

    document.getElementById('plDrawerContent').innerHTML = `
      <div class="cp-detail-row"><span class="cp-detail-label">Category</span><span class="cp-detail-value">${p.category}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Current Version</span><span class="cp-detail-value">v${p.currentVersion}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Last Updated</span><span class="cp-detail-value">${D.fmtDate(p.updated)}</span></div>
      <div class="cp-detail-row"><span class="cp-detail-label">Tags</span><span class="cp-detail-value">${p.tags.join(', ')}</span></div>

      <div class="cp-asset-block">
        <div class="cp-asset-label">Current Prompt Text (v${p.currentVersion})</div>
        <textarea class="cp-asset-textarea" style="min-height:140px;" readonly>${current.text}</textarea>
      </div>

      <div class="cp-asset-block">
        <div class="cp-asset-label">Notes</div>
        <textarea class="cp-asset-textarea" id="plNotesInput" style="min-height:80px;background-color:var(--bg-primary);" placeholder="Add notes about this prompt's performance or edge cases...">${p.notes || ''}</textarea>
        <button class="btn btn-ghost btn-sm" id="plSaveNotesBtn" style="margin-top:var(--space-2);">Save Notes</button>
      </div>

      <div class="cp-accordion">
        <div class="cp-accordion-header">Version History<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg></div>
        <div class="cp-accordion-body">
          <div class="form-hint" style="margin-bottom:var(--space-3);">Select exactly 2 versions to compare side by side.</div>
          ${p.versions.map((v) => `
            <label class="pl-version-row">
              <input type="checkbox" data-compare-version="${v.v}" ${selectedVersions.includes(v.v) ? 'checked' : ''}>
              <div class="pl-version-row-body">
                <div class="pl-version-row-tag">v${v.v}${v.v === p.currentVersion ? ' (current)' : ''}</div>
                <div class="pl-version-row-date">${D.fmtDate(v.date)}</div>
              </div>
            </label>
          `).join('')}
          <button class="btn btn-primary btn-sm" id="plCompareBtn" style="width:100%;margin-top:var(--space-2);" ${selectedVersions.length === 2 ? '' : 'disabled'}>Compare Selected (${selectedVersions.length}/2)</button>
        </div>
      </div>
    `;

    document.querySelectorAll('#plDrawerContent .cp-accordion-header').forEach((h) => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed'));
    });

    document.getElementById('plSaveNotesBtn').addEventListener('click', () => {
      p.notes = document.getElementById('plNotesInput').value;
      window.OS.toast({ type: 'success', title: 'Notes saved', message: `Notes updated for ${p.name}.` });
    });

    document.querySelectorAll('[data-compare-version]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const v = Number(cb.dataset.compareVersion);
        if (cb.checked) {
          if (selectedVersions.length >= 2) { cb.checked = false; return; }
          selectedVersions.push(v);
        } else {
          selectedVersions = selectedVersions.filter((x) => x !== v);
        }
        renderDrawer();
      });
    });

    const compareBtn = document.getElementById('plCompareBtn');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => openCompareModal(p));
    }

    document.getElementById('plDrawerActions').innerHTML = `
      <button class="btn btn-ghost" id="plDuplicateBtn">Duplicate as New Prompt</button>
    `;
    document.getElementById('plDuplicateBtn').addEventListener('click', () => {
      window.OS.toast({ type: 'info', title: 'Duplicated', message: `A new draft of "${p.name}" was created.` });
    });
  }

  function openDrawer(id) {
    openPromptId = id;
    selectedVersions = [];
    renderDrawer();
    window.OS.openDrawer('plDrawer', 'plDrawerOverlay');
  }

  function openCompareModal(p) {
    const vA = p.versions.find((v) => v.v === selectedVersions[0]);
    const vB = p.versions.find((v) => v.v === selectedVersions[1]);
    const [older, newer] = vA.v < vB.v ? [vA, vB] : [vB, vA];
    document.getElementById('plCompareBody').innerHTML = `
      <div class="pl-compare-body">
        <div>
          <div class="pl-compare-col-label">v${older.v} — ${D.fmtDateShort(older.date)}</div>
          <textarea class="cp-asset-textarea" style="min-height:280px;" readonly>${older.text}</textarea>
        </div>
        <div>
          <div class="pl-compare-col-label">v${newer.v} — ${D.fmtDateShort(newer.date)}</div>
          <textarea class="cp-asset-textarea" style="min-height:280px;" readonly>${newer.text}</textarea>
        </div>
      </div>
    `;
    window.OS.openModal('plCompareModal');
  }

  document.getElementById('plCloseDrawer').addEventListener('click', () => window.OS.closeDrawer('plDrawer', 'plDrawerOverlay'));
  document.getElementById('plDrawerOverlay').addEventListener('click', () => window.OS.closeDrawer('plDrawer', 'plDrawerOverlay'));

  document.getElementById('plSearch').addEventListener('input', (e) => {
    search = e.target.value.toLowerCase();
    renderList();
  });

  renderRail();
  renderList();
});
