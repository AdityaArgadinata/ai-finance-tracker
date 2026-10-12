export function jakartaDayRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const date = `${values.year}-${values.month}-${values.day}`;
  const [year, month, day] = date.split("-").map(Number);
  return {
    date,
    start: new Date(Date.UTC(year, month - 1, day) - 7 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.UTC(year, month - 1, day + 1) - 7 * 60 * 60 * 1000).toISOString(),
  };
}

export function dailySpendingMessage(date: string, expenses: { kategori: string; nominal: number }[]) {
  const byCategory = new Map<string, number>();
  for (const expense of expenses) byCategory.set(expense.kategori, (byCategory.get(expense.kategori) ?? 0) + expense.nominal);
  const total = [...byCategory.values()].reduce((sum, amount) => sum + amount, 0);
  const format = (amount: number) => amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const details = [...byCategory].sort((a, b) => b[1] - a[1]).map(([category, amount]) => `• ${category}: Rp ${format(amount)}`);
  return [
    `📊 Pengeluaran hari ini (${date})`,
    `Total: Rp ${format(total)}`,
    ...(details.length ? details : ["Belum ada pengeluaran hari ini."]),
  ].join("\n");
}
