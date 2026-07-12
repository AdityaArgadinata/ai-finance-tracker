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
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const FORMAT_ERROR = [
  "❌ Format transaksi tidak dikenali.",
  "",
  "Tulis nama item dan nominalnya. Contoh:",
  "• beli makan 26k",
  "• bensin motor 50k",
  "• gaji bulanan 5000k",
  "",
  "Gunakan angka untuk nominal, misalnya 26k atau 26000.",
].join("\n");

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

    const linkCode = msg.text.trim().match(/^\/link\s+([a-f0-9]{8})$/i)?.[1].toUpperCase();
    if (linkCode) {
      const { data: pending } = await supabase.from("telegram_link_codes").select("user_id, expires_at").eq("code", linkCode).maybeSingle();
      if (!pending || new Date(pending.expires_at) <= new Date()) {
        await replyTelegram(chatId, "❌ This link code is invalid or expired. Generate a new code from your Account page.");
        return NextResponse.json({ ok: true });
      }

      const { error: linkError } = await supabase.from("telegram_accounts").upsert({ user_id: pending.user_id, chat_id: chatId, linked_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (linkError) {
        await replyTelegram(chatId, "❌ This Telegram account is already linked to another user.");
        return NextResponse.json({ ok: true });
      }

      await supabase.from("telegram_link_codes").delete().eq("user_id", pending.user_id);
      await replyTelegram(chatId, "✅ Telegram connected to Expanse. You can now record transactions with natural language.");
      return NextResponse.json({ ok: true });
    }

    const { data: telegramAccount } = await supabase.from("telegram_accounts").select("user_id").eq("chat_id", chatId).maybeSingle();
    if (!telegramAccount) {
      await replyTelegram(chatId, "🔗 Connect Telegram from your Expanse Account page before recording transactions.");
      return NextResponse.json({ ok: true });
    }

    const { data: groqApiKey, error: keyError } = await supabase.rpc("get_groq_api_key", { p_user_id: telegramAccount.user_id });
    if (keyError || !groqApiKey) {
      await replyTelegram(chatId, "❌ Groq AI is not connected.\n\nOpen Expanse → Account → Groq API key, save your key, then try again.");
      return NextResponse.json({ ok: true });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    if (!/\d/.test(msg.text)) {
      await replyTelegram(chatId, FORMAT_ERROR);
      return NextResponse.json({ ok: true });
    }

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
- Kategori harus dipilih dari daftar standar berdasarkan contoh detail:
   - "Makanan & Minuman": nasi, mie, kopi, teh, air, snack, kerupuk, coklat, permen, minuman bersoda
   - "Rokok": rokok, vape, pod, tembakau
   - "Transportasi": bensin, solar, tol, taxi, ojek, parkir, bus, kereta
   - "Belanja": pakaian, sepatu, tas, tissue, lotion, sabun, shampoo, deodorant, sikat gigi, pasta gigi, pembalut, popok, skincare, kosmetik, barang elektronik kecil, peralatan rumah tangga minimarket
   - "Tagihan & Utilitas": listrik, internet, pulsa, air, sewa rumah, cicilan, kartu kredit
   - "Hiburan": bioskop, game, spotify, tiket pesawat, hotel, liburan
   - "Kesehatan": obat, vitamin, rumah sakit, dokter, gym
   - "Pendidikan": buku, kursus, les, tuition
   - "Lain-lain": item lain yang tidak masuk kategori di atas
   - Pemasukan: "Gaji" (gaji, bonus, THR, libur cuti), "Investasi" (dividen, return), "Bisnis" (penjualan, freelance), "Lain-lain"
- Jenis dideuksi dari konteks (membeli/makan/bayar = pengeluaran, menerima/dapat/bonus = pemasukan)

CONTOH PARSING BELANJA:
- Input: "beli tissue 5k" → item="tissue", nominal=5000, kategori="Belanja"
- Input: "beli lotion 25k" → item="lotion", nominal=25000, kategori="Belanja"
- Input: "beli sabun mandi 8k" → item="sabun mandi", nominal=8000, kategori="Belanja"
- Input: "beli deodorant 15k" → item="deodorant", nominal=15000, kategori="Belanja"
- Input: "beli pasta gigi 12k" → item="pasta gigi", nominal=12000, kategori="Belanja"

CONTOH PARSING LAINNYA:
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
    if ((parsed.jenis !== "pemasukan" && parsed.jenis !== "pengeluaran") || !parsed.kategori?.trim() || !parsed.item?.trim() || !Number.isFinite(parsed.nominal) || parsed.nominal <= 0) {
      await replyTelegram(chatId, FORMAT_ERROR);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 3. Insert to Supabase
    const { error: dbError } = await supabase.from("transactions").insert({
      chat_id: chatId,
      user_id: telegramAccount.user_id,
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
