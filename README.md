# Finance Manager App 💰

Aplikasi web manajemen keuangan yang lengkap dengan fitur OCR, integrasi WhatsApp bot, dan analisis AI menggunakan Gemini.

---

## 📋 Panduan Awal (Wajib Baca)

Aplikasi ini dibagi menjadi dua bagian utama:
1.  **Backend (Server)**: Mengelola database, bot WA, dan logika AI.
2.  **Frontend (Interface)**: Tampilan website yang kamu lihat di browser.

---

## 🛠️ Persiapan Lingkungan (Prerequisites)

Sebelum menjalankan aplikasi, pastikan laptop kamu sudah siap:

### 1. Install Node.js
*   Download di [nodejs.org](https://nodejs.org/) (pilih yang versi **LTS**).
*   Setelah install, buka Terminal (Command Prompt/PowerShell) dan cek dengan mengetik: `node -v`. Pastikan muncul versinya.

### 2. Install dan Setup MongoDB (Database)
Aplikasi ini butuh database untuk menyimpan data transaksi kamu.
*   **Download**: [MongoDB Community Server](https://www.mongodb.com/try/download/community).
*   **Install**: Jalankan installer-nya. Ikuti langkahnya (tekan Next terus), pastikan centang **"Install MongoDB as a Service"**.
*   **Verify**: 
    1. Cari aplikasi namanya **MongoDB Compass** di laptop kamu (biasanya terinstall otomatis bareng database).
    2. Buka MongoDB Compass.
    3. Klik button **"Connect"** (menggunakan URI default: `mongodb://localhost:27017`).
    4. Kalau berhasil masuk dan tidak ada error, artinya database sudah jalan di laptopmu.

---

## 📥 Langkah Instalasi Detail

PENTING: Jangan menjalankan `npm install` di folder utama. Kamu harus masuk ke masing-masing folder (backend & frontend).

### Langkah 1: Setup Backend
1.  Buka terminal baru.
2.  Masuk ke folder backend: `cd backend`
3.  **Hapus folder `node_modules` jika ada** (ini folder sampah/cache dari laptop orang lain yang jangan di-copy).
4.  Jalankan perintah instalasi:
    ```bash
    npm install
    ```
    *Tunggu sampai selesai. Perintah ini akan mendownload semua "bahan baku" aplikasi berdasarkan file `package.json` kamu.*

### Langkah 2: Setup Konfigurasi (.env)
Masih di dalam folder `backend`, buat file baru bernama `.env`. Ketik isinya seperti ini:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/finance_manager
JWT_SECRET=bebas_pilih_kata_rahasia_apa_saja
GEMINI_API_KEY=KODE_API_KEY_KAMU_DI_SINI
```
*Note: Ambil API Key gratis di [Google AI Studio](https://aistudio.google.com/).*

### Langkah 3: Setup Frontend
1.  Buka terminal **BARU** lagi (jangan tutup terminal backend).
2.  Masuk ke folder frontend: `cd frontend`
3.  **Hapus folder `node_modules` jika ada**.
4.  Jalankan perintah instalasi:
    ```bash
    npm install
    ```

---

## 🚀 Cara Menjalankan

Kamu harus menyalakan dua "mesin" sekaligus di dua terminal berbeda:

### 1. Terminal Backend (Wajib Pertama)
Pastikan kamu ada di folder `backend`, lalu ketik:
```bash
npm run dev
```
*   Jika muncul QR Code di terminal, silakan scan pakai WhatsApp kamu agar bot WA aktif.
*   Pastikan ada tulisan `Server running on port 5000` dan `Database Connected`.

### 2. Terminal Frontend
Pastikan kamu ada di folder `frontend`, lalu ketik:
```bash
npm run dev
```
*   Akan muncul link seperti `http://localhost:5173`.
*   Ctrl + Klik link tersebut atau copy ke browser kamu (Chrome/Edge).

---

## ❓ FAQ / Masalah Umum

*   **"npm install error"**: Pastikan koneksi internet stabil. Jika gagal di tengah jalan, hapus folder `node_modules`, lalu ketik `npm install` lagi.
*   **"Database Error"**: Buka MongoDB Compass, pastikan bisa connect. Jika tidak bisa, coba restart laptop atau cek di 'Services' Windows apakah MongoDB sudah 'Running'.
*   **"Node is not recognized"**: Kamu belum install Node.js atau belum restart terminal setelah install.
