// main.js

// Global Profile Avatar Helper
window.updateGlobalAvatar = function() {
  const savedAvatar = localStorage.getItem('profile_avatar');
  const headerAvatarBtn = document.getElementById('header-avatar-btn');
  if (savedAvatar && headerAvatarBtn) {
    headerAvatarBtn.innerHTML = `<img src="${savedAvatar}" class="w-full h-full object-cover rounded-[inherit]">`;
  }
};
window.updateGlobalAvatar();

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
    // 1. Fade out konten lama dengan smooth transition
    contentArea.style.transition = 'opacity 0.15s ease';
    contentArea.style.opacity = '0';

    // 2. Tampilkan spinner hanya jika fetch memakan waktu > 80ms
    //    (mencegah spinner flash sesaat pada koneksi lokal yang cepat)
    let spinnerTimeout = setTimeout(() => {
      contentArea.innerHTML = `
        <div class="flex flex-col justify-center items-center h-64 gap-3">
          <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm font-semibold text-slate-500 animate-pulse">Memuat halaman...</span>
        </div>
      `;
      contentArea.style.opacity = '1';
    }, 80);

    // 3. Fetch HTML view
    const response = await fetch(`./src/views/${viewName}.html`);
    if (!response.ok) throw new Error('View not found');
    const html = await response.text();

    // 4. Hentikan spinner timeout jika fetch sudah selesai
    clearTimeout(spinnerTimeout);

    // 5. Inject HTML saat opacity masih 0 (tidak terlihat)
    contentArea.style.opacity = '0';
    contentArea.innerHTML = html;

    // 6. Tunggu satu frame render agar browser mengecat DOM dulu,
    //    lalu fade-in halaman dengan smooth
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        contentArea.style.opacity = '1';
      });
    });

    // Update active nav link
    navLinks.forEach(link => {
      if (link.dataset.route === viewName) {
        link.classList.add('active-nav');
        // Auto-expand parent submenu if it exists and is hidden
        const submenu = link.closest('.submenu');
        if (submenu && submenu.classList.contains('hidden')) {
          submenu.classList.remove('hidden');
          submenu.classList.add('flex');
          const toggleBtn = submenu.previousElementSibling;
          if (toggleBtn) {
            const chevron = toggleBtn.querySelector('.chevron');
            if (chevron) {
              chevron.style.transform = 'rotate(180deg)';
            }
          }
        }
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
      initNewComponents();
    } else if (viewName === 'user-role-access') {
      initUserRoleAccess();
    } else if (viewName === 'profile') {
      initProfileView();
    }
  } catch (error) {
    contentArea.style.opacity = '1';
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
window.isPermissionsDirty = false;

window.updatePermissionsDirtyWarning = function() {
  const warningBanner = document.getElementById('simulation-dirty-warning');
  if (warningBanner) {
    if (window.isPermissionsDirty) {
      warningBanner.classList.remove('hidden');
    } else {
      warningBanner.classList.add('hidden');
    }
  }
};

window.checkTabSwitch = function(button, paneId) {
  if (window.isPermissionsDirty) {
    window.confirmModal(
      'Perubahan Belum Disimpan',
      'Anda memiliki perubahan hak akses yang belum disimpan. Apakah Anda yakin ingin meninggalkan tab ini? Perubahan Anda akan hilang.',
      () => {
        window.isPermissionsDirty = false;
        window.updatePermissionsDirtyWarning();
        window.switchTab(button, paneId);
      }
    );
  } else {
    window.switchTab(button, paneId);
  }
};

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

// Custom Reusable Confirmation Modal (Elegant replacement for browser confirm())
window.confirmModal = function(title, message, onConfirm) {
  let existing = document.getElementById('global-confirm-modal');
  if (existing) existing.remove();

  const modalMarkup = `
    <div id="global-confirm-modal" class="modal-overlay-premium show" style="display: flex;">
      <div class="modal-dialog-premium" style="max-width: 400px; text-align: center;" onclick="event.stopPropagation()">
        <div class="modal-body-content" style="padding: 36px 24px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #FDEAEC; color: #E0264B; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
            <svg style="width: 28px; height: 28px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h4 style="font-size: 17px; font-weight: 700; margin: 0; color: var(--ink); font-family: 'Poppins', sans-serif;">${title}</h4>
          <p style="font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; text-align: center;">
            ${message}
          </p>
          <div style="display: flex; gap: 10px; width: 100%; margin-top: 8px;">
            <button id="confirm-cancel-btn" class="btn-premium btn-md btn-secondary" style="flex: 1; padding: 8px 12px; font-size: 13px;">Batal</button>
            <button id="confirm-ok-btn" class="btn-premium btn-md btn-primary" style="flex: 1; padding: 8px 12px; font-size: 13px; background: linear-gradient(135deg, #FF6B8A, #E0264B); border: none; box-shadow: 0 4px 15px -4px rgba(224, 38, 75, 0.35); color: white;">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalMarkup;
  const modalEl = tempDiv.firstElementChild;
  document.body.appendChild(modalEl);
  document.body.style.overflow = 'hidden';

  const closeConfirmModal = () => {
    modalEl.remove();
    document.body.style.overflow = '';
  };

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeConfirmModal();
  });

  modalEl.querySelector('#confirm-cancel-btn').addEventListener('click', closeConfirmModal);

  modalEl.querySelector('#confirm-ok-btn').addEventListener('click', () => {
    closeConfirmModal();
    if (onConfirm) onConfirm();
  });
};

// Custom Reusable Alert Modal (Elegant replacement for browser alert())
window.alertModal = function(title, message, type = 'success') {
  let existing = document.getElementById('global-alert-modal');
  if (existing) existing.remove();

  const colors = {
    success: { bg: '#E7F8EF', stroke: '#1AA964', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>' },
    info: { bg: '#EFE9FF', stroke: '#7B5CFA', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' },
    warning: { bg: '#FEF3C7', stroke: '#B45309', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' }
  };

  const current = colors[type] || colors.success;

  const modalMarkup = `
    <div id="global-alert-modal" class="modal-overlay-premium show" style="display: flex;">
      <div class="modal-dialog-premium" style="max-width: 380px; text-align: center;" onclick="event.stopPropagation()">
        <div class="modal-body-content" style="padding: 36px 24px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: ${current.bg}; color: ${current.stroke}; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
            <svg style="width: 28px; height: 28px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">${current.icon}</svg>
          </div>
          <h4 style="font-size: 17px; font-weight: 700; margin: 0; color: var(--ink); font-family: 'Poppins', sans-serif;">${title}</h4>
          <p style="font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; text-align: center;">
            ${message}
          </p>
          <button id="alert-ok-btn" class="btn-premium btn-md btn-primary" style="width: 100%; margin-top: 8px; font-size: 13px;">Oke</button>
        </div>
      </div>
    </div>
  `;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalMarkup;
  const modalEl = tempDiv.firstElementChild;
  document.body.appendChild(modalEl);
  document.body.style.overflow = 'hidden';

  const closeAlertModal = () => {
    modalEl.remove();
    document.body.style.overflow = '';
  };

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeAlertModal();
  });

  modalEl.querySelector('#alert-ok-btn').addEventListener('click', closeAlertModal);
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

// 9. New UI Components Logic (Row 6, Row 7, Row 8)
window.toggleDrawer = function(drawerId, show) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  if (show) {
    drawer.classList.add('show');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.remove('show');
    document.body.style.overflow = '';
  }
};

function initNewComponents() {
  // --- 16. TAG INPUT & MULTI-SELECT ---
  
  // Tag Input
  const tagInputWrap = document.getElementById('custom-tag-input');
  if (tagInputWrap) {
    const chipsContainer = tagInputWrap.querySelector('.tag-chips-container');
    const inputField = tagInputWrap.querySelector('.tag-input-field');
    let tags = ['Grooming', 'Kucing'];

    function renderChips() {
      // Remove all current chips (except the input field itself)
      const currentChips = chipsContainer.querySelectorAll('.tag-chip');
      currentChips.forEach(chip => chip.remove());

      tags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `
          ${tag}
          <button type="button" class="tag-chip-remove">&times;</button>
        `;

        chip.querySelector('.tag-chip-remove').addEventListener('click', () => {
          tags = tags.filter(t => t !== tag);
          renderChips();
        });

        // Insert chip before input field
        chipsContainer.insertBefore(chip, inputField);
      });
    }

    // Initial render
    renderChips();

    // Focus input on wrap click
    tagInputWrap.addEventListener('click', (e) => {
      if (e.target === tagInputWrap || e.target === chipsContainer) {
        inputField.focus();
      }
    });

    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = inputField.value.trim().replace(/,/g, '');
        if (val && !tags.includes(val)) {
          tags.push(val);
          inputField.value = '';
          renderChips();
        }
      } else if (e.key === 'Backspace' && inputField.value === '' && tags.length > 0) {
        tags.pop();
        renderChips();
      }
    });
  }

  // Multi-select Combobox
  const multiselectWrap = document.getElementById('custom-multiselect');
  if (multiselectWrap) {
    const trigger = multiselectWrap.querySelector('.multiselect-trigger');
    const valueLabel = multiselectWrap.querySelector('.multiselect-value');
    const checkboxes = multiselectWrap.querySelectorAll('.multiselect-item input');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      multiselectWrap.classList.toggle('open');
    });

    function updateTriggerLabel() {
      const selected = [];
      checkboxes.forEach(cb => {
        if (cb.checked) {
          selected.push(cb.value);
        }
      });

      if (selected.length === 0) {
        valueLabel.textContent = 'Pilih Layanan...';
      } else {
        // Show as chips inside the trigger
        valueLabel.innerHTML = selected.map(val => `<span class="multiselect-chip">${val}</span>`).join(' ');
      }
    }

    checkboxes.forEach(cb => {
      cb.addEventListener('change', updateTriggerLabel);
    });

    // Close on click outside
    const outsideClick = (e) => {
      if (!multiselectWrap.contains(e.target)) {
        multiselectWrap.classList.remove('open');
      }
    };
    document.addEventListener('click', outsideClick);
    
    window.addEventListener('hashchange', function cleanup() {
      document.removeEventListener('click', outsideClick);
      window.removeEventListener('hashchange', cleanup);
    });
  }

  // --- 17. DRAG & DROP FILE UPLOADER ---
  const uploaderWrap = document.getElementById('custom-file-uploader');
  if (uploaderWrap) {
    const fileInput = uploaderWrap.querySelector('#uploader-file-input');
    const dropzone = uploaderWrap.querySelector('.dropzone-area');
    const previewList = uploaderWrap.querySelector('.uploader-preview-list');

    // Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    });

    fileInput.addEventListener('change', () => {
      handleFiles(fileInput.files);
    });

    function handleFiles(files) {
      Array.from(files).forEach(file => {
        createFilePreview(file);
      });
    }

    function createFilePreview(file) {
      const card = document.createElement('div');
      card.className = 'preview-file-card';
      
      const sizeKB = (file.size / 1024).toFixed(1);
      const displaySize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

      card.innerHTML = `
        <div class="preview-file-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <div class="preview-file-info">
          <div class="preview-file-name" title="${file.name}">${file.name}</div>
          <div class="preview-file-size">${displaySize}</div>
          <div class="preview-file-progress-track">
            <div class="preview-file-progress-fill"></div>
          </div>
        </div>
        <button type="button" class="preview-file-remove">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      `;

      card.querySelector('.preview-file-remove').addEventListener('click', () => {
        card.remove();
      });

      previewList.appendChild(card);

      // Simulated Upload Progress animation
      const fill = card.querySelector('.preview-file-progress-fill');
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            card.querySelector('.preview-file-progress-track').style.display = 'none';
          }, 400);
        }
        fill.style.width = `${progress}%`;
      }, 150);
    }
  }

  // --- 18. RANGE SLIDER & STAR RATING ---

  // Range Slider
  const slider = document.getElementById('budget-range-slider');
  const sliderVal = document.getElementById('slider-val-display');
  if (slider && sliderVal) {
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      sliderVal.textContent = `Rp ${val.toLocaleString('id-ID')}`;
    });
  }

  // Star Rating
  const ratingWrap = document.getElementById('interactive-star-rating');
  if (ratingWrap) {
    const stars = ratingWrap.querySelectorAll('.star-icon');
    const feedback = ratingWrap.querySelector('#rating-text-feedback');
    let currentRating = 0;

    const ratingTexts = {
      1: 'Buruk sekali (1/5)',
      2: 'Kurang (2/5)',
      3: 'Cukup (3/5)',
      4: 'Bagus (4/5)',
      5: 'Sangat Bagus (5/5)'
    };

    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const hoverVal = parseInt(star.dataset.value);
        highlightStars(hoverVal, 'hovered');
      });

      star.addEventListener('mouseleave', () => {
        removeHighlight('hovered');
      });

      star.addEventListener('click', () => {
        currentRating = parseInt(star.dataset.value);
        highlightStars(currentRating, 'selected');
        feedback.textContent = ratingTexts[currentRating];
        feedback.style.color = 'var(--ink)';
      });
    });

    function highlightStars(rating, className) {
      stars.forEach(star => {
        const val = parseInt(star.dataset.value);
        if (val <= rating) {
          star.classList.add(className);
        } else {
          star.classList.remove(className);
        }
      });
    }

    function removeHighlight(className) {
      stars.forEach(star => star.classList.remove(className));
    }
  }

  // --- 19. DATE & TIME PICKER DEFAULT VALUES ---
  const dateInput = document.getElementById('premium-date-input');
  const timeInput = document.getElementById('premium-time-input');
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  if (timeInput && !timeInput.value) {
    timeInput.value = "09:00";
  }

  // --- 20. COLOR PICKER ---
  const swatchesWrap = document.getElementById('custom-color-swatches');
  const dynamicColor = document.getElementById('dynamic-color-picker');
  const previewBox = document.getElementById('color-preview-box');
  const hexLabel = document.getElementById('color-hex-label');

  if (swatchesWrap && dynamicColor && previewBox && hexLabel) {
    const swatches = swatchesWrap.querySelectorAll('.swatch-btn');

    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        
        const color = swatch.dataset.color;
        dynamicColor.value = color;
        updateColorDisplay(color);
      });
    });

    dynamicColor.addEventListener('input', (e) => {
      const color = e.target.value;
      updateColorDisplay(color);
      
      // Deactivate swatches since custom color selected
      swatches.forEach(s => {
        if (s.dataset.color === color.toLowerCase()) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });

    function updateColorDisplay(color) {
      previewBox.style.background = color;
      hexLabel.textContent = color.toUpperCase();
    }
  }

  // --- 21. DRAWER TOGGLE --
  // Exposed globally, so no local code needed except check
  
  // --- 23. TREE VIEW ---
  const treeWrap = document.getElementById('custom-tree-view');
  if (treeWrap) {
    const folders = treeWrap.querySelectorAll('.tree-folder-header');
    folders.forEach(folder => {
      folder.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = folder.parentElement;
        parent.classList.toggle('open');
      });
    });
  }

  // --- 24. TRANSFER LIST ---
  const transferWrap = document.getElementById('custom-transfer-list');
  if (transferWrap) {
    const sourceBox = transferWrap.querySelector('.source-items');
    const targetBox = transferWrap.querySelector('.target-items');
    const toTargetBtn = transferWrap.querySelector('.to-target-btn');
    const toSourceBtn = transferWrap.querySelector('.to-source-btn');

    // Click to select/deselect items
    transferWrap.addEventListener('click', (e) => {
      const item = e.target.closest('.transfer-item');
      if (item) {
        item.classList.toggle('selected');
      }
    });

    toTargetBtn.addEventListener('click', () => {
      const selected = sourceBox.querySelectorAll('.transfer-item.selected');
      selected.forEach(item => {
        item.classList.remove('selected');
        targetBox.appendChild(item);
      });
    });

    toSourceBtn.addEventListener('click', () => {
      const selected = targetBox.querySelectorAll('.transfer-item.selected');
      selected.forEach(item => {
        item.classList.remove('selected');
        sourceBox.appendChild(item);
      });
    });
  }

  // --- ADVANCED DATATABLE LOGIC ---
  const datatable = document.getElementById('advanced-datatable');
  if (datatable) {
    const searchInput = document.getElementById('datatable-search');
    const statusFilter = document.getElementById('datatable-status-filter');
    const selectAllCb = document.getElementById('datatable-select-all');
    const bulkBtn = document.getElementById('datatable-bulk-btn');
    const bulkCount = document.getElementById('datatable-bulk-count');
    const infoLabel = document.getElementById('datatable-info');
    const tbody = document.getElementById('datatable-body');

    function updateDatatableInfo() {
      const totalRows = tbody.querySelectorAll('tr').length;
      const visibleRows = tbody.querySelectorAll('tr:not([style*="display: none"])').length;
      infoLabel.textContent = `Menampilkan 1-${visibleRows} dari ${totalRows} data`;
    }

    // Filter logic
    function filterTable() {
      const query = searchInput.value.toLowerCase().trim();
      const status = statusFilter.value;
      const rows = tbody.querySelectorAll('tr');

      rows.forEach(row => {
        const name = row.querySelector('.name').textContent.toLowerCase();
        const role = row.querySelectorAll('td')[2].textContent.toLowerCase();
        const rowStatus = row.getAttribute('data-status');

        const matchesSearch = name.includes(query) || role.includes(query);
        const matchesStatus = status === 'all' || rowStatus === status;

        if (matchesSearch && matchesStatus) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
      updateDatatableInfo();
    }

    searchInput.addEventListener('input', filterTable);
    statusFilter.addEventListener('change', filterTable);

    // Bulk selection logic
    function updateBulkButton() {
      const selectedCbs = datatable.querySelectorAll('.datatable-row-select:checked');
      if (selectedCbs.length > 0) {
        bulkBtn.style.display = 'inline-flex';
        bulkCount.textContent = selectedCbs.length;
      } else {
        bulkBtn.style.display = 'none';
      }
    }

    selectAllCb.addEventListener('change', () => {
      const checked = selectAllCb.checked;
      tbody.querySelectorAll('tr:not([style*="display: none"]) .datatable-row-select').forEach(cb => {
        cb.checked = checked;
      });
      updateBulkButton();
    });

    tbody.addEventListener('change', (e) => {
      if (e.target.classList.contains('datatable-row-select')) {
        updateBulkButton();
      }
    });

    // Row Actions: Delete
    tbody.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-row-btn');
      if (deleteBtn) {
        const row = deleteBtn.closest('tr');
        const name = row.querySelector('.name').textContent;
        window.confirmModal(
          'Hapus Anggota',
          `Apakah Anda yakin ingin menghapus ${name}?`,
          () => {
            row.remove();
            showToast('success', 'Anggota Dihapus', `${name} telah dihapus dari tim.`);
            updateDatatableInfo();
            updateBulkButton();
          }
        );
      }
    });

    // Row Actions: Edit
    tbody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-row-btn');
      if (editBtn) {
        const row = editBtn.closest('tr');
        const name = row.querySelector('.name').textContent;
        toggleModal('form-modal', true);
        
        // Fill form modal name input with row's name
        const modalNameInput = document.querySelector('#form-modal .form-input-premium[placeholder*="Snowy"]');
        if (modalNameInput) {
          modalNameInput.value = name;
        }
      }
    });

    // Expose sort function globally
    window.sortDatatable = function(colIndex) {
      const table = document.getElementById("advanced-datatable");
      if (!table) return;
      const tbodyEl = table.querySelector("#datatable-body");
      const rows = Array.from(tbodyEl.querySelectorAll("tr"));
      
      const ths = table.querySelectorAll("thead th");
      const indicator = ths[colIndex].querySelector(".sort-indicator");
      const currentDir = indicator.getAttribute("data-dir") || "asc";
      const nextDir = currentDir === "asc" ? "desc" : "asc";
      
      // Reset other indicators
      table.querySelectorAll(".sort-indicator").forEach(ind => {
        ind.textContent = "↕";
        ind.setAttribute("data-dir", "");
      });
      
      indicator.textContent = nextDir === "asc" ? "▲" : "▼";
      indicator.setAttribute("data-dir", nextDir);

      const sortedRows = rows.sort((a, b) => {
        let cellA = a.querySelectorAll("td")[colIndex].textContent.trim();
        let cellB = b.querySelectorAll("td")[colIndex].textContent.trim();
        
        // Custom name comparison (contains sub-elements)
        if (colIndex === 1) {
          cellA = a.querySelector(".name").textContent.trim();
          cellB = b.querySelector(".name").textContent.trim();
        }

        return nextDir === "asc" 
          ? cellA.localeCompare(cellB) 
          : cellB.localeCompare(cellA);
      });

      tbodyEl.innerHTML = "";
      sortedRows.forEach(row => tbodyEl.appendChild(row));
    };

    updateDatatableInfo();
  }
}

function initUserRoleAccess() {
  // Reset dirty state on page load/re-init
  window.isPermissionsDirty = false;
  window.updatePermissionsDirtyWarning();

  const container = document.getElementById('access-control-container');
  if (!container) return;

  // 1. Initialize State in window so it persists
  if (!window.roleAccessState) {
    window.roleAccessState = {
      roles: [
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Akses penuh ke semua fitur, modul, dan pengaturan sistem.',
          permissions: {
            dashboard: { view: true, create: true, edit: true, delete: true },
            services: { view: true, create: true, edit: true, delete: true },
            forum: { view: true, create: true, edit: true, delete: true },
            bookings: { view: true, create: true, edit: true, delete: true },
            adoptions: { view: true, create: true, edit: true, delete: true },
            settings: { view: true, create: true, edit: true, delete: true }
          }
        },
        {
          id: 'editor',
          name: 'Editor Konten',
          description: 'Mengelola konten company profile (Layanan, Diskusi Forum, Adopsi Hewan). Tidak memiliki izin ke Bookings & Settings.',
          permissions: {
            dashboard: { view: true, create: false, edit: false, delete: false },
            services: { view: true, create: true, edit: true, delete: false },
            forum: { view: true, create: true, edit: true, delete: true },
            bookings: { view: false, create: false, edit: false, delete: false },
            adoptions: { view: true, create: true, edit: true, delete: false },
            settings: { view: false, create: false, edit: false, delete: false }
          }
        },
        {
          id: 'moderator',
          name: 'Moderator Forum',
          description: 'Fokus pada moderasi forum diskusi dan status adopsi hewan.',
          permissions: {
            dashboard: { view: true, create: false, edit: false, delete: false },
            services: { view: false, create: false, edit: false, delete: false },
            forum: { view: true, create: false, edit: true, delete: true },
            bookings: { view: false, create: false, edit: false, delete: false },
            adoptions: { view: true, create: false, edit: true, delete: false },
            settings: { view: false, create: false, edit: false, delete: false }
          }
        },
        {
          id: 'viewer',
          name: 'Viewer (Read-Only)',
          description: 'Hanya memiliki izin untuk memantau data tanpa izin perubahan.',
          permissions: {
            dashboard: { view: true, create: false, edit: false, delete: false },
            services: { view: true, create: false, edit: false, delete: false },
            forum: { view: true, create: false, edit: false, delete: false },
            bookings: { view: true, create: false, edit: false, delete: false },
            adoptions: { view: true, create: false, edit: false, delete: false },
            settings: { view: true, create: false, edit: false, delete: false }
          }
        }
      ],
      users: [
        { id: 1, name: 'Ahmad Faisal', email: 'ahmad.f@company.com', role: 'admin', status: 'active', avatar: 'AF', color: 'bg-blue-600 text-white', createdAt: '12 Jan 2026', lastActive: '5 menit lalu' },
        { id: 2, name: 'Siti Rahma', email: 'siti.r@company.com', role: 'editor', status: 'active', avatar: 'SR', color: 'bg-emerald-600 text-white', createdAt: '15 Feb 2026', lastActive: '1 jam lalu' },
        { id: 3, name: 'Budi Santoso', email: 'budi.s@company.com', role: 'moderator', status: 'active', avatar: 'BS', color: 'bg-amber-600 text-white', createdAt: '22 Mar 2026', lastActive: 'Kemarin' },
        { id: 4, name: 'Diana Lestari', email: 'diana.l@company.com', role: 'viewer', status: 'inactive', avatar: 'DL', color: 'bg-slate-500 text-white', createdAt: '10 Apr 2026', lastActive: '3 hari lalu' }
      ],
      auditLogs: [
        { time: '2026-06-21 00:15:32', user: 'Ahmad Faisal', role: 'Administrator', activity: 'Melakukan reset password untuk Diana Lestari', ip: '192.168.1.42' },
        { time: '2026-06-21 00:12:08', user: 'Ahmad Faisal', role: 'Administrator', activity: 'Mengubah hak akses peran Editor Konten', ip: '192.168.1.42' },
        { time: '2026-06-20 18:44:19', user: 'Siti Rahma', role: 'Editor Konten', activity: 'Mengunggah foto profil baru', ip: '192.168.1.105' },
        { time: '2026-06-20 15:30:45', user: 'Budi Santoso', role: 'Moderator Forum', activity: 'Menghapus postingan forum berunsur spam', ip: '192.168.1.77' },
        { time: '2026-06-19 11:22:10', user: 'Ahmad Faisal', role: 'Administrator', activity: 'Menambahkan pengguna baru: Siti Rahma', ip: '192.168.1.42' }
      ],
      menus: [
        { key: 'dashboard', label: 'Dashboard Overview', icon: '<path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>' },
        { key: 'services', label: 'Pet Services', icon: '<path d="M9 12a3 3 0 1 1 6 0v3a3 3 0 0 1-6 0zM9 13c-3 1-4 3-4 6h14c0-3-1-5-4-6M11 2l1 3 1-3"/>' },
        { key: 'forum', label: 'Forum Moderasi', icon: '<path d="M21 11.5a8.38 8.38 0 0 1-1.9 5.4L21 21l-4.3-1.1a8.5 8.5 0 1 1 4.3-8.4z"/>' },
        { key: 'bookings', label: 'Bookings Jadwal', icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
        { key: 'adoptions', label: 'Adoptions Hewan', icon: '<circle cx="12" cy="13" r="4"/><circle cx="6" cy="6" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="3" cy="11" r="1.6"/><circle cx="21" cy="11" r="1.6"/>' },
        { key: 'settings', label: 'Settings Website', icon: '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066"/>' }
      ]
    };
  }

  const state = window.roleAccessState;
  let selectedRoleId = state.roles[0].id;
  let simulatedRoleId = state.roles[0].id;
  let simulatedActiveMenu = 'dashboard';

  // --- ELEMENT SELECTORS ---
  // Users elements
  const tbodyUsers = document.getElementById('users-table-body');
  const emptyUsers = document.getElementById('users-table-empty');
  const userSearch = document.getElementById('user-search-input');
  const userStatusFilter = document.getElementById('user-status-filter');
  const btnAddUser = document.getElementById('btn-add-user');
  const userModal = document.getElementById('user-modal');
  const userForm = document.getElementById('user-modal-form');

  // Roles elements
  const rolesContainer = document.getElementById('roles-list-container');
  const permissionsTbody = document.getElementById('permissions-table-body');
  const btnSavePermissions = document.getElementById('btn-save-permissions');
  const selectedRoleName = document.getElementById('selected-role-name');
  const selectedRoleDesc = document.getElementById('selected-role-description');
  const btnAddRole = document.getElementById('btn-add-role');
  const roleModal = document.getElementById('role-modal');
  const roleForm = document.getElementById('role-modal-form');

  // Simulation elements
  const simRoleSelect = document.getElementById('simulation-role-select');
  const simSidebar = document.getElementById('simulated-sidebar-menu');
  const simAppContent = document.getElementById('simulated-app-content');
  const simUserDisplayName = document.getElementById('simulated-user-display-name');
  const simUserRoleBadge = document.getElementById('simulated-user-role-badge');
  const simUrlHash = document.getElementById('simulated-browser-url-hash');

  // --- RENDER USER FUNCTION ---
  function renderUsers() {
    if (!tbodyUsers) return;
    tbodyUsers.innerHTML = '';
    
    const query = userSearch.value.toLowerCase().trim();
    const filterStatus = userStatusFilter.value;
    
    const filtered = state.users.filter(u => {
      const nameMatch = u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
      const statusMatch = filterStatus === 'all' || u.status === filterStatus;
      return nameMatch && statusMatch;
    });

    if (filtered.length === 0) {
      emptyUsers.classList.remove('hidden');
    } else {
      emptyUsers.classList.add('hidden');
      filtered.forEach(u => {
        const roleObj = state.roles.find(r => r.id === u.role) || { name: u.role };
        const statusBadge = u.status === 'active' 
          ? '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">Aktif</span>'
          : '<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Nonaktif</span>';

        const avatarHtml = u.avatar && (u.avatar.startsWith('data:') || u.avatar.startsWith('http'))
          ? `<img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover shadow-sm shrink-0">`
          : `<div class="w-8 h-8 rounded-full ${u.color || 'bg-slate-500 text-white'} flex items-center justify-center font-bold text-xs shadow-sm shrink-0">${u.avatar || u.name.substring(0,2).toUpperCase()}</div>`;

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 transition-colors';
        tr.innerHTML = `
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              ${avatarHtml}
              <div>
                <div class="font-semibold text-slate-800 text-[13.5px]">${u.name}</div>
                <div class="text-xs text-slate-400 font-normal">${u.email}</div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 font-medium text-slate-700">${roleObj.name}</td>
          <td class="py-3 px-4 text-slate-500 font-medium text-[12.5px]">${u.createdAt || '-'}</td>
          <td class="py-3 px-4 text-slate-500 font-medium text-[12.5px]">${u.lastActive || '-'}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-3 md:gap-1.5">
              <button class="btn-reset-user-password p-2 md:p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all" data-id="${u.id}" title="Reset Password">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m-2 2a2 2 0 01-2-2m2 2a2 2 0 002-2m-2 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4a2 2 0 012-2h6zM15 7a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
              <button class="btn-edit-user p-2 md:p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-all" data-id="${u.id}" title="Edit User">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button class="btn-delete-user p-2 md:p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all" data-id="${u.id}" title="Hapus User">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
        </tr>`;
        tbodyUsers.appendChild(tr);
      });
    }
  }

  // --- RENDER ROLES SIDEBAR ---
  function renderRolesList() {
    if (!rolesContainer) return;
    rolesContainer.innerHTML = '';
    
    state.roles.forEach(role => {
      const isSelected = role.id === selectedRoleId;
      const userCount = state.users.filter(u => u.role === role.id).length;
      const isAdmin = role.id === 'admin';
      
      const roleCard = document.createElement('div');
      roleCard.className = `p-4 rounded-xl border transition-all flex flex-col gap-3.5 relative cursor-pointer ${
        isSelected 
          ? 'bg-blue-50/40 border-blue-200 shadow-sm ring-1 ring-blue-100/50' 
          : 'bg-white border-slate-100 hover:bg-slate-50/50 hover:border-slate-200'
      }`;
      
      roleCard.onclick = (e) => {
        if (e.target.closest('.role-action-btn')) return;
        selectedRoleId = role.id;
        renderRolesList();
        renderPermissions();
      };
      
      let actionButtonsHtml = '';
      if (!isAdmin) {
        actionButtonsHtml = `
          <div class="flex items-center gap-1.5 border-t border-slate-100 pt-2.5 mt-0.5">
            <button class="role-action-btn btn-edit-role-inline flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors" data-id="${role.id}">
              <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Ubah Deskripsi
            </button>
            <button class="role-action-btn btn-delete-role-inline flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors" data-id="${role.id}">
              <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus
            </button>
          </div>
        `;
      } else {
        actionButtonsHtml = `
          <div class="flex items-center gap-1.5 border-t border-slate-100 pt-2.5 mt-0.5 text-[10px] text-slate-400 select-none">
            <svg class="w-3.5 h-3.5 text-slate-450 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Sistem Peran (Akses Penuh)</span>
          </div>
        `;
      }
      
      roleCard.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="font-bold text-slate-800 text-[13.5px] truncate">${role.name}</div>
          <span class="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          }">${userCount} User</span>
        </div>
        <div class="text-[11.5px] text-slate-500 leading-relaxed font-normal">${role.description || ''}</div>
        ${actionButtonsHtml}
      `;

      const editBtn = roleCard.querySelector('.btn-edit-role-inline');
      const deleteBtn = roleCard.querySelector('.btn-delete-role-inline');

      if (editBtn) {
        editBtn.onclick = (e) => {
          e.stopPropagation();
          document.getElementById('role-modal-title').textContent = 'Ubah Detail Peran';
          document.getElementById('role-modal-action-id').value = role.id;
          document.getElementById('role-modal-name').value = role.name;
          document.getElementById('role-modal-description').value = role.description;
          window.toggleModal('role-modal', true);
        };
      }

      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          
          const assignedUsers = state.users.filter(u => u.role === role.id);
          if (assignedUsers.length > 0) {
            window.showToast('error', 'Tidak Dapat Dihapus', `Peran ${role.name} sedang digunakan oleh ${assignedUsers.length} pengguna. Ubah peran pengguna tersebut terlebih dahulu.`);
            return;
          }

          window.confirmModal('Hapus Peran', `Apakah Anda yakin ingin menghapus peran ${role.name} dari sistem?`, () => {
            state.roles = state.roles.filter(r => r.id !== role.id);
            if (selectedRoleId === role.id) {
              selectedRoleId = state.roles[0].id;
            }
            window.showToast('success', 'Peran Dihapus', `Peran ${role.name} berhasil dihapus.`);
            renderRolesList();
            renderPermissions();
            populateSimulationRoles();
            updateSimulation();
          });
        };
      }

      rolesContainer.appendChild(roleCard);
    });
  }

  // --- RENDER PERMISSIONS FOR SELECTED ROLE ---
  function renderPermissions() {
    if (!permissionsTbody) return;
    permissionsTbody.innerHTML = '';
    
    const role = state.roles.find(r => r.id === selectedRoleId);
    if (!role) return;

    selectedRoleName.textContent = `Detail Peran: ${role.name}`;
    selectedRoleDesc.textContent = role.description || 'Tidak ada deskripsi.';

    state.menus.forEach(menu => {
      const perm = role.permissions[menu.key] || { view: false, create: false, edit: false, delete: false };
      
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-100/70 transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-2.5 font-medium text-slate-800">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              ${menu.icon}
            </svg>
            <span>${menu.label}</span>
          </div>
        </td>
        <td class="py-3.5 px-4 text-center">
          <label class="relative inline-flex items-center justify-center cursor-pointer group">
            <input type="checkbox" class="sr-only peer view-toggle" data-menu="${menu.key}" ${perm.view ? 'checked' : ''}>
            <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/40 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </td>
        <td class="py-3.5 px-4 text-center">
          <label class="relative inline-flex items-center justify-center cursor-pointer group ${!perm.view ? 'opacity-40 cursor-not-allowed' : ''}">
            <input type="checkbox" class="sr-only peer create-toggle" data-menu="${menu.key}" ${perm.create ? 'checked' : ''} ${!perm.view ? 'disabled' : ''}>
            <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/40 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </td>
        <td class="py-3.5 px-4 text-center">
          <label class="relative inline-flex items-center justify-center cursor-pointer group ${!perm.view ? 'opacity-40 cursor-not-allowed' : ''}">
            <input type="checkbox" class="sr-only peer edit-toggle" data-menu="${menu.key}" ${perm.edit ? 'checked' : ''} ${!perm.view ? 'disabled' : ''}>
            <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/40 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </td>
        <td class="py-3.5 px-4 text-center">
          <label class="relative inline-flex items-center justify-center cursor-pointer group ${!perm.view ? 'opacity-40 cursor-not-allowed' : ''}">
            <input type="checkbox" class="sr-only peer delete-toggle" data-menu="${menu.key}" ${perm.delete ? 'checked' : ''} ${!perm.view ? 'disabled' : ''}>
            <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/40 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </td>
      `;

      // Reset Set Semua buttons state
      container.querySelectorAll('.btn-check-all').forEach(btn => {
        btn.dataset.state = 'true';
        btn.textContent = 'Set Semua';
      });

      // Add behavior: if 'view' toggle changes to unchecked, disable and uncheck 'create', 'edit' and 'delete'
      const viewCheckbox = tr.querySelector('.view-toggle');
      const createCheckbox = tr.querySelector('.create-toggle');
      const editCheckbox = tr.querySelector('.edit-toggle');
      const deleteCheckbox = tr.querySelector('.delete-toggle');
      
      viewCheckbox.addEventListener('change', () => {
        if (!viewCheckbox.checked) {
          createCheckbox.checked = false;
          createCheckbox.disabled = true;
          createCheckbox.parentElement.classList.add('opacity-40', 'cursor-not-allowed');

          editCheckbox.checked = false;
          editCheckbox.disabled = true;
          editCheckbox.parentElement.classList.add('opacity-40', 'cursor-not-allowed');
          
          deleteCheckbox.checked = false;
          deleteCheckbox.disabled = true;
          deleteCheckbox.parentElement.classList.add('opacity-40', 'cursor-not-allowed');
        } else {
          createCheckbox.disabled = false;
          createCheckbox.parentElement.classList.remove('opacity-40', 'cursor-not-allowed');

          editCheckbox.disabled = false;
          editCheckbox.parentElement.classList.remove('opacity-40', 'cursor-not-allowed');
          
          deleteCheckbox.disabled = false;
          deleteCheckbox.parentElement.classList.remove('opacity-40', 'cursor-not-allowed');
        }
      });

      // Listen for dirty state on individual checkboxes
      const allCheckboxes = tr.querySelectorAll('input[type="checkbox"]');
      allCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          window.isPermissionsDirty = true;
          window.updatePermissionsDirtyWarning();
        });
      });

      permissionsTbody.appendChild(tr);
    });
  }

  // --- SAVE PERMISSIONS FOR SELECTED ROLE ---
  if (btnSavePermissions) {
    btnSavePermissions.addEventListener('click', () => {
      const role = state.roles.find(r => r.id === selectedRoleId);
      if (!role) return;

      const rows = permissionsTbody.querySelectorAll('tr');
      rows.forEach(row => {
        const viewToggle = row.querySelector('.view-toggle');
        const createToggle = row.querySelector('.create-toggle');
        const editToggle = row.querySelector('.edit-toggle');
        const deleteToggle = row.querySelector('.delete-toggle');
        const menuKey = viewToggle.dataset.menu;

        role.permissions[menuKey] = {
          view: viewToggle.checked,
          create: createToggle.checked,
          edit: editToggle.checked,
          delete: deleteToggle.checked
        };
      });

      window.isPermissionsDirty = false;
      window.updatePermissionsDirtyWarning();

      window.showToast('success', 'Akses Disimpan', `Konfigurasi hak akses untuk peran ${role.name} berhasil diperbarui.`);
      
      state.auditLogs.unshift({
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: 'Ahmad Faisal',
        role: 'Administrator',
        activity: `Mengubah konfigurasi hak akses peran ${role.name}`,
        ip: '192.168.1.42'
      });
      renderAuditLogs();

      renderRolesList();
      updateSimulation(); // update simulation immediately
    });
  }

  // --- BIND MASS ACTION CHECK ALL ---
  const handleCheckAll = (type, targetState) => {
    const checkboxes = permissionsTbody.querySelectorAll(`.${type}-toggle`);
    checkboxes.forEach(cb => {
      if (!cb.disabled) {
        cb.checked = targetState;
        cb.dispatchEvent(new Event('change'));
      }
    });
    window.isPermissionsDirty = true;
    window.updatePermissionsDirtyWarning();
  };

  container.querySelectorAll('.btn-check-all').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const currentState = btn.dataset.state === 'true';
      
      handleCheckAll(type, currentState);
      
      if (currentState) {
        btn.dataset.state = 'false';
        btn.textContent = 'Bersihkan';
      } else {
        btn.dataset.state = 'true';
        btn.textContent = 'Set Semua';
      }
    });
  });

  // --- BIND USERS FILTER & SEARCH ---
  if (userSearch) userSearch.addEventListener('input', renderUsers);
  if (userStatusFilter) userStatusFilter.addEventListener('change', renderUsers);

  // --- POPULATE ROLES IN USER MODAL ---
  function populateUserModalRoles() {
    const userModalRoleSelect = document.getElementById('user-modal-role');
    if (!userModalRoleSelect) return;
    userModalRoleSelect.innerHTML = '';
    
    state.roles.forEach(role => {
      const opt = document.createElement('option');
      opt.value = role.id;
      opt.textContent = role.name;
      userModalRoleSelect.appendChild(opt);
    });
  }

  // --- TAMBAH USER BUTTON ---
  if (btnAddUser) {
    btnAddUser.addEventListener('click', () => {
      document.getElementById('user-modal-title').textContent = 'Tambah Pengguna Baru';
      document.getElementById('user-modal-action-id').value = '';
      userForm.reset();
      
      const avatarPreview = document.getElementById('user-modal-avatar-preview');
      if (avatarPreview) {
        avatarPreview.innerHTML = 'U';
        avatarPreview.style.backgroundColor = '';
      }
      window.userModalAvatarData = null;
      document.getElementById('user-modal-avatar-input').value = '';

      populateUserModalRoles();
      window.toggleModal('user-modal', true);
    });
  }

  // --- EDIT, DELETE & RESET USER DELEGATE ---
  if (tbodyUsers) {
    tbodyUsers.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-user');
      const deleteBtn = e.target.closest('.btn-delete-user');
      const resetBtn = e.target.closest('.btn-reset-user-password');

      if (editBtn) {
        const uid = parseInt(editBtn.dataset.id);
        const user = state.users.find(u => u.id === uid);
        if (user) {
          document.getElementById('user-modal-title').textContent = 'Ubah Detail Pengguna';
          document.getElementById('user-modal-action-id').value = uid;
          document.getElementById('user-modal-name').value = user.name;
          document.getElementById('user-modal-email').value = user.email;
          
          const avatarPreview = document.getElementById('user-modal-avatar-preview');
          if (avatarPreview) {
            if (user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'))) {
              avatarPreview.innerHTML = `<img src="${user.avatar}" class="w-full h-full object-cover">`;
            } else {
              avatarPreview.innerHTML = user.avatar || user.name.substring(0,2).toUpperCase();
              avatarPreview.style.backgroundColor = '';
            }
          }
          window.userModalAvatarData = user.avatar;
          document.getElementById('user-modal-avatar-input').value = '';

          populateUserModalRoles();
          document.getElementById('user-modal-role').value = user.role;
          document.getElementById('user-modal-status').value = user.status;
          
          window.toggleModal('user-modal', true);
        }
      }

      if (resetBtn) {
        const uid = parseInt(resetBtn.dataset.id);
        const user = state.users.find(u => u.id === uid);
        if (user) {
          window.confirmModal('Reset Password', `Apakah Anda yakin ingin me-reset password untuk pengguna <strong>${user.name}</strong>? Kata sandi baru akan dibuat secara otomatis oleh sistem.`, () => {
            const tempPassword = 'Pawfect' + Math.floor(1000 + Math.random() * 9000) + '!';
            window.alertModal('Password Berhasil Direset', `Password untuk <strong>${user.name}</strong> telah berhasil di-reset.<br><br>Kata sandi sementara baru:<br><code style="background:#f1f5f9; padding:6px 12px; border-radius:4px; font-weight:bold; font-size:14px; margin-top:8px; display:inline-block; letter-spacing:1px;">${tempPassword}</code>`, 'success');
            
            // Log security audit trail
            state.auditLogs.unshift({
              time: new Date().toISOString().replace('T', ' ').substring(0, 19),
              user: 'Ahmad Faisal',
              role: 'Administrator',
              activity: `Melakukan reset password untuk ${user.name}`,
              ip: '192.168.1.42'
            });
            renderAuditLogs();
          });
        }
      }

      if (deleteBtn) {
        const uid = parseInt(deleteBtn.dataset.id);
        const user = state.users.find(u => u.id === uid);
        if (user) {
          window.confirmModal('Hapus Pengguna', `Apakah Anda yakin ingin menghapus ${user.name} dari sistem?`, () => {
            state.users = state.users.filter(u => u.id !== uid);
            window.showToast('success', 'Pengguna Dihapus', `${user.name} telah berhasil dihapus.`);
            
            // Log security audit trail
            state.auditLogs.unshift({
              time: new Date().toISOString().replace('T', ' ').substring(0, 19),
              user: 'Ahmad Faisal',
              role: 'Administrator',
              activity: `Menghapus pengguna ${user.name} dari sistem`,
              ip: '192.168.1.42'
            });
            renderAuditLogs();

            renderUsers();
            renderRolesList(); // updates sidebar user counts
          });
        }
      }
    });
  }

  // --- BIND AVATAR FILE INPUT IN USER MODAL ---
  const modalAvatarInput = document.getElementById('user-modal-avatar-input');
  const modalAvatarPreview = document.getElementById('user-modal-avatar-preview');
  if (modalAvatarInput) {
    modalAvatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          window.showToast('error', 'Ukuran Berkas Terlalu Besar', 'Maksimal ukuran foto adalah 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          window.userModalAvatarData = event.target.result;
          if (modalAvatarPreview) {
            modalAvatarPreview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- SUBMIT USER FORM ---
  if (userForm) {
    userForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const actionId = document.getElementById('user-modal-action-id').value;
      const name = document.getElementById('user-modal-name').value.trim();
      const email = document.getElementById('user-modal-email').value.trim();
      const role = document.getElementById('user-modal-role').value;
      const status = document.getElementById('user-modal-status').value;

      const colors = ['bg-blue-600 text-white', 'bg-emerald-600 text-white', 'bg-amber-600 text-white', 'bg-slate-500 text-white', 'bg-purple-600 text-white', 'bg-rose-600 text-white'];
      const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
      const avatarValue = window.userModalAvatarData || initials;

      if (actionId) {
        // Edit flow
        const uIdx = state.users.findIndex(u => u.id === parseInt(actionId));
        if (uIdx !== -1) {
          state.users[uIdx].name = name;
          state.users[uIdx].email = email;
          state.users[uIdx].role = role;
          state.users[uIdx].status = status;
          state.users[uIdx].avatar = avatarValue;
          window.showToast('success', 'Detail Diperbarui', `Informasi pengguna ${name} berhasil disimpan.`);

          // Log security audit trail
          state.auditLogs.unshift({
            time: new Date().toISOString().replace('T', ' ').substring(0, 19),
            user: 'Ahmad Faisal',
            role: 'Administrator',
            activity: `Mengubah informasi detail pengguna ${name}`,
            ip: '192.168.1.42'
          });
          renderAuditLogs();
        }
      } else {
        // Add flow
        const newId = state.users.length > 0 ? Math.max(...state.users.map(u => u.id)) + 1 : 1;
        const randColor = colors[newId % colors.length];
        
        state.users.push({
          id: newId,
          name: name,
          email: email,
          role: role,
          status: status,
          avatar: avatarValue,
          color: randColor,
          createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          lastActive: 'Baru Terdaftar'
        });
        window.showToast('success', 'Pengguna Ditambahkan', `Pengguna ${name} berhasil didaftarkan ke sistem.`);

        // Log security audit trail
        state.auditLogs.unshift({
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          user: 'Ahmad Faisal',
          role: 'Administrator',
          activity: `Menambahkan pengguna baru: ${name}`,
          ip: '192.168.1.42'
        });
        renderAuditLogs();
      }

      window.toggleModal('user-modal', false);
      renderUsers();
      renderRolesList(); // updates sidebar user counts
    });
  }

  // --- ADD ROLE DIALOG ---
  if (btnAddRole) {
    btnAddRole.addEventListener('click', () => {
      document.getElementById('role-modal-title').textContent = 'Tambah Peran (Role) Baru';
      document.getElementById('role-modal-action-id').value = '';
      roleForm.reset();
      window.toggleModal('role-modal', true);
    });
  }



  // --- SUBMIT ROLE FORM ---
  if (roleForm) {
    roleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const actionId = document.getElementById('role-modal-action-id').value;
      const name = document.getElementById('role-modal-name').value.trim();
      const desc = document.getElementById('role-modal-description').value.trim();

      if (actionId) {
        // Edit flow
        const role = state.roles.find(r => r.id === actionId);
        if (role) {
          role.name = name;
          role.description = desc;
          window.showToast('success', 'Peran Diperbarui', `Informasi detail peran ${name} berhasil disimpan.`);
        }
      } else {
        // Add flow
        const newRoleId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        if (state.roles.some(r => r.id === newRoleId)) {
          window.showToast('error', 'Gagal', `Peran dengan nama tersebut sudah ada.`);
          return;
        }

        const newPermissions = {};
        state.menus.forEach(m => {
          newPermissions[m.key] = { view: false, edit: false, delete: false };
        });

        state.roles.push({
          id: newRoleId,
          name: name,
          description: desc,
          permissions: newPermissions
        });

        selectedRoleId = newRoleId;
        window.showToast('success', 'Peran Baru Ditambahkan', `Peran ${name} berhasil dibuat. Konfigurasi hak akses menu di bawah.`);
      }

      window.toggleModal('role-modal', false);
      renderRolesList();
      renderPermissions();
      populateSimulationRoles();
    });
  }



  // --- SIMULATION LOGIC ---
  function populateSimulationRoles() {
    if (!simRoleSelect) return;
    simRoleSelect.innerHTML = '';
    
    state.roles.forEach(role => {
      const opt = document.createElement('option');
      opt.value = role.id;
      opt.textContent = role.name;
      if (role.id === simulatedRoleId) opt.selected = true;
      simRoleSelect.appendChild(opt);
    });
  }

  function updateSimulation() {
    if (!simRoleSelect) return;
    
    simulatedRoleId = simRoleSelect.value;
    const role = state.roles.find(r => r.id === simulatedRoleId);
    if (!role) return;

    const simulatedUser = state.users.find(u => u.role === role.id) || { name: `Staff - ${role.name}` };
    simUserDisplayName.textContent = simulatedUser.name;
    simUserRoleBadge.textContent = role.name;

    simSidebar.innerHTML = '';
    
    let hasSelectedMenuAccess = false;
    let firstAllowedMenu = null;

    state.menus.forEach(menu => {
      const isAllowed = role.permissions[menu.key] && role.permissions[menu.key].view;
      if (isAllowed) {
        if (!firstAllowedMenu) firstAllowedMenu = menu.key;
        if (menu.key === simulatedActiveMenu) hasSelectedMenuAccess = true;

        const navBtn = document.createElement('button');
        const isActive = menu.key === simulatedActiveMenu;
        navBtn.className = `w-full flex items-center gap-2.5 px-3 py-2 rounded text-[12px] font-semibold transition-all ${
          isActive 
            ? 'bg-slate-800 text-white' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`;
        navBtn.onclick = () => {
          simulatedActiveMenu = menu.key;
          updateSimulation();
        };
        navBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            ${menu.icon}
          </svg>
          <span>${menu.label}</span>
        `;
        simSidebar.appendChild(navBtn);
      }
    });

    if (!hasSelectedMenuAccess) {
      if (firstAllowedMenu) {
        simulatedActiveMenu = firstAllowedMenu;
        updateSimulation();
        return;
      } else {
        simulatedActiveMenu = '';
      }
    }

    simUrlHash.textContent = simulatedActiveMenu || 'no-access';
    renderSimulatedContent(role);
  }

  function renderSimulatedContent(role) {
    if (!simAppContent) return;
    simAppContent.innerHTML = '';

    if (!simulatedActiveMenu) {
      simAppContent.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-lg border border-slate-200">
          <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3 border border-red-100">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 class="font-bold text-slate-800 text-sm">Akses Diblokir Sepenuhnya</h4>
          <p class="text-[12px] text-slate-400 max-w-xs mt-1.5 leading-relaxed">Peran <strong>${role.name}</strong> tidak memiliki izin melihat untuk menu mana pun di sistem.</p>
        </div>
      `;
      return;
    }

    const perm = role.permissions[simulatedActiveMenu] || { view: false, edit: false, delete: false };

    const infoBar = document.createElement('div');
    infoBar.className = `p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-3 mb-4 ${
      perm.edit && perm.delete 
        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
        : 'bg-amber-50 border-amber-100 text-amber-800'
    }`;
    
    const permStatusLabels = [];
    if (perm.view) permStatusLabels.push('<span class="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Lihat: Aktif</span>');
    permStatusLabels.push(perm.edit 
      ? '<span class="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Edit: Aktif</span>' 
      : '<span class="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">Edit: Nonaktif</span>');
    permStatusLabels.push(perm.delete 
      ? '<span class="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Hapus: Aktif</span>' 
      : '<span class="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">Hapus: Nonaktif</span>');

    infoBar.innerHTML = `
      <div>
        Anda mensimulasikan peran <strong>${role.name}</strong> pada menu <strong>${state.menus.find(m => m.key === simulatedActiveMenu).label}</strong>.
      </div>
      <div class="flex items-center gap-1.5 text-[10px]">
        ${permStatusLabels.join(' ')}
      </div>
    `;
    simAppContent.appendChild(infoBar);

    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-1 flex flex-col min-h-0';

    const handleSimulatedAction = (actionType) => {
      const allowed = perm[actionType];
      if (allowed) {
        window.showToast('success', 'Simulasi Sukses', `Aksi ${actionType === 'edit' ? 'Ubah' : 'Hapus'} berhasil dijalankan (Peran ${role.name} memiliki hak akses).`);
      } else {
        window.showToast('error', 'Akses Ditolak', `Gagal: Peran ${role.name} TIDAK memiliki hak untuk ${actionType === 'edit' ? 'mengubah (Edit)' : 'menghapus (Delete)'} data ini.`);
      }
    };

    if (simulatedActiveMenu === 'dashboard') {
      pageWrapper.innerHTML = `
        <div class="welcome mb-4">
          <h2 class="text-base font-bold text-slate-800">Dashboard Summary</h2>
          <p class="text-[11px] text-slate-400">Pratinjau ringkasan situs company profile.</p>
        </div>
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="p-3 border border-slate-100 rounded-lg bg-slate-50/50 text-center">
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Layanan</div>
            <div class="text-xl font-bold text-slate-800 mt-0.5">18</div>
          </div>
          <div class="p-3 border border-slate-100 rounded-lg bg-slate-50/50 text-center">
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Diskusi</div>
            <div class="text-xl font-bold text-slate-800 mt-0.5">946</div>
          </div>
          <div class="p-3 border border-slate-100 rounded-lg bg-slate-50/50 text-center">
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Booking</div>
            <div class="text-xl font-bold text-slate-800 mt-0.5">24</div>
          </div>
        </div>
        <div class="flex-1 flex flex-col items-center justify-center text-center p-4">
          <svg class="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          <div class="text-xs font-semibold text-slate-600">Simulasi Statistik Aktif</div>
          <p class="text-[10px] text-slate-400 max-w-xs mt-1">Halaman pratinjau statistik company profile berjalan sukses.</p>
        </div>
      `;
    } 
    else if (simulatedActiveMenu === 'services') {
      pageWrapper.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h2 class="text-xs font-bold text-slate-800">Daftar Layanan</h2>
            <p class="text-[10px] text-slate-400">Mockup data Layanan Company Profile.</p>
          </div>
          <button class="sim-btn-add px-2.5 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-all ${
            !perm.edit ? 'opacity-40 cursor-not-allowed bg-slate-500' : ''
          }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Tambah Layanan Baru"'}>${!perm.edit ? '🔒 ' : ''}+ Tambah Layanan</button>
        </div>
        <div class="space-y-2.5 overflow-y-auto flex-1 pr-1">
          <div class="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/20">
            <div>
              <div class="text-xs font-bold text-slate-700">Premium Grooming & Spa</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Mandi + Pijat + Gunting Kuku</div>
            </div>
            <div class="flex gap-1">
              <button class="sim-btn-edit px-2 py-1 text-[10px] font-bold border rounded ${
                perm.edit ? 'text-slate-600 border-slate-200 hover:bg-slate-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Ubah Data"'}>
                <span class="flex items-center gap-1">${perm.edit ? '' : '🔒 '}Edit</span>
              </button>
              <button class="sim-btn-delete px-2 py-1 text-[10px] font-bold border rounded ${
                perm.delete ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.delete ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Hapus (Delete) untuk modul ini"' : 'title="Hapus Data"'}>
                <span class="flex items-center gap-1">${perm.delete ? '' : '🔒 '}Hapus</span>
              </button>
            </div>
          </div>
          
          <div class="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/20">
            <div>
              <div class="text-xs font-bold text-slate-700">Vaccine & Health Check</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Vaksinasi lengkap + Vitamin</div>
            </div>
            <div class="flex gap-1">
              <button class="sim-btn-edit px-2 py-1 text-[10px] font-bold border rounded ${
                perm.edit ? 'text-slate-600 border-slate-200 hover:bg-slate-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Ubah Data"'}>
                <span class="flex items-center gap-1">${perm.edit ? '' : '🔒 '}Edit</span>
              </button>
              <button class="sim-btn-delete px-2 py-1 text-[10px] font-bold border rounded ${
                perm.delete ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.delete ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Hapus (Delete) untuk modul ini"' : 'title="Hapus Data"'}>
                <span class="flex items-center gap-1">${perm.delete ? '' : '🔒 '}Hapus</span>
              </button>
            </div>
          </div>
        </div>
      `;

      pageWrapper.querySelector('.sim-btn-add')?.addEventListener('click', () => handleSimulatedAction('edit'));
      pageWrapper.querySelectorAll('.sim-btn-edit').forEach(b => b.addEventListener('click', () => handleSimulatedAction('edit')));
      pageWrapper.querySelectorAll('.sim-btn-delete').forEach(b => b.addEventListener('click', () => handleSimulatedAction('delete')));
    } 
    else if (simulatedActiveMenu === 'forum') {
      pageWrapper.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h2 class="text-xs font-bold text-slate-800">Forum Diskusi (Moderasi)</h2>
            <p class="text-[10px] text-slate-400">Daftar komentar dilaporkan.</p>
          </div>
        </div>
        <div class="space-y-3 overflow-y-auto flex-1 pr-1">
          <div class="p-3 border border-red-100 rounded-lg bg-red-50/20 space-y-2">
            <div class="flex justify-between items-center text-[10px]">
              <span class="font-bold text-slate-700">Pelapor: Citra Lestari</span>
              <span class="text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded">Spam</span>
            </div>
            <p class="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 italic leading-relaxed">"Jual obat kuat murah kunjungi situs abal-abal..."</p>
            <div class="flex justify-end gap-1.5 pt-1">
              <button class="sim-btn-edit px-2 py-1 text-[9.5px] font-bold border rounded ${
                perm.edit ? 'text-slate-600 border-slate-200 hover:bg-slate-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Abaikan Laporan"'}>
                <span>${perm.edit ? '' : '🔒 '}Abaikan</span>
              </button>
              <button class="sim-btn-delete px-2 py-1 text-[9.5px] font-bold border rounded ${
                perm.delete ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.delete ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Hapus (Delete) untuk modul ini"' : 'title="Hapus Komentar"'}>
                <span>${perm.delete ? '' : '🔒 '}Hapus Komentar</span>
              </button>
            </div>
          </div>
        </div>
      `;
      pageWrapper.querySelectorAll('.sim-btn-edit').forEach(b => b.addEventListener('click', () => handleSimulatedAction('edit')));
      pageWrapper.querySelectorAll('.sim-btn-delete').forEach(b => b.addEventListener('click', () => handleSimulatedAction('delete')));
    } 
    else if (simulatedActiveMenu === 'bookings') {
      pageWrapper.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h2 class="text-xs font-bold text-slate-800">Booking Perawatan Hewan</h2>
            <p class="text-[10px] text-slate-400">Jadwal aktif yang menunggu konfirmasi.</p>
          </div>
        </div>
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left border-collapse text-[10px]">
            <thead class="bg-slate-50">
              <tr>
                <th class="py-2 px-3">Hewan</th>
                <th class="py-2 px-3">Layanan</th>
                <th class="py-2 px-3 text-center">Status</th>
                <th class="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-2 px-3 font-semibold text-slate-700">Mochi (Kucing)</td>
                <td class="py-2 px-3">Grooming Spa</td>
                <td class="py-2 px-3 text-center"><span class="bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-[9px] font-bold">Pending</span></td>
                <td class="py-2 px-3 text-right">
                  <button class="sim-btn-edit px-1.5 py-0.5 text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded hover:bg-blue-100 ${
                    !perm.edit ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-100' : ''
                  }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Konfirmasi Booking"'}>${perm.edit ? '' : '🔒 '}Konfirmasi</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      pageWrapper.querySelectorAll('.sim-btn-edit').forEach(b => b.addEventListener('click', () => handleSimulatedAction('edit')));
    } 
    else if (simulatedActiveMenu === 'adoptions') {
      pageWrapper.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h2 class="text-xs font-bold text-slate-800">Adoptions Hewan</h2>
            <p class="text-[10px] text-slate-400">Daftar hewan siap diadopsi.</p>
          </div>
          <button class="sim-btn-add px-2 py-1 text-[9.5px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-all ${
            !perm.edit ? 'opacity-40 cursor-not-allowed bg-slate-500' : ''
          }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Registrasi Hewan Baru"'}>${!perm.edit ? '🔒 ' : ''}+ Registrasi Hewan</button>
        </div>
        <div class="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
          <div class="p-2.5 border border-slate-150 rounded-lg bg-slate-50/30 flex flex-col justify-between space-y-2">
            <div class="h-16 bg-slate-200 rounded flex items-center justify-center text-slate-400 text-[9px]">
              [Foto Hewan - Luna]
            </div>
            <div>
              <div class="text-[11px] font-bold text-slate-700">Luna (Persia Mix)</div>
              <div class="text-[9px] text-slate-400">Umur: 10 Bulan</div>
            </div>
            <div class="flex gap-1 pt-1">
              <button class="sim-btn-edit flex-1 px-1 py-0.5 text-[9px] font-semibold border rounded text-center ${
                perm.edit ? 'text-slate-600 border-slate-200 hover:bg-slate-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Ubah Data"'}>
                <span>${perm.edit ? '' : '🔒 '}Edit</span>
              </button>
              <button class="sim-btn-delete flex-1 px-1 py-0.5 text-[9px] font-semibold border rounded text-center ${
                perm.delete ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.delete ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Hapus (Delete) untuk modul ini"' : 'title="Hapus Data"'}>
                <span>${perm.delete ? '' : '🔒 '}Hapus</span>
              </button>
            </div>
          </div>
        </div>
      `;
      pageWrapper.querySelector('.sim-btn-add')?.addEventListener('click', () => handleSimulatedAction('edit'));
      pageWrapper.querySelectorAll('.sim-btn-edit').forEach(b => b.addEventListener('click', () => handleSimulatedAction('edit')));
      pageWrapper.querySelectorAll('.sim-btn-delete').forEach(b => b.addEventListener('click', () => handleSimulatedAction('delete')));
    } 
    else if (simulatedActiveMenu === 'settings') {
      pageWrapper.innerHTML = `
        <div class="welcome mb-3">
          <h2 class="text-xs font-bold text-slate-800">Pengaturan Website</h2>
          <p class="text-[10px] text-slate-400">Profil perusahaan & setting global.</p>
        </div>
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div>
            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Perusahaan</label>
            <input type="text" class="w-full h-8 px-2 border border-slate-200 rounded text-[11px]" value="Pawfect Indonesia" disabled>
          </div>
          <div>
            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Kontak</label>
            <input type="email" class="w-full h-8 px-2 border border-slate-200 rounded text-[11px]" value="info@pawfect.id" disabled>
          </div>
          <div class="pt-3 border-t border-slate-100">
            <button class="sim-btn-save px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-all ${
              !perm.edit ? 'opacity-40 cursor-not-allowed bg-slate-500' : ''
            }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Simpan Pengaturan Website"'}>${!perm.edit ? '🔒 ' : ''}Simpan Pengaturan</button>
          </div>
        </div>
      `;
      pageWrapper.querySelector('.sim-btn-save')?.addEventListener('click', () => handleSimulatedAction('edit'));
    }

    simAppContent.appendChild(pageWrapper);
  }

  if (simRoleSelect) {
    simRoleSelect.addEventListener('change', updateSimulation);
  }

  // --- RENDER AUDIT LOGS ---
  function renderAuditLogs() {
    const tbodyAudit = document.getElementById('audit-table-body');
    if (!tbodyAudit) return;
    tbodyAudit.innerHTML = '';
    
    state.auditLogs.forEach(log => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/50 transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-4 font-mono text-slate-500 text-xs">${log.time}</td>
        <td class="py-3 px-4 font-semibold text-slate-700 text-[13px]">${log.user}</td>
        <td class="py-3 px-4 text-slate-500 text-[12.5px]">${log.role}</td>
        <td class="py-3 px-4 text-slate-600 text-[13px]">${log.activity}</td>
        <td class="py-3 px-4 font-mono text-slate-500 text-xs">${log.ip}</td>
      `;
      tbodyAudit.appendChild(tr);
    });

    const btnExportAudit = document.getElementById('btn-export-audit');
    if (btnExportAudit) {
      btnExportAudit.onclick = null;
      btnExportAudit.onclick = () => {
        window.alertModal('Ekspor Berhasil', 'Data log audit keamanan berhasil diekspor ke format berkas CSV (Simulasi).', 'success');
        state.auditLogs.unshift({
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          user: 'Ahmad Faisal',
          role: 'Administrator',
          activity: 'Melakukan ekspor log audit keamanan (.CSV)',
          ip: '192.168.1.42'
        });
        renderAuditLogs();
      };
    }
  }
  window.renderAuditLogs = renderAuditLogs;

  // --- INITIAL INITS ---
  renderUsers();
  renderRolesList();
  renderPermissions();
  populateSimulationRoles();
  updateSimulation();
  renderAuditLogs();
}

function initProfileView() {
  const avatarInput = document.getElementById('profile-avatar-input');
  const avatarDisplay = document.getElementById('profile-avatar-display');
  
  // Restore preview from localStorage if any
  const savedAvatar = localStorage.getItem('profile_avatar');
  if (savedAvatar && avatarDisplay) {
    avatarDisplay.innerHTML = `<img src="${savedAvatar}" class="w-full h-full object-cover rounded-[inherit]">`;
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          window.showToast('error', 'Ukuran Berkas Terlalu Besar', 'Maksimal ukuran foto adalah 2MB.');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          // Save to localStorage
          localStorage.setItem('profile_avatar', dataUrl);
          
          // Update profile display
          if (avatarDisplay) {
            avatarDisplay.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover rounded-[inherit]">`;
          }
          
          // Update header avatar
          window.updateGlobalAvatar();
          
          window.showToast('success', 'Foto Profil Diunggah', 'Foto profil Anda berhasil diperbarui.');
        };
        reader.readAsDataURL(file);
      }
    });
  }
}
