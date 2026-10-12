import { jakartaWeekRange, weeklySpendingMessage } from "@/lib/telegram-daily-report";
import { sendTelegramReport } from "@/lib/telegram-report-job";

export async function GET(request: Request) {
  const { weekStart, start, end } = jakartaWeekRange();
  return sendTelegramReport(request, { start, end }, (expenses) => weeklySpendingMessage(weekStart, expenses));
}
