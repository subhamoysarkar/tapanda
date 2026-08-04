// GSAP Animations Config
gsap.registerPlugin(ScrollTrigger);
var ease = "power3.out";
var duration = 1.2;

// Initialize Swiper
const swiper = new Swiper('.main-presentation', {
    direction: 'vertical',
    slidesPerView: 1,
    mousewheel: true,
    keyboard: {
        enabled: true,
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    speed: 1000,
    effect: 'fade',
    fadeEffect: {
        crossFade: true
    },
    on: {
        init: function () {
            // Update total pages in footer band
            const totalNumEl = document.getElementById('total-slides-num');
            if (totalNumEl) {
                totalNumEl.textContent = this.slides.length;
            }
            animateSlide(0);
            injectMasonryPortfolio();
            setupLightbox();
            setupParallax();
        },
        slideChangeTransitionStart: function () {
            animateSlide(this.activeIndex);
        }
    }
});

// Setup Parallax for Cover Page
function setupParallax() {
    const coverSlide = document.querySelector('.slide-cover');
    if (!coverSlide) return;
    
    // Mouse movement parallax
    coverSlide.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.clientX) / 45;
        const y = (window.innerHeight / 2 - e.clientY) / 45;
        
        gsap.to('.slide-cover .cover-content', { x: x, y: y, duration: 1.2, ease: 'power2.out' });
        gsap.to('.blob1', { x: -x * 1.5, y: -y * 1.5, duration: 1.5, ease: 'power2.out' });
        gsap.to('.blob2', { x: x * 1.2, y: y * 1.2, duration: 2, ease: 'power2.out' });
    });

    // Continuous wobbly floaty movement for Cover content
    gsap.fromTo('.slide-cover .cover-content', 
        { y: -6, x: -3, rotation: -0.5 },
        { y: 6, x: 3, rotation: 0.5, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut' }
    );
}

// Setup Lightbox for Milestone Projects Gallery
function setupLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    
    if (!lightbox || !closeBtn || !lightboxImg) return;
    
    // Close on clicking Close button
    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });
    
    // Close on clicking outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
        }
    });
}

// Helper: Open Lightbox
window.openLightbox = function(imgSrc) {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightbox && lightboxImg) {
        lightboxImg.src = imgSrc;
        lightbox.style.display = 'flex';
    }
};

// Helper: Inject masonry items that fit exactly within viewport (up to 12 images)
function injectMasonryPortfolio() {
    const grid = document.getElementById('masonry-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const items = [
        { id: 1, src: 'assets/images/placeholder_1.jpeg', span: 'span-v-2' },
        { id: 2, src: 'assets/images/placeholder_2.avif', span: 'span-h-2' },
        { id: 3, src: 'assets/images/placeholder_3.png', span: '' },
        { id: 4, src: 'assets/images/placeholder_4.png', span: '' },
        { id: 5, src: 'assets/images/placeholder_5.png', span: 'span-h-2' },
        { id: 6, src: 'assets/images/placeholder_6.png', span: '' },
        { id: 7, src: 'assets/images/placeholder_7.png', span: '' },
        { id: 8, src: 'assets/images/placeholder_8.webp', span: '' },
        { id: 9, src: 'assets/images/placeholder_9.webp', span: '' },
        { id: 10, src: 'assets/images/placeholder_10.webp', span: '' },
        { id: 11, src: 'assets/images/placeholder_11.webp', span: '' },
        { id: 12, src: 'assets/images/placeholder_12.webp', span: '' },
        { id: 13, src: 'assets/images/placeholder_13.webp', span: '' }
    ];
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = `masonry-item ${item.span} gsap-port-item`;
        div.id = `masonry-item-${item.id}`;
        div.onclick = () => window.openLightbox(item.src);
        
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = `Milestone Project ${item.id}`;
        
        // Error Handler: If the image file doesn't exist in the folder, remove this grid card immediately
        img.onerror = function() {
            div.remove();
            recalculateGridColumns();
        };
        
        img.onload = function() {
            recalculateGridColumns();
        };
        
        div.appendChild(img);
        grid.appendChild(div);
    });

    // Dynamically adjust grid layout columns depending on how many images actually loaded
    function recalculateGridColumns() {
        const visibleItems = grid.querySelectorAll('.masonry-item');
        const count = visibleItems.length;
        
        if (count <= 4) {
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            grid.style.gridTemplateRows = 'repeat(2, 1fr)';
        } else if (count <= 6) {
            grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            grid.style.gridTemplateRows = 'repeat(2, 1fr)';
        } else {
            grid.style.gridTemplateColumns = 'repeat(6, 1fr)';
            grid.style.gridTemplateRows = 'repeat(3, 1fr)';
        }
        grid.style.gridAutoRows = 'minmax(0, 1fr)';
    }
}

