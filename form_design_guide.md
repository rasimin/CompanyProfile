# Panduan Standar Desain Form Frontend (Company Profile Admin)

Dokumen ini berfungsi sebagai acuan resmi (design guidelines) dalam membuat atau memperbarui formulir (form) pada frontend Company Profile Admin. Semua komponen mengacu pada sistem desain yang diimplementasikan di [ui-components.html](file:///d:/Rasimin/Learn/companyProfile/src/views/ui-components.html) dan [style.css](file:///d:/Rasimin/Learn/companyProfile/style.css).

---

## 1. Tata Letak Dasar (Form Layout)

Gunakan utility class **`.form-group-premium`** untuk pembungkus input tunggal dan **`.form-row-premium`** untuk tata letak multi-kolom yang sejajar secara responsif.

### A. Input Tunggal (Single Input)
Bungkus label dan input menggunakan `.form-group-premium`. Label otomatis diformat menjadi huruf kapital kecil dengan jarak yang rapi.

```html
<div class="form-group-premium">
  <label>Nama Pengguna</label>
  <input type="text" class="form-input-premium" placeholder="Masukkan nama lengkap...">
</div>
```

### B. Baris Grid Sejajar (Multi-column Row)
Untuk membagi input menjadi beberapa kolom sejajar (otomatis menumpuk di perangkat mobile), bungkus dengan `.form-row-premium`.

```html
<div class="form-row-premium">
  <div class="form-group-premium">
    <label>Email Utama</label>
    <input type="email" class="form-input-premium" placeholder="name@mail.com">
  </div>
  <div class="form-group-premium">
    <label>Nomor Telepon</label>
    <input type="tel" class="form-input-premium" placeholder="0812...">
  </div>
</div>
```

---

## 2. Varian Input Controls

Semua elemen input menggunakan kelas berakhiran `-premium` untuk menjamin keselarasan visual (border, radius, focus state).

### A. Textbox Biasa & Textbox Ber-Ikon
Untuk textbox dengan ikon di sebelah kiri, bungkus dengan `.input-group-premium` dan letakkan elemen `<svg>` dengan kelas `.input-icon`.

```html
<!-- Textbox Standar -->
<input type="text" class="form-input-premium" placeholder="Teks standar...">

<!-- Textbox dengan Ikon -->
<div class="input-group-premium">
  <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
  <input type="text" class="form-input-premium" placeholder="Cari data...">
</div>
```

### B. Dropdown Select & Textarea
Gunakan `.form-select-premium` untuk dropdown dan `.form-textarea-premium` untuk input teks panjang.

```html
<!-- Dropdown Select -->
<select class="form-select-premium">
  <option value="1">Pilihan Pertama</option>
  <option value="2">Pilihan Kedua</option>
</select>

<!-- Textarea -->
<textarea class="form-textarea-premium" placeholder="Tulis deskripsi detail..."></textarea>
```

### C. Checkbox, Radio Button, & Toggle Switch
Gunakan indikator visual terstandarisasi untuk elemen checkbox dan radio.

```html
<!-- Checkbox -->
<label class="checkbox-premium">
  <input type="checkbox">
  <span class="checkbox-indicator">
    <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
  </span>
  Opsi Pilihan
</label>

<!-- Radio Button -->
<label class="radio-premium">
  <input type="radio" name="grup-opsi" value="1">
  <span class="radio-indicator"></span>
  Opsi 1
</label>

<!-- Toggle Switch -->
<div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
  <span style="font-size:13.5px; font-weight:500;">Aktifkan Fitur</span>
  <label class="switch-premium">
    <input type="checkbox">
    <span class="slider-premium"></span>
  </label>
</div>
```

---

## 3. Notifikasi & Interaktivitas Form

Gunakan JavaScript helper global yang terpusat di `main.js` untuk interaksi pop-up konfirmasi dan alert.

### A. Modal Popup (Form Input / Detail)
Untuk menampilkan form di dalam popup modal, gunakan markup modal standar dan pemicu JavaScript `toggleModal('id-modal', true/false)`.

```html
<!-- Contoh Tombol Pemicu -->
<button class="btn-premium btn-md btn-primary" onclick="toggleModal('id-form-modal', true)">
  Buka Form Modal
</button>

<!-- Markup Modal -->
<div id="id-form-modal" class="modal-overlay-premium" onclick="if(event.target === this) toggleModal('id-form-modal', false)">
  <div class="modal-dialog-premium" onclick="event.stopPropagation()">
    <div class="modal-header">
      <h4>Judul Form</h4>
      <button class="modal-close-btn" onclick="toggleModal('id-form-modal', false)">&times;</button>
    </div>
    <div class="modal-body-content">
      <!-- Letakkan .form-group-premium di sini -->
    </div>
    <div class="modal-footer">
      <button class="btn-premium btn-sm btn-secondary" onclick="toggleModal('id-form-modal', false)">Batal</button>
      <button class="btn-premium btn-sm btn-primary" onclick="saveData()">Simpan</button>
    </div>
  </div>
</div>
```

### B. Konfirmasi Hapus Data (Elegant Confirm Dialog)
Gunakan `window.confirmModal` untuk konfirmasi tindakan sensitif (seperti menghapus data).

```javascript
window.confirmModal(
  'Hapus Data', // Judul Modal
  'Apakah Anda yakin ingin menghapus data anggota ini secara permanen?', // Pesan Deskripsi
  () => {
    // Jalankan kode aksi hapus data di sini
    showToast('success', 'Dihapus', 'Data berhasil dihapus.');
  }
);
```

### C. Alert Notifikasi (Elegant Alert Popup)
Gunakan `window.alertModal` untuk pengganti dialog `alert()` bawaan browser.

```javascript
// Contoh Alert Sukses
window.alertModal('Berhasil', 'Konfigurasi telah sukses disimpan!', 'success');

// Contoh Alert Informasi / Warning
window.alertModal('Info Sistem', 'Layanan pemeliharaan terjadwal malam ini.', 'info');
```

---

## 4. Checklist Kepatuhan Desain (Compliance Checklist)
- [ ] Semua input dibungkus dalam `.form-group-premium`.
- [ ] Semua tombol aksi menggunakan kelas `.btn-premium` dengan varian warna (`btn-primary` or `btn-secondary`).
- [ ] Label input menggunakan tag `<label>` sederhana di dalam `.form-group-premium` (tanpa style manual tambahan).
- [ ] Setiap textbox memiliki atribut `placeholder` yang deskriptif.
- [ ] Validasi error ditampilkan dengan menambahkan kelas `.error` pada input dan menyertakan teks peringatan berwarna merah di bawahnya.
