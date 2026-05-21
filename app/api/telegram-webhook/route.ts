import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────
interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
}

interface GroqParsedTransaction {
  jenis: "pemasukan" | "pengeluaran";
  kategori: string;
  item: string;
  nominal: number;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// ── Clients ──────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// ── Helpers ──────────────────────────────────────────
function formatRupiah(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

async function replyTelegram(chatId: number, text: string) {
  await fetch(
    `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    },
  );
}

// ── Route ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();
    const msg = update.message;

    // Abaikan non-text
    if (!msg?.text) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const chatId = msg.chat.id;

    // 1. Call Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah asisten keuangan. Ekstrak input user ke format JSON: { 'jenis': 'pemasukan' | 'pengeluaran', 'kategori': string, 'item': string, 'nominal': number }. Nominal wajib berupa angka murni tanpa titik/koma. Jika jenis tidak disebutkan eksplisit, gunakan logika (contoh: gaji = pemasukan, beli = pengeluaran, bayar = pengeluaran).",
        },
        { role: "user", content: msg.text },
      ],
    });

    const raw = (completion as GroqResponse).choices[0]?.message?.content;
    if (!raw) {
      await replyTelegram(chatId, "❌ Gagal memproses pesan.");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const parsed: GroqParsedTransaction = JSON.parse(raw);

    // 2. Validate required fields
    if (!parsed.jenis || !parsed.kategori || !parsed.item || !parsed.nominal) {
      await replyTelegram(chatId, "❌ Format tidak dikenali. Coba lagi.");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 3. Insert to Supabase
    const { error: dbError } = await supabase.from("transactions").insert({
      chat_id: chatId,
      jenis: parsed.jenis,
      kategori: parsed.kategori,
      item: parsed.item,
      nominal: parsed.nominal,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      await replyTelegram(chatId, "❌ Gagal menyimpan ke database.");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 4. Reply success
    const replyText = [
      "✅ Berhasil dicatat!",
      `🔹 Jenis: ${parsed.jenis}`,
      `🔹 Kategori: ${parsed.kategori}`,
      `🔹 Item: ${parsed.item}`,
      `🔹 Nominal: Rp ${formatRupiah(parsed.nominal)}`,
    ].join("\n");

    await replyTelegram(chatId, replyText);
  } catch (err) {
    console.error("Webhook error:", err);
    // Always 200 to stop Telegram retries
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}