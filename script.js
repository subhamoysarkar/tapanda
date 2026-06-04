/* ============================================
   Ta Panda Innovation — Main JavaScript
   ============================================ */

// Replace this with your Google Apps Script Web App URL
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxCRW5j9NzhodHzRqJjaSeaDp7dxFyG--XlB2BQM6qpcHuDMjqdkkVrclj6Z_I3Gnz_/exec";

document.addEventListener('DOMContentLoaded', () => {

  /* ── Detect touch/mobile (disable custom cursor logic) ── */
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ── Sticky Navigation & Scroll Spy ── */
  const navbar = document.getElementById('navbar');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');
  const sectionIds = ['hero', 'projects', 'values', 'services', 'about', 'contact'];

  const handleNavScroll = () => {
    const heroSection = document.getElementById('hero');
    const threshold = heroSection ? (heroSection.offsetHeight - window.innerHeight) : 80;
    navbar.classList.toggle('scrolled', window.scrollY > threshold);

    let current = '';
    const scrollY = window.scrollY;
    sectionIds.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        const sectionTop = section.offsetTop - 150;
        if (scrollY >= sectionTop) {
          current = id;
        }
      }
    });

    navItems.forEach(a => {
      a.classList.remove('active-section');
      if (a.getAttribute('href') === `#${current}`) {
        a.classList.add('active-section');
      }
    });
  };
  window.addEventListener('scroll', handleNavScroll, { passive: true });

  /* ── Mobile Hamburger Menu ── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
  });

  const mobileMenuClose = document.getElementById('mobileMenuClose');
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  /* ── Preloader & Hero Animation ── */
  const preloader = document.getElementById('preloader');
  const heroLines = document.querySelectorAll('.hero-headline .line-inner');
  const heroSub = document.querySelector('.hero-sub');
  const heroCta = document.querySelector('.hero-content .btn-primary');

  const startHeroAnimation = () => {
    setTimeout(() => {
      heroLines.forEach((line, i) => setTimeout(() => line.classList.add('animate'), i * 180));
      setTimeout(() => heroSub?.classList.add('animate'), heroLines.length * 180 + 200);
      setTimeout(() => heroCta?.classList.add('animate'), heroLines.length * 180 + 400);
    }, 100);
  };

  window.addEventListener('load', () => {
    window.dispatchEvent(new Event('scroll'));
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.classList.remove('loading');
        // Wait for fade out transition (0.6s) before starting hero text animation
        setTimeout(startHeroAnimation, 600);
      }, 2500); // 2.5s minimum display to visualize the branded loader
    } else {
      document.body.classList.remove('loading');
      startHeroAnimation();
    }
  });

  /* ── Dynamic Staggered Scroll Reveal ── */
  let revealQueue = [];
  let isRevealing = false;

  const processRevealQueue = () => {
    if (revealQueue.length === 0) {
      isRevealing = false;
      return;
    }
    const el = revealQueue.shift();
    el.classList.add('visible');
    setTimeout(processRevealQueue, 100); /* 100ms stagger between elements */
  };

  const revealObserver = new IntersectionObserver((entries) => {
    let added = false;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealQueue.push(entry.target);
        revealObserver.unobserve(entry.target);
        added = true;
      }
    });
    if (added && !isRevealing) {
      isRevealing = true;
      processRevealQueue();
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  const observeReveal = (root = document) => {
    root.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  };
  observeReveal();

  /* ── Continuous Reveal for Parallax Cards ── */
  const parallaxObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        // Remove class when out of view to re-trigger on scroll back
        entry.target.classList.remove('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.card-parallax').forEach(el => parallaxObserver.observe(el));

  /* ── Dynamic Projects Rendering ── */
  let galleryImages = [];

  const loadProjects = async () => {
    let projectsData = null;
    try {
      const { data, error } = await supabase.from('projects_store').select('data').eq('id', 1).single();
      if (error) throw error;
      projectsData = data.data;
    } catch (err) {
      console.error('Failed to load projects data from Supabase:', err);
      return;
    }

    if (!projectsData || !projectsData.categories) return;

    const container = document.getElementById('dynamic-projects-container');
    if (!container) return;

    // Filter UI
    const filterContainer = document.createElement('div');
    filterContainer.className = 'projects-filter';
    filterContainer.style.display = 'flex';
    filterContainer.style.justifyContent = 'center';
    filterContainer.style.gap = '15px';
    filterContainer.style.marginBottom = '40px';
    filterContainer.style.flexWrap = 'wrap';

    const allBtn = document.createElement('button');
    allBtn.className = 'nav-cta filter-btn active';
    allBtn.textContent = 'All';
    allBtn.dataset.filter = 'all';
    filterContainer.appendChild(allBtn);

    projectsData.categories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'nav-cta filter-btn';
      btn.textContent = category.name;
      btn.dataset.filter = category.name;
      filterContainer.appendChild(btn);
    });
    container.appendChild(filterContainer);

    // Grid UI
    const masonry = document.createElement('div');
    masonry.className = 'masonry-grid-single';

    projectsData.categories.forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          const globalIndex = galleryImages.length;
          galleryImages.push({ 
            src: item.actualSrc || item.src, 
            thumbnailSrc: item.thumbnailSrc || item.src,
            title: item.title, 
            detail: item.detail || item.subtitle || '' 
          });

          const itemEl = document.createElement('div');
          itemEl.className = 'grid-item reveal project-item';
          itemEl.dataset.category = category.name;
          itemEl.dataset.galleryIndex = globalIndex;
          itemEl.innerHTML = `
            <img src="${item.thumbnailSrc || item.src}" alt="${item.title}" loading="lazy">
            <div class="grid-item-overlay">
              <h4 class="item-title">${item.title}</h4>
              <p class="item-subtitle">Click to see the Full Image and Details</p>
            </div>
          `;
          masonry.appendChild(itemEl);
        });
      }
    });

    container.appendChild(masonry);
    container.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Filter Logic
    const filterBtns = filterContainer.querySelectorAll('.filter-btn');
    const projectItems = masonry.querySelectorAll('.project-item');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = 'var(--accent-gold)';
        });
        btn.classList.add('active');
        btn.style.background = 'var(--accent-gold)';
        btn.style.color = 'var(--bg-primary)';

        const filterValue = btn.dataset.filter;

        projectItems.forEach(item => {
          if (filterValue === 'all' || item.dataset.category === filterValue) {
            item.style.display = 'block';
            setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'scale(1)'; }, 50);
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.9)';
            setTimeout(() => { item.style.display = 'none'; }, 300);
          }
        });
      });
    });

    // Initialize with "ALL" filter
    allBtn.click();
  };
  loadProjects();

  // Initialize nav color immediately
  handleNavScroll();

  /* ── Canvas Hero Animation ── */
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const context = canvas.getContext('2d');
    const frameCount = 345;
    const currentFrame = index => `images/hero_animation/Tapanda_logo_Anim_${index.toString().padStart(3, '0')}.webp`;

    const images = [];
    // Set an internal resolution that matches the aspect ratio of your image sequence
    canvas.width = 1920;
    canvas.height = 1080;

    // Preload images
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      images.push(img);
      if (i === 0) {
        img.onload = () => {
          context.drawImage(images[0], 0, 0, canvas.width, canvas.height);
        };
      }
    }

    const heroSection = document.getElementById('hero');

    const lbl1 = document.getElementById('hero-label-01');
    const lbl2 = document.getElementById('hero-label-02');
    const finalTxt = document.getElementById('hero-final-text');
    const progressBar = document.getElementById('heroProgressBar');

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const heroTop = heroSection.offsetTop;
      const scrollRange = heroSection.offsetHeight - window.innerHeight;

      let scrollProgress = (scrollTop - heroTop) / scrollRange;
      scrollProgress = Math.max(0, Math.min(1, scrollProgress)); // Clamp between 0 and 1

      const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(scrollProgress * frameCount)
      );

      // Label opacity logic
      const f = scrollProgress * (frameCount - 1);

      let op1 = 1;
      if (f > 26 && f <= 47) op1 = 1 - ((f - 26) / (47 - 26));
      else if (f > 47) op1 = 0;

      let op2 = 0;
      if (f > 95 && f <= 100) op2 = (f - 95) / (100 - 95);
      else if (f > 100 && f <= 173) op2 = 1;
      else if (f > 173 && f <= 180) op2 = 1 - ((f - 173) / (180 - 173));
      else if (f > 180) op2 = 0;

      const topInd = document.getElementById('heroScrollTopInd');
      const bottomInd = document.getElementById('heroScrollBottomInd');
      let topIndOp = 1;
      let bottomIndOp = 0;
      if (f > 60 && f <= 90) {
        topIndOp = 1 - ((f - 60) / (90 - 60));
        bottomIndOp = (f - 60) / (90 - 60);
      } else if (f > 90) {
        topIndOp = 0;
        bottomIndOp = 1;
      }

      // Nav Color logic
      let ratio = 0;
      if (f <= 180) ratio = 0;
      else if (f > 180 && f <= 210) ratio = (f - 180) / 30;
      else ratio = 1;

      // Interpolate from #F0EAD6 (240, 234, 214) to #7A7065 (122, 112, 101)
      const r = Math.round(240 - (240 - 122) * ratio);
      const g = Math.round(234 - (234 - 112) * ratio);
      const b = Math.round(214 - (214 - 101) * ratio);
      navbar.style.setProperty('--nav-link-color', `rgb(${r}, ${g}, ${b})`);

      requestAnimationFrame(() => {
        if (images[frameIndex] && images[frameIndex].complete) {
          context.drawImage(images[frameIndex], 0, 0, canvas.width, canvas.height);
        }
        if (lbl1) lbl1.style.opacity = op1.toString();
        if (lbl2) lbl2.style.opacity = op2.toString();
        if (progressBar) progressBar.style.width = `${scrollProgress * 100}%`;
        if (topInd) topInd.style.opacity = topIndOp.toString();
        if (bottomInd) bottomInd.style.opacity = bottomIndOp.toString();

        if (finalTxt) {
          if (f >= 280) {
            finalTxt.classList.add('show');
          } else {
            finalTxt.classList.remove('show');
          }
        }
      });
    }, { passive: true });
  }

  /* ── Values Section Parallax ── */
  const valuesPinnedContainer = document.getElementById('values');
  if (valuesPinnedContainer) {
    const vheader = document.getElementById('vheader');
    
    // We use a 1-indexed array for cards so index matches the slide number (1 to 5)
    const vCards = [
      null,
      document.getElementById('vcard-1'),
      document.getElementById('vcard-2'),
      document.getElementById('vcard-3'),
      document.getElementById('vcard-4'),
      document.getElementById('vcard-5')
    ];
    
    // Backgrounds 0 to 5
    const vBgs = [
      document.getElementById('vbg-0'),
      document.getElementById('vbg-1'),
      document.getElementById('vbg-2'),
      document.getElementById('vbg-3'),
      document.getElementById('vbg-4'),
      document.getElementById('vbg-5')
    ];

    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const containerTop = valuesPinnedContainer.offsetTop;
        const containerHeight = valuesPinnedContainer.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Pinned Transitions (600vh total -> 500vh scrollable -> 5 transitions)
        const scrollableDistance = containerHeight - windowHeight;
        const stickyScrollTop = scrollTop - containerTop;
        
        // Map scroll to a 0 - 5 progress
        const totalProgress = Math.max(0, Math.min(5, stickyScrollTop / scrollableDistance * 5));

        // 1. Backgrounds state
        for (let j = 0; j <= 5; j++) {
          if (!vBgs[j]) continue;
          if (j === 0) {
            vBgs[j].style.opacity = '1';
          } else {
            if (totalProgress <= j - 1) {
              vBgs[j].style.opacity = '0';
            } else if (totalProgress >= j) {
              vBgs[j].style.opacity = '1';
            } else {
              vBgs[j].style.opacity = (totalProgress - (j - 1)).toString();
            }
          }
        }

        // 2. Header Content state (shrinks and moves up during transition 0 to 1)
        if (vheader) {
          if (totalProgress <= 0) {
            vheader.style.transform = 'translateY(0vh) scale(1)';
          } else if (totalProgress >= 1) {
            vheader.style.transform = 'translateY(-25vh) scale(0.8)';
          } else {
            vheader.style.transform = `translateY(-${totalProgress * 25}vh) scale(${1 - totalProgress * 0.2})`;
          }
        }

        // 3. Cards state
        for (let j = 1; j <= 5; j++) {
          if (!vCards[j]) continue;
          
          if (totalProgress <= j - 1) {
            // Before this card's turn
            vCards[j].style.transform = 'translateY(-50%) translateX(-150%)';
            vCards[j].style.opacity = '0';
          } else if (totalProgress > j - 1 && totalProgress < j) {
            // This card is sliding in
            const p = totalProgress - (j - 1);
            const easeInOut = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // Smooth ease-in-out
            vCards[j].style.transform = `translateY(-50%) translateX(${-150 + easeInOut * 150}%)`;
            vCards[j].style.opacity = p.toString();
          } else if (totalProgress === j) {
            // This card is fully active
            vCards[j].style.transform = 'translateY(-50%) translateX(0%)';
            vCards[j].style.opacity = '1';
          } else if (totalProgress > j && totalProgress < j + 1) {
            // This card is sliding out
            const p = totalProgress - j;
            const easeInOut = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // Exact same ease
            vCards[j].style.transform = `translateY(-50%) translateX(${easeInOut * 150}%)`;
            vCards[j].style.opacity = (1 - p).toString();
          } else {
            // After this card's turn
            vCards[j].style.transform = 'translateY(-50%) translateX(150%)';
            vCards[j].style.opacity = '0';
          }
        }
      });
    }, { passive: true });
  }

  /* ── Smooth Scroll for Nav Links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Contact Form Submit (POST to server + WhatsApp greeting link) ── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      btn.style.pointerEvents = 'none';

      const payload = {
        formType: 'contact',
        name: document.getElementById('fullName')?.value || '',
        email: document.getElementById('emailAddress')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        projectType: document.getElementById('projectType')?.value || '',
        brief: document.getElementById('projectBrief')?.value || ''
      };

      try {
        await fetch(APP_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
      } catch (err) { console.warn('Enquiry email error:', err); }

      btn.textContent = 'Message Sent ✓';
      btn.style.background = '#2a6b3a';
      setTimeout(() => {
        btn.textContent = 'Send Enquiry';
        btn.style.background = '';
        btn.style.pointerEvents = '';
        contactForm.reset();
      }, 3500);
    });
  }

  /* ── Consultation Modal ── */
  const consultOverlay = document.getElementById('consultOverlay');
  const consultForm = document.getElementById('consultForm');
  const consultSuccess = document.getElementById('consultSuccess');
  const consultClose = document.getElementById('consultClose');

  const openConsult = () => {
    consultOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    consultForm.style.display = '';
    consultSuccess.classList.remove('show');
    consultForm.reset();
  };
  const closeConsult = () => {
    consultOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  document.getElementById('openConsultModal')?.addEventListener('click', openConsult);
  document.getElementById('openConsultModalMobile')?.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(openConsult, 200);
  });
  document.getElementById('openConsultModalHero')?.addEventListener('click', openConsult);
  consultClose?.addEventListener('click', closeConsult);
  consultOverlay?.addEventListener('click', e => { if (e.target === consultOverlay) closeConsult(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && consultOverlay?.classList.contains('active')) closeConsult(); });

  if (consultForm) {
    consultForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('consultSubmitBtn');
      btn.style.pointerEvents = 'none';

      const name = document.getElementById('consultName')?.value || '';
      const phone = document.getElementById('consultPhone')?.value || '';
      const email = document.getElementById('consultEmail')?.value || '';

      consultForm.style.display = 'none';
      consultSuccess.classList.add('show');

      try {
        await fetch(APP_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ formType: 'consult', name, phone, email })
        });
      } catch (err) { console.warn('Consultation email error:', err); }

      setTimeout(closeConsult, 3000);
    });
  }

  /* ── Lightbox ── */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCounter = document.getElementById('lightboxCounter');

  let currentLightboxIndex = -1;
  let currentCategoryImages = [];

  const openLightbox = (globalIndex) => {
    // Only get currently visible project items (based on filter)
    const visibleItems = document.querySelectorAll('.project-item[style*="display: block"], .project-item:not([style*="display: none"])');
    let catImages = [], localIndex = 0;

    let foundLocal = 0;
    visibleItems.forEach((item, idx) => {
      const gi = parseInt(item.dataset.galleryIndex, 10);
      catImages.push({
        src: galleryImages[gi]?.src || item.querySelector('img')?.src,
        title: galleryImages[gi]?.title || item.querySelector('.item-title')?.textContent || '',
        detail: galleryImages[gi]?.detail || ''
      });
      if (gi === globalIndex) { localIndex = foundLocal; }
      foundLocal++;
    });

    currentCategoryImages = catImages;
    currentLightboxIndex = localIndex;
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const updateLightboxImage = () => {
    if (!currentCategoryImages.length) return;
    const img = currentCategoryImages[currentLightboxIndex];
    lightboxImg.style.opacity = '0'; lightboxImg.style.transform = 'scale(0.95)';
    const textEl = document.getElementById('lightboxText');
    if (textEl) textEl.style.opacity = '0';

    setTimeout(() => {
      lightboxImg.src = img.src;
      lightboxImg.style.opacity = '1';
      lightboxImg.style.transform = 'scale(1)';

      const titleEl = document.getElementById('lightboxTitle');
      const detailEl = document.getElementById('lightboxDetail');
      if (titleEl) titleEl.textContent = img.title;
      if (detailEl) detailEl.textContent = img.detail;
      if (textEl) textEl.style.opacity = '1';
    }, 200);

    if (lightboxCounter) lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${currentCategoryImages.length}`;
    if (lightboxPrev && lightboxNext) {
      const show = currentCategoryImages.length > 1 ? 'flex' : 'none';
      lightboxPrev.style.display = lightboxNext.style.display = show;
    }
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      lightboxImg.src = '';
      const titleEl = document.getElementById('lightboxTitle');
      const detailEl = document.getElementById('lightboxDetail');
      if (titleEl) titleEl.textContent = '';
      if (detailEl) detailEl.textContent = '';
    }, 400);
    currentLightboxIndex = -1; currentCategoryImages = [];
  };

  if (lightbox) {
    document.addEventListener('click', e => {
      const gridItem = e.target.closest('.grid-item');
      if (gridItem) { const gi = parseInt(gridItem.dataset.galleryIndex, 10); if (!isNaN(gi)) openLightbox(gi); }
    });
    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    lightboxPrev?.addEventListener('click', e => { e.stopPropagation(); currentLightboxIndex = (currentLightboxIndex - 1 + currentCategoryImages.length) % currentCategoryImages.length; updateLightboxImage(); });
    lightboxNext?.addEventListener('click', e => { e.stopPropagation(); currentLightboxIndex = (currentLightboxIndex + 1) % currentCategoryImages.length; updateLightboxImage(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') { currentLightboxIndex = (currentLightboxIndex - 1 + currentCategoryImages.length) % currentCategoryImages.length; updateLightboxImage(); }
      else if (e.key === 'ArrowRight') { currentLightboxIndex = (currentLightboxIndex + 1) % currentCategoryImages.length; updateLightboxImage(); }
      else if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ── Prevent Image Downloads ── */
  document.addEventListener('contextmenu', e => {
    if (e.target.tagName === 'IMG' || e.target.closest('.grid-item') || e.target.closest('.lightbox')) e.preventDefault();
  });

  /* ── Custom Cursor — desktop only, velocity-based rotation ── */
  const customCursor = document.getElementById('custom-cursor');
  if (customCursor && !isTouch) {
    /* Hide native cursor site-wide when custom cursor is visible */
    const cursorStyle = document.createElement('style');
    cursorStyle.id = 'hide-native-cursor';
    cursorStyle.textContent = '* { cursor: none !important; }';

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let currentAngle = 0;
    let cursorVisible = false;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Reliably detect if hovering over an interactive element at all times
      if (e.target.closest('button, a, input, select, textarea, .footer, #navbar, .consult-overlay, .btn-submit, .btn-primary')) {
        if (!isOverHiddenElement) {
          isOverHiddenElement = true;
          updateCursorVisibility();
        }
      } else {
        if (isOverHiddenElement) {
          isOverHiddenElement = false;
          updateCursorVisibility();
        }
      }
    });

    const renderCursor = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      const vx = mouseX - cursorX;
      const targetAngle = Math.max(-45, Math.min(45, vx * 1.2));
      currentAngle += (targetAngle - currentAngle) * 0.1;
      const w = customCursor.offsetWidth || 62;
      const h = customCursor.offsetHeight || 80;
      customCursor.style.transform = `translate(${cursorX - w / 2}px, ${cursorY - h}px) rotate(${currentAngle}deg)`;
      requestAnimationFrame(renderCursor);
    };

    renderCursor();

    let isOverHiddenElement = false;
    let shouldShowScroll = false;

    const updateCursorVisibility = () => {
      const shouldBeVisible = shouldShowScroll && !isOverHiddenElement;
      if (shouldBeVisible && !cursorVisible) {
        customCursor.style.opacity = '1';
        cursorVisible = true;
        document.head.appendChild(cursorStyle);
      } else if (!shouldBeVisible && cursorVisible) {
        customCursor.style.opacity = '0';
        cursorVisible = false;
        if (cursorStyle.parentNode) cursorStyle.remove();
      }
    };

    window.addEventListener('scroll', () => {
      const hero = document.getElementById('hero');
      const threshold = hero ? (hero.offsetHeight - window.innerHeight) : window.innerHeight;
      shouldShowScroll = window.scrollY > threshold;
      updateCursorVisibility();
    }, { passive: true });
  }


});

// About Section Image Height Sync
function syncAboutImageHeight() {
  const textContent = document.getElementById('about-text-content');
  const founderImg = document.getElementById('about-founder-img');

  if (textContent && founderImg) {
    // Get the height of the text content div
    const textHeight = textContent.offsetHeight;

    // Set the image height to match the text height
    if (textHeight > 0) {
      founderImg.style.height = `${textHeight}px`;
      founderImg.style.width = 'auto'; // ensure width remains auto
    }
  }
}

// Run on load and resize
window.addEventListener('load', syncAboutImageHeight);
window.addEventListener('resize', syncAboutImageHeight);
