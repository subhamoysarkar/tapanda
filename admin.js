// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const PASSWORD = 'tapanda2025';
  
  // DOM Elements
  const loginOverlay = document.getElementById('loginOverlay');
  const loginPassword = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const crmContainer = document.getElementById('crmContainer');
  
  const categoriesList = document.getElementById('categoriesList');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const addCatForm = document.getElementById('addCatForm');
  const newCatName = document.getElementById('newCatName');
  const saveNewCatBtn = document.getElementById('saveNewCatBtn');
  const cancelNewCatBtn = document.getElementById('cancelNewCatBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const optimizeBtn = document.getElementById('optimizeBtn');
  const optimizeStatus = document.getElementById('optimizeStatus');
  const reloadBtn = document.getElementById('reloadBtn');
  const reloadStatus = document.getElementById('reloadStatus');
  
  const mainContent = document.getElementById('mainContent');
  const emptyState = document.getElementById('emptyState');
  const currentCategoryName = document.getElementById('currentCategoryName');
  const itemsGrid = document.getElementById('itemsGrid');
  const addItemBtn = document.getElementById('addItemBtn');
  
  // Modal Elements
  const addItemModal = document.getElementById('addItemModal');
  const thumbnailFileInput = document.getElementById('thumbnailFileInput');
  const actualFileInput = document.getElementById('actualFileInput');
  const thumbnailPreviewContainer = document.getElementById('thumbnailPreviewContainer');
  const actualPreviewContainer = document.getElementById('actualPreviewContainer');
  const thumbnailImagePreview = document.getElementById('thumbnailImagePreview');
  const actualImagePreview = document.getElementById('actualImagePreview');
  const singleFileFormGroup = document.getElementById('singleFileFormGroup');
  const newItemTitle = document.getElementById('newItemTitle');
  const newItemDetail = document.getElementById('newItemDetail');
  const newItemCategory = document.getElementById('newItemCategory');
  const saveItemBtn = document.getElementById('saveItemBtn');
  const cancelItemBtn = document.getElementById('cancelItemBtn');

  // State
  let projectsData = { categories: [] };
  let activeCategoryId = null;
  let thumbnailFile = null;
  let actualFile = null;

  // ---- Authentication ----
  if (sessionStorage.getItem('tapanda_crm_auth') === 'true') {
    showCrm();
  }

  loginBtn.addEventListener('click', handleLogin);
  loginPassword.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });

  function handleLogin() {
    if (loginPassword.value === PASSWORD) {
      sessionStorage.setItem('tapanda_crm_auth', 'true');
      showCrm();
    } else {
      loginError.textContent = 'Incorrect password.';
    }
  }

  function showCrm() {
    loginOverlay.style.display = 'none';
    crmContainer.style.display = 'flex';
    loadData();
  }

  // ---- Data Management ----
  async function loadData() {
    try {
      const res = await fetch('./projects-data.json');
      if (!res.ok) throw new Error('Network response was not ok');
      projectsData = await res.json();
      localStorage.setItem('tapanda_projects', JSON.stringify(projectsData));
      showStatus('✓ Data loaded from projects-data.json');
    } catch (err) {
      console.warn('Failed to fetch projects-data.json, falling back to localStorage', err);
      const localData = localStorage.getItem('tapanda_projects');
      if (localData) {
        projectsData = JSON.parse(localData);
      } else {
        projectsData = { categories: [] };
        emptyState.innerHTML = '<p style="text-align:center; padding:2rem;">No project data found. Start by adding a category.</p>';
      }
    }

    if (projectsData.categories && projectsData.categories.length > 0) {
      activeCategoryId = projectsData.categories[0].id;
    } else {
      activeCategoryId = null;
    }
    renderSidebar();
    renderMain();
  }

  function showStatus(msg) {
    if (reloadStatus) {
      reloadStatus.textContent = msg;
      reloadStatus.style.display = 'block';
      reloadStatus.style.color = '#4CAF50';
      setTimeout(() => {
        reloadStatus.style.display = 'none';
      }, 3000);
    }
  }

  async function saveData() {
    localStorage.setItem('tapanda_projects', JSON.stringify(projectsData));
    try {
      const response = await fetch('/save-projects-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectsData, null, 2)
      });
      if (!response.ok) {
        console.error('Failed to save to server');
      }
    } catch (e) {
      console.error('Error saving to server:', e);
    }
  }

  if (reloadBtn) {
    reloadBtn.addEventListener('click', async () => {
      reloadBtn.textContent = 'Reloading...';
      await loadData();
      reloadBtn.textContent = 'Reload from File';
    });
  }

  // ---- Sidebar: Categories ----
  function renderSidebar() {
    categoriesList.innerHTML = '';
    
    if (!projectsData.categories) return;

    projectsData.categories.forEach(cat => {
      const item = document.createElement('div');
      item.className = `category-item ${cat.id === activeCategoryId ? 'active' : ''}`;
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'category-name';
      const itemCount = cat.items ? cat.items.length : 0;
      nameSpan.textContent = `${cat.name} (${itemCount})`;
      
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'category-name-input';
      nameInput.value = cat.name;
      nameInput.style.display = 'none';

      const actions = document.createElement('div');
      actions.className = 'cat-actions';
      
      const editBtn = document.createElement('button');
      editBtn.innerHTML = '✏️';
      editBtn.title = 'Rename';
      
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'Delete';

      item.addEventListener('click', (e) => {
        if (e.target !== editBtn && e.target !== delBtn && e.target !== nameInput) {
          activeCategoryId = cat.id;
          renderSidebar();
          renderMain();
        }
      });

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isEditing = nameInput.style.display === 'block';
        if (isEditing) {
          if (nameInput.value.trim()) {
            cat.name = nameInput.value.trim();
            saveData();
            renderSidebar();
            if (activeCategoryId === cat.id) renderMain();
          }
        } else {
          nameSpan.style.display = 'none';
          nameInput.style.display = 'block';
          nameInput.focus();
          editBtn.innerHTML = '✅';
        }
      });

      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          editBtn.click();
        }
      });

      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete category "${cat.name}" and all its items? This cannot be undone.`)) {
          try {
            await fetch('/delete-category', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ categoryName: cat.name })
            });
          } catch(err) { console.error('Failed to delete category directory', err); }

          projectsData.categories = projectsData.categories.filter(c => c.id !== cat.id);
          if (activeCategoryId === cat.id) {
            activeCategoryId = projectsData.categories.length ? projectsData.categories[0].id : null;
            renderMain();
          }
          saveData();
          renderSidebar();
        }
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      
      item.appendChild(nameSpan);
      item.appendChild(nameInput);
      item.appendChild(actions);
      categoriesList.appendChild(item);
    });

    updateCategoryDropdown();
  }

  // Add Category
  addCategoryBtn.addEventListener('click', () => {
    addCategoryBtn.style.display = 'none';
    addCatForm.style.display = 'flex';
    newCatName.focus();
  });

  cancelNewCatBtn.addEventListener('click', () => {
    addCategoryBtn.style.display = 'block';
    addCatForm.style.display = 'none';
    newCatName.value = '';
  });

  saveNewCatBtn.addEventListener('click', () => {
    const name = newCatName.value.trim();
    if (name) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newCat = {
        id: slug + '-' + Date.now(),
        name: name,
        order: projectsData.categories ? projectsData.categories.length + 1 : 1,
        items: []
      };
      if (!projectsData.categories) projectsData.categories = [];
      projectsData.categories.push(newCat);
      saveData();
      
      addCategoryBtn.style.display = 'block';
      addCatForm.style.display = 'none';
      newCatName.value = '';
      
      activeCategoryId = newCat.id;
      renderSidebar();
      renderMain();
    }
  });

  // ---- Main Content: Category Details ----
  function renderMain() {
    if (!activeCategoryId) {
      mainContent.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    const cat = projectsData.categories.find(c => c.id === activeCategoryId);
    if (!cat) return;

    mainContent.style.display = 'block';
    emptyState.style.display = 'none';

    currentCategoryName.textContent = cat.name;

    renderItemsGrid(cat);
  }

  // ---- Items Grid ----
  function renderItemsGrid(cat) {
    itemsGrid.innerHTML = '';
    if (!cat.items) cat.items = [];

    cat.items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove-item';
      removeBtn.innerHTML = '🗑️';
      removeBtn.addEventListener('click', async () => {
        if(confirm('Remove this item?')) {
          try {
            await fetch('/delete-item', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                thumbnailSrc: item.thumbnailSrc, 
                actualSrc: item.actualSrc, 
                src: item.src 
              })
            });
          } catch(err) { console.error('Failed to delete item files', err); }

          cat.items = cat.items.filter(i => i.id !== item.id);
          saveData();
          renderSidebar();
          renderItemsGrid(cat);
        }
      });

      const img = document.createElement('img');
      img.className = 'item-image';
      img.src = item.thumbnailSrc || item.src;
      img.alt = item.title;

      const details = document.createElement('div');
      details.className = 'item-details';

      const titleInput = document.createElement('input');
      titleInput.className = 'item-title-edit';
      titleInput.value = item.title || '';
      titleInput.placeholder = 'Item Title';
      titleInput.addEventListener('blur', () => {
        item.title = titleInput.value.trim();
        saveData();
      });

      const subInput = document.createElement('textarea');
      subInput.className = 'item-subtitle-edit';
      subInput.value = item.detail || item.subtitle || '';
      subInput.placeholder = 'Item Detail';
      subInput.rows = 2;
      subInput.style.resize = 'vertical';
      subInput.style.width = '100%';
      subInput.addEventListener('blur', () => {
        item.detail = subInput.value.trim();
        item.subtitle = item.detail; // Backwards compat
        saveData();
      });

      details.appendChild(titleInput);
      details.appendChild(subInput);
      card.appendChild(removeBtn);
      card.appendChild(img);
      card.appendChild(details);
      
      itemsGrid.appendChild(card);
    });
  }

  // ---- Add Item Modal ----
  function updateCategoryDropdown() {
    if (!newItemCategory) return;
    newItemCategory.innerHTML = '';
    if (!projectsData.categories) return;
    projectsData.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      newItemCategory.appendChild(opt);
    });
  }

  addItemBtn.addEventListener('click', () => {
    updateCategoryDropdown();
    if(activeCategoryId) newItemCategory.value = activeCategoryId;
    
    // Reset form
    thumbnailFileInput.value = '';
    actualFileInput.value = '';
    thumbnailFile = null;
    actualFile = null;
    
    thumbnailPreviewContainer.style.display = 'none';
    actualPreviewContainer.style.display = 'none';
    
    thumbnailImagePreview.src = '';
    actualImagePreview.src = '';
    
    newItemTitle.value = '';
    newItemDetail.value = '';
    saveItemBtn.textContent = 'Save to Gallery';
    
    addItemModal.style.display = 'flex';
  });

  cancelItemBtn.addEventListener('click', () => {
    addItemModal.style.display = 'none';
  });

  thumbnailFileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    thumbnailFile = files[0];
    const reader = new FileReader();
    reader.onload = function(evt) {
      thumbnailImagePreview.src = evt.target.result;
      thumbnailPreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(thumbnailFile);
  });

  actualFileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    actualFile = files[0];
    const reader = new FileReader();
    reader.onload = function(evt) {
      actualImagePreview.src = evt.target.result;
      actualPreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(actualFile);
  });

  saveItemBtn.addEventListener('click', async () => {
    if (!thumbnailFile) {
      alert('Please select a thumbnail image.');
      return;
    }
    
    const catId = newItemCategory.value;
    const cat = projectsData.categories.find(c => c.id === catId);
    if (!cat) return;
    if (!cat.items) cat.items = [];

    const categorySlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    saveItemBtn.disabled = true;
    const originalText = saveItemBtn.textContent;
    saveItemBtn.textContent = 'Uploading... ⏳';
    
    const formData = new FormData();
    formData.append('category', categorySlug);
    formData.append('thumbnailFile', thumbnailFile);
    if (actualFile) {
      formData.append('actualFile', actualFile);
    }

    try {
      const res = await fetch('/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success && data.thumbnailSrc) {
        cat.items.push({
          id: 'item-' + Date.now(),
          type: 'image',
          src: data.actualSrc || data.thumbnailSrc,
          thumbnailSrc: data.thumbnailSrc,
          actualSrc: data.actualSrc || data.thumbnailSrc,
          title: newItemTitle.value.trim() || thumbnailFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          detail: newItemDetail.value.trim() || '',
          subtitle: newItemDetail.value.trim() || ''
        });
        
        await saveData();
        renderSidebar();
        if (activeCategoryId === catId) renderMain();
        
        saveItemBtn.textContent = `✓ Uploaded successfully`;
        setTimeout(() => {
          addItemModal.style.display = 'none';
        }, 1500);
      } else {
        saveItemBtn.textContent = `✗ Failed: ${data.error || 'Unknown error'}`;
      }
    } catch (err) {
      saveItemBtn.textContent = `✗ Failed to upload. Is the server running?`;
    }
    
    setTimeout(() => {
      saveItemBtn.disabled = false;
      saveItemBtn.textContent = originalText;
    }, 2000);
  });

  // ---- Publish Data directly to file via Server ----
  exportDataBtn.textContent = 'Publish Changes';
  exportDataBtn.addEventListener('click', async () => {
    const originalText = exportDataBtn.textContent;
    exportDataBtn.textContent = 'Saving...';
    exportDataBtn.style.opacity = '0.5';
    exportDataBtn.style.pointerEvents = 'none';

    try {
      await saveData();
      exportDataBtn.textContent = 'Published ✓';
      exportDataBtn.style.background = '#2a6b3a';
      exportDataBtn.style.color = 'white';
      exportDataBtn.style.borderColor = '#2a6b3a';
    } catch (err) {
      console.error(err);
      exportDataBtn.textContent = 'Error Saving';
    }

    setTimeout(() => {
      exportDataBtn.textContent = originalText;
      exportDataBtn.style.opacity = '1';
      exportDataBtn.style.pointerEvents = 'all';
      exportDataBtn.style.background = '';
      exportDataBtn.style.color = '';
      exportDataBtn.style.borderColor = '';
    }, 3000);
  });

  // ---- Optimize Images ----
  if (optimizeBtn) {
    optimizeBtn.addEventListener('click', async () => {
      optimizeBtn.disabled = true;
      optimizeStatus.textContent = 'Optimizing... This may take a few minutes.';
      try {
        const res = await fetch('/optimize-images', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          optimizeStatus.textContent = `Success! Optimized ${json.optimizedCount} images. Reload page to see changes.`;
          optimizeStatus.style.color = '#4CAF50';
          await loadData(); // Reload JSON to reflect .webp changes
        } else {
          optimizeStatus.textContent = `Error: ${json.error}`;
          optimizeStatus.style.color = '#f44336';
        }
      } catch (err) {
        optimizeStatus.textContent = `Failed: Server might be restarting. Check later.`;
        optimizeStatus.style.color = '#f44336';
      }
      optimizeBtn.disabled = false;
    });
  }
});
