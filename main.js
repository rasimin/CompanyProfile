// main.js

// 1. Sidebar Toggle
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const mainWrapper = document.getElementById('main-wrapper');
const overlay = document.getElementById('overlay');

function toggleSidebar() {
  if (window.innerWidth >= 1024) {
    // On desktop, toggle the 'lg:translate-x-0' class to let '-translate-x-full' take over
    sidebar.classList.toggle('lg:translate-x-0');
    mainWrapper.classList.toggle('lg:ml-[260px]');
  } else {
    // On mobile, toggle the base '-translate-x-full' class
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
  }
}

if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
if (overlay) overlay.addEventListener('click', toggleSidebar);

// 2. Simple Hash Router
const contentArea = document.getElementById('app-content');
const navLinks = document.querySelectorAll('.nav-link');

async function loadView(viewName) {
  try {
    // Show loading state
    contentArea.innerHTML = '<div class="flex justify-center items-center h-64 text-slate-500">Loading...</div>';
    
    // Fetch HTML view
    const response = await fetch(`./src/views/${viewName}.html`);
    if (!response.ok) throw new Error('View not found');
    const html = await response.text();
    
    // Inject HTML
    contentArea.innerHTML = html;
    
    // Update active nav link
    navLinks.forEach(link => {
      if (link.dataset.route === viewName) {
        link.classList.add('active-nav');
      } else {
        link.classList.remove('active-nav');
      }
    });

    // Close sidebar on mobile after navigation
    if (!sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
      toggleSidebar();
    }
  } catch (error) {
    contentArea.innerHTML = `<div class="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">Error loading view: ${viewName}</div>`;
    console.error(error);
  }
}

function handleHashChange() {
  const hash = window.location.hash.substring(1); // Remove '#'
  const route = hash || 'ui-components'; // Default to ui-components
  loadView(route);
}

// Listen for hash changes
window.addEventListener('hashchange', handleHashChange);

// Initial load
handleHashChange();

// 3. Submenu Toggle
const submenuToggles = document.querySelectorAll('.toggle-submenu');
submenuToggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const submenu = toggle.nextElementSibling;
    const chevron = toggle.querySelector('.chevron');
    
    // Toggle visibility
    if (submenu.classList.contains('hidden')) {
      submenu.classList.remove('hidden');
      submenu.classList.add('flex');
      chevron.style.transform = 'rotate(180deg)';
    } else {
      submenu.classList.add('hidden');
      submenu.classList.remove('flex');
      chevron.style.transform = 'rotate(0deg)';
    }
  });
});

// 4. Global UI Component Helpers for Dynamic Content
window.switchTab = function(button, paneId) {
  const container = button.closest('.tabs-container');
  if (!container) return;
  
  // Find siblings of the button and deactivate them
  const buttons = button.parentElement.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.classList.remove('tab-active');
    btn.classList.remove('vtab-active');
  });
  
  // Determine if it is a vertical or horizontal tab
  const isActiveClass = button.classList.contains('v-tab-btn') ? 'vtab-active' : 'tab-active';
  button.classList.add(isActiveClass);
  button.classList.add('active');
  
  // Find pane container and deactivate all panes
  const panes = container.querySelectorAll('.tab-pane');
  panes.forEach(pane => {
    pane.classList.add('hidden');
    pane.classList.remove('active');
  });
  
  // Activate target pane
  const targetPane = container.querySelector('#' + paneId);
  if (targetPane) {
    targetPane.classList.remove('hidden');
    targetPane.classList.add('active');
  }
};

window.toggleModal = function(modalId, show) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  if (show) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
  } else {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // restore scrolling
  }
};


