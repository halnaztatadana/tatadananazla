# Original User Request

## 2026-10-13T10:22:36Z

# TataDana — SaaS Fintech Indonesia & Telegram Bot Integration

Working directory: C:\Users\ACER\.gemini\antigravity\scratch\tatadana
Integrity mode: development

TataDana adalah aplikasi SaaS manajemen keuangan pribadi (personal finance) Indonesia yang terintegrasi secara end-to-end dengan Telegram Bot (single bot multi-user), Supabase (Auth, Postgres, Realtime, Storage), Midtrans payment gateway, dan multi-provider AI (Gemini, GPT, DeepSeek) untuk pencatatan teks bahasa natural, ekstraksi foto struk, dan transkripsi voice note.

Pilihan Arsitektur Terkonfirmasi:
1. Framework: Remix / React Router v7 full-stack dengan Tailwind CSS dan @supabase/ssr.
2. Supabase: Siapkan skema database lengkap dan migrations di supabase/migrations/, serta .env.local template lengkap.
3. Auth: Email/Password, Google OAuth, dan verifikasi SMS OTP nomor HP (Twilio/Zenziva di Supabase Auth).
4. Webhook Telegram: Idempoten (/api/telegram/webhook), live bot getMe & setWebhook, serta simulator testing (/api/telegram/simulate atau UI di Settings).
5. AI Multimodal: Google Gemini Flash sebagai baseline (teks, vision OCR struk, audio VN transkrip) dengan konfigurasi multi-provider di Admin Dashboard.

## Requirements

### R1. Database Schema & Auth System (Supabase)
- Database schema lengkap tersimpan di `supabase/migrations/001_initial_schema.sql`:
  - `profiles` (id, user_id, phone_number, phone_verified, full_name, avatar_url, default_currency, plan, telegram_user_id, telegram_chat_id, created_at, updated_at)
  - `wallets` (id, user_id, name, type, balance, is_telegram_default, created_at)
  - `categories` (id, user_id, name, type, emoji, color, is_ai_recommended)
  - `budgets` (id, user_id, category_id, monthly_amount, spent_amount, period_month, period_year)
  - `transactions` (id, user_id, wallet_id, category_id, type, amount, date_wib, notes, source, receipt_url, has_items, created_at)
  - `transaction_items` (id, transaction_id, item_name, amount, category_id, time_wib)
  - `ai_providers` (id, provider_name, api_key_encrypted, is_active, mode, priority)
  - `ai_logs` (id, user_id, provider, prompt_tokens, completion_tokens, input_type, latency_ms, status, created_at)
  - `telegram_updates` (update_id PRIMARY KEY, processed_at, user_id, status)
  - `payment_transactions` (id, user_id, plan, amount, payment_type, midtrans_order_id, status, proof_url, approved_by, created_at)
  - `export_histories` (id, user_id, file_name, file_url, file_type, period, expires_at, created_at)
  - `audit_logs` (id, admin_id, target_user_id, action, reason, created_at)
- Row Level Security (RLS) aktif pada semua tabel pengguna.
- Seed data awal untuk kategori rekomendasi AI & dummy sandbox.

### R2. Telegram Bot Webhook & AI Pipeline
- Endpoint publik idempoten `/api/telegram/webhook` yang mencatat dan mengecek `update_id` sebelum pemrosesan.
- Setup bot token di Settings: validasi via `getMe`, otomatisasi `setWebhook`, status "Testing...", "Terhubung", "Tidak terhubung".
- AI Multimodal Engine:
  - Teks: Parsing nominal Indonesia ("15rb", "1.5jt", "500k", "gajian 5jt") via LLM Structured Output (`{jenis, nominal, kategori, catatan}`).
  - Foto Struk (khusus Pro): Vision OCR untuk ekstraksi item, harga, tanggal, merchant. Tersimpan sebagai 1 transaksi utama dengan expandable item rincian.
  - Voice Note: Transkripsi audio (maks 60 detik) + parsing transaksi + balasan dengan baris `🎙️ Transkrip: "[hasil]"`.
- Format reply bot standar WIB:
  - Pengeluaran: Format terstruktur dengan nominal, kategori, dompet, catatan, saldo, dan visual progress bar budget (`█` dan `░`).
  - Pemasukan: Format terstruktur dengan motivasi tabungan.
  - Commands: `/saldo`, `/hari ini`, `/minggu ini`, `/bulan ini`, `/budget`, `/sheet`, `/bantuan`.
  - AI Financial Advisor otomatis (khusus Pro) saat pengeluaran abnormal.
  - Reminder harian (maks 2x sehari sesuai jam pilihan).
  - Enforcement limit kuota Starter (maks 50 tx/bulan).
- Endpoint Simulator `/api/telegram/simulate` untuk testing instan di local environment.

### R3. Web Dashboard & In-App Reporting (Remix / React Router v7)
- Tema visual: Orange + Putih (fintech clean, modern, Inter/Plus Jakarta Sans, smooth transitions).
- Beranda: 4 stats card, Pie Chart kategori, Bar Chart 6 bulan, Trend line harian, List 10 transaksi terbaru, empty state checklist onboarding.
- Transaksi: Pemasukan, Pengeluaran, Transfer antar wallet.
- Laporan (Native): Tabel transaksi paginasi & sorting, filter kategori/wallet/tanggal/jenis/catatan, ringkasan net cashflow, expand item struk belanja, Supabase Realtime update.
- Generator Laporan PDF & Excel (.xlsx) on-demand disimpan di Supabase Storage dengan signed URL ephemeral.
- Budgeting: Progress bar visual persentase, alert 80% & 100% via Telegram.
- Wallets: Multi-wallet management & switch default Telegram wallet.
- Settings: Profil, Setup Token Bot & Test Koneksi, Reminder, Custom Kategori.

### R4. Admin Dashboard (Superadmin)
- Panel terpisah dengan impersonation user mode.
- Konfigurasi AI Provider (Gemini, OpenAI, DeepSeek) dengan toggle mode Single / Paralel (failover).
- Manajemen Users & status paket (Starter/Pro).
- Approval/Reject manual Midtrans transfer.
- Monitoring AI Logs & audit trail akses data user.

### R5. Landing Page & Auth Flow
- Landing page fintech 11 section lengkap (Navbar sticky, Pre-headline, Hero gradient orange, Placeholder video hero, Problems, Solution, Interactive Dashboard & Telegram preview, Fitur, Testimoni masonry, Pricing Starter/Pro, FAQ 7+ butir, CTA, Footer).
- Auth split layout (40% branding orange fintech, 60% form interaktif).

## Acceptance Criteria

### Verification Checklist
- [ ] Berkas `.env.example` mencakup seluruh variabel yang disyaratkan tanpa hardcoded secrets.
- [ ] Skema database lengkap di `supabase/migrations/` dapat dieksekusi tanpa error.
- [ ] Endpoint `/api/telegram/webhook` idempoten terhadap `update_id` yang sama.
- [ ] Parsing teks menangani "15rb", "1.5jt", "500k", dan format Indonesia lainnya secara valid.
- [ ] Laporan transaksi native mendukung filter, pagination, expand rincian struk, dan export PDF + Excel.
- [ ] Seluruh halaman beroperasi dengan tema Orange-Putih yang elegan, skeleton loading, dan responsive mobile 375px & desktop 1280px.
