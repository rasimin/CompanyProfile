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
  const route = hash || 'dashboard'; // Default to dashboard
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

// 4. UI Components Tab Interactivity (Event Delegation)
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tab-btn');
  if (tabBtn) {
    const targetId = tabBtn.getAttribute('data-target');
    const tabGroup = tabBtn.closest('.tab-group');
    const isVertical = tabGroup.classList.contains('vertical-tabs');

    // Deactivate all buttons in group
    tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
      if (isVertical) {
        btn.classList.remove('bg-blue-50', 'text-blue-700', 'border-blue-600');
        btn.classList.add('text-slate-600', 'border-transparent', 'hover:bg-slate-50');
      } else {
        btn.classList.remove('border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-800');
      }
    });

    // Activate clicked button
    if (isVertical) {
      tabBtn.classList.remove('text-slate-600', 'border-transparent', 'hover:bg-slate-50');
      tabBtn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-600');
    } else {
      tabBtn.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-800');
      tabBtn.classList.add('border-blue-600', 'text-blue-600');
    }

    // Switch Content
    const tabContainer = tabGroup.closest('.tab-container');
    if (tabContainer) {
      const contents = tabContainer.querySelectorAll('.tab-content');
      contents.forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('opacity-100');
        content.classList.add('opacity-0');
      });

      const targetContent = tabContainer.querySelector(targetId);
      if (targetContent) {
        targetContent.classList.remove('hidden');
        // Small delay to allow display:block to apply before animating opacity
        setTimeout(() => {
          targetContent.classList.remove('opacity-0');
          targetContent.classList.add('opacity-100');
        }, 10);
      }
    }
  }
});

// 5. Autocomplete Interactivity
document.addEventListener('input', (e) => {
  if (e.target.id === 'autocomplete-input') {
    const input = e.target;
    const list = document.getElementById('autocomplete-list');
    const emptyState = document.getElementById('autocomplete-empty');
    const items = list.querySelectorAll('.autocomplete-item');
    const filter = input.value.toLowerCase();
    
    list.classList.remove('hidden');
    let hasVisibleItems = false;
    
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(filter)) {
        item.classList.remove('hidden');
        hasVisibleItems = true;
      } else {
        item.classList.add('hidden');
      }
    });
    
    if (hasVisibleItems) {
      emptyState.classList.add('hidden');
    } else {
      emptyState.classList.remove('hidden');
    }
  }
});

document.addEventListener('click', (e) => {
  const list = document.getElementById('autocomplete-list');
  const input = document.getElementById('autocomplete-input');
  
  if (!list || !input) return;
  
  // Click on an item
  const item = e.target.closest('.autocomplete-item');
  if (item && list.contains(item)) {
    input.value = item.getAttribute('data-value');
    list.classList.add('hidden');
    return;
  }
  
  // Click on the input to show list
  if (e.target === input) {
    list.classList.remove('hidden');
    // Trigger input event to re-filter based on current value
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  
  // Click outside to hide list
  if (!input.contains(e.target) && !list.contains(e.target)) {
    list.classList.add('hidden');
  }
});
