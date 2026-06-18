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
      initNewComponents();
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
