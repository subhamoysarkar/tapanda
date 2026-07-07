// Ta Panda Business OS - UI Interactions

document.addEventListener('DOMContentLoaded', () => {
  // --- Current Date Injection ---
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // --- Sidebar Toggle ---
  const sidebar = document.getElementById('osSidebar');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  
  if (sidebar && sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
      }
    });
  }

  // --- Mobile Sidebar Overlay Close ---
  // Close sidebar on mobile if clicked outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('mobile-open')) {
      if (!sidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });

  // --- Theme Toggle ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    // Check local storage for theme preference
    const currentTheme = localStorage.getItem('os-theme') || 'light';
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }

    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      
      if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('os-theme', 'dark');
      } else {
        localStorage.setItem('os-theme', 'light');
      }
    });
  }

  // --- Navigation Item Active State Simulation ---
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Allow default link behavior if href is set to external, otherwise just UI toggle
      if (item.getAttribute('href') === '#') {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // On mobile, close sidebar after selecting an item
        if (window.innerWidth <= 768 && sidebar) {
          sidebar.classList.remove('mobile-open');
        }
      }
    });
  });

  // --- CSS Chart Animation Trigger ---
  // Simple intersection observer to animate bar heights when scrolled into view
  const chartBars = document.querySelectorAll('.bar');
  if (chartBars.length > 0) {
    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.height = entry.target.dataset.height || '50%';
          chartObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    chartBars.forEach(bar => {
      // Store original height, set to 0, then observe
      bar.dataset.height = bar.style.height || getComputedStyle(bar).height;
      bar.style.height = '0';
      chartObserver.observe(bar);
    });
  }
});
