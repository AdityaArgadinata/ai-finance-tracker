import { ArrowDownRight, ArrowUpRight, CalendarDays, CreditCard, Lightbulb, TrendingDown } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { getTransactions } from "@/lib/supabase";
import { translateCategory } from "@/lib/utils";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

type Period = "week" | "month" | "year";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const requestedPeriod = (await searchParams).period;
  const period: Period = requestedPeriod === "week" || requestedPeriod === "year" ? requestedPeriod : "month";
  const transactions = await getTransactions();
  const anchor = transactions[0] ? new Date(transactions[0].created_at) : new Date();
  const currentStart = period === "week" ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - 6) : period === "month" ? new Date(anchor.getFullYear(), anchor.getMonth(), 1) : new Date(anchor.getFullYear(), 0, 1);
  const currentEnd = period === "week" ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 23, 59, 59, 999) : period === "month" ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999) : new Date(anchor.getFullYear(), 11, 31, 23, 59, 59, 999);
  const previousStart = period === "week" ? new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 7) : period === "month" ? new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1) : new Date(anchor.getFullYear() - 1, 0, 1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const inRange = (createdAt: string, start: Date, end: Date) => { const date = new Date(createdAt); return date >= start && date <= end; };
  const rowsTotal = (rows: typeof transactions, type: "pemasukan" | "pengeluaran") => rows.filter((tx) => tx.jenis === type).reduce((sum, tx) => sum + tx.nominal, 0);
  const currentRows = transactions.filter((tx) => inRange(tx.created_at, currentStart, currentEnd));
  const previousRows = transactions.filter((tx) => inRange(tx.created_at, previousStart, previousEnd));
  const current = { income: rowsTotal(currentRows, "pemasukan"), expense: rowsTotal(currentRows, "pengeluaran") };
  const previous = { income: rowsTotal(previousRows, "pemasukan"), expense: rowsTotal(previousRows, "pengeluaran") };
  const bucketCount = period === "week" ? 7 : period === "month" ? 5 : 12;
  const flow = Array.from({ length: bucketCount }, (_, index) => {
    const start = period === "year" ? new Date(anchor.getFullYear(), index, 1) : period === "month" ? new Date(anchor.getFullYear(), anchor.getMonth(), index * 7 + 1) : new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() + index);
    const end = period === "year" ? new Date(anchor.getFullYear(), index + 1, 0, 23, 59, 59, 999) : period === "month" ? new Date(Math.min(new Date(anchor.getFullYear(), anchor.getMonth(), (index + 1) * 7, 23, 59, 59, 999).getTime(), currentEnd.getTime())) : new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
    const rows = currentRows.filter((tx) => inRange(tx.created_at, start, end));
    const total = (type: "pemasukan" | "pengeluaran") => rows.filter((tx) => tx.jenis === type).reduce((sum, tx) => sum + tx.nominal, 0);
    const label = period === "week" ? start.toLocaleDateString("en-US", { weekday: "short" }) : period === "year" ? start.toLocaleDateString("en-US", { month: "short" }) : `${start.getDate()}–${end.getDate()}`;
    return { label, income: total("pemasukan"), expense: total("pengeluaran") };
  });
  const expenses = currentRows.filter((tx) => tx.jenis === "pengeluaran");
  const categories = [...expenses.reduce((map, tx) => map.set(tx.kategori, (map.get(tx.kategori) ?? 0) + tx.nominal), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const maxFlow = Math.max(...flow.flatMap(({ income, expense }) => [income, expense]), 1);
  const expenseChange = previous.expense ? Math.round(((current.expense - previous.expense) / previous.expense) * 100) : current.expense ? 100 : 0;
  const topCategory = categories[0];
  const periodName = period === "week" ? "week" : period === "month" ? "month" : "year";
  const insight = !expenses.length
    ? `No expenses to analyze this ${periodName}.`
    : `${translateCategory(topCategory[0])} is the largest category, accounting for ${Math.round((topCategory[1] / current.expense) * 100)}% of this ${periodName}'s expenses.`;

  return (
    <main className="shell">
      <AppHeader active="analytics" />
      <section className="page-heading"><div><span>Expanse</span><h1>Analytics</h1></div><p>Financial overview</p></section>
      <section className="period-filter" aria-label="Analytics period">
        <div className="period-range"><i><CalendarDays /></i><div><span>Period</span><strong>This {periodName}</strong></div></div>
        <nav>{(["week", "month", "year"] as const).map((value) => <Link className={period === value ? "active" : ""} href={`/analytics?period=${value}`} key={value}>{value}</Link>)}</nav>
      </section>
      <section className="analytics-grid">
        <article className="card analytics-flow">
          <div className="card-title"><div><span>Cash flow</span><h2>Income vs expense</h2></div></div>
          <div className="chart-legend"><span><i className="income-dot" />Income</span><span><i className="expense-dot" />Expense</span></div>
          <div className="analytics-bars" style={{ gridTemplateColumns: `repeat(${bucketCount}, 1fr)` }}>{flow.map((bucket) => <div key={bucket.label}><span><i className="income-bar" style={{ height: `${bucket.income / maxFlow * 100}%` }} /><i className="expense-bar" style={{ height: `${bucket.expense / maxFlow * 100}%` }} /></span><small>{bucket.label}</small></div>)}</div>
        </article>

        <article className="analytics-compare">
          <span>{periodName} over {periodName}</span><h2>{expenseChange > 0 ? "+" : ""}{expenseChange}%</h2>
          <p>{expenseChange <= 0 ? <ArrowDownRight /> : <ArrowUpRight />} Expenses compared with last {periodName}</p>
          <dl><div><dt>This {periodName}</dt><dd>{currency.format(current.expense)}</dd></div><div><dt>Last {periodName}</dt><dd>{currency.format(previous.expense)}</dd></div></dl>
        </article>

        <article className="card category-card analytics-categories">
          <div className="card-title"><div><span>Breakdown</span><h2>Spending categories</h2></div></div>
          <ul>{categories.slice(0, 6).map(([category, amount], index) => <li key={category}><span className="round-icon">{index ? <CreditCard /> : <TrendingDown />}</span><div><b>{translateCategory(category)}</b><small>{currency.format(amount)}</small></div><em>{current.expense ? `${Math.round(amount / current.expense * 100)}%` : "—"}</em></li>)}</ul>
          {!categories.length && <p className="category-empty">No expenses in this period.</p>}
        </article>

        <article className="card analytics-top activity-card">
          <div className="card-title"><div><span>Largest expenses</span><h2>Top 5 transactions</h2></div></div>
          <div className="transaction-list">{[...expenses].sort((a, b) => b.nominal - a.nominal).slice(0, 5).map((tx) => <div key={tx.id}><span className="round-icon"><CreditCard /></span><div><b>{tx.item}</b><small>{translateCategory(tx.kategori)}</small></div><strong>− {currency.format(tx.nominal)}</strong></div>)}</div>
          {!expenses.length && <p className="category-empty">No expense transactions yet.</p>}
        </article>

        <article className="analytics-insight"><Lightbulb /><div><span>{periodName} insight</span><h2>{insight}</h2><p>{current.income ? `${Math.round((current.expense / current.income) * 100)}% of income used this ${periodName}.` : `No income this ${periodName}.`}</p></div></article>
      </section>
    </main>
  );
}
