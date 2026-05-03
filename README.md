# 🥗 Gizku

> Aplikasi pelacak nutrisi makanan berbasis AI — analisa foto makananmu dan catat asupan harian dengan mudah.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/license-Private-red)](#)

> ⚠️ **Catatan Rebrand:** Aplikasi ini sebelumnya bernama **NutriLog**. Per Mei 2026, nama resmi telah berganti menjadi **Gizku**. Seluruh referensi `NutriLog` dalam kode dan dokumentasi ini merujuk pada versi lama.

---

## ✨ Fitur Utama

- 📷 **Analisa foto makanan** — upload foto atau ambil dari kamera, AI (Claude) akan mendeteksi nama makanan beserta kandungan kalori, protein, karbohidrat, dan lemak
- 📊 **Riwayat & statistik** — lihat rekap harian/mingguan beserta ringkasan nutrisi per hari
- 🔐 **Autentikasi** — sistem login/register dengan JWT, tanpa dependency pihak ketiga
- 🛠️ **Admin dashboard** — kelola user, limit harian, maintenance mode, laporan masukan
- 🔧 **Maintenance mode** — admin bisa mengaktifkan mode pemeliharaan; user aktif otomatis di-logout dan melihat pesan pemeliharaan di halaman login
- 📈 **Vercel Analytics** — tracking page views dan web vitals secara otomatis

---

## 🗂️ Struktur Direktori

```
nutrilog-next/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout — inject font, Toaster, Vercel Analytics
│   ├── page.tsx                  # Redirect root → /login
│   ├── globals.css               # CSS variables (dark/light theme tokens)
│   │
│   ├── login/
│   │   └── page.tsx              # Halaman login & register; tampilkan banner maintenance + BrandAnnouncement
│   │
│   ├── main/
│   │   ├── layout.tsx            # Layout aplikasi utama (header, nav tab, auto-logout maintenance)
│   │   ├── catat/
│   │   │   └── page.tsx          # Halaman catat makan — upload foto & hasil analisa AI + BrandAnnouncement
│   │   └── riwayat/
│   │       └── page.tsx          # Halaman riwayat — daftar meal & ringkasan nutrisi harian
│   │
│   ├── admin/
│   │   └── page.tsx              # Dashboard admin — manajemen user, config, laporan
│   │
│   ├── maintenance/
│   │   └── page.tsx              # Halaman maintenance (fallback statis)
│   │
│   └── api/                      # API Routes (Next.js Route Handlers)
│       ├── auth/
│       │   └── route.ts          # POST login, register, verify token
│       ├── analyze/
│       │   └── route.ts          # POST analisa gambar makanan via Anthropic Claude
│       ├── history/
│       │   └── route.ts          # GET/POST/DELETE riwayat meal; GET today summary
│       ├── report/
│       │   └── route.ts          # POST kirim laporan/masukan; GET laporan milik user
│       ├── user/
│       │   └── route.ts          # GET/PATCH data profil user
│       ├── maintenance/
│       │   └── route.ts          # GET status maintenance mode
│       └── admin/
│           ├── route.ts          # CRUD admin — user, config, maintenance, laporan
│           └── migrate/
│               └── route.ts      # POST migrasi data dari Supabase KV → PostgreSQL
│
├── components/                   # Shared React components
│   └── BrandAnnouncement.tsx     # Widget notifikasi rebrand NutriLog → Gizku (dismissible)
│
├── drizzle/
│   └── schema.ts                 # Drizzle ORM schema — definisi tabel PostgreSQL
│
├── lib/
│   ├── auth.ts                   # JWT sign/verify, hashPassword, extractToken
│   ├── db.ts                     # Drizzle client (koneksi ke Supabase PostgreSQL)
│   └── utils.ts                  # Helper: setCors, ok, err, todayISO, dll
│
├── sql/                          # Raw SQL migration scripts (referensi)
├── public/                       # Static assets (favicon, manifest.json, icons)
│
├── middleware.ts                 # Next.js middleware — cek maintenance mode di edge
├── drizzle.config.ts             # Konfigurasi Drizzle Kit
├── next.config.ts                # Konfigurasi Next.js
├── tailwind.config.ts            # Konfigurasi Tailwind CSS
├── .env.example                  # Template environment variables
└── package.json                  # Dependencies & scripts
```

---

## ⚙️ Environment Variables

Salin `.env.example` ke `.env.local` lalu isi nilai yang sesuai:

```bash
cp .env.example .env.local
```

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL Supabase |
| `SUPABASE_URL` | URL project Supabase (`https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase (untuk migrasi data) |
| `JWT_SECRET` | Secret key untuk signing JWT (min. 32 karakter) |
| `ANTHROPIC_API_KEY` | API key Anthropic Claude (analisa gambar) |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash password admin |

---

## 🔌 API Reference

### Konvensi Umum

Semua response menggunakan format JSON. Field `ok` menandakan keberhasilan request.

**Response sukses:**
```json
{ "ok": true, "data": { ... } }
```

**Response error:**
```json
{ "ok": false, "error": "Pesan error" }
```

**Authentication header** (wajib untuk semua endpoint kecuali `/api/auth?action=login|register` dan `/api/maintenance`):
```
Authorization: Bearer <jwt_token>
```

---

### HTTP Status Code

| Code | Arti | Kapan Muncul |
|------|------|--------------|
| `200` | OK | Request berhasil |
| `204` | No Content | CORS preflight (OPTIONS) |
| `400` | Bad Request | Body/parameter tidak valid atau tidak lengkap |
| `401` | Unauthorized | Token tidak ada, tidak valid, atau kadaluarsa |
| `403` | Forbidden | Akun tidak aktif (dinonaktifkan admin) |
| `404` | Not Found | Resource tidak ditemukan (meal ID salah, dll) |
| `409` | Conflict | Data sudah ada (username duplikat) |
| `422` | Unprocessable Entity | Gambar tidak mengandung makanan |
| `429` | Too Many Requests | Batas analisa harian user tercapai, atau rate limit Anthropic |
| `500` | Internal Server Error | Error tak terduga di server |
| `503` | Service Unavailable | AI sedang overload, API key tidak valid, maintenance aktif |

---

### `/api/auth`

#### `POST ?action=register`

Daftarkan akun user baru.

**Body:**
```json
{ "username": "string (min 3)", "password": "string (min 6)" }
```

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Registrasi berhasil — mengembalikan `token` dan `user` |
| `400` | Username atau password tidak dikirim / terlalu pendek |
| `409` | Username sudah digunakan |
| `503` | Maintenance mode aktif |

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": "uuid", "username": "atmaklasik" }
  }
}
```

---

#### `POST ?action=login`

Login dan dapatkan JWT token.

**Body:**
```json
{ "username": "string", "password": "string" }
```

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Login berhasil — mengembalikan `token`, `user`, `dailyLimit` |
| `400` | Username atau password tidak dikirim |
| `401` | Username atau password salah |
| `403` | Akun tidak aktif (diblokir admin) |
| `503` | Maintenance mode aktif |

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": "uuid", "username": "atmaklasik", "dailyLimit": 5 }
  }
}
```

---

#### `POST ?action=verify`

Validasi JWT token yang tersimpan di client.

**Header:** `Authorization: Bearer <token>`

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Token valid — mengembalikan data user terkini |
| `401` | Token tidak ada / tidak valid / kadaluarsa / akun tidak aktif |

---

### `/api/analyze`

#### `POST`

Analisa gambar makanan menggunakan Anthropic Claude Vision. Kuota harian user akan dikurangi **hanya jika analisa berhasil**.

**Header:** `Authorization: Bearer <token>`

**Body (JSON):**
```json
{
  "image": "base64_string",
  "mimeType": "image/jpeg",
  "correction": "opsional — koreksi dari user untuk re-analisa"
}
```

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Analisa berhasil — mengembalikan `analysis`, `usage` |
| `400` | Gambar tidak dikirim atau `Content-Type` tidak didukung |
| `401` | Token tidak valid |
| `422` | Gambar tidak mengandung makanan atau minuman |
| `429` | Batas analisa harian user tercapai, atau rate limit Anthropic |
| `503` | Server AI sedang overload (`overloaded_error`) / API key tidak valid / maintenance aktif / koneksi timeout |
| `500` | Error tak terduga saat analisa |

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "analysis": {
      "dishes": [
        {
          "name": "Nasi Goreng",
          "portion": "1 piring",
          "calories": 450,
          "protein": 12.5,
          "carbs": 65.0,
          "fat": 15.0
        }
      ],
      "total": { "calories": 450, "protein": 12.5, "carbs": 65.0, "fat": 15.0 },
      "notes": "Kandungan karbohidrat tinggi",
      "healthScore": 6,
      "assessment": "Makanan cukup bergizi namun tinggi kalori."
    },
    "usage": { "used": 2, "limit": 5, "remaining": 3 }
  }
}
```

