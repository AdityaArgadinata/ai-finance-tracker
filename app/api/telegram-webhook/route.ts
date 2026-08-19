import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeTelegramTransaction, type TelegramParsedTransaction } from "@/lib/telegram-transaction";

// ── Types ────────────────────────────────────────────
interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
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
const routerBaseUrl = (process.env.NINEROUTER_BASE_URL ?? "https://9router.com/v1").replace(/\/$/, "");

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

function replyTelegram(chatId: number, text: string) {
  return NextResponse.json({ method: "sendMessage", chat_id: chatId, text });
}

// ── Route ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let chatId: number | undefined;
  try {
    const update: TelegramUpdate = await req.json();
    const msg = update.message;

    // Abaikan non-text
    if (!msg?.text) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    chatId = msg.chat.id;

    const linkCode = msg.text.trim().match(/^\/link\s+([a-f0-9]{8})$/i)?.[1].toUpperCase();
    if (linkCode) {
      const { data: pending } = await supabase.from("telegram_link_codes").select("user_id, expires_at").eq("code", linkCode).maybeSingle();
      if (!pending || new Date(pending.expires_at) <= new Date()) {
        return replyTelegram(chatId, "❌ This link code is invalid or expired. Generate a new code from your Account page.");
      }

      const { error: linkError } = await supabase.from("telegram_accounts").upsert({ user_id: pending.user_id, chat_id: chatId, linked_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (linkError) {
        return replyTelegram(chatId, "❌ This Telegram account is already linked to another user.");
      }

      await supabase.from("telegram_link_codes").delete().eq("user_id", pending.user_id);
      return replyTelegram(chatId, "✅ Telegram connected to Expanse. You can now record transactions with natural language.");
    }

    const { data: telegramAccount } = await supabase.from("telegram_accounts").select("user_id").eq("chat_id", chatId).maybeSingle();
    if (!telegramAccount) {
      return replyTelegram(chatId, "🔗 Connect Telegram from your Expanse Account page before recording transactions.");
    }

    const [{ data: savedRouterApiKey }, { data: aiSettings }] = await Promise.all([
      supabase.rpc("get_groq_api_key", { p_user_id: telegramAccount.user_id }),
      supabase.from("user_ai_settings").select("model").eq("user_id", telegramAccount.user_id).maybeSingle(),
    ]);
    const routerApiKey = process.env.NINEROUTER_API_KEY || savedRouterApiKey;
    const routerModel = process.env.NINEROUTER_MODEL || aiSettings?.model;
    if (!routerApiKey || !routerModel) {
      return replyTelegram(chatId, "❌ 9Router is not connected.\n\nOpen Expanse → Account, save your 9Router API key and model, then try again.");
    }

    if (!/\d/.test(msg.text)) {
      return replyTelegram(chatId, FORMAT_ERROR);
    }

    // 1. Call 9Router
    const routerResponse = await fetch(`${routerBaseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${routerApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: routerModel, response_format: { type: "json_object" }, messages: [
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
   - "Cafe": transaksi yang secara eksplisit menyebut cafe, kafe, coffee shop, atau nongkrong di cafe
   - "Date": transaksi yang secara eksplisit menyebut date atau kencan
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
- Input: "cafe 20k" → item="Cafe", nominal=20000, jenis="pengeluaran", kategori="Cafe"
- Input: "ngopi cafe 35k" → item="ngopi", nominal=35000, jenis="pengeluaran", kategori="Cafe"
- Input: "date makan 100k" → item="makan", nominal=100000, jenis="pengeluaran", kategori="Date"
- Input: "beli nasi padang 15k" → item="nasi padang", nominal=15000, jenis="pengeluaran", kategori="Makanan & Minuman"
- Input: "beli kopi 8k" → item="kopi", nominal=8000, jenis="pengeluaran", kategori="Makanan & Minuman"
- Input: "gaji bulanan 5000k" → item="gaji bulanan", nominal=5000000, jenis="pemasukan", kategori="Gaji"`
        },
        { role: "user", content: msg.text },
      ] }),
    });
    const responseText = await routerResponse.text();
    if (!routerResponse.ok) throw new Error(`9Router ${routerResponse.status}: ${responseText}`);
    const completion = JSON.parse(responseText.split(/\ndata:/, 1)[0]) as GroqResponse;

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return replyTelegram(chatId, "❌ Failed to process the message.");
    }

    const parsed = normalizeTelegramTransaction(msg.text, JSON.parse(raw) as TelegramParsedTransaction);
    if (/\b(?:cafe|kafe|coffee shop)\b/i.test(msg.text)) parsed.kategori = "Cafe";
    else if (/\b(?:date|kencan)\b/i.test(msg.text)) parsed.kategori = "Date";

    // 2. Validate required fields
    if ((parsed.jenis !== "pemasukan" && parsed.jenis !== "pengeluaran") || !parsed.kategori?.trim() || !parsed.item?.trim() || !Number.isFinite(parsed.nominal) || parsed.nominal <= 0) {
      return replyTelegram(chatId, FORMAT_ERROR);
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
      return replyTelegram(chatId, "❌ Gagal menyimpan ke database.");
    }

    // 4. Reply success
    const replyText = [
      "✅ Berhasil dicatat!",
      `🔹 Jenis: ${parsed.jenis === "pemasukan" ? "PEMASUKAN" : "PENGELUARAN"}`,
      `🔹 Kategori: ${parsed.kategori}`,
      `🔹 Item: ${parsed.item}`,
      `🔹 Nominal: Rp ${formatRupiah(parsed.nominal)}`,
    ].join("\n");

    return replyTelegram(chatId, replyText);
  } catch (err) {
    console.error("Webhook error:", err);
    if (chatId !== undefined) return replyTelegram(chatId, "❌ Layanan AI sedang bermasalah. Coba lagi atau periksa koneksi 9Router di halaman Account.");
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