// Helper: Fallback Trust Handshake SVG Injection
function injectFallbackTrustSVG() {
    const container = document.getElementById('trust-lottie');
    if (container) {
        container.innerHTML = `
            <svg class="trust-handshake-svg" viewBox="0 0 200 200" fill="none" stroke="var(--color-orange)" stroke-width="2" style="width: 100%; height: 100%;">
                <style>
                    .hand-left { stroke-dasharray: 200; stroke-dashoffset: 200; animation: drawHand 2s forwards; }
                    .hand-right { stroke-dasharray: 200; stroke-dashoffset: 200; animation: drawHand 2s forwards; animation-delay: 0.5s; }
                    .sparkle { opacity: 0; animation: fadeInSparkle 1.5s forwards; animation-delay: 2.2s; }
                    @keyframes drawHand { to { stroke-dashoffset: 0; } }
                    @keyframes fadeInSparkle { to { opacity: 1; transform: scale(1.1); transform-origin: center; } }
                </style>
                <!-- Left Hand -->
                <path class="hand-left" d="M 20 120 L 70 120 C 75 120, 80 115, 85 110 L 105 90 C 110 85, 110 78, 105 73 C 100 68, 93 68, 88 73 L 73 88" stroke-linecap="round" stroke-linejoin="round" />
                <!-- Right Hand -->
                <path class="hand-right" d="M 180 120 L 130 120 C 125 120, 120 115, 115 110 L 95 90 C 90 85, 90 78, 95 73 C 100 68, 107 68, 112 73 L 127 88" stroke-linecap="round" stroke-linejoin="round" />
                <!-- Glowing Heart / Trust emblem above -->
                <path class="sparkle" d="M 100 35 C 95 30, 85 30, 80 35 C 75 40, 75 50, 100 70 C 125 50, 125 40, 120 35 C 115 30, 105 30, 100 35 Z" fill="rgba(255, 107, 53, 0.15)" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;
    }
}

// GSAP Animations Switchboard
function animateSlide(index) {
    // 1. Manage Global Header/Footer Bands visibility & dynamic page numbering
    const headerBand = document.querySelector('.presentation-header-band');
    const footerBand = document.querySelector('.presentation-footer-band');
    const pageNumEl = document.getElementById('current-slide-num');
    
    if (headerBand && footerBand) {
        if (index === 0) {
            document.body.classList.add('cover-active');
            headerBand.style.opacity = '0';
            footerBand.style.opacity = '0';
        } else {
            document.body.classList.remove('cover-active');
            headerBand.style.opacity = '1';
            footerBand.style.opacity = '1';
            if (pageNumEl) {
                pageNumEl.textContent = index + 1;
            }
        }
    }

    switch (index) {
        case 0: // Slide 1: Cover
            gsap.fromTo('.gsap-cover-element', 
                { y: 40, opacity: 0 }, 
                { y: 0, opacity: 1, duration: duration, stagger: 0.15, ease: ease, clearProps: "all" }
            );
            break;
            
        case 1: // Slide 2: Execution Capability
            gsap.fromTo('.gsap-who-heading', 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: duration, ease: ease }
            );
            gsap.fromTo('.gsap-who-card',
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: duration, stagger: 0.15, ease: ease, delay: 0.3 }
            );
            gsap.fromTo('.gsap-who-value',
                { opacity: 0 },
                { opacity: 1, duration: duration, stagger: 0.2, ease: ease, delay: 0.8 }
            );
            animateCounters();
            break;
            
        case 2: // Slide 3: Why Choose (2 columns with Lottie)
            gsap.fromTo('.gsap-why-heading', 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: duration, ease: ease }
            );
            gsap.fromTo('.gsap-why-card',
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: duration, stagger: 0.1, ease: ease, delay: 0.2 }
            );
            
            // Load and init Lottie trust handshake animation with SVG fallback
            if (!window.trustLottieInstance) {
                try {
                    window.trustLottieInstance = lottie.loadAnimation({
                        container: document.getElementById('trust-lottie'),
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        path: 'https://assets-v2.lottiefiles.com/a/49b6b71a-1175-11ee-8bb4-0b7931b26f58/76Q1a2sQdF.json'
                    });
                    
                    // Hook fallback in case Lottie fails to parse/fetch
                    window.trustLottieInstance.addEventListener('data_failed', () => injectFallbackTrustSVG());
                    window.trustLottieInstance.addEventListener('DOMLoaded_failed', () => injectFallbackTrustSVG());
                    
                    // Setup a network error handler timeout (if Lottie takes too long to load)
                    setTimeout(() => {
                        const container = document.getElementById('trust-lottie');
                        if (container && container.children.length === 0) {
                            injectFallbackTrustSVG();
                        }
                    }, 2500);
                } catch(e) {
                    injectFallbackTrustSVG();
                }
            }
            break;
            
        case 3: // Slide 4: Infographic Roadmap
            gsap.fromTo('.gsap-blue-heading', 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: duration, ease: ease }
            );
            // Animate decorative background circles fading in
            gsap.fromTo('.deco-circle',
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power2.out", delay: 0.1 }
            );
            // Measure winding SVG path length and draw highlighted path completely
            const road = document.getElementById('blueprint-path');
            if (road) {
                const length = road.getTotalLength ? road.getTotalLength() : 2400;
                road.style.strokeDasharray = length;
                gsap.fromTo(road, 
                    { strokeDashoffset: length }, 
                    { strokeDashoffset: 0, duration: 3, ease: "power2.inOut", delay: 0.3 }
                );
            }
            // Stagger node icons popping in with scale bounce
            gsap.fromTo('.gsap-blue-node',
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.6, stagger: 0.15, ease: "back.out(1.7)", delay: 0.5 }
            );
            break;
            
        case 4: // Slide 5: Corporate Clients
            gsap.fromTo('.gsap-client-heading',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: duration, ease: ease }
            );
            gsap.fromTo('.gsap-client-ball',
                { scale: 0.3, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, stagger: 0.12, ease: "back.out(1.5)", delay: 0.2 }
            );
            break;
            
        case 5: // Slide 6: Milestone Projects Masonry
            gsap.fromTo('.gsap-port-heading',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: duration, ease: ease }
            );
            gsap.fromTo('.gsap-port-item',
                { scale: 0.9, opacity: 0 },
                { scale: 1, opacity: 1, duration: duration, stagger: 0.12, ease: ease, delay: 0.2 }
            );
            break;
            
        case 6: // Slide 7: Quality Control Infographic
            gsap.fromTo('.gsap-qc-heading',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: duration, ease: ease }
            );
            gsap.fromTo('.gsap-qc-item',
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: duration, stagger: 0.12, ease: ease, delay: 0.2 }
            );
            break;
            
        case 7: // Slide 8: Customer Experience Portal (Dual Mockups)
            gsap.fromTo('.gsap-plat-heading', 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: duration, ease: ease }
            );
            gsap.fromTo('.gsap-plat-mockup',
                { y: 100, opacity: 0 },
                { y: 0, opacity: 1, duration: duration, ease: ease, delay: 0.2 }
            );
            gsap.fromTo('.gsap-plat-float .notif-platform-logo',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: duration, stagger: 0.15, ease: ease, delay: 0.5 }
            );
            
            // Animate Gantt bars in the timeline mockup
            const ganttBars = document.querySelectorAll('.gantt-bar');
            ganttBars.forEach(bar => {
                const targetWidth = bar.getAttribute('data-width') + '%';
                gsap.fromTo(bar, 
                    { width: '0%' }, 
                    { width: targetWidth, duration: 1.5, ease: "power2.out", delay: 0.8 }
                );
            });
            break;
            
        case 8: // Slide 9: Closing
            gsap.fromTo('.gsap-close-heading', 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, duration: duration, ease: ease }
            );
            gsap.fromTo('.gsap-close-point',
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: duration, stagger: 0.15, ease: ease, delay: 0.3 }
            );
            gsap.fromTo('.gsap-close-bottom',
                { opacity: 0 },
                { opacity: 1, duration: duration, ease: ease, delay: 1 }
            );
            break;
    }
}

// Helper: Animate Counters
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        gsap.fromTo(counter, 
            { innerHTML: 0 }, 
            { innerHTML: target, duration: 2, snap: { innerHTML: 1 }, ease: "power1.inOut" }
        );
    });
}