**Response 422 (bukan makanan):**
```json
{ "ok": false, "error": "Gambar tidak mengandung makanan atau minuman. Silakan foto makananmu." }
```

**Response 503 (AI overload):**
```json
{ "ok": false, "error": "Server AI sedang sibuk. Tunggu beberapa detik lalu coba lagi." }
```

---

### `/api/history`

#### `GET ?action=list`

Ambil daftar riwayat meal dengan pagination.

**Query Params:** `page` (default: 1), `per_page` (default: 10)

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Mengembalikan `meals[]`, `total`, `page`, `totalPages` |
| `401` | Token tidak valid |

---

#### `GET ?action=today`

Ambil ringkasan nutrisi hari ini beserta status penggunaan kuota.

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Mengembalikan `meals[]`, `summary` nutrisi, `usage` kuota |
| `401` | Token tidak valid |

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "meals": [...],
    "summary": { "totalCalories": 850, "totalProtein": 35.0, "totalCarbs": 110.0, "totalFat": 28.0 },
    "usage": { "used": 3, "limit": 5, "remaining": 2 }
  }
}
```

---

#### `POST`

Simpan hasil analisa sebagai entri riwayat.

**Body:**
```json
{ "analysis": { ... }, "imageDataUrl": "data:image/jpeg;base64,..." }
```

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Data berhasil disimpan — mengembalikan `meal` |
| `400` | Field `analysis` tidak dikirim |
| `401` | Token tidak valid |

---

#### `DELETE ?id=<meal_id>`

Hapus satu entri riwayat milik user yang sedang login.

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Data berhasil dihapus |
| `400` | `id` tidak dikirim |
| `401` | Token tidak valid |
| `404` | Meal tidak ditemukan atau bukan milik user |

---

### `/api/report`

#### `POST`

Kirim laporan / masukan dari user.

**Body:**
```json
{ "message": "string (min 10, max 1000 karakter)" }
```

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Laporan berhasil dikirim — mengembalikan `report` |
| `400` | Pesan terlalu pendek (< 10 karakter) atau terlalu panjang (> 1000) |
| `401` | Token tidak valid |

---

#### `GET`

Ambil daftar laporan milik user yang login (maks. 20 terakhir).

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Mengembalikan `reports[]` |
| `401` | Token tidak valid |

---

### `/api/maintenance`

#### `GET`

Cek status maintenance mode. Endpoint ini **tidak memerlukan autentikasi**.

**Response Codes:**

| Code | Kondisi |
|------|---------|
| `200` | Mengembalikan `enabled`, `title`, `description` |

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "enabled": false,
    "title": "Gizku sedang dalam perbaikan",
    "description": "Kami sedang melakukan peningkatan sistem."
  }
}
```

