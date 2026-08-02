document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.presentation-container');
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const currentSlideEl = document.getElementById('current-slide');
    const totalSlidesEl = document.getElementById('total-slides');
    const progressBar = document.getElementById('progress-bar');
    
    totalSlidesEl.textContent = totalSlides;

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
            if (entry.isIntersecting) {
                // Add active class to current slide
                entry.target.classList.add('active');
                
                // Remove active class from siblings
                slides.forEach(slide => {
                    if (slide !== entry.target) {
                        slide.classList.remove('active');
                    }
                });

                // Update counter and progress bar
                const index = Array.from(slides).indexOf(entry.target);
                currentSlideEl.textContent = index + 1;
                updateProgress(index);
            }
        });
    }, observerOptions);

    slides.forEach(slide => observer.observe(slide));

    function updateProgress(index) {
        const progress = ((index + 1) / totalSlides) * 100;
        progressBar.style.width = `${progress}%`;
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const currentScroll = container.scrollTop;
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
