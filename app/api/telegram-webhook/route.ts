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
          content: `Anda adalah asisten keuangan yang mengekstrak transaksi dari pesan obrolan pengguna ke format JSON:
{
  "jenis": "pemasukan" | "pengeluaran",
  "kategori": string,
  "item": string,
  "nominal": number
}

ATURAN EKSTRAKSI ITEM:
- Item HARUS menjadi nama produk/layanan spesifik (misalnya: "nasi padang", "bensin", "kopi", "pulsa")
- JANGAN gunakan kata kerja (beli, makan, ambil, bayar, kirim, terima, dll)
- JANGAN gunakan preposisi (ke, dari, di, untuk, dengan, dll)
- Jika ada "beli nasi padang 15k", ekstrak item="nasi padang" BUKAN "makan"
- Jika ada "minum kopi 5k", ekstrak item="kopi" BUKAN "minum"
- Jika ada "bensin motor 50k", ekstrak item="bensin motor" atau "bensin"

ATURAN PARSIAL NOMINAL:
1. Nilai nominal harus berupa angka murni tanpa titik/koma/spasi (misalnya 15000, bukan 15.000)
2. Jika ada "k" atau "K" di akhir (25k, 150K), kalikan dengan 1000
3. Contoh: "15k" → 15000, "50K" → 50000, "150000" → 150000

ATURAN KATEGORI & JENIS:
- Kategori harus dipilih dari daftar standar:
   - Pengeluaran: "Makanan & Minuman", "Rokok", "Transportasi", "Belanja", "Tagihan & Utilitas", "Hiburan", "Kesehatan", "Pendidikan", "Lain-lain"
   - Pemasukan: "Gaji", "Investasi", "Bisnis", "Lain-lain"
- Jenis dideuksi dari konteks (membeli/makan = pengeluaran, menerima/dapat = pemasukan)

CONTOH PARSING:
- Input: "beli nasi padang 15k" → item="nasi padang", nominal=15000, jenis="pengeluaran", kategori="Makanan & Minuman"
- Input: "beli kopi 8k" → item="kopi", nominal=8000, jenis="pengeluaran", kategori="Makanan & Minuman"
- Input: "gaji bulanan 5000k" → item="gaji bulanan", nominal=5000000, jenis="pemasukan", kategori="Gaji"`
        },
        { role: "user", content: msg.text },
      ],
    });

    const raw = (completion as GroqResponse).choices[0]?.message?.content;
    if (!raw) {
      await replyTelegram(chatId, "❌ Failed to process the message.");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const parsed: GroqParsedTransaction = JSON.parse(raw);

    // 2. Validate required fields
    if (!parsed.jenis || !parsed.kategori || !parsed.item || !parsed.nominal) {
      await replyTelegram(chatId, "❌ Format tidak dikenali. Silakan coba lagi.");
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
      `🔹 Jenis: ${parsed.jenis === "pemasukan" ? "PEMASUKAN" : "PENGELUARAN"}`,
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