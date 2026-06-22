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
    } else if (viewName === 'dashboard') {
      initDashboard();
    } else if (viewName === 'home-settings') {
      initHomeSettings();
    } else if (viewName === 'about-us') {
      initAboutUs();
    } else if (viewName === 'services') {
      initServices();
    } else if (viewName === 'products') {
      initProducts();
    } else if (viewName === 'portfolio') {
      initPortfolio();
    } else if (viewName === 'blog') {
      initBlog();
    } else if (viewName === 'inbox') {
      initInbox();
    } else if (viewName === 'settings-landing') {
      initSettingsLanding();
    }
  } catch (error) {
    contentArea.style.opacity = '1';
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

// 4. Global UI Component Helpers for Dynamic Content
window.isPermissionsDirty = false;

// Helper to save state
window.saveRoleAccessState = function() {
  if (window.roleAccessState) {
    localStorage.setItem('roleAccessState', JSON.stringify(window.roleAccessState));
  }
};

// Global Shared State (PM & Data Mocking Agents)
if (!window.roleAccessState) {
  const savedState = localStorage.getItem('roleAccessState');
  if (savedState) {
    try {
      window.roleAccessState = JSON.parse(savedState);
    } catch (e) {
      console.error("Error parsing saved roleAccessState", e);
    }
  }
  
  if (!window.roleAccessState) {
    window.roleAccessState = {
    roles: [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Akses penuh ke semua fitur, modul, dan pengaturan sistem.',
        permissions: {
          dashboard: { view: true, create: true, edit: true, delete: true },
          'home-settings': { view: true, create: true, edit: true, delete: true },
          'about-us': { view: true, create: true, edit: true, delete: true },
          services: { view: true, create: true, edit: true, delete: true },
          products: { view: true, create: true, edit: true, delete: true },
          portfolio: { view: true, create: true, edit: true, delete: true },
          blog: { view: true, create: true, edit: true, delete: true },
          inbox: { view: true, create: true, edit: true, delete: true },
          settings: { view: true, create: true, edit: true, delete: true }
        }
      },
      {
        id: 'editor',
        name: 'Editor Konten',
        description: 'Mengelola konten showroom (Layanan, Katalog Unit, Galeri Serah Terima, Artikel). Tidak memiliki izin ke Inbox & Settings.',
        permissions: {
          dashboard: { view: true, create: false, edit: false, delete: false },
          'home-settings': { view: true, create: true, edit: true, delete: false },
          'about-us': { view: true, create: true, edit: true, delete: false },
          services: { view: true, create: true, edit: true, delete: false },
          products: { view: true, create: true, edit: true, delete: false },
          portfolio: { view: true, create: true, edit: true, delete: false },
          blog: { view: true, create: true, edit: true, delete: true },
          inbox: { view: false, create: false, edit: false, delete: false },
          settings: { view: false, create: false, edit: false, delete: false }
        }
      },
      {
        id: 'sales',
        name: 'Sales Executive',
        description: 'Fokus pada kelola unit, galeri serah terima, dan merespon kotak masuk / permintaan hubungi kami.',
        permissions: {
          dashboard: { view: true, create: false, edit: false, delete: false },
          'home-settings': { view: false, create: false, edit: false, delete: false },
          'about-us': { view: true, create: false, edit: false, delete: false },
          services: { view: true, create: false, edit: false, delete: false },
          products: { view: true, create: true, edit: true, delete: false },
          portfolio: { view: true, create: true, edit: true, delete: false },
          blog: { view: false, create: false, edit: false, delete: false },
          inbox: { view: true, create: true, edit: true, delete: false },
          settings: { view: false, create: false, edit: false, delete: false }
        }
      },
      {
        id: 'viewer',
        name: 'Viewer (Read-Only)',
        description: 'Hanya memiliki izin untuk memantau data tanpa izin perubahan.',
        permissions: {
          dashboard: { view: true, create: false, edit: false, delete: false },
          'home-settings': { view: true, create: false, edit: false, delete: false },
          'about-us': { view: true, create: false, edit: false, delete: false },
          services: { view: true, create: false, edit: false, delete: false },
          products: { view: true, create: false, edit: false, delete: false },
          portfolio: { view: true, create: false, edit: false, delete: false },
          blog: { view: true, create: false, edit: false, delete: false },
          inbox: { view: true, create: false, edit: false, delete: false },
          settings: { view: true, create: false, edit: false, delete: false }
        }
      }
    ],
    users: [
      { id: 1, name: 'Ahmad Faisal', username: 'ahmad.faisal', email: 'ahmad.faisal@autodrive.com', role: 'admin', status: 'active', avatar: 'AF', color: 'bg-blue-600 text-white', createdAt: '12 Jan 2026', lastActive: '5 menit lalu' },
      { id: 2, name: 'Siti Rahma', username: 'siti.rahma', email: 'siti.rahma@autodrive.com', role: 'editor', status: 'active', avatar: 'SR', color: 'bg-emerald-600 text-white', createdAt: '15 Feb 2026', lastActive: '1 jam lalu' },
      { id: 3, name: 'Budi Santoso', username: 'budi.santoso', email: 'budi.santoso@autodrive.com', role: 'sales', status: 'active', avatar: 'BS', color: 'bg-amber-600 text-white', createdAt: '22 Mar 2026', lastActive: 'Kemarin' },
      { id: 4, name: 'Diana Lestari', username: 'diana.dian', email: 'diana.lestari@autodrive.com', role: 'viewer', status: 'inactive', avatar: 'DL', color: 'bg-slate-500 text-white', createdAt: '10 Apr 2026', lastActive: '3 hari lalu' }
    ],
    auditLogs: [
      { time: '2026-06-21 00:15:32', user: 'Ahmad Faisal', role: 'Administrator', activity: 'Mengubah konfigurasi hero banner utama', ip: '192.168.1.42' },
      { time: '2026-06-21 00:12:08', user: 'Ahmad Faisal', role: 'Administrator', activity: 'Mengubah hak akses peran Sales Executive', ip: '192.168.1.42' },
      { time: '2026-06-20 18:44:19', user: 'Siti Rahma', role: 'Editor Konten', activity: 'Menambahkan unit baru: Honda HR-V 1.5 E CVT 2021 ke Katalog Unit', ip: '192.168.1.105' },
      { time: '2026-06-20 15:30:45', user: 'Budi Santoso', role: 'Sales Executive', activity: 'Membaca pesan masuk dari Andi Wijaya terkait penawaran kredit', ip: '192.168.1.77' },
      { time: '2026-06-19 11:22:10', user: 'Ahmad Faisal', role: 'Administrator', activity: 'Menghapus unit yang terjual dari katalog aktif', ip: '192.168.1.42' }
    ],
    menus: [
      { key: 'dashboard', label: 'Dashboard Overview', icon: '<path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>' },
      { key: 'home-settings', label: 'Pengaturan Beranda', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>' },
      { key: 'about-us', label: 'Tentang Kami', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>' },
      { key: 'services', label: 'Layanan Showroom', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>' },
      { key: 'products', label: 'Katalog Unit', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>' },
      { key: 'portfolio', label: 'Galeri Serah Terima', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>' },
      { key: 'blog', label: 'Artikel Otomotif', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5a2 2 0 00-2 2v3m9 11h-3m-9.07-12h.01m-.01 4h.01M9 16h3m-3-4h3"/>' },
      { key: 'inbox', label: 'Hubungi Kami', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>' },
      { key: 'settings', label: 'Settings Website', icon: '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066"/>' }
    ],
    // Hero & Highlights Data Mocking
    homeHero: {
      title: 'Cari Mobil & Motor Bekas Berkualitas?',
      subtitle: 'AutoDrive Showroom menghadirkan pilihan mobil dan motor bekas terbaik dengan inspeksi ketat 175+ titik, garansi mesin & transmisi 1 tahun, serta pilihan pembayaran kredit bunga rendah yang aman dan transparan.',
      ctaText: 'Hubungi Kami',
      ctaUrl: '#inbox',
      image: null
    },
    homeHighlights: [
      { id: 1, icon: '🚗', title: 'Inspeksi 175+ Titik', desc: 'Jaminan unit bebas banjir, bebas tabrakan besar, dan odometer asli.' },
      { id: 2, icon: '🛡️', title: 'Garansi 1 Tahun', desc: 'Garansi penuh untuk mesin, transmisi, dan sistem kelistrikan utama.' },
      { id: 3, icon: '🤝', title: 'Tukar Tambah Instan', desc: 'Taksir harga kendaraan lama Anda secara transparan dalam 30 menit.' }
    ],
    aboutProfile: {
      companyName: 'AutoDrive Showroom',
      vision: 'Menjadi platform dan showroom otomotif bekas paling terpercaya, transparan, dan memudahkan kepemilikan kendaraan bagi masyarakat Indonesia.',
      mission: '1. Menyediakan unit mobil dan motor bekas dengan standar inspeksi kualitas tertinggi.\n2. Memberikan jaminan tertulis bebas banjir dan bebas tabrakan berat pada setiap unit.\n3. Menawarkan opsi pembiayaan kredit yang adil, transparan, dan bekerjasama dengan leasing terkemuka.\n4. Menghadirkan layanan purna jual yang andal untuk kenyamanan berkendara pelanggan.'
    },
    aboutTeam: [
      { id: 1, name: 'Rasimin, S.T.', role: 'Chief Executive Officer & Founder', avatar: null },
      { id: 2, name: 'Siti Rahma, S.Kom', role: 'Head of Sales & Marketing', avatar: null },
      { id: 3, name: 'Budi Santoso', role: 'Chief Inspector & Quality Manager', avatar: null }
    ],
    // Services Mocking
    services: [
      { id: 1, icon: '🚗', name: 'Beli Mobil & Motor Bekas', category: 'Utama', desc: 'Temukan ratusan unit kendaraan bekas berkualitas yang siap pakai dengan dokumen kepemilikan yang terjamin legalitasnya.', price: 'Harga Transparan', status: 'active' },
      { id: 2, icon: '🤝', name: 'Tukar Tambah (Trade-In)', category: 'Utama', desc: 'Tukarkan mobil atau motor lama Anda dengan unit impian di showroom kami. Proses taksir cepat dan penawaran harga terbaik.', price: 'Taksir Gratis', status: 'active' },
      { id: 3, icon: '🛡️', name: 'Garansi Mesin & Transmisi', category: 'Jaminan', desc: 'Setiap unit mobil yang dibeli di AutoDrive dilengkapi garansi mesin dan transmisi selama 12 bulan demi ketenangan berkendara Anda.', price: 'Gratis 1 Tahun', status: 'active' },
      { id: 4, icon: '✨', name: 'Premium Detailing & Paint Protection', category: 'Perawatan Unit', desc: 'Layanan restorasi eksterior dan interior kendaraan agar kembali berkilau seperti baru menggunakan produk coating premium.', price: 'Mulai Rp 1.500.000', status: 'active' }
    ],
    // Products Mocking
    products: [
      { id: 1, name: 'Honda HR-V 1.5 E CVT 2021', category: 'Mobil', price: 'Rp 275.000.050', stock: 1, status: 'active', desc: 'Warna Putih Mutiara, Tangan Pertama dari baru, KM 28.000 (Low), Pajak Panjang s/d Oktober, Body Mulus Orisinil, Kunci Serep Lengkap.', image: null },
      { id: 2, name: 'Toyota Avanza 1.3 G M/T 2020', category: 'Mobil', price: 'Rp 168.000.000', stock: 1, status: 'active', desc: 'Warna Abu-abu Metalik, Mesin Halus, AC Dingin Double Blower, Kaki-kaki Sunyi, Interior Bersih wangi, Odometer 45.000 km berjalan.', image: null },
      { id: 3, name: 'Yamaha NMAX 155 ABS Keyless 2022', category: 'Motor', price: 'Rp 28.800.000', stock: 1, status: 'active', desc: 'Tipe Connected ABS (Termahal), Warna Matte Black, Surat Lengkap BPKB/STNK/Faktur, Kunci Keyless 2 pcs & Barcode, KM 11.000.', image: null },
      { id: 4, name: 'Honda Vario 160 CBS 2023', category: 'Motor', price: 'Rp 23.500.000', stock: 1, status: 'active', desc: 'Warna Active Black, Body Mulus dilapisi stiker proteksi bening, Ban Tebal depan belakang, Kelistrikan normal, Pajak Hidup.', image: null }
    ],
    // Portfolio Mocking
    portfolio: [
      { id: 1, title: 'Serah Terima Honda HR-V 2021 - Ibu Retno', client: 'Jakarta Selatan', category: 'Handover', date: 'Maret 2026', image: null, status: 'active' },
      { id: 2, title: 'Tukar Tambah Avanza lama ke Toyota Fortuner - Bp. Budi', client: 'Tangerang', category: 'Handover', date: 'Mei 2026', image: null, status: 'active' },
      { id: 3, title: 'Event AutoDrive Showroom Weekend Expo 2026', client: 'AutoDrive Kelapa Gading', category: 'Event', date: 'Juni 2026', image: null, status: 'active' }
    ],
    // Blog Mocking
    blog: [
      { id: 1, title: '5 Hal Wajib Diperiksa Saat Membeli Mobil Bekas', author: 'Budi Santoso', date: '15 Juni 2026', category: 'Tips Otomotif', content: 'Membeli mobil bekas berkualitas membutuhkan ketelitian ekstra agar tidak menyesal di kemudian hari.\n\nBeberapa bagian penting yang harus diperiksa:\n1. Cek Ruang Mesin: Pastikan tidak ada kebocoran oli atau suara ketukan kasar.\n2. Cek Tulang Sasis (Apron): Pastikan tidak ada las-lasan kasar atau bekas ketok yang menandakan mobil pernah tabrakan besar.\n3. Periksa Kolong Mobil: Indikasi karat parah atau lumpur kering yang mengeras menandakan mobil bekas banjir.\n4. Cek Kelayakan Dokumen: Cocokkan nomor mesin dan nomor rangka pada fisik mobil dengan STNK dan BPKB.', status: 'active' },
      { id: 2, title: 'Review Yamaha NMAX Bekas: Apakah Masih Layak di Tahun 2026?', author: 'Siti Rahma', date: '10 Juni 2026', category: 'Review Kendaraan', content: 'Yamaha NMAX 155 bekas tetap menjadi raja motor matic besar di pasar motor bekas Indonesia. Dengan kisaran harga Rp 20 jutaan untuk tahun 2020-2022, motor ini menawarkan kenyamanan riding jarak jauh, bagasi luas, serta mesin berteknologi Blue Core VVA yang bertenaga namun irit bahan bakar.', status: 'active' },
      { id: 3, title: 'Pentingnya Garansi Mesin untuk Pembelian Unit Bekas', author: 'Rasimin, S.T.', date: '02 Juni 2026', category: 'Berita Showroom', content: 'Di AutoDrive Showroom, kami percaya bahwa ketenangan pikiran pembeli adalah segalanya. Itulah mengapa kami menyediakan garansi mesin dan transmisi selama 1 tahun secara gratis. Temukan informasi mengapa garansi ini sangat vital di artikel ini.', status: 'active' }
    ],
    // Inbox Mocking
    inbox: [
      { id: 1, name: 'Andi Wijaya', email: 'andi.wijaya@gmail.com', subject: 'Tanya Simulasi Kredit Toyota Avanza 2020', message: 'Halo admin AutoDrive, saya berminat dengan unit Toyota Avanza 2020 abu-abu. Bolehkah dikirimkan simulasi kredit untuk tenor 3 tahun dan 4 tahun dengan DP minimal 15%? Terima kasih.', date: '21 Juni 2026, 09:12', read: false },
      { id: 2, name: 'Siti Aminah', email: 'siti.aminah@yahoo.com', subject: 'Pengajuan Jual Titip Honda Jazz 2018', message: 'Selamat pagi, saya ingin titip jual (konsinyasi) Honda Jazz RS CVT tahun 2018 warna merah milik pribadi. Mobil tangan pertama, km 60 ribu, plat B genap. Bagaimana skema bagi hasil atau biayanya di showroom AutoDrive?', date: '20 Juni 2026, 15:30', read: true },
      { id: 3, name: 'Rudi Hermawan', email: 'rudi.h@leasingpartner.id', subject: 'Penawaran Program Bunga Murah Tenor Panjang', message: 'Kami dari divisi kemitraan leasing partner ingin menawarkan program pembiayaan mobil bekas dengan suku bunga khusus 4.5% flat untuk nasabah AutoDrive Showroom. Apakah kita bisa jadwalkan meeting singkat membahas MoU kerjasama ini?', date: '19 Juni 2026, 11:45', read: true }
    ]
  };
  window.saveRoleAccessState();
  }
}

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
    // Initialize dropzones inside this modal
    setTimeout(() => initDropzones(modal), 50);
  } else {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // restore scrolling
  }
};

// ── Drag-and-drop upload dropzone initializer ──────────────────────────
function initDropzones(container) {
  const dropzones = (container || document).querySelectorAll('.upload-dropzone');
  dropzones.forEach(zone => {
    if (zone._dropzoneInit) return; // avoid double-binding
    zone._dropzoneInit = true;

    // Find the hidden file input inside the zone
    const input = zone.querySelector('input[type="file"]');
    if (!input) return;

    // Find associated preview element (by sibling or parent lookup)
    const findPreview = () => {
      // Try inside the zone first
      let p = zone.querySelector('[id$="-preview"]');
      if (!p) {
        // Try sibling
        const parent = zone.closest('.form-group-premium, div');
        p = parent && parent.querySelector('[id$="-preview"]');
      }
      return p;
    };

    const showPreview = (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewEl = findPreview();
        if (!previewEl) return;
        if (previewEl.tagName === 'IMG') {
          previewEl.src = e.target.result;
          previewEl.classList.remove('hidden');
        } else if (previewEl.tagName === 'DIV') {
          previewEl.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />`;
          previewEl.classList.remove('hidden');
        }
        // Update avatar-style previews (round)
        const avatarPrev = zone.querySelector('.rounded-full');
        if (avatarPrev && avatarPrev !== previewEl) {
          avatarPrev.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
        }
      };
      reader.readAsDataURL(file);
    };

    // Click handled by inline onclick; also handle change event
    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        showPreview(e.target.files[0]);
      }
    });

    // Drag events
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('dragover');
      }
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        // Assign to the hidden input
        const dt = new DataTransfer();
        dt.items.add(files[0]);
        input.files = dt.files;
        showPreview(files[0]);
      }
    });
  });
}

// Init dropzones already in DOM on page load
document.addEventListener('DOMContentLoaded', () => initDropzones());


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
  if (type === 'success' && window.saveRoleAccessState) {
    window.saveRoleAccessState();
  }
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
    { name: 'Toyota Avanza', category: 'Mobil' },
    { name: 'Honda HR-V', category: 'Mobil' },
    { name: 'Mitsubishi Xpander', category: 'Mobil' },
    { name: 'Hyundai Creta', category: 'Mobil' },
    { name: 'Toyota Fortuner', category: 'Mobil' },
    { name: 'Honda Civic', category: 'Mobil' },
    { name: 'Yamaha NMAX', category: 'Motor' },
    { name: 'Honda Vario', category: 'Motor' },
    { name: 'Kawasaki Ninja', category: 'Motor' },
    { name: 'Honda Beat', category: 'Motor' },
    { name: 'Suzuki Satria F150', category: 'Motor' },
    { name: 'Vespa Sprint', category: 'Motor' }
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
    let tags = ['Mobil', 'Motor'];

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
    console.error("roleAccessState is not initialized globally!");
    return;
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
      const nameMatch = u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || (u.username && u.username.toLowerCase().includes(query));
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
                <div class="font-semibold text-slate-800 text-[13.5px]">${u.name} <span class="text-xs font-normal text-slate-400 font-mono">(@${u.username || ''})</span></div>
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
              <button class="btn-detail-user p-2 md:p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all" data-id="${u.id}" title="Detail User">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
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

  // --- EDIT, DELETE, RESET & DETAIL USER DELEGATE ---
  if (tbodyUsers) {
    tbodyUsers.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-user');
      const deleteBtn = e.target.closest('.btn-delete-user');
      const resetBtn = e.target.closest('.btn-reset-user-password');
      const detailBtn = e.target.closest('.btn-detail-user');

      if (detailBtn) {
        const uid = parseInt(detailBtn.dataset.id);
        const user = state.users.find(u => u.id === uid);
        if (user) {
          const roleObj = state.roles.find(r => r.id === user.role) || { name: user.role, permissions: {} };
          
          document.getElementById('user-detail-name').textContent = user.name;
          document.getElementById('user-detail-username').textContent = `@${user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          document.getElementById('user-detail-email').textContent = user.email;
          document.getElementById('user-detail-created').textContent = user.createdAt || '12 Jan 2026';
          document.getElementById('user-detail-active').textContent = user.lastActive || 'Kemarin';
          
          const roleBadge = document.getElementById('user-detail-role-badge');
          roleBadge.textContent = roleObj.name;

          const statusBadge = document.getElementById('user-detail-status-badge');
          if (user.status === 'active') {
            statusBadge.textContent = 'Aktif';
            statusBadge.className = 'badge badge-done';
          } else {
            statusBadge.textContent = 'Nonaktif';
            statusBadge.className = 'badge';
          }

          const avatarEl = document.getElementById('user-detail-avatar');
          if (user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http'))) {
            avatarEl.innerHTML = `<img src="${user.avatar}" class="w-full h-full object-cover rounded-full">`;
            avatarEl.style.backgroundColor = '';
          } else {
            avatarEl.innerHTML = user.avatar || user.name.substring(0,2).toUpperCase();
            avatarEl.className = `w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md ${user.color || 'bg-slate-500'}`;
            avatarEl.style.backgroundColor = '';
          }

          // Populate permissions list badges
          const permissionsContainer = document.getElementById('user-detail-permissions');
          permissionsContainer.innerHTML = '';
          
          let hasPerms = false;
          state.menus.forEach(menu => {
            const menuPerm = roleObj.permissions[menu.key];
            if (menuPerm && menuPerm.view) {
              hasPerms = true;
              const pill = document.createElement('span');
              pill.className = 'px-2.5 py-1 bg-slate-105 text-slate-700 text-[11px] rounded-full border border-slate-200 font-medium flex items-center gap-1';
              
              let crudText = 'Lihat';
              if (menuPerm.create || menuPerm.edit || menuPerm.delete) {
                let list = [];
                if (menuPerm.create) list.push('C');
                if (menuPerm.edit) list.push('U');
                if (menuPerm.delete) list.push('D');
                crudText += ` (${list.join('/')})`;
              }
              
              pill.innerHTML = `<span>${menu.label}</span> <span class="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">${crudText}</span>`;
              permissionsContainer.appendChild(pill);
            }
          });

          if (!hasPerms) {
            permissionsContainer.innerHTML = '<span class="text-slate-400 italic text-[11.5px]">Tidak ada akses modul aktif.</span>';
          }

          window.toggleModal('user-detail-modal', true);
        }
      }

      if (editBtn) {
        const uid = parseInt(editBtn.dataset.id);
        const user = state.users.find(u => u.id === uid);
        if (user) {
          document.getElementById('user-modal-title').textContent = 'Ubah Detail Pengguna';
          document.getElementById('user-modal-action-id').value = uid;
          document.getElementById('user-modal-name').value = user.name;
          document.getElementById('user-modal-username').value = user.username || '';
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
            const tempPassword = 'AutoDrive' + Math.floor(1000 + Math.random() * 9000) + '!';
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
      const username = document.getElementById('user-modal-username').value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
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
          state.users[uIdx].username = username;
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
          username: username,
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
            <div class="text-xl font-bold text-slate-800 mt-0.5">4</div>
          </div>
          <div class="p-3 border border-slate-100 rounded-lg bg-slate-50/50 text-center">
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Unit Ready</div>
            <div class="text-xl font-bold text-slate-800 mt-0.5">42</div>
          </div>
          <div class="p-3 border border-slate-100 rounded-lg bg-slate-50/50 text-center">
            <div class="text-[10px] text-slate-400 font-semibold uppercase">Pengajuan</div>
            <div class="text-xl font-bold text-slate-800 mt-0.5">12</div>
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
            <p class="text-[10px] text-slate-400">Mockup data Layanan Showroom.</p>
          </div>
          <button class="sim-btn-add px-2.5 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-all ${
            !perm.edit ? 'opacity-40 cursor-not-allowed bg-slate-500' : ''
          }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Tambah Layanan Baru"'}>${!perm.edit ? '🔒 ' : ''}+ Tambah Layanan</button>
        </div>
        <div class="space-y-2.5 overflow-y-auto flex-1 pr-1">
          <div class="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/20">
            <div>
              <div class="text-xs font-bold text-slate-700">Tukar Tambah (Trade-In)</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Taksir instan dalam 30 menit</div>
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
              <div class="text-xs font-bold text-slate-700">Garansi Mesin & Transmisi</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Proteksi penuh 12 bulan</div>
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
    else if (simulatedActiveMenu === 'products') {
      pageWrapper.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h2 class="text-xs font-bold text-slate-800">Katalog Unit (Katalog)</h2>
            <p class="text-[10px] text-slate-400">Mockup data Unit Mobil & Motor.</p>
          </div>
          <button class="sim-btn-add px-2.5 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-all ${
            !perm.edit ? 'opacity-40 cursor-not-allowed bg-slate-500' : ''
          }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Tambah Unit Baru"'}>${!perm.edit ? '🔒 ' : ''}+ Tambah Unit</button>
        </div>
        <div class="space-y-2.5 overflow-y-auto flex-1 pr-1">
          <div class="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/20">
            <div>
              <div class="text-xs font-bold text-slate-700">Honda HR-V 1.5 E CVT 2021</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Kategori: Mobil • KM: 28.000 (Low)</div>
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
              <div class="text-xs font-bold text-slate-700">Yamaha NMAX 155 ABS 2022</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Kategori: Motor • KM: 11.000</div>
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
    else if (simulatedActiveMenu === 'portfolio') {
      pageWrapper.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h2 class="text-xs font-bold text-slate-800">Galeri Serah Terima Unit</h2>
            <p class="text-[10px] text-slate-400">Daftar serah terima dokumentasi ke pelanggan.</p>
          </div>
          <button class="sim-btn-add px-2.5 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-all ${
            !perm.edit ? 'opacity-40 cursor-not-allowed bg-slate-500' : ''
          }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Tambah Serah Terima Baru"'}>${!perm.edit ? '🔒 ' : ''}+ Serah Terima</button>
        </div>
        <div class="space-y-3 overflow-y-auto flex-1 pr-1">
          <div class="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/20">
            <div>
              <div class="text-xs font-bold text-slate-700">Serah Terima HR-V - Ibu Retno</div>
              <div class="text-[10px] text-slate-450 mt-0.5">Kategori: Handover • Klien: Jakarta Selatan</div>
            </div>
            <div class="flex gap-1">
              <button class="sim-btn-edit px-2 py-1 text-[9.5px] font-bold border rounded ${
                perm.edit ? 'text-slate-600 border-slate-200 hover:bg-slate-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Ubah Data"'}>
                <span>${perm.edit ? '' : '🔒 '}Edit</span>
              </button>
              <button class="sim-btn-delete px-2 py-1 text-[9.5px] font-bold border rounded ${
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
    else if (simulatedActiveMenu === 'blog') {
      pageWrapper.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h2 class="text-xs font-bold text-slate-800">Artikel Otomotif</h2>
            <p class="text-[10px] text-slate-400">Kelola artikel tips & review.</p>
          </div>
          <button class="sim-btn-add px-2.5 py-1.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-all ${
            !perm.edit ? 'opacity-40 cursor-not-allowed bg-slate-500' : ''
          }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Tulis Artikel Baru"'}>${!perm.edit ? '🔒 ' : ''}+ Tulis Artikel</button>
        </div>
        <div class="space-y-2.5 overflow-y-auto flex-1 pr-1">
          <div class="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/20">
            <div>
              <div class="text-xs font-bold text-slate-700">5 Hal Wajib Diperiksa Saat Membeli Mobil Bekas</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Tips Otomotif • Penulis: Budi Santoso</div>
            </div>
            <div class="flex gap-1">
              <button class="sim-btn-edit px-2 py-1 text-[9.5px] font-bold border rounded ${
                perm.edit ? 'text-slate-600 border-slate-200 hover:bg-slate-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Edit Artikel"'}>
                <span>${perm.edit ? '' : '🔒 '}Edit</span>
              </button>
              <button class="sim-btn-delete px-2 py-1 text-[9.5px] font-bold border rounded ${
                perm.delete ? 'text-red-600 border-red-100 hover:bg-red-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.delete ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Hapus (Delete) untuk modul ini"' : 'title="Hapus Artikel"'}>
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
    else if (simulatedActiveMenu === 'inbox') {
      pageWrapper.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div>
            <h2 class="text-xs font-bold text-slate-800">Hubungi Kami (Pesan Masuk)</h2>
            <p class="text-[10px] text-slate-400">Pesan dari calon konsumen.</p>
          </div>
        </div>
        <div class="space-y-2.5 overflow-y-auto flex-1 pr-1">
          <div class="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50/20">
            <div>
              <div class="text-xs font-bold text-slate-700">Andi Wijaya</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Subjek: Tanya Kredit Toyota Avanza 2020</div>
            </div>
            <div class="flex gap-1">
              <button class="sim-btn-edit px-2 py-1 text-[9.5px] font-bold border rounded ${
                perm.edit ? 'text-slate-600 border-slate-200 hover:bg-slate-50' : 'text-slate-300 border-slate-100 cursor-not-allowed'
              }" ${!perm.edit ? 'title="Fitur dikunci: Peran Anda tidak memiliki izin Edit (Write) untuk modul ini"' : 'title="Buka Pesan"'}>
                <span>${perm.edit ? '' : '🔒 '}Balas</span>
              </button>
            </div>
          </div>
        </div>
      `;
      pageWrapper.querySelectorAll('.sim-btn-edit').forEach(b => b.addEventListener('click', () => handleSimulatedAction('edit')));
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
            <input type="text" class="w-full h-8 px-2 border border-slate-200 rounded text-[11px]" value="AutoDrive Showroom" disabled>
          </div>
          <div>
            <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Kontak</label>
            <input type="email" class="w-full h-8 px-2 border border-slate-200 rounded text-[11px]" value="info@autodrive.com" disabled>
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

// --- 7 NEW VIEWS INITIALIZERS ---

function initDashboard() {
  const state = window.roleAccessState;
  
  // Update stats display
  const vEl = document.getElementById('dashboard-stat-visitors');
  const sEl = document.getElementById('dashboard-stat-services');
  const pEl = document.getElementById('dashboard-stat-portfolio');
  const aEl = document.getElementById('dashboard-stat-articles');
  
  if (vEl) vEl.textContent = '12.480';
  if (sEl) sEl.textContent = state.services.length;
  if (pEl) pEl.textContent = state.portfolio.length;
  if (aEl) aEl.textContent = state.blog.length;

  // Render recent inbox
  const inboxBody = document.getElementById('dashboard-inbox-body');
  if (inboxBody) {
    inboxBody.innerHTML = '';
    const recentMessages = state.inbox.slice(0, 3);
    recentMessages.forEach(msg => {
      const readBadge = msg.read 
        ? '<span class="px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded bg-slate-105 text-slate-500">Read</span>'
        : '<span class="px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded bg-blue-105 text-blue-700 font-bold">New</span>';
      
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/50 transition-colors';
      tr.innerHTML = `
        <td class="py-2.5 px-3">
          <div class="font-medium text-slate-800 text-xs">${msg.name}</div>
          <div class="text-[10px] text-slate-400 font-normal">${msg.email}</div>
        </td>
        <td class="py-2.5 px-3 text-xs text-slate-600 truncate max-w-[200px] font-semibold">${msg.subject}</td>
        <td class="py-2.5 px-3 text-[11px] text-slate-500 font-mono">${msg.date.split(',')[0]}</td>
        <td class="py-2.5 px-3 text-center">${readBadge}</td>
      `;
      inboxBody.appendChild(tr);
    });
  }

  // Render recent activity logs
  const activityList = document.getElementById('dashboard-activity-list');
  if (activityList) {
    activityList.innerHTML = '';
    const recentLogs = state.auditLogs.slice(0, 4);
    recentLogs.forEach(log => {
      const div = document.createElement('div');
      div.className = 'flex gap-3 text-xs border-l-2 border-slate-150 pl-3 pb-1';
      div.innerHTML = `
        <div class="flex-1">
          <div class="text-[11px] text-slate-400 font-mono">${log.time.split(' ')[1]}</div>
          <div class="text-slate-800 font-medium mt-0.5"><span class="font-semibold">${log.user}</span>: ${log.activity}</div>
        </div>
      `;
      activityList.appendChild(div);
    });
  }
}

function initHomeSettings() {
  const state = window.roleAccessState;
  
  // Populate form fields
  const titleInput = document.getElementById('hero-title-input');
  const subtitleInput = document.getElementById('hero-subtitle-input');
  const ctaTextInput = document.getElementById('hero-cta-text');
  const ctaUrlInput = document.getElementById('hero-cta-url');
  const imagePreview = document.getElementById('hero-image-preview');
  
  if (titleInput) titleInput.value = state.homeHero.title;
  if (subtitleInput) subtitleInput.value = state.homeHero.subtitle;
  if (ctaTextInput) ctaTextInput.value = state.homeHero.ctaText;
  if (ctaUrlInput) ctaUrlInput.value = state.homeHero.ctaUrl;
  
  if (imagePreview && state.homeHero.image) {
    imagePreview.innerHTML = `<img src="${state.homeHero.image}" class="w-full h-full object-cover">`;
  }

  // Save changes button
  const saveBtn = document.getElementById('btn-save-home-settings');
  if (saveBtn) {
    saveBtn.onclick = () => {
      state.homeHero.title = titleInput.value.trim();
      state.homeHero.subtitle = subtitleInput.value.trim();
      state.homeHero.ctaText = ctaTextInput.value.trim();
      state.homeHero.ctaUrl = ctaUrlInput.value.trim();
      
      window.showToast('success', 'Berhasil Disimpan', 'Konfigurasi spanduk Hero halaman depan berhasil diperbarui.');
      
      // Log audit
      state.auditLogs.unshift({
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: 'Ahmad Faisal',
        role: 'Administrator',
        activity: 'Memperbarui konfigurasi Hero Banner Beranda',
        ip: '192.168.1.42'
      });
    };
  }

  // Handle image upload
  const imageInput = document.getElementById('hero-image-input');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          window.showToast('error', 'Ukuran Berkas Terlalu Besar', 'Maksimal ukuran foto adalah 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          state.homeHero.image = event.target.result;
          if (imagePreview) {
            imagePreview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
          }
          window.showToast('success', 'Gambar Berhasil Dimuat', 'Pratinjau gambar Hero berhasil dimuat. Klik Simpan Perubahan untuk menyimpan.');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Render Highlights list
  const highlightsContainer = document.getElementById('highlights-list-container');
  function renderHighlights() {
    if (!highlightsContainer) return;
    highlightsContainer.innerHTML = '';
    
    state.homeHighlights.forEach(hl => {
      const div = document.createElement('div');
      div.className = 'p-3 border border-slate-100 rounded-lg flex items-center justify-between gap-3 bg-slate-50/30';
      div.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm shrink-0">${hl.icon}</div>
          <div>
            <div class="font-bold text-slate-800 text-[13px]">${hl.title}</div>
            <div class="text-[11.5px] text-slate-505 leading-normal">${hl.desc}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <button class="btn-edit-hl p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-105" data-id="${hl.id}" title="Edit">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
          <button class="btn-delete-hl p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50" data-id="${hl.id}" title="Hapus">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      `;
      highlightsContainer.appendChild(div);
    });

    // Bind Edit/Delete buttons
    highlightsContainer.querySelectorAll('.btn-edit-hl').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const hl = state.homeHighlights.find(h => h.id === id);
        if (hl) {
          document.getElementById('highlight-modal-title').textContent = 'Ubah Keunggulan';
          document.getElementById('highlight-modal-action-id').value = id;
          document.getElementById('highlight-modal-icon').value = hl.icon;
          document.getElementById('highlight-modal-title-input').value = hl.title;
          document.getElementById('highlight-modal-desc').value = hl.desc;
          window.toggleModal('highlight-modal', true);
        }
      };
    });

    highlightsContainer.querySelectorAll('.btn-delete-hl').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const hl = state.homeHighlights.find(h => h.id === id);
        if (hl) {
          window.confirmModal('Hapus Sorotan', `Apakah Anda yakin ingin menghapus sorotan "${hl.title}"?`, () => {
            state.homeHighlights = state.homeHighlights.filter(h => h.id !== id);
            window.showToast('success', 'Sorotan Dihapus', 'Satu sorotan berhasil dihapus.');
            renderHighlights();
          });
        }
      };
    });
  }

  // Add highlight button
  const addHlBtn = document.getElementById('btn-add-highlight');
  if (addHlBtn) {
    addHlBtn.onclick = () => {
      document.getElementById('highlight-modal-title').textContent = 'Tambah Keunggulan';
      document.getElementById('highlight-modal-action-id').value = '';
      document.getElementById('highlight-modal-form').reset();
      window.toggleModal('highlight-modal', true);
    };
  }

  // Handle highlight submission
  const hlForm = document.getElementById('highlight-modal-form');
  if (hlForm) {
    hlForm.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('highlight-modal-action-id').value;
      const icon = document.getElementById('highlight-modal-icon').value.trim();
      const title = document.getElementById('highlight-modal-title-input').value.trim();
      const desc = document.getElementById('highlight-modal-desc').value.trim();

      if (id) {
        const idx = state.homeHighlights.findIndex(h => h.id === parseInt(id));
        if (idx !== -1) {
          state.homeHighlights[idx].icon = icon;
          state.homeHighlights[idx].title = title;
          state.homeHighlights[idx].desc = desc;
          window.showToast('success', 'Berhasil Diubah', 'Sorotan berhasil diperbarui.');
        }
      } else {
        const newId = state.homeHighlights.length > 0 ? Math.max(...state.homeHighlights.map(h => h.id)) + 1 : 1;
        state.homeHighlights.push({ id: newId, icon, title, desc });
        window.showToast('success', 'Berhasil Ditambahkan', 'Keunggulan sorotan baru berhasil didaftarkan.');
      }
      window.toggleModal('highlight-modal', false);
      renderHighlights();
    };
  }

  renderHighlights();
}