---

### `/api/admin`

Semua endpoint admin memerlukan header:
```
Authorization: Bearer <nl_admin_token>
```
Token admin diperoleh dari `POST /api/admin?action=login` dan disimpan sebagai cookie `HttpOnly`.

> ⚠️ Token admin adalah cookie `HttpOnly` — tidak dapat dibaca oleh JavaScript. Gunakan cookie secara otomatis oleh browser, atau kirim token via header `Authorization` yang disisipkan server-side.

#### `POST ?action=login`

Login admin.

**Body:** `{ "password": "string" }`

| Code | Kondisi |
|------|---------|
| `200` | Login berhasil — set cookie `nl_admin_token` (HttpOnly, 4 jam) |
| `400` | Password tidak dikirim |
| `401` | Password salah |

---

#### `POST ?action=update_report`

Ubah status laporan user (`open` → `resolved`).

**Body:** `{ "id": "report_uuid", "status": "resolved" }`

| Code | Kondisi |
|------|---------|
| `200` | Status berhasil diperbarui |
| `400` | `id` tidak dikirim |
| `401` | Token admin tidak valid |

---

#### `POST ?action=update_user`

Ubah status aktif atau limit harian seorang user.

**Body:** `{ "id": "user_uuid", "isActive": true, "dailyLimit": 10 }`

