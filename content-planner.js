// Ta Panda Business OS - Content Planner JS

document.addEventListener('DOMContentLoaded', () => {
  // Inherit standard OS functionality (Theme, Sidebar) if business-os.js is loaded
  
  // --- Content Details Drawer Logic ---
  const drawerOverlay = document.getElementById('cpDrawerOverlay');
  const drawer = document.getElementById('cpDrawer');
  const closeDrawerBtn = document.getElementById('cpCloseDrawer');
  const kanbanCards = document.querySelectorAll('.cp-kanban-card');

  const openDrawer = () => {
    if (drawerOverlay && drawer) {
      drawerOverlay.classList.add('active');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  };

  const closeDrawer = () => {
    if (drawerOverlay && drawer) {
      drawerOverlay.classList.remove('active');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  // Open drawer when clicking any card (except action buttons)
  kanbanCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Prevent opening if clicking an action button
      if (e.target.closest('.cp-card-action-btn')) return;
      
      openDrawer();
    });
  });

  // Close drawer events
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // --- Accordion Logic ---
  const accordions = document.querySelectorAll('.cp-accordion');
  accordions.forEach(acc => {
    const header = acc.querySelector('.cp-accordion-header');
    if (header) {
      header.addEventListener('click', () => {
        acc.classList.toggle('collapsed');
      });
    }
  });

  // --- Calendar Date Click Demo ---
  const calCells = document.querySelectorAll('.cp-cal-cell:not(.empty)');
  calCells.forEach(cell => {
    cell.addEventListener('click', () => {
      // Remove active from all
      calCells.forEach(c => c.classList.remove('active'));
      // Add to clicked
      cell.classList.add('active');
      
      // If it has a scheduled or published event, simulate opening a preview
      if (cell.classList.contains('has-scheduled') || cell.classList.contains('has-published')) {
        openDrawer();
      }
    });
  });

  // --- Kanban Drag and Drop Visual Feedback (Vanilla JS Placeholder) ---
  // Note: Actual data-driven drag and drop will require a library like SortableJS or extensive Vanilla JS.
  // This just adds some grab styles.
  kanbanCards.forEach(card => {
    card.setAttribute('draggable', true);
    
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      card.style.opacity = '0.5';
    });
    
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });
  });
});
