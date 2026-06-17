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

    // Initialize page-specific scripts
    if (viewName === 'ui-components') {
      initAutocomplete();
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

// 5. Toast Notification System
window.showToast = function(type, title, message) {
  // Ensure toast container exists
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    error: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warning: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
    info: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.closest('.toast-item').classList.add('toast-exit'); setTimeout(() => this.closest('.toast-item')?.remove(), 300);">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
};

// 6. Dropdown Menu Toggle
window.toggleDropdown = function(dropdownId) {
  const menu = document.getElementById(dropdownId);
  if (!menu) return;

  const isOpen = menu.classList.contains('dropdown-open');

  // Close all dropdowns first
  document.querySelectorAll('.dropdown-menu.dropdown-open').forEach(m => {
    m.classList.remove('dropdown-open');
  });

  if (!isOpen) {
    menu.classList.add('dropdown-open');

    // Close on outside click
    const closeHandler = function(e) {
      if (!menu.contains(e.target) && !e.target.closest('[onclick*="toggleDropdown"]')) {
        menu.classList.remove('dropdown-open');
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }
};

// 7. Popover Toggle
window.togglePopover = function(popoverId) {
  const popover = document.getElementById(popoverId);
  if (!popover) return;
  popover.classList.toggle('popover-show');

  if (popover.classList.contains('popover-show')) {
    const closeHandler = function(e) {
      if (!popover.contains(e.target) && !e.target.closest('[onclick*="togglePopover"]')) {
        popover.classList.remove('popover-show');
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }
};

// 8. Autocomplete Dropdown Component Logic
function initAutocomplete() {
  const wrap = document.getElementById('breed-autocomplete');
  if (!wrap) return;

  const input = wrap.querySelector('.autocomplete-input');
  const menu = wrap.querySelector('.autocomplete-menu');
  const spinner = wrap.querySelector('.autocomplete-spinner');
  const clearBtn = wrap.querySelector('.autocomplete-clear-btn');

  const breeds = [
    { name: 'Persian Cat', category: 'Kucing' },
    { name: 'Siamese Cat', category: 'Kucing' },
    { name: 'Maine Coon', category: 'Kucing' },
    { name: 'Angora Cat', category: 'Kucing' },
    { name: 'Sphynx Cat', category: 'Kucing' },
    { name: 'Golden Retriever', category: 'Anjing' },
    { name: 'German Shepherd', category: 'Anjing' },
    { name: 'Siberian Husky', category: 'Anjing' },
    { name: 'Poodle', category: 'Anjing' },
    { name: 'Bulldog', category: 'Anjing' },
    { name: 'Beagle', category: 'Anjing' },
    { name: 'Chihuahua', category: 'Anjing' }
  ];

  let activeIndex = -1;
  let filteredBreeds = [];
  let loadingTimeout = null;

  function renderItems(items, query) {
    menu.innerHTML = '';
    
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'autocomplete-empty';
      empty.textContent = 'Tidak ada hasil ditemukan';
      menu.appendChild(empty);
      return;
    }

    items.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'autocomplete-item';
      btn.dataset.index = index;

      // Highlight match
      let displayName = item.name;
      if (query) {
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        displayName = item.name.replace(regex, '<span class="autocomplete-match">$1</span>');
      }

      btn.innerHTML = `
        <span>${displayName}</span>
        <span class="autocomplete-item-category">${item.category}</span>
      `;

      btn.addEventListener('click', () => {
        selectItem(item.name);
      });

      menu.appendChild(btn);
    });
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function selectItem(val) {
    input.value = val;
    wrap.classList.remove('open');
    clearBtn.classList.remove('hidden');
    activeIndex = -1;
  }

  function filterResults() {
    const val = input.value;
    
    if (val.trim() === '') {
      clearBtn.classList.add('hidden');
    } else {
      clearBtn.classList.remove('hidden');
    }

    // Cancel existing search timeout
    if (loadingTimeout) clearTimeout(loadingTimeout);

    // Show simulated network spinner
    spinner.classList.remove('hidden');
    menu.innerHTML = '';

    loadingTimeout = setTimeout(() => {
      spinner.classList.add('hidden');
      const query = val.toLowerCase().trim();
      
      if (query === '') {
        filteredBreeds = breeds;
        renderItems(filteredBreeds, '');
        wrap.classList.add('open');
      } else {
        filteredBreeds = breeds.filter(item => 
          item.name.toLowerCase().includes(query) || 
          item.category.toLowerCase().includes(query)
        );
        renderItems(filteredBreeds, query);
        wrap.classList.add('open');
      }
      activeIndex = -1;
    }, 300); // 300ms simulated network delay
  }

  input.addEventListener('input', filterResults);

  input.addEventListener('focus', () => {
    // On focus, show all if empty or current results
    const query = input.value.toLowerCase().trim();
    if (query === '') {
      filteredBreeds = breeds;
      renderItems(breeds, '');
    } else {
      filteredBreeds = breeds.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
      );
      renderItems(filteredBreeds, query);
    }
    wrap.classList.add('open');
    if (input.value !== '') {
      clearBtn.classList.remove('hidden');
    }
  });

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    input.value = '';
    clearBtn.classList.add('hidden');
    input.focus();
    filteredBreeds = breeds;
    renderItems(breeds, '');
    wrap.classList.add('open');
  });

  // Handle arrow keys and Enter
  input.addEventListener('keydown', (e) => {
    const items = menu.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!wrap.classList.contains('open')) {
        wrap.classList.add('open');
        return;
      }
      activeIndex++;
      if (activeIndex >= items.length) activeIndex = 0;
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!wrap.classList.contains('open')) {
        wrap.classList.add('open');
        return;
      }
      activeIndex--;
      if (activeIndex < 0) activeIndex = items.length - 1;
      updateHighlight(items);
    } else if (e.key === 'Enter') {
      if (wrap.classList.contains('open')) {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < items.length) {
          items[activeIndex].click();
        } else if (items.length > 0) {
          items[0].click();
        }
      }
    } else if (e.key === 'Escape') {
      wrap.classList.remove('open');
      input.blur();
    }
  });

  function updateHighlight(items) {
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('active');
        // Scroll item into view if necessary
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Close when clicking outside
  const clickOutsideHandler = (e) => {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove('open');
    }
  };

  document.addEventListener('click', clickOutsideHandler);
  
  // Clean up event listener when hash changes (view changes)
  window.addEventListener('hashchange', function cleanup() {
    document.removeEventListener('click', clickOutsideHandler);
    window.removeEventListener('hashchange', cleanup);
  });
}
