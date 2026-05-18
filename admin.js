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
  const itemFileInput = document.getElementById('itemFileInput');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const itemImagePreview = document.getElementById('itemImagePreview');
  const multiFilePreviewContainer = document.getElementById('multiFilePreviewContainer');
  const multiPreviewStrip = document.getElementById('multiPreviewStrip');
  const multiFileStatus = document.getElementById('multiFileStatus');
  const singleFileFormGroup = document.getElementById('singleFileFormGroup');
  const newItemTitle = document.getElementById('newItemTitle');
  const newItemSubtitle = document.getElementById('newItemSubtitle');
  const newItemCategory = document.getElementById('newItemCategory');
  const saveItemBtn = document.getElementById('saveItemBtn');
  const cancelItemBtn = document.getElementById('cancelItemBtn');

  // State
  let projectsData = { categories: [] };
  let activeCategoryId = null;
  let selectedFiles = [];

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

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete category "${cat.name}" and all its items? This cannot be undone.`)) {
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
      removeBtn.addEventListener('click', () => {
        if(confirm('Remove this item?')) {
          cat.items = cat.items.filter(i => i.id !== item.id);
          saveData();
          renderSidebar();
          renderItemsGrid(cat);
        }
      });

      const img = document.createElement('img');
      img.className = 'item-image';
      img.src = item.src;
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

      const subInput = document.createElement('input');
      subInput.className = 'item-subtitle-edit';
      subInput.value = item.subtitle || '';
      subInput.placeholder = 'Item Subtitle';
      subInput.addEventListener('blur', () => {
        item.subtitle = subInput.value.trim();
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
    itemFileInput.value = '';
    selectedFiles = [];
    imagePreviewContainer.style.display = 'none';
    multiFilePreviewContainer.style.display = 'none';
    singleFileFormGroup.style.display = 'block';
    
    itemImagePreview.src = '';
    multiPreviewStrip.innerHTML = '';
    multiFileStatus.textContent = '';
    newItemTitle.value = '';
    newItemSubtitle.value = '';
    saveItemBtn.textContent = 'Save to Gallery';
    
    addItemModal.style.display = 'flex';
  });

  cancelItemBtn.addEventListener('click', () => {
    addItemModal.style.display = 'none';
  });

  itemFileInput.addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length === 1) {
      // Single file preview
      const file = selectedFiles[0];
      const reader = new FileReader();
      reader.onload = function(evt) {
        itemImagePreview.src = evt.target.result;
        imagePreviewContainer.style.display = 'block';
        multiFilePreviewContainer.style.display = 'none';
        singleFileFormGroup.style.display = 'block';
        saveItemBtn.textContent = 'Save to Gallery';
      };
      reader.readAsDataURL(file);
    } else {
      // Multiple file preview
      imagePreviewContainer.style.display = 'none';
      multiFilePreviewContainer.style.display = 'block';
      singleFileFormGroup.style.display = 'none';
      saveItemBtn.textContent = 'Upload All';
      
      multiPreviewStrip.innerHTML = '';
      selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(evt) {
          const img = document.createElement('img');
          img.src = evt.target.result;
          img.style.maxHeight = '120px';
          img.style.borderRadius = '4px';
          multiPreviewStrip.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
      multiFileStatus.textContent = `${selectedFiles.length} images selected — you can add titles after uploading`;
    }
  });

  function showInlineStatus(msg, isError=false) {
    // A small helper if we wanted to replace alerts, but prompt said "inline near the relevant action — not as browser alert() popups"
    // So let's implement inline status for uploads inside the modal before closing, or below the button.
  }

  saveItemBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
      // Alert is okay for missing selection
      alert('Please select an image.');
      return;
    }
    
    const catId = newItemCategory.value;
    const cat = projectsData.categories.find(c => c.id === catId);
    if (!cat) return;
    if (!cat.items) cat.items = [];

    const categorySlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    saveItemBtn.disabled = true;
    const originalText = saveItemBtn.textContent;
    
    // We will use a dedicated status element if we can, or just update the button
    let finalStatus = '';

    if (selectedFiles.length === 1) {
      saveItemBtn.textContent = 'Uploading... ⏳';
      const file = selectedFiles[0];
      
      const formData = new FormData();
      formData.append('category', categorySlug);
      formData.append('file', file);

      try {
        const res = await fetch('/upload-image', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.success && data.paths && data.paths.length > 0) {
          cat.items.push({
            id: 'item-' + Date.now(),
            type: 'image',
            src: data.paths[0],
            title: newItemTitle.value.trim() || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            subtitle: newItemSubtitle.value.trim() || ''
          });
          
          await saveData();
          renderSidebar();
          if (activeCategoryId === catId) renderMain();
          
          saveItemBtn.textContent = `✓ ${file.name} uploaded successfully`;
          setTimeout(() => {
            addItemModal.style.display = 'none';
          }, 1500);
        } else {
          saveItemBtn.textContent = `✗ Failed: ${data.error || 'Unknown error'}`;
        }
      } catch (err) {
        saveItemBtn.textContent = `✗ Failed to upload. Is the server running?`;
      }
    } else {
      // Multiple file upload
      let successCount = 0;
      let fails = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        saveItemBtn.textContent = `Uploading ${i + 1} of ${selectedFiles.length}...`;
        
        const formData = new FormData();
        formData.append('category', categorySlug);
        formData.append('file', file);

        try {
          const res = await fetch('/upload-image', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          
          if (data.success && data.paths && data.paths.length > 0) {
            cat.items.push({
              id: 'item-' + Date.now() + '-' + i,
              type: 'image',
              src: data.paths[0],
              title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
              subtitle: ''
            });
            successCount++;
          } else {
            fails.push(`${file.name} — ${data.error || 'Unknown error'}`);
          }
        } catch (err) {
          fails.push(`${file.name} — Server error`);
        }
      }
      
      await saveData();
      renderSidebar();
      if (activeCategoryId === catId) renderMain();
      
      if (fails.length === 0) {
        saveItemBtn.textContent = `✓ ${successCount} images uploaded successfully`;
      } else {
        saveItemBtn.textContent = `✓ ${successCount} uploaded, ✗ ${fails.length} failed`;
        // Since we can't show full details in the button easily, let's keep an alert just for the summary of failures
        setTimeout(() => alert(`Failed images:\n` + fails.join('\n')), 500);
      }

      setTimeout(() => {
        addItemModal.style.display = 'none';
      }, 1500);
    }
    
    setTimeout(() => {
      saveItemBtn.disabled = false;
      saveItemBtn.textContent = originalText;
    }, 1500);
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
