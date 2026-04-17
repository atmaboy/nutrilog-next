# 🥗 NutriLog

> Aplikasi pelacak nutrisi makanan berbasis AI — analisa foto makananmu dan catat asupan harian dengan mudah.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/license-Private-red)](#)

---

## ✨ Fitur Utama

- 📷 **Analisa foto makanan** — upload foto atau ambil dari kamera, AI (Claude) akan mendeteksi nama makanan beserta kandungan kalori, protein, karbohidrat, dan lemak
- 📊 **Riwayat & statistik** — lihat rekap harian/mingguan beserta grafik tren nutrisi
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
│   │   └── page.tsx              # Halaman login & register; tampilkan banner maintenance
│   │
│   ├── main/
│   │   ├── layout.tsx            # Layout aplikasi utama (header, nav tab, auto-logout maintenance)
│   │   ├── catat/
│   │   │   └── page.tsx          # Halaman catat makan — upload foto & hasil analisa AI
│   │   └── riwayat/
│   │       └── page.tsx          # Halaman riwayat — daftar meal & statistik nutrisi
│   │
│   ├── admin/
│   │   └── page.tsx              # Dashboard admin — manajemen user, config, laporan
│   │
│   ├── maintenance/
│   │   └── page.tsx              # Halaman maintenance (fallback statis)
│   │
│   └── api/                      # API Routes (Next.js Route Handlers)
│       ├── auth/
│       │   └── route.ts          # POST login & register — issue JWT
│       ├── analyze/
│       │   └── route.ts          # POST analisa gambar makanan via Anthropic Claude
│       ├── history/
│       │   └── route.ts          # GET riwayat meal harian/mingguan; GET today summary
│       ├── report/
│       │   └── route.ts          # POST kirim laporan/masukan dari user
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
│
├── drizzle/
│   └── schema.ts                 # Drizzle ORM schema — definisi tabel PostgreSQL
│
├── lib/
│   ├── auth.ts                   # JWT sign/verify, hashPassword, extractToken
│   ├── db.ts                     # Drizzle client (koneksi ke Supabase PostgreSQL)
│   └── utils.ts                  # Helper: setCors, cn, dll
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

Saat diminta, masukkan environment variables atau sambungkan ke Vercel project yang sudah ada.

### 4. Jalankan Migrasi Data (Opsional)

Jika kamu memiliki data lama di Supabase KV Store (`kv_store`), jalankan endpoint migrasi:

```bash
curl -X POST https://<your-domain>/api/admin/migrate \
  -H "Authorization: Bearer <admin_token>"
```

### 5. Verifikasi Analytics

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

### v1.2.0 — 2026-04-18
- ✅ **Vercel Analytics** — tambah `@vercel/analytics` ke root layout untuk tracking otomatis
- 🔧 **Maintenance auto-logout** — user yang sedang login otomatis di-logout dan diarahkan ke halaman login dengan banner pesan maintenance jika admin mengaktifkan maintenance mode
- 🛡️ **Maintenance banner di login** — halaman login menampilkan banner kuning informatif saat aplikasi sedang dalam pemeliharaan

### v1.1.0 — 2026-04-17
- 🔄 **Migrasi data** — route `POST /api/admin/migrate` untuk migrasi data dari Supabase KV Store (`kv_store`) ke PostgreSQL; mendukung pola key `meals/index/`, `meals/data/`, `usage/`, `reports/`, `config/global`
- 🗺️ **Mapping legacy ID** — konversi `u_xxx` legacy user ID ke UUID PostgreSQL secara deterministik (idempotent)
- 🚫 **Strip imageData** — base64 image tidak disimpan ke `rawAnalysis` saat migrasi untuk efisiensi storage

### v1.0.0 — 2026-04-10
- 🎉 **Initial release**
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
| Deploy | Vercel |

---

## 📄 Lisensi

Private — © 2026 [dev.wiryawan@gmail.com](mailto:dev.wiryawan@gmail.com)
