# 💰 Expanse (AI Expense Tracker Telegram Bot)

Expanse is a personal finance assistant based on a Telegram Bot that uses Artificial Intelligence (AI) to track your expenses and income. Built using modern technologies with flexible multi-provider AI integration.

Simply type a message naturally like _"Bought coffee 25000"_ or _"This month's salary 5000000"_, and the bot will automatically extract the information and save it to the database.

## ✨ Key Features
- **🤖 Flexible Multi-Provider NLP:** Supports any AI endpoint: **DeepSeek**, **Google Gemini**, **OpenAI**, **Anthropic Claude**, **Groq**, **OpenRouter**, **9Router**, or any custom OpenAI-compatible / local endpoint (Ollama, LM Studio, etc.).
- **💬 Telegram Integration:** Utilizes a *Webhook* system for instant responses.
- **🗄️ Real-time Database:** Transaction data is securely stored using Supabase (PostgreSQL) with API keys encrypted in Supabase Vault.
- **⚡ Fast & Modern:** Built on the Next.js App Router ecosystem with TypeScript support.

## 🛠️ Tech Stack
- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI Providers:** DeepSeek, Google Gemini, OpenAI, Claude, Groq, 9Router, or Custom Endpoint
- **Database & Auth:** Supabase
- **Integration:** Telegram Bot API
- **Local Tools:** Ngrok (For *webhook tunneling* in *development* mode)

## 🚀 Installation Guide (Local)

### 1. Prerequisites
Make sure you have:
- Node.js installed on your computer.
- An API key from your preferred AI provider (e.g. DeepSeek, OpenAI, Google AI Studio, Anthropic, Groq, etc.).
- A new Supabase project.
- A Telegram Bot created via @BotFather (to get the *Bot Token*).

### 2. Database Schema (Supabase)
Run the SQL migration files in `supabase/migrations/` in your Supabase SQL Editor:
- `202607130001_user_transaction_isolation.sql`
- `202607130002_user_groq_vault.sql`
- `202608190001_9router_integration.sql`
- `202609080001_flexible_ai_providers.sql`

### 3. Clone & Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the *root* folder and fill it with your credentials:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_ai_api_key
AI_MODEL=gpt-4o-mini
```

After signing in, configure your AI provider preset or custom endpoint, model ID, and API key directly from the **Account** page.

### 5. Running Server & Webhook (Local)
Run the Next.js server:
```bash
npm run dev
```

Open a new terminal and run Ngrok to expose your *localhost* to the public:
```bash
ngrok http 3000
```
*(Note: Expanse already allows the ngrok-free.app domain in your `next.config.ts`.)*

### 6. Set Telegram Webhook
Register your Ngrok URL to the Telegram Bot API. Open a *browser* or use *cURL* to access the following URL:
```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<NGROK_URL>/api/telegram-webhook
```
*Note: Replace `<TELEGRAM_BOT_TOKEN>` and `<NGROK_URL>` with your own.*

## 💡 Usage Guide

Open Telegram, start a chat with your bot, then send messages like:
- *"Pay home electricity bill 250 thousand"*
- *"Bought nasi padang for lunch 25000"*
- *"Got a web development freelance project 1500000"*

The bot will automatically identify the transaction and reply with a summary of the successfully saved record.
