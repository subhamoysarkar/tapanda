/* ============================================
   Ta Panda Innovation — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Detect touch/mobile (disable custom cursor logic) ── */
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ── Sticky Navigation ── */
  const navbar = document.getElementById('navbar');
  const handleNavScroll = () => {
    const heroSection = document.getElementById('hero');
    const threshold = heroSection ? (heroSection.offsetHeight - window.innerHeight) : 80;
    navbar.classList.toggle('scrolled', window.scrollY > threshold);
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

  /* ── Dynamic Projects Rendering ── */
  let galleryImages = [];

  const loadProjects = async () => {
    let projectsData = null;
    const localData = localStorage.getItem('tapanda_projects');
    if (localData) {
      try { projectsData = JSON.parse(localData); } catch (e) { projectsData = null; }
    }
    if (!projectsData) {
      try {
        const res = await fetch('projects-data.json');
        projectsData = await res.json();
        localStorage.setItem('tapanda_projects', JSON.stringify(projectsData));
      } catch (err) { console.error('Failed to load projects data', err); return; }
    }

    const container = document.getElementById('dynamic-projects-container');
    if (!container || !projectsData?.categories) return;

    projectsData.categories.forEach(category => {
      const block = document.createElement('section');
      block.className = 'category-block projects-snap-section';

      const rightContent = document.createElement('div');
      rightContent.className = 'projects-content-right';

      const categoryLabel = document.createElement('div');
      categoryLabel.className = 'category-label-header reveal';
      categoryLabel.innerHTML = `<h3>${category.name}</h3>`;
      rightContent.appendChild(categoryLabel);

      const masonry = document.createElement('div');
      masonry.className = 'masonry-grid';

      if (category.items) {
        category.items.forEach(item => {
          const globalIndex = galleryImages.length;
          galleryImages.push({ src: item.src, title: item.title, subtitle: item.subtitle });

          const itemEl = document.createElement('div');
          itemEl.className = 'grid-item reveal';
          itemEl.dataset.galleryIndex = globalIndex;
          itemEl.innerHTML = `
            <img src="${item.src}" alt="${item.title}" loading="lazy">
            <div class="grid-item-overlay">
              <h4 class="item-title">${item.title}</h4>
              <p class="item-subtitle">${item.subtitle}</p>
            </div>
          `;
          masonry.appendChild(itemEl);
        });
      }

      rightContent.appendChild(masonry);
      block.appendChild(rightContent);
      container.appendChild(block);
      block.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    });
  };
  loadProjects();

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

      requestAnimationFrame(() => {
        if (images[frameIndex] && images[frameIndex].complete) {
          context.drawImage(images[frameIndex], 0, 0, canvas.width, canvas.height);
        }
        if (lbl1) lbl1.style.opacity = op1.toString();
        if (lbl2) lbl2.style.opacity = op2.toString();
        if (progressBar) progressBar.style.width = `${scrollProgress * 100}%`;

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
        access_key: '74c9ede5-7b37-4c7a-b07d-80dec7d91bb2', // <-- REPLACE THIS WITH YOUR WEB3FORMS ACCESS KEY
        subject: 'New Website Enquiry - Ta Panda Innovation',
        from_name: 'Ta Panda Website',
        Name: document.getElementById('fullName')?.value || '',
        Email: document.getElementById('emailAddress')?.value || '',
        Phone: document.getElementById('phone')?.value || '',
        'Project Type': document.getElementById('projectType')?.value || '',
        Brief: document.getElementById('projectBrief')?.value || ''
      };

      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
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

      consultForm.style.display = 'none';
      consultSuccess.classList.add('show');

      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            access_key: '74c9ede5-7b37-4c7a-b07d-80dec7d91bb2', // <-- REPLACE THIS WITH YOUR WEB3FORMS ACCESS KEY
            subject: 'New Free Consultation Request - Ta Panda Innovation',
            from_name: 'Ta Panda Website',
            Name: name,
            Phone: phone
          })
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
    const allCategoryBlocks = document.querySelectorAll('.category-block');
    let catImages = [], localIndex = 0;

    outerLoop:
    for (const block of allCategoryBlocks) {
      const gridItems = block.querySelectorAll('.grid-item');
      let blockImages = [], found = false, foundLocal = 0;
      gridItems.forEach((item, idx) => {
        const gi = parseInt(item.dataset.galleryIndex, 10);
        blockImages.push({ src: galleryImages[gi]?.src || item.querySelector('img')?.src, title: item.querySelector('.item-title')?.textContent || '', subtitle: item.querySelector('.item-subtitle')?.textContent || '' });
        if (gi === globalIndex) { found = true; foundLocal = idx; }
      });
      if (found) { catImages = blockImages; localIndex = foundLocal; break outerLoop; }
    }
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
    setTimeout(() => { lightboxImg.src = img.src; lightboxImg.style.opacity = '1'; lightboxImg.style.transform = 'scale(1)'; }, 200);
    if (lightboxCounter) lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${currentCategoryImages.length}`;
    if (lightboxPrev && lightboxNext) {
      const show = currentCategoryImages.length > 1 ? 'flex' : 'none';
      lightboxPrev.style.display = lightboxNext.style.display = show;
    }
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 400);
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
    });

    const renderCursor = () => {
      // Smoothly follow mouse position
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;

      // Calculate velocity for rotation
      const vx = mouseX - cursorX;

      // Subtle lean based on horizontal velocity, clamped to 45 degrees
      const targetAngle = Math.max(-45, Math.min(45, vx * 1.2));
      currentAngle += (targetAngle - currentAngle) * 0.1;

      // Update cursor transform
      // Since it's fixed, we use translate
      // Pivot is at bottom-center (50% 100% in CSS)
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

    const navForCursor = document.getElementById('navbar');
    const footerForCursor = document.querySelector('.footer');
    const consultOverlayForCursor = document.getElementById('consultOverlay');

    const handleEnter = () => { isOverHiddenElement = true; updateCursorVisibility(); };
    const handleLeave = () => { isOverHiddenElement = false; updateCursorVisibility(); };

    if (navForCursor) {
      navForCursor.addEventListener('mouseenter', handleEnter);
      navForCursor.addEventListener('mouseleave', handleLeave);
    }
    if (footerForCursor) {
      footerForCursor.addEventListener('mouseenter', handleEnter);
      footerForCursor.addEventListener('mouseleave', handleLeave);
    }
    if (consultOverlayForCursor) {
      consultOverlayForCursor.addEventListener('mouseenter', handleEnter);
      consultOverlayForCursor.addEventListener('mouseleave', handleLeave);
    }
  }

  /* ── Projects Header Slide entrance animation ── */
  const projectsHeaderContent = document.querySelector('.projects-header-slide .projects-header');
  if (projectsHeaderContent) {
    const headerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('slide-in'); headerObs.unobserve(entry.target); }
      });
    }, { threshold: 0.2 });
    headerObs.observe(projectsHeaderContent);
  }

});
