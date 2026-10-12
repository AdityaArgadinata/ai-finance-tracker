import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function sendTelegramReport(request: Request, range: { start: string; end: string }, message: (expenses: { kategori: string; nominal: number }[]) => string) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: accounts, error: accountError }, { data: expenses, error: expenseError }] = await Promise.all([
    supabase.from("telegram_accounts").select("user_id, chat_id"),
    supabase.from("transactions").select("user_id, kategori, nominal").eq("jenis", "pengeluaran").gte("created_at", range.start).lte("created_at", range.end),
  ]);
  if (accountError || expenseError) return NextResponse.json({ error: "Failed to load expenses" }, { status: 500 });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 500 });

  const byUser = new Map<string, { kategori: string; nominal: number }[]>();
  for (const expense of expenses ?? []) {
    const userExpenses = byUser.get(expense.user_id) ?? [];
    userExpenses.push(expense);
    byUser.set(expense.user_id, userExpenses);
  }

  const failed: number[] = [];
  for (const account of accounts ?? []) {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: account.chat_id, text: message(byUser.get(account.user_id) ?? []) }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true) failed.push(account.chat_id);
  }

  if (failed.length) return NextResponse.json({ error: "Some Telegram messages failed", failed }, { status: 502 });
  return NextResponse.json({ sent: accounts?.length ?? 0 });
}