| Code | Kondisi |
|------|---------|
| `200` | User berhasil diperbarui |
| `400` | `id` tidak dikirim |
| `401` | Token admin tidak valid |

---

#### `POST ?action=create_user`

Buat akun user baru dari admin.

**Body:** `{ "username": "string", "password": "string", "dailyLimit": 5 }`

| Code | Kondisi |
|------|---------|
| `200` | User berhasil dibuat |
| `400` | Username atau password tidak dikirim |
| `401` | Token admin tidak valid |
| `409` | Username sudah digunakan |

---

#### `POST ?action=update_config`

Ubah konfigurasi global (daily limit default, API key Anthropic).

**Body:** `{ "dailyLimit": 5, "anthropicApiKey": "sk-ant-..." }`

| Code | Kondisi |
|------|---------|
| `200` | Konfigurasi berhasil disimpan |
| `401` | Token admin tidak valid |

---

#### `POST ?action=update_maintenance`

Aktifkan / nonaktifkan maintenance mode.

**Body:** `{ "enabled": true, "title": "...", "description": "..." }`

| Code | Kondisi |
|------|---------|
| `200` | Status maintenance diperbarui |
| `401` | Token admin tidak valid |

---

#### `GET ?action=dashboard`

Ambil statistik ringkasan dashboard admin.

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "stats": {
      "totalUsers": 42,
      "activeUsers": 40,
      "totalMeals": 318,
      "openReports": 2,
      "totalCalories": 487250,
      "todayAnalyses": 15
    },
    "recentUsers": [...]
  }
}
```

---

#### `GET ?action=users`

Daftar semua user dengan pagination.

**Query Params:** `page`, `per_page` (default: 20)

| Code | Kondisi |
|------|---------|
| `200` | Mengembalikan `users[]`, `total`, `page`, `perPage` |
| `401` | Token admin tidak valid |

---

#### `GET ?action=reports`

Daftar laporan user.

**Query Params:** `status` (`open` / `resolved` / `all`, default: `all`)

| Code | Kondisi |
|------|---------|
| `200` | Mengembalikan `reports[]` |
| `401` | Token admin tidak valid |

---

#### `DELETE ?action=delete_report&id=<id>`

Hapus laporan user.

| Code | Kondisi |
|------|---------|
| `200` | Laporan berhasil dihapus |
| `400` | `id` tidak dikirim |
| `401` | Token admin tidak valid |

---

#### `DELETE ?action=delete_user`

Hapus akun user beserta seluruh data meal-nya.

**Body:** `{ "id": "user_uuid" }`

| Code | Kondisi |
|------|---------|
| `200` | User berhasil dihapus |
| `400` | `id` tidak dikirim |
| `401` | Token admin tidak valid |

---

## 🚀 Cara Deploy ke Vercel

### 1. Fork & Clone

```bash
git clone https://github.com/atmaboy/nutrilog-next.git
cd nutrilog-next
npm install
```

### 2. Siapkan Database di Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Masuk ke **SQL Editor**, jalankan seluruh file di folder `sql/` secara berurutan
3. Salin **Connection String** dari Settings → Database → Connection string (mode `Transaction` / port `6543`)

### 3. Deploy ke Vercel

#### Via Vercel Dashboard (Rekomendasi)

1. Push repo ke GitHub
2. Buka [vercel.com/new](https://vercel.com/new) → Import repository
3. **Framework Preset**: Next.js (auto-detected)
4. Tambahkan semua environment variables di bagian **Environment Variables**
5. Klik **Deploy**

#### Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 4. Custom Domain

Setelah deploy, tambahkan custom domain di **Vercel Dashboard → Project → Settings → Domains**.

> ⚠️ **Deployment Protection:** Pastikan **Settings → Deployment Protection** di-set ke `Disabled` agar user eksternal bisa mengakses aplikasi tanpa autentikasi Vercel. Jika hanya untuk internal tim, biarkan aktif.

### 5. Jalankan Migrasi Data (Opsional)

Jika kamu memiliki data lama di Supabase KV Store (`kv_store`), jalankan endpoint migrasi:

```bash
curl -X POST https://<your-domain>/api/admin/migrate \
  -H "Authorization: Bearer <admin_token>"
