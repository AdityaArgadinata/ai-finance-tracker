import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { translateCategory } from "@/lib/utils";

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
          content: `You are a financial assistant that extracts transactions from user chat messages into JSON format:
{
  "jenis": "pemasukan" | "pengeluaran",
  "kategori": string,
  "item": string,
  "nominal": number
}

Rules:
1. The nominal value must be a pure number without dots/commas (e.g., 15000). If the user writes a suffix "k" or "K" (like 25k or 150K), interpret it as thousands (multiply by 1000, e.g., 25k -> 25000).
2. If the transaction type (jenis) is not explicitly mentioned, deduce it logically (e.g., "bought coffee" is pengeluaran, "received salary" is pemasukan).
3. The category (kategori) must be chosen from the standard list below:
   - For pengeluaran (expenses):
     * "Makanan & Minuman" (e.g., food, drinks, coffee, snacks, meals)
     * "Rokok" (e.g., cigarettes, vape, pod)
     * "Transportasi" (e.g., petrol/gas, taxi, ride-sharing, tolls, parking)
     * "Belanja" (e.g., clothing, grocery shopping, electronics)
     * "Tagihan & Utilitas" (e.g., electricity, internet, phone credit, rent)
     * "Hiburan" (e.g., cinema, games, travel/holidays)
     * "Kesehatan" (e.g., medicine, hospital, gym)
     * "Pendidikan" (e.g., books, courses)
     * "Lain-lain" (if it doesn't fit any above)
   - For pemasukan (income):
     * "Gaji" (e.g., monthly salary, bonus, THR)
     * "Investasi" (e.g., mutual fund gains, dividends)
     * "Bisnis" (e.g., sales, side project)
     * "Lain-lain" (if it doesn't fit any above)
4. The item must be a short description of the item/activity (e.g., "coffee", "petrol").`
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
      await replyTelegram(chatId, "❌ Format unrecognized. Please try again.");
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
      await replyTelegram(chatId, "❌ Failed to save to database.");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 4. Reply success
    const replyText = [
      "✅ Successfully recorded!",
      `🔹 Type: ${parsed.jenis === "pemasukan" ? "INFLOW" : "OUTFLOW"}`,
      `🔹 Category: ${translateCategory(parsed.kategori)}`,
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