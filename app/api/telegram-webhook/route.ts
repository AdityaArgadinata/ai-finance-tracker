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

Aturan:
1. Nilai nominal harus berupa angka murni tanpa titik/koma (misalnya 15000). Jika pengguna menulis akhiran "k" atau "K" (seperti 25k atau 150K), interpretasikan sebagai ribuan (kalikan dengan 1000, misalnya 25k -> 25000).
2. Jika jenis transaksi (jenis) tidak disebutkan secara eksplisit, deduksi secara logis (misalnya, "membeli kopi" adalah pengeluaran, "menerima gaji" adalah pemasukan).
3. Kategori (kategori) harus dipilih dari daftar standar di bawah:
   - Untuk pengeluaran (expenses):
     * "Makanan & Minuman" (misalnya makanan, minuman, kopi, camilan, hidangan)
     * "Rokok" (misalnya rokok, vape, pod)
     * "Transportasi" (misalnya bensin/gas, taksi, ride-sharing, tol, parkir)
     * "Belanja" (misalnya pakaian, belanja groceries, elektronik)
     * "Tagihan & Utilitas" (misalnya listrik, internet, pulsa, sewa)
     * "Hiburan" (misalnya bioskop, game, travel/liburan)
     * "Kesehatan" (misalnya obat, rumah sakit, gym)
     * "Pendidikan" (misalnya buku, kursus)
     * "Lain-lain" (jika tidak sesuai yang di atas)
   - Untuk pemasukan (income):
     * "Gaji" (misalnya gaji bulanan, bonus, THR)
     * "Investasi" (misalnya keuntungan reksa dana, dividen)
     * "Bisnis" (misalnya penjualan, proyek sampingan)
     * "Lain-lain" (jika tidak sesuai yang di atas)
4. Item harus berupa deskripsi singkat tentang item/aktivitas (misalnya "kopi", "bensin").`
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