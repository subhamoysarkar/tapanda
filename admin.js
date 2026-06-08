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
  let thumbnailFiles = [];
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
  async function optimizeToWebP(file, maxWidth = 1920) {
    if (!file.type.startsWith('image/')) return file; // Skip videos/other
    if (file.type === 'image/webp') return file; // Already webp
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, 'image/webp', 0.85); // 85% quality
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function loadData() {
    try {
      const { data, error } = await supabase.from('projects_store').select('data').eq('id', 1).single();
      if (error) throw error;
      projectsData = data.data;
      if (!projectsData || !projectsData.categories) projectsData = { categories: [] };
      showStatus('✓ Data loaded from Supabase');
    } catch (err) {
      console.warn('Failed to fetch from Supabase', err);
      if (err.code === 'PGRST116') {
        projectsData = { categories: [] };
        showStatus('✓ Initialized new database');
      } else {
        projectsData = null;
        emptyState.innerHTML = '<p style="text-align:center; padding:2rem; color:red;">Critical Error loading data from Supabase. Please check connection and refresh.</p>';
        return; // Prevent rendering and modifying data
      }
    }

    if (projectsData && projectsData.categories && projectsData.categories.length > 0) {
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
    if (!projectsData) {
      console.error('Cannot save: data failed to load.');
      return;
    }
    try {
      const { error } = await supabase.from('projects_store').update({ data: projectsData }).eq('id', 1);
      if (error) throw error;
    } catch (e) {
      console.error('Error saving to Supabase:', e);
      alert('Error saving data to Supabase. Check console.');
    }
  }

  if (reloadBtn) {
    reloadBtn.addEventListener('click', async () => {
      reloadBtn.textContent = 'Reloading...';
      await loadData();
      reloadBtn.textContent = 'Reload from Cloud';
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
            const categorySlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const { data, error } = await supabase.storage.from('portfolio').list(categorySlug);
            if (data && data.length > 0) {
               const filesToRemove = data.map(f => `${categorySlug}/${f.name}`);
               await supabase.storage.from('portfolio').remove(filesToRemove);
            }
          } catch(err) { console.error('Failed to delete category files', err); }

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
            const extractPath = (url) => {
              if(!url) return null;
              const parts = url.split('/public/portfolio/');
              return parts.length > 1 ? parts[1] : null;
            };
            const thumbPath = extractPath(item.thumbnailSrc);
            const actualPath = extractPath(item.actualSrc);
            const pathsToDelete = [];
            if(thumbPath) pathsToDelete.push(thumbPath);
            if(actualPath && actualPath !== thumbPath) pathsToDelete.push(actualPath);
            
            if (pathsToDelete.length > 0) {
              await supabase.storage.from('portfolio').remove(pathsToDelete);
            }
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
    thumbnailFiles = [];
    actualFile = null;
    
    thumbnailPreviewContainer.style.display = 'none';
    actualPreviewContainer.style.display = 'none';
    
    const bulkUploadText = document.getElementById('bulkUploadText');
    if (bulkUploadText) bulkUploadText.style.display = 'none';
    
    const actualInputParent = document.getElementById('actualFileInput').parentElement;
    if (actualInputParent) actualInputParent.style.display = 'block';
    if (singleFileFormGroup) singleFileFormGroup.style.display = 'block';
    
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
    thumbnailFiles = Array.from(e.target.files);
    if (thumbnailFiles.length === 0) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
      thumbnailImagePreview.src = evt.target.result;
      thumbnailPreviewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(thumbnailFiles[0]);
    
    const bulkUploadText = document.getElementById('bulkUploadText');
    const actualInputParent = document.getElementById('actualFileInput').parentElement;
    
    if (thumbnailFiles.length > 1) {
      if (bulkUploadText) {
        bulkUploadText.textContent = `+ ${thumbnailFiles.length - 1} more file(s)`;
        bulkUploadText.style.display = 'inline';
      }
      if (actualInputParent) actualInputParent.style.display = 'none';
      if (singleFileFormGroup) singleFileFormGroup.style.display = 'none';
    } else {
      if (bulkUploadText) bulkUploadText.style.display = 'none';
      if (actualInputParent) actualInputParent.style.display = 'block';
      if (singleFileFormGroup) singleFileFormGroup.style.display = 'block';
    }
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
    if (thumbnailFiles.length === 0) {
      alert('Please select at least one thumbnail image.');
      return;
    }
    
    const catId = newItemCategory.value;
    const cat = projectsData.categories.find(c => c.id === catId);
    if (!cat) return;
    if (!cat.items) cat.items = [];

    const categorySlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    saveItemBtn.disabled = true;
    const originalText = saveItemBtn.textContent;
    
    try {
      const isBulk = thumbnailFiles.length > 1;
      
      for (let i = 0; i < thumbnailFiles.length; i++) {
        const tFile = thumbnailFiles[i];
        
        if (isBulk) {
          saveItemBtn.textContent = `Optimizing... (${i + 1}/${thumbnailFiles.length})`;
        } else {
          saveItemBtn.textContent = 'Optimizing... ⏳';
        }
        
        const optimizedThumb = await optimizeToWebP(tFile, 800);
        let optimizedActual = null;
        
        if (!isBulk && actualFile) {
          optimizedActual = await optimizeToWebP(actualFile, 1920);
        } else if (isBulk) {
          optimizedActual = await optimizeToWebP(tFile, 1920);
        }

        if (isBulk) {
          saveItemBtn.textContent = `Uploading... (${i + 1}/${thumbnailFiles.length})`;
        } else {
          saveItemBtn.textContent = 'Uploading... ⏳';
        }
        
        const ts = Date.now() + i;
        let thumbUrl = '';
        let actualUrl = '';
        
        const thumbExt = optimizedThumb.name.split('.').pop();
        const thumbPath = `${categorySlug}/thumb-${ts}.${thumbExt}`;
        const { data: thumbData, error: thumbErr } = await supabase.storage.from('portfolio').upload(thumbPath, optimizedThumb, { cacheControl: '3600', upsert: true });
        if (thumbErr) throw thumbErr;
        thumbUrl = supabase.storage.from('portfolio').getPublicUrl(thumbPath).data.publicUrl;

        if (optimizedActual) {
          const actualExt = optimizedActual.name.split('.').pop();
          const actualPath = `${categorySlug}/actual-${ts}.${actualExt}`;
          const { data: actData, error: actErr } = await supabase.storage.from('portfolio').upload(actualPath, optimizedActual, { cacheControl: '3600', upsert: true });
          if (actErr) throw actErr;
          actualUrl = supabase.storage.from('portfolio').getPublicUrl(actualPath).data.publicUrl;
        } else {
          actualUrl = thumbUrl;
        }

        const generatedTitle = tFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());

        cat.items.push({
          id: 'item-' + ts,
          type: 'image',
          src: actualUrl,
          thumbnailSrc: thumbUrl,
          actualSrc: actualUrl,
          title: isBulk ? generatedTitle : (newItemTitle.value.trim() || generatedTitle),
          detail: isBulk ? '' : (newItemDetail.value.trim() || ''),
          subtitle: isBulk ? '' : (newItemDetail.value.trim() || '')
        });
      }
      
      const shuffleCheckbox = document.getElementById('shuffleUploadsCheckbox');
      if (shuffleCheckbox && shuffleCheckbox.checked && cat.items.length > 0) {
        for (let i = cat.items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cat.items[i], cat.items[j]] = [cat.items[j], cat.items[i]];
        }
      }
      
      await saveData();
      renderSidebar();
      if (activeCategoryId === catId) renderMain();
      
      saveItemBtn.textContent = `✓ Uploaded successfully`;
      setTimeout(() => {
        addItemModal.style.display = 'none';
      }, 1500);

    } catch (err) {
      console.error(err);
      saveItemBtn.textContent = `✗ Failed to upload`;
    }
    
    setTimeout(() => {
      saveItemBtn.disabled = false;
      saveItemBtn.textContent = originalText;
    }, 2000);
  });

  // ---- Publish Data directly to file via Server ----
  exportDataBtn.textContent = 'Force Cloud Sync';
  exportDataBtn.addEventListener('click', async () => {
    const originalText = exportDataBtn.textContent;
    exportDataBtn.textContent = 'Syncing...';
    exportDataBtn.style.opacity = '0.5';
    exportDataBtn.style.pointerEvents = 'none';

    try {
      await saveData();
      exportDataBtn.textContent = 'Synced ✓';
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

  // Optimize images block removed since Supabase Storage does basic CDN optimization
  if (optimizeBtn) {
    optimizeBtn.style.display = 'none';
  }
});