```

### 6. Verifikasi Analytics

Setelah deploy, buka Vercel Dashboard → tab **Analytics** untuk melihat page views dan Web Vitals secara real-time.

---

## 🖥️ Development Lokal

```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev
# → http://localhost:3000

# Generate/sync schema Drizzle
npx drizzle-kit push

# Lint
npm run lint
```

---

## 📋 Changelog

### v1.4.0 — 2026-05-03

#### 🎨 Rebrand: NutriLog → Gizku
- **Nama aplikasi resmi berganti** dari NutriLog menjadi **Gizku** — seluruh UI, metadata, dan dokumentasi diperbarui
- **Custom domain** — tidak lagi menggunakan subdomain `vercel.app`; aplikasi kini berjalan di domain sendiri
- **Fix Vercel 403 Forbidden** — Deployment Protection dinonaktifkan agar user eksternal dapat mengakses aplikasi; solusi jangka panjang dengan migrasi ke custom domain

#### 🔔 Brand Announcement Widget
- Komponen baru `components/BrandAnnouncement.tsx` — notifikasi rebrand yang muncul di halaman **Login** dan **Catat Makanan**
- Background oranye on-brand dengan animasi slide-down
- **Dismissible** — setelah ditutup, disimpan ke `localStorage` (`gizku_brand_notice_dismissed`) sehingga tidak muncul lagi di kunjungan berikutnya

#### 🗓️ UI Riwayat — Kartu Ringkasan Harian
- **Pembeda visual** antara kartu ringkasan harian (summary) dan kartu item makan (meal list)
- Summary card kini menggunakan background **amber** (`#FFF7ED`) dengan border oranye (`#FED7AA`) dan label pill **"Total Hari Ini"**
- Meal card tetap putih bersih — hierarki visual parent/child kini lebih jelas

---

### v1.3.0 — 2026-04-26
- 🛡️ **Validasi gambar non-makanan** — AI menolak foto yang bukan makanan/minuman dengan pesan `422 Unprocessable Entity` yang ramah; kuota harian tidak terpotong
- ⚡ **Error handling AI** — `overloaded_error` (529), rate limit (429), invalid key (401), dan timeout kini menampilkan pesan user-friendly alih-alih raw JSON error
- 🔐 **Validasi token saat app load** — `app/main/layout.tsx` memvalidasi token ke server saat mount; jika `401` langsung force-logout
- 🔄 **Auto-logout global** — semua API call di halaman utama dan analisa kini mendeteksi `401` dan otomatis redirect ke login
- 📖 **Dokumentasi API lengkap** — README diperbarui dengan seluruh endpoint, error code, dan contoh response

### v1.2.0 — 2026-04-18
- ✅ **Vercel Analytics** — tambah `@vercel/analytics` ke root layout untuk tracking otomatis
- 🔧 **Maintenance auto-logout** — user yang sedang login otomatis di-logout dan diarahkan ke halaman login dengan banner pesan maintenance jika admin mengaktifkan maintenance mode
- 🛡️ **Maintenance banner di login** — halaman login menampilkan banner kuning informatif saat aplikasi sedang dalam pemeliharaan

### v1.1.0 — 2026-04-17
- 🔄 **Migrasi data** — route `POST /api/admin/migrate` untuk migrasi data dari Supabase KV Store (`kv_store`) ke PostgreSQL
- 🗺️ **Mapping legacy ID** — konversi `u_xxx` legacy user ID ke UUID PostgreSQL secara deterministik (idempotent)
- 🚫 **Strip imageData** — base64 image tidak disimpan ke `rawAnalysis` saat migrasi untuk efisiensi storage

### v1.0.0 — 2026-04-10
- 🎉 **Initial release** sebagai NutriLog
- 📷 Analisa foto makanan via Anthropic Claude Vision
- 📊 Riwayat & statistik harian
- 🔐 Autentikasi JWT (login/register)
- 🛠️ Admin dashboard — manajemen user, daily limit, maintenance mode
- 🌙 Dark/light mode toggle
- 📱 PWA-ready (manifest + mobile viewport)

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS, DM Sans, Fraunces |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | JWT (jose) — custom, tanpa NextAuth |
| AI | Anthropic Claude (Vision) |
| Analytics | Vercel Analytics |
| Deploy | Vercel + Custom Domain |

---

## 📄 Lisensi

Private — © 2026 [dev.wiryawan@gmail.com](mailto:dev.wiryawan@gmail.com)