function initAboutUs() {
  const state = window.roleAccessState;
  
  // Populate form
  const nameInput = document.getElementById('company-name-input');
  const visionInput = document.getElementById('company-vision-input');
  const missionInput = document.getElementById('company-mission-input');
  
  if (nameInput) nameInput.value = state.aboutProfile.companyName;
  if (visionInput) visionInput.value = state.aboutProfile.vision;
  if (missionInput) missionInput.value = state.aboutProfile.mission;

  // Save changes button
  const saveBtn = document.getElementById('btn-save-about-us');
  if (saveBtn) {
    saveBtn.onclick = () => {
      state.aboutProfile.companyName = nameInput.value.trim();
      state.aboutProfile.vision = visionInput.value.trim();
      state.aboutProfile.mission = missionInput.value.trim();
      
      window.showToast('success', 'Profil Disimpan', 'Informasi profil instansi, visi, dan misi berhasil diperbarui.');
    };
  }

  // Render Team Table
  const teamBody = document.getElementById('team-table-body');
  function renderTeam() {
    if (!teamBody) return;
    teamBody.innerHTML = '';
    
    state.aboutTeam.forEach(member => {
      const avatarHtml = member.avatar 
        ? `<img src="${member.avatar}" class="w-8 h-8 rounded-full object-cover">`
        : `<div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">${member.name.substring(0,2).toUpperCase()}</div>`;
        
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/50 transition-colors';
      tr.innerHTML = `
        <td class="py-2.5 px-3">
          <div class="flex items-center gap-2.5">
            ${avatarHtml}
            <div class="font-semibold text-slate-800 text-xs">${member.name}</div>
          </div>
        </td>
        <td class="py-2.5 px-3 text-xs text-slate-505 font-medium">${member.role}</td>
        <td class="py-2.5 px-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button class="btn-edit-team p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-105" data-id="${member.id}">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button class="btn-delete-team p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50" data-id="${member.id}">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      `;
      teamBody.appendChild(tr);
    });

    // Bind Edit/Delete
    teamBody.querySelectorAll('.btn-edit-team').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const member = state.aboutTeam.find(m => m.id === id);
        if (member) {
          document.getElementById('team-modal-title').textContent = 'Ubah Anggota Tim';
          document.getElementById('team-modal-action-id').value = id;
          document.getElementById('team-modal-name').value = member.name;
          document.getElementById('team-modal-role').value = member.role;
          
          const preview = document.getElementById('team-modal-avatar-preview');
          if (preview) {
            if (member.avatar) {
              preview.innerHTML = `<img src="${member.avatar}" class="w-full h-full object-cover">`;
            } else {
              preview.innerHTML = member.name.substring(0,2).toUpperCase();
            }
          }
          window.teamModalAvatarData = member.avatar;
          window.toggleModal('team-modal', true);
        }
      };
    });

    teamBody.querySelectorAll('.btn-delete-team').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const member = state.aboutTeam.find(m => m.id === id);
        if (member) {
          window.confirmModal('Hapus Staf', `Apakah Anda yakin ingin menghapus ${member.name} dari struktur tim?`, () => {
            state.aboutTeam = state.aboutTeam.filter(m => m.id !== id);
            window.showToast('success', 'Anggota Dihapus', `${member.name} telah dihapus dari tim.`);
            renderTeam();
          });
        }
      };
    });
  }

  // Handle Team image upload
  const teamAvatarInput = document.getElementById('team-modal-avatar-input');
  const teamAvatarPreview = document.getElementById('team-modal-avatar-preview');
  if (teamAvatarInput) {
    teamAvatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          window.showToast('error', 'Ukuran Berkas Terlalu Besar', 'Maksimal ukuran foto adalah 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          window.teamModalAvatarData = event.target.result;
          if (teamAvatarPreview) {
            teamAvatarPreview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Add team member button
  const addTeamBtn = document.getElementById('btn-add-team-member');
  if (addTeamBtn) {
    addTeamBtn.onclick = () => {
      document.getElementById('team-modal-title').textContent = 'Tambah Anggota Tim';
      document.getElementById('team-modal-action-id').value = '';
      document.getElementById('team-modal-form').reset();
      if (teamAvatarPreview) teamAvatarPreview.innerHTML = 'T';
      window.teamModalAvatarData = null;
      window.toggleModal('team-modal', true);
    };
  }

  // Handle team submission
  const teamForm = document.getElementById('team-modal-form');
  if (teamForm) {
    teamForm.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('team-modal-action-id').value;
      const name = document.getElementById('team-modal-name').value.trim();
      const role = document.getElementById('team-modal-role').value.trim();
      const avatar = window.teamModalAvatarData || null;

      if (id) {
        const idx = state.aboutTeam.findIndex(m => m.id === parseInt(id));
        if (idx !== -1) {
          state.aboutTeam[idx].name = name;
          state.aboutTeam[idx].role = role;
          state.aboutTeam[idx].avatar = avatar;
          window.showToast('success', 'Berhasil Diubah', `Informasi detail ${name} berhasil disimpan.`);
        }
      } else {
        const newId = state.aboutTeam.length > 0 ? Math.max(...state.aboutTeam.map(m => m.id)) + 1 : 1;
        state.aboutTeam.push({ id: newId, name, role, avatar });
        window.showToast('success', 'Berhasil Ditambahkan', `${name} didaftarkan ke struktur tim.`);
      }
      window.toggleModal('team-modal', false);
      renderTeam();
    };
  }

  renderTeam();
}

function initServices() {
  const state = window.roleAccessState;
  
  const tbody = document.getElementById('services-table-body');
  const emptyView = document.getElementById('services-table-empty');
  const searchInput = document.getElementById('service-search-input');
  const categoryFilter = document.getElementById('service-category-filter');
  
  function renderServices() {
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const query = searchInput.value.toLowerCase().trim();
    const cat = categoryFilter.value;
    
    const filtered = state.services.filter(s => {
      return s.name.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query);
    });

    const isFiltered = filtered.filter(s => cat === 'all' || s.category === cat);

    if (isFiltered.length === 0) {
      emptyView.classList.remove('hidden');
    } else {
      emptyView.classList.add('hidden');
      isFiltered.forEach(s => {
        const statusBadge = s.status === 'active'
          ? '<span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">Aktif</span>'
          : '<span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Draf</span>';
          
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 transition-colors';
        tr.innerHTML = `
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shrink-0">${s.icon || '🛠️'}</div>
              <div>
                <div class="font-bold text-slate-800 text-[13.5px]">${s.name}</div>
                <div class="text-xs text-slate-450 font-normal truncate max-w-[280px]">${s.desc}</div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-xs font-semibold text-slate-500">${s.category}</td>
          <td class="py-3 px-4 font-semibold text-slate-850 text-[13.5px]">${s.price}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button class="btn-edit-service p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-105" data-id="${s.id}">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
              <button class="btn-delete-service p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50" data-id="${s.id}">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Bind edit/delete
    tbody.querySelectorAll('.btn-edit-service').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const s = state.services.find(item => item.id === id);
        if (s) {
          document.getElementById('service-modal-title').textContent = 'Ubah Detail Layanan';
          document.getElementById('service-modal-action-id').value = id;
          document.getElementById('service-modal-name').value = s.name;
          document.getElementById('service-modal-category').value = s.category;
          document.getElementById('service-modal-icon').value = s.icon || '';
          document.getElementById('service-modal-desc').value = s.desc;
          document.getElementById('service-modal-price').value = s.price;
          document.getElementById('service-modal-status').value = s.status;
          window.toggleModal('service-modal', true);
        }
      };
    });

    tbody.querySelectorAll('.btn-delete-service').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const s = state.services.find(item => item.id === id);
        if (s) {
          window.confirmModal('Hapus Layanan', `Apakah Anda yakin ingin menghapus layanan "${s.name}"?`, () => {
            state.services = state.services.filter(item => item.id !== id);
            window.showToast('success', 'Layanan Dihapus', `${s.name} berhasil dihapus.`);
            renderServices();
          });
        }
      };
    });
  }

  // Bind filters
  if (searchInput) searchInput.addEventListener('input', renderServices);
  if (categoryFilter) categoryFilter.addEventListener('change', renderServices);

  // Add Service button
  const addBtn = document.getElementById('btn-add-service');
  if (addBtn) {
    addBtn.onclick = () => {
      document.getElementById('service-modal-title').textContent = 'Tambah Layanan Baru';
      document.getElementById('service-modal-action-id').value = '';
      document.getElementById('service-modal-form').reset();
      window.toggleModal('service-modal', true);
    };
  }

  // Handle Service submission
  const serviceForm = document.getElementById('service-modal-form');
  if (serviceForm) {
    serviceForm.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('service-modal-action-id').value;
      const name = document.getElementById('service-modal-name').value.trim();
      const category = document.getElementById('service-modal-category').value;
      const icon = document.getElementById('service-modal-icon').value.trim() || '🛠️';
      const desc = document.getElementById('service-modal-desc').value.trim();
      const price = document.getElementById('service-modal-price').value.trim();
      const status = document.getElementById('service-modal-status').value;

      if (id) {
        const idx = state.services.findIndex(item => item.id === parseInt(id));
        if (idx !== -1) {
          state.services[idx].name = name;
          state.services[idx].category = category;
          state.services[idx].icon = icon;
          state.services[idx].desc = desc;
          state.services[idx].price = price;
          state.services[idx].status = status;
          window.showToast('success', 'Layanan Diubah', 'Informasi layanan berhasil diperbarui.');
        }
      } else {
        const newId = state.services.length > 0 ? Math.max(...state.services.map(item => item.id)) + 1 : 1;
        state.services.push({ id: newId, icon, name, category, desc, price, status });
        window.showToast('success', 'Layanan Ditambahkan', `Layanan ${name} berhasil dibuat.`);
      }
      window.toggleModal('service-modal', false);
      renderServices();
    };
  }

  renderServices();
}

function initPortfolio() {
  const state = window.roleAccessState;
  
  const grid = document.getElementById('portfolio-grid-body');
  const emptyView = document.getElementById('portfolio-empty-view');
  const searchInput = document.getElementById('portfolio-search-input');
  
  function renderPortfolio() {
    if (!grid) return;
    grid.innerHTML = '';
    
    const query = searchInput.value.toLowerCase().trim();
    
    const filtered = state.portfolio.filter(p => {
      return p.title.toLowerCase().includes(query) || p.client.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      emptyView.classList.remove('hidden');
    } else {
      emptyView.classList.add('hidden');
      filtered.forEach(p => {
        const statusBadge = p.status === 'active'
          ? '<span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">Tampil</span>'
          : '<span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">Draf</span>';
          
        const thumbnail = p.image 
          ? `<img src="${p.image}" class="w-full h-full object-cover">`
          : `<div class="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col items-center justify-center text-white p-4 text-center">
               <span class="text-3xl mb-1.5">💼</span>
               <span class="text-[10px] font-bold font-mono tracking-wide uppercase px-2 py-0.5 rounded bg-white/10 border border-white/5">${p.category}</span>
             </div>`;

        const card = document.createElement('div');
        card.className = 'bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col';
        card.innerHTML = `
          <div class="h-44 overflow-hidden relative border-b border-slate-100 select-none shrink-0">
            ${thumbnail}
            <div class="absolute top-3 right-3 z-10">${statusBadge}</div>
          </div>
          <div class="p-4 flex-1 flex flex-col justify-between gap-4">
            <div>
              <div class="text-[11px] font-bold text-blue-600 uppercase tracking-wide font-mono">${p.client}</div>
              <h4 class="font-bold text-slate-800 text-[14px] mt-1 line-clamp-2 leading-snug" title="${p.title}">${p.title}</h4>
              <div class="text-[11.5px] text-slate-400 font-medium mt-1">${p.date}</div>
            </div>
            <div class="flex items-center justify-end gap-1.5 border-t border-slate-50 pt-3">
              <button class="btn-edit-pf px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-105 rounded transition-colors flex items-center gap-1" data-id="${p.id}">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                Edit
              </button>
              <button class="btn-delete-pf px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1" data-id="${p.id}">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Hapus
              </button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    // Bind edit/delete
    grid.querySelectorAll('.btn-edit-pf').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const p = state.portfolio.find(item => item.id === id);
        if (p) {
          document.getElementById('portfolio-modal-title').textContent = 'Ubah Portofolio';
          document.getElementById('portfolio-modal-action-id').value = id;
          document.getElementById('portfolio-modal-title-input').value = p.title;
          document.getElementById('portfolio-modal-client').value = p.client;
          document.getElementById('portfolio-modal-category').value = p.category;
          document.getElementById('portfolio-modal-date').value = p.date;
          document.getElementById('portfolio-modal-status').value = p.status;
          
          const preview = document.getElementById('portfolio-modal-img-preview');
          if (preview) {
            if (p.image) {
              preview.innerHTML = `<img src="${p.image}" class="w-full h-full object-cover">`;
            } else {
              preview.innerHTML = 'Sampul';
            }
          }
          window.portfolioModalImgData = p.image;
          window.toggleModal('portfolio-modal', true);
        }
      };
    });

    grid.querySelectorAll('.btn-delete-pf').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const p = state.portfolio.find(item => item.id === id);
        if (p) {
          window.confirmModal('Hapus Projek', `Apakah Anda yakin ingin menghapus portofolio "${p.title}"?`, () => {
            state.portfolio = state.portfolio.filter(item => item.id !== id);
            window.showToast('success', 'Portofolio Dihapus', 'Satu item portofolio berhasil dihapus.');
            renderPortfolio();
          });
        }
      };
    });
  }

  if (searchInput) searchInput.addEventListener('input', renderPortfolio);

  // Handle file input
  const imgInput = document.getElementById('portfolio-modal-img-input');
  const imgPreview = document.getElementById('portfolio-modal-img-preview');
  if (imgInput) {
    imgInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          window.showToast('error', 'Ukuran Berkas Terlalu Besar', 'Maksimal ukuran foto adalah 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          window.portfolioModalImgData = event.target.result;
          if (imgPreview) {
            imgPreview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Add Portfolio Button
  const addBtn = document.getElementById('btn-add-portfolio');
  if (addBtn) {
    addBtn.onclick = () => {
      document.getElementById('portfolio-modal-title').textContent = 'Tambah Portofolio Baru';
      document.getElementById('portfolio-modal-action-id').value = '';
      document.getElementById('portfolio-modal-form').reset();
      if (imgPreview) imgPreview.innerHTML = 'Sampul';
      window.portfolioModalImgData = null;
      window.toggleModal('portfolio-modal', true);
    };
  }

  // Handle submit form
  const pfForm = document.getElementById('portfolio-modal-form');
  if (pfForm) {
    pfForm.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('portfolio-modal-action-id').value;
      const title = document.getElementById('portfolio-modal-title-input').value.trim();
      const client = document.getElementById('portfolio-modal-client').value.trim();
      const category = document.getElementById('portfolio-modal-category').value.trim();
      const date = document.getElementById('portfolio-modal-date').value.trim();
      const image = window.portfolioModalImgData || null;
      const status = document.getElementById('portfolio-modal-status').value;

      if (id) {
        const idx = state.portfolio.findIndex(item => item.id === parseInt(id));
        if (idx !== -1) {
          state.portfolio[idx].title = title;
          state.portfolio[idx].client = client;
          state.portfolio[idx].category = category;
          state.portfolio[idx].date = date;
          state.portfolio[idx].image = image;
          state.portfolio[idx].status = status;
          window.showToast('success', 'Portofolio Diubah', 'Item portofolio berhasil diperbarui.');
        }
      } else {
        const newId = state.portfolio.length > 0 ? Math.max(...state.portfolio.map(item => item.id)) + 1 : 1;
        state.portfolio.push({ id: newId, title, client, category, date, image, status });
        window.showToast('success', 'Portofolio Ditambahkan', `Projek ${title} berhasil disimpan.`);
      }
      window.toggleModal('portfolio-modal', false);
      renderPortfolio();
    };
  }

  renderPortfolio();
}

function initBlog() {
  const state = window.roleAccessState;
  
  const tbody = document.getElementById('blog-table-body');
  const emptyView = document.getElementById('blog-table-empty');
  const searchInput = document.getElementById('blog-search-input');
  const categoryFilter = document.getElementById('blog-category-filter');
  
  function renderBlog() {
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const query = searchInput.value.toLowerCase().trim();
    const cat = categoryFilter.value;
    
    const filtered = state.blog.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(query) || (post.content && post.content.toLowerCase().includes(query));
      const catMatch = cat === 'all' || post.category === cat;
      return titleMatch && catMatch;
    });

    if (filtered.length === 0) {
      emptyView.classList.remove('hidden');
    } else {
      emptyView.classList.add('hidden');
      filtered.forEach(post => {
        const statusBadge = post.status === 'active'
          ? '<span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">Dipublikasikan</span>'
          : '<span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-105 text-slate-600 border border-slate-200">Draf</span>';
          
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 transition-colors';
        tr.innerHTML = `
          <td class="py-3 px-4">
            <div>
              <div class="font-bold text-slate-800 text-[13.5px] leading-snug line-clamp-1">${post.title}</div>
              <div class="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold inline-block border border-blue-100/50 mt-1">${post.category}</div>
            </div>
          </td>
          <td class="py-3 px-4 text-xs font-semibold text-slate-600">${post.author}</td>
          <td class="py-3 px-4 text-xs text-slate-500 font-medium">${post.date}</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button class="btn-edit-blog p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-105" data-id="${post.id}">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
              <button class="btn-delete-blog p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50" data-id="${post.id}">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Bind edit/delete
    tbody.querySelectorAll('.btn-edit-blog').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const post = state.blog.find(item => item.id === id);
        if (post) {
          document.getElementById('blog-modal-title').textContent = 'Edit Artikel';
          document.getElementById('blog-modal-action-id').value = id;
          document.getElementById('blog-modal-title-input').value = post.title;
          document.getElementById('blog-modal-category').value = post.category;
          document.getElementById('blog-modal-author').value = post.author;
          document.getElementById('blog-modal-status').value = post.status;
          document.getElementById('blog-modal-content').value = post.content || '';
          
          const preview = document.getElementById('blog-modal-cover-preview');
          if (preview) {
            if (post.image) {
              preview.innerHTML = `<img src="${post.image}" class="w-full h-full object-cover">`;
            } else {
              preview.innerHTML = 'Sampul';
            }
          }
          window.blogModalCoverData = post.image;
          window.toggleModal('blog-modal', true);
        }
      };
    });

    tbody.querySelectorAll('.btn-delete-blog').forEach(b => {
      b.onclick = () => {
        const id = parseInt(b.dataset.id);
        const post = state.blog.find(item => item.id === id);
        if (post) {
          window.confirmModal('Hapus Artikel', `Apakah Anda yakin ingin menghapus artikel "${post.title}"?`, () => {
            state.blog = state.blog.filter(item => item.id !== id);
            window.showToast('success', 'Artikel Dihapus', 'Artikel berhasil dihapus dari draf.');
            renderBlog();
          });
        }
      };
    });
  }

  if (searchInput) searchInput.addEventListener('input', renderBlog);
  if (categoryFilter) categoryFilter.addEventListener('change', renderBlog);

  // Handle cover upload
  const coverInput = document.getElementById('blog-modal-cover-input');
  const coverPreview = document.getElementById('blog-modal-cover-preview');
  if (coverInput) {
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          window.showToast('error', 'Ukuran Berkas Terlalu Besar', 'Maksimal ukuran foto adalah 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          window.blogModalCoverData = event.target.result;
          if (coverPreview) {
            coverPreview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Add Blog Button
  const addBtn = document.getElementById('btn-add-blog');
  if (addBtn) {
    addBtn.onclick = () => {
      document.getElementById('blog-modal-title').textContent = 'Tulis Artikel Baru';
      document.getElementById('blog-modal-action-id').value = '';
      document.getElementById('blog-modal-form').reset();
      if (coverPreview) coverPreview.innerHTML = 'Sampul';
      window.blogModalCoverData = null;
      window.toggleModal('blog-modal', true);
    };
  }

  // Handle submit form
  const blogForm = document.getElementById('blog-modal-form');
  if (blogForm) {
    blogForm.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('blog-modal-action-id').value;
      const title = document.getElementById('blog-modal-title-input').value.trim();
      const category = document.getElementById('blog-modal-category').value;
      const author = document.getElementById('blog-modal-author').value.trim();
      const status = document.getElementById('blog-modal-status').value;
      const content = document.getElementById('blog-modal-content').value.trim();
      const image = window.blogModalCoverData || null;

      if (id) {
        const idx = state.blog.findIndex(item => item.id === parseInt(id));
        if (idx !== -1) {
          state.blog[idx].title = title;
          state.blog[idx].category = category;
          state.blog[idx].author = author;
          state.blog[idx].status = status;
          state.blog[idx].content = content;
          state.blog[idx].image = image;
          window.showToast('success', 'Artikel Diperbarui', 'Artikel berhasil disimpan.');
        }
      } else {
        const newId = state.blog.length > 0 ? Math.max(...state.blog.map(item => item.id)) + 1 : 1;
        state.blog.push({
          id: newId,
          title,
          category,
          author,
          date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          status,
          content,
          image
        });
        window.showToast('success', 'Artikel Ditambahkan', `Artikel "${title}" berhasil diterbitkan.`);
      }
      window.toggleModal('blog-modal', false);
      renderBlog();
    };
  }

  renderBlog();
}

function initInbox() {
  const state = window.roleAccessState;
  
  const listContainer = document.getElementById('inbox-list-body');
  const emptyList = document.getElementById('inbox-list-empty');
  const searchInput = document.getElementById('inbox-search-input');
  const detailPane = document.getElementById('inbox-detail-view');
  
  let activeMsgId = null;

  function renderInboxList() {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const query = searchInput.value.toLowerCase().trim();
    
    const filtered = state.inbox.filter(msg => {
      return msg.name.toLowerCase().includes(query) || msg.subject.toLowerCase().includes(query) || msg.message.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      emptyList.classList.remove('hidden');
    } else {
      emptyList.classList.add('hidden');
      filtered.forEach(msg => {
        const isActive = msg.id === activeMsgId;
        const unreadDot = msg.read 
          ? '' 
          : '<span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shrink-0"></span>';
          
        const item = document.createElement('div');
        item.className = `p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-3 ${
          isActive 
            ? 'bg-blue-50/40 border-blue-200' 
            : msg.read 
              ? 'bg-white border-slate-100 hover:bg-slate-50/50'
              : 'bg-slate-50 border-slate-150 shadow-sm font-semibold'
        }`;
        
        item.innerHTML = `
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-slate-800 font-bold truncate max-w-[150px]">${msg.name}</span>
              <span class="text-[10px] text-slate-450 font-mono">${msg.date.split(',')[0]}</span>
            </div>
            <div class="text-[12px] text-slate-700 font-semibold truncate mt-0.5">${msg.subject}</div>
            <div class="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">${msg.message}</div>
          </div>
          <div class="pt-1.5 shrink-0">${unreadDot}</div>
        `;
        
        item.onclick = () => {
          activeMsgId = msg.id;
          msg.read = true; // mark read
          renderInboxList();
          renderMessageDetail(msg);
        };
        
        listContainer.appendChild(item);
      });
    }
  }

  function renderMessageDetail(msg) {
    if (!detailPane) return;
    
    detailPane.innerHTML = `
      <div class="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
        <div>
          <h3 class="text-base font-bold text-slate-800 leading-snug">${msg.subject}</h3>
          <div class="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-505">
            <span>Dari: <strong class="text-slate-700">${msg.name}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-mono">${msg.email}</span>
          </div>
        </div>
        <div class="text-[11px] text-slate-450 font-mono">${msg.date}</div>
      </div>
      
      <div class="flex-1 overflow-y-auto py-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        ${msg.message}
      </div>

      <!-- Simulated Reply Form -->
      <div class="border-t border-slate-100 pt-4 shrink-0 space-y-3">
        <h5 class="text-xs font-bold text-slate-800 uppercase tracking-wider text-[10px]">Kirim Balasan</h5>
        <form id="inbox-reply-form" class="space-y-3">
          <textarea id="inbox-reply-text" required rows="3" placeholder="Tuliskan respon balasan email Anda di sini..." class="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-blue-600 text-sm font-medium transition-colors bg-white resize-none"></textarea>
          <div class="flex justify-end gap-2">
            <button type="submit" class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-600/10 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Kirim Balasan
            </button>
          </div>
        </form>
      </div>
    `;

    // Handle reply form submit
    const replyForm = detailPane.querySelector('#inbox-reply-form');
    if (replyForm) {
      replyForm.onsubmit = (e) => {
        e.preventDefault();
        const text = replyForm.querySelector('#inbox-reply-text').value.trim();
        if (text) {
          window.showToast('success', 'Balasan Terkirim', `Respon Anda telah sukses dikirimkan ke alamat email ${msg.email}`);
          replyForm.reset();
          
          // Log security audit trail
          state.auditLogs.unshift({
            time: new Date().toISOString().replace('T', ' ').substring(0, 19),
            user: 'Ahmad Faisal',
            role: 'Administrator',
            activity: `Membalas pesan dari ${msg.name} (Subjek: ${msg.subject})`,
            ip: '192.168.1.42'
          });
        }
      };
    }
  }

  if (searchInput) searchInput.addEventListener('input', renderInboxList);
  
  renderInboxList();
}

function initProducts() {
  const state = window.roleAccessState;
  
  const tbodyEl = document.getElementById('products-table-body');
  const emptyEl = document.getElementById('products-table-empty');
  const searchInput = document.getElementById('product-search-input');
  const categoryFilter = document.getElementById('product-category-filter');
  
  const addBtn = document.getElementById('btn-add-product');
  const modalForm = document.getElementById('product-modal-form');
  const imageInput = document.getElementById('product-modal-image-input');
  const imagePreview = document.getElementById('product-modal-image-preview');

  function renderProducts() {
    if (!tbodyEl) return;
    tbodyEl.innerHTML = '';
    
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filterCat = categoryFilter ? categoryFilter.value : 'all';
    
    const filtered = state.products.filter(item => {
      const matchName = item.name.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query);
      const matchCat = filterCat === 'all' || item.category === filterCat;
      return matchName && matchCat;
    });

    if (filtered.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
    } else {
      if (emptyEl) emptyEl.classList.add('hidden');
      
      filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 transition-colors';
        
        const statusBadge = item.status === 'active'
          ? '<span class="px-2 py-1 inline-flex text-[11px] leading-5 font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">Aktif</span>'
          : '<span class="px-2 py-1 inline-flex text-[11px] leading-5 font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Draf</span>';
          
        const productImg = item.image 
          ? `<img src="${item.image}" class="w-10 h-10 rounded-lg object-cover shadow-sm shrink-0 border border-slate-100">`
          : `<div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0">📦</div>`;
          
        tr.innerHTML = `
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              ${productImg}
              <div>
                <div class="font-bold text-slate-800 text-[13.5px]">${item.name}</div>
                <div class="text-xs text-slate-450 font-normal line-clamp-1 mt-0.5">${item.desc}</div>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-600 font-medium">${item.category}</td>
          <td class="py-3 px-4 font-bold text-slate-800">${item.price}</td>
          <td class="py-3 px-4 text-center font-semibold text-slate-600">${item.stock} pcs</td>
          <td class="py-3 px-4 text-center">${statusBadge}</td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button class="btn-edit-product p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors" data-id="${item.id}" title="Edit Produk">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
              <button class="btn-delete-product p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" data-id="${item.id}" title="Hapus Produk">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </td>
        `;
        
        tbodyEl.appendChild(tr);
      });
    }
  }

  // Handle search and filter
  if (searchInput) searchInput.addEventListener('input', renderProducts);
  if (categoryFilter) categoryFilter.addEventListener('change', renderProducts);

  // File Upload handler
  if (imageInput) {
    imageInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          window.showToast('error', 'Ukuran Berkas Terlalu Besar', 'Maksimal ukuran foto adalah 2MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          window.productModalCoverData = event.target.result;
          if (imagePreview) {
            imagePreview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Add Product Button
  if (addBtn) {
    addBtn.onclick = () => {
      document.getElementById('product-modal-title').textContent = 'Tambah Produk Baru';
      document.getElementById('product-modal-action-id').value = '';
      if (modalForm) modalForm.reset();
      if (imagePreview) imagePreview.innerHTML = 'Sampul';
      window.productModalCoverData = null;
      window.toggleModal('product-modal', true);
    };
  }

  // Edit / Delete delegator
  if (tbodyEl) {
    tbodyEl.onclick = (e) => {
      const editBtn = e.target.closest('.btn-edit-product');
      const deleteBtn = e.target.closest('.btn-delete-product');

      if (editBtn) {
        const id = parseInt(editBtn.dataset.id);
        const item = state.products.find(p => p.id === id);
        if (item) {
          document.getElementById('product-modal-title').textContent = 'Edit Produk';
          document.getElementById('product-modal-action-id').value = item.id;
          document.getElementById('product-modal-name').value = item.name;
          document.getElementById('product-modal-category').value = item.category;
          document.getElementById('product-modal-price').value = item.price;
          document.getElementById('product-modal-stock').value = item.stock;
          document.getElementById('product-modal-desc').value = item.desc;
          document.getElementById('product-modal-status').value = item.status;
          
          if (imagePreview) {
            if (item.image) {
              imagePreview.innerHTML = `<img src="${item.image}" class="w-full h-full object-cover">`;
            } else {
              imagePreview.innerHTML = 'Sampul';
            }
          }
          window.productModalCoverData = item.image;
          window.toggleModal('product-modal', true);
        }
      }

      if (deleteBtn) {
        const id = parseInt(deleteBtn.dataset.id);
        const item = state.products.find(p => p.id === id);
        if (item) {
          window.confirmModal('Hapus Produk', `Apakah Anda yakin ingin menghapus produk <strong>${item.name}</strong> dari katalog?`, () => {
            state.products = state.products.filter(p => p.id !== id);
            window.showToast('success', 'Produk Dihapus', `${item.name} berhasil dihapus dari katalog.`);
            
            // Log security audit trail
            state.auditLogs.unshift({
              time: new Date().toISOString().replace('T', ' ').substring(0, 19),
              user: 'Ahmad Faisal',
              role: 'Administrator',
              activity: `Menghapus produk dari katalog: ${item.name}`,
              ip: '192.168.1.42'
            });
            
            renderProducts();
          });
        }
      }
    };
  }

  // Handle Form Submit
  if (modalForm) {
    modalForm.onsubmit = (e) => {
      e.preventDefault();
      
      const id = document.getElementById('product-modal-action-id').value;
      const name = document.getElementById('product-modal-name').value.trim();
      const category = document.getElementById('product-modal-category').value;
      const price = document.getElementById('product-modal-price').value.trim();
      const stock = parseInt(document.getElementById('product-modal-stock').value);
      const desc = document.getElementById('product-modal-desc').value.trim();
      const status = document.getElementById('product-modal-status').value;
      const image = window.productModalCoverData || null;

      if (id) {
        // Edit flow
        const idx = state.products.findIndex(p => p.id === parseInt(id));
        if (idx !== -1) {
          state.products[idx].name = name;
          state.products[idx].category = category;
          state.products[idx].price = price;
          state.products[idx].stock = stock;
          state.products[idx].desc = desc;
          state.products[idx].status = status;
          state.products[idx].image = image;
          
          window.showToast('success', 'Produk Diperbarui', `Informasi produk "${name}" berhasil diperbarui.`);
          
          // Log security audit trail
          state.auditLogs.unshift({
            time: new Date().toISOString().replace('T', ' ').substring(0, 19),
            user: 'Ahmad Faisal',
            role: 'Administrator',
            activity: `Mengubah informasi detail produk: ${name}`,
            ip: '192.168.1.42'
          });
        }
      } else {
        // Add flow
        const newId = state.products.length > 0 ? Math.max(...state.products.map(p => p.id)) + 1 : 1;
        state.products.push({
          id: newId,
          name,
          category,
          price,
          stock,
          desc,
          status,
          image
        });
        
        window.showToast('success', 'Produk Ditambahkan', `Produk baru "${name}" berhasil ditambahkan ke katalog.`);
        
        // Log security audit trail
        state.auditLogs.unshift({
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          user: 'Ahmad Faisal',
          role: 'Administrator',
          activity: `Menambahkan produk baru ke katalog: ${name}`,
          ip: '192.168.1.42'
        });
      }

      window.toggleModal('product-modal', false);
      renderProducts();
    };
  }

  renderProducts();
}

function initSettingsLanding() {
  const state = window.roleAccessState;
  
  // Populate hero title
  const heroTitleEl = document.getElementById('stats-hero-title');
  if (heroTitleEl) {
    heroTitleEl.textContent = state.homeHero.title || 'Belum diatur';
  }

  // Populate active catalog count
  const productsCountEl = document.getElementById('stats-products-count');
  if (productsCountEl) {
    const activeProducts = state.products.filter(p => p.status === 'active').length;
    productsCountEl.textContent = activeProducts;
  }

  // Populate active services count
  const servicesCountEl = document.getElementById('stats-services-count');
  if (servicesCountEl) {
    const activeServices = state.services.filter(s => s.status === 'active').length;
    servicesCountEl.textContent = activeServices;
  }

  // Populate active portfolio count
  const portfolioCountEl = document.getElementById('stats-portfolio-count');
  if (portfolioCountEl) {
    const activePortfolio = state.portfolio.filter(p => p.status === 'active').length;
    portfolioCountEl.textContent = activePortfolio;
  }

  // Populate active blog articles count
  const blogCountEl = document.getElementById('stats-blog-count');
  if (blogCountEl) {
    const activeBlog = state.blog.filter(b => b.status === 'active').length;
    blogCountEl.textContent = activeBlog;
  }

  // Populate inbox count and show alert if there are unread messages
  const unreadCount = state.inbox.filter(msg => !msg.read).length;
  const inboxAlertEl = document.getElementById('stats-inbox-alert');
  const inboxUnreadEl = document.getElementById('stats-inbox-unread');
  if (inboxAlertEl && inboxUnreadEl) {
    if (unreadCount > 0) {
      inboxUnreadEl.textContent = unreadCount;
      inboxAlertEl.classList.remove('hidden');
    } else {
      inboxAlertEl.classList.add('hidden');
    }
  }
}


