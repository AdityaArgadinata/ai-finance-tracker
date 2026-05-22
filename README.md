# 💰 Expanse (AI Expense Tracker Telegram Bot)

Expanse is a personal finance assistant based on a Telegram Bot that uses Artificial Intelligence (AI) to track your expenses and income. Built using modern technologies with fast AI integration.

Simply type a message naturally like _"Beli kopi 25000"_ (Bought coffee 25000) or _"Gaji bulan ini 5000000"_ (This month's salary 5000000), and the bot will automatically extract the information and save it to the database.

## ✨ Key Features
- **🤖 Natural Language Processing (NLP):** Uses a cutting-edge AI model (Groq LLaMA 3.1) to read informal messages and convert them into structured data (Type, Category, Item, Amount).
- **💬 Telegram Integration:** Utilizes a *Webhook* system for instant responses.
- **🗄️ Real-time Database:** Transaction data is securely stored using Supabase (PostgreSQL).
- **⚡ Fast & Modern:** Built on the Next.js App Router ecosystem with TypeScript support.

## 🛠️ Tech Stack
- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI Engine:** [Groq SDK](https://console.groq.com/) (Model `llama-3.1-8b-instant`)
- **Database & Auth:** Supabase
- **Integration:** Telegram Bot API
- **Local Tools:** Ngrok (For *webhook tunneling* in *development* mode)

## 🚀 Installation Guide (Local)

### 1. Prerequisites
Make sure you have:
- Node.js installed on your computer.
- A Groq account to get an API Key.
- A new Supabase project.
- A Telegram Bot created via @BotFather (to get the *Bot Token*).

### 2. Database Schema (Supabase)
Create a table named `transactions` in your Supabase database, with the following columns:
- `id` (int8 / uuid) - *Primary Key*
- `created_at` (timestamptz) - *Default to now()*
- `chat_id` (int8)
- `jenis` (text) - *Will contain 'pemasukan' (income) or 'pengeluaran' (expense)*
- `kategori` (text)
- `item` (text)
- `nominal` (numeric / int8)

### 3. Clone & Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 4. Konfigurasi Environment Variables
Buat file `.env.local` di *root* folder dan isi dengan data kredensial Anda:
```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 5. Menjalankan Server & Webhook (Local)
Jalankan server Next.js:
```bash
npm run dev
```

Buka terminal baru, jalankan Ngrok untuk mengekspos *localhost* Anda ke publik:
```bash
ngrok http 3000
```
*(Catatan: Expanse sudah mengizinkan domain ngrok-free.app di `next.config.ts` Anda.)*

### 6. Set Webhook Telegram
Daftarkan URL Ngrok Anda ke Telegram Bot API. Buka *browser* atau gunakan *cURL* untuk mengakses URL berikut:
```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<NGROK_URL>/api/telegram-webhook
```
*Catatan: Ganti `<TELEGRAM_BOT_TOKEN>` dan `<NGROK_URL>` dengan milik Anda.*

## 💡 Cara Penggunaan

Buka Telegram, mulai obrolan dengan bot Anda, lalu kirim teks seperti:
- *"Bayar tagihan listrik rumah 250 ribu"*
- *"Beli nasi padang untuk makan siang 25000"*
- *"Dapat proyek freelance pembuatan web 1500000"*

Bot akan secara otomatis mengidentifikasi transaksi dan membalas dengan ringkasan pencatatan yang sukses tersimpan.