import { dailySpendingMessage, jakartaDayRange } from "@/lib/telegram-daily-report";
import { sendTelegramReport } from "@/lib/telegram-report-job";

export async function GET(request: Request) {
  const { date, start, end } = jakartaDayRange();
  return sendTelegramReport(request, { start, end }, (expenses) => dailySpendingMessage(date, expenses));
}
