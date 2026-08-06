document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.presentation-container');

    // Inject dynamic gallery slides
    if (typeof galleryData !== 'undefined') {
        const endingSlide = document.getElementById('slide-14');
        galleryData.forEach((item, index) => {
            const section = document.createElement('section');
            section.className = 'slide image-slide';
            section.setAttribute('data-category', item.category);
            section.id = `slide-${index + 1}`;
            
            let imgStyle = '';
            // For moodboards or desktop specific inline styling
            if (item.category === 'moodboards') {
                imgStyle = 'style="object-fit: contain; background: #1a1a1a;"';
            }
            
            let overlayHtml = '';
            if (item.category !== 'moodboards') {
                overlayHtml = `
                <div class="slide-overlay">
                    <h2>${item.title}</h2>
                </div>`;
            }
            
            section.innerHTML = `
                <img src="${item.src}" alt="${item.title}" class="slide-image" ${imgStyle}>
                ${overlayHtml}
            `;
            container.insertBefore(section, endingSlide);
        });
    }

    const slides = document.querySelectorAll('.slide');
    const currentSlideEl = document.getElementById('current-slide');
    const totalSlidesEl = document.getElementById('total-slides');
    const progressBar = document.getElementById('progress-bar');
    const filterMenu = document.getElementById('filter-menu');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let visibleSlides = Array.from(slides);
    
    const updateSlideCounts = () => {
        visibleSlides = Array.from(document.querySelectorAll('.slide:not(.hidden)'));
        totalSlidesEl.textContent = visibleSlides.length;
    };

    updateSlideCounts();

    // Set initial active state
    slides[0].classList.add('active');
    updateProgress(0);

    // Use Intersection Observer to detect which slide is currently in view
    const observerOptions = {
        root: container,
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('hidden')) {
                // Add active class to current slide
                entry.target.classList.add('active');
                
                // Remove active class from siblings
                slides.forEach(slide => {
                    if (slide !== entry.target) {
                        slide.classList.remove('active');
                    }
                });

                // Hide filter menu on Landing Page
                if (entry.target.id === 'slide-0') {
                    filterMenu.style.opacity = '0';
                    filterMenu.style.pointerEvents = 'none';
                } else {
                    filterMenu.style.opacity = '1';
                    filterMenu.style.pointerEvents = 'auto';
                }

                // Update counter and progress bar
                const index = visibleSlides.indexOf(entry.target);
                if (index !== -1) {
                    currentSlideEl.textContent = index + 1;
                    updateProgress(index);
                }
            }
        });
    }, observerOptions);

    slides.forEach(slide => observer.observe(slide));

    function updateProgress(index) {
        if (visibleSlides.length === 0) return;
        const progress = ((index + 1) / visibleSlides.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            slides.forEach(slide => {
                if (slide.classList.contains('always-visible')) {
                    slide.classList.remove('hidden');
                } else {
                    if (filter === 'all' || slide.getAttribute('data-category') === filter) {
                        slide.classList.remove('hidden');
                    } else {
                        slide.classList.add('hidden');
                    }
                }
            });

            updateSlideCounts();

            // After filtering, scroll to the first relevant slide
            const firstFilteredSlide = document.querySelector(`.slide:not(.hidden):not(.always-visible)`);
            if (firstFilteredSlide) {
                setTimeout(() => {
                    firstFilteredSlide.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const windowHeight = window.innerHeight;
        
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            container.scrollBy({ top: windowHeight, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            container.scrollBy({ top: -windowHeight, behavior: 'smooth' });
        }
    });

    // --- Audio Logic ---
    const bgMusic = document.getElementById('bg-music');
    const soundToggle = document.getElementById('sound-toggle');
    const iconMute = soundToggle.querySelector('.icon-mute');
    const iconPlay = soundToggle.querySelector('.icon-play');
    let isPlaying = false;

    const playMusic = () => {
        bgMusic.play().then(() => {
            isPlaying = true;
            iconMute.style.display = 'none';
            iconPlay.style.display = 'block';
        }).catch(e => {
            // Autoplay blocked.
        });
    };

    // Attempt to auto-play immediately
    playMusic();

    // Try to auto-play on first user interaction in case the browser blocked it
    const handleFirstInteraction = () => {
        if (!isPlaying) {
            playMusic();
        }
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    soundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlaying) {
            bgMusic.pause();
            isPlaying = false;
            iconMute.style.display = 'block';
            iconPlay.style.display = 'none';
        } else {
            bgMusic.play();
            isPlaying = true;
            iconMute.style.display = 'none';
            iconPlay.style.display = 'block';
        }
    });

    // --- Anti-Download & Screenshot Protection ---
    // Prevent Context Menu (Right Click)
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Prevent Dragging
    document.addEventListener('dragstart', e => e.preventDefault());

    // Screenshot Protection (Key detection)
    const blurScreen = () => {
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 2000);
    };

    document.addEventListener('keydown', (e) => {
        if (
            e.key === 'PrintScreen' || 
            (e.metaKey && e.shiftKey) || 
            (e.ctrlKey && e.key === 'p') 
        ) {
            blurScreen();
            try {
                navigator.clipboard.writeText('Screenshots and copying are disabled for this presentation.');
            } catch(err) {}
        }
    });

    // Blur on focus loss (common when opening OS screenshot tools)
    window.addEventListener('blur', () => {
        document.body.style.filter = 'blur(20px)';
    });
    
    window.addEventListener('focus', () => {
        document.body.style.filter = 'none';
    });
});
