import {
  CalendarDays,
  CreditCard,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppHeader } from "@/app/components/AppHeader";
import { getTransactions } from "@/lib/supabase";
import { createAuthClient } from "@/lib/supabase-auth";
import { translateCategory } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const dateLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

type Period = "week" | "month" | "year";

export default async function Home({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const requestedPeriod = (await searchParams).period;
  const period: Period = requestedPeriod === "week" || requestedPeriod === "year" ? requestedPeriod : "month";
  const supabase = await createAuthClient();
  const [{ data: { user } }, allTransactions] = await Promise.all([supabase.auth.getUser(), getTransactions()]);
  if (!user) redirect("/login");
  const name = String(user.user_metadata.full_name ?? user.user_metadata.name ?? user.email?.split("@")[0] ?? "User").split(" ")[0];
  const anchor = allTransactions[0] ? new Date(allTransactions[0].created_at) : new Date();
  const currentStart = period === "week"
    ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - 6)
    : period === "month"
      ? new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      : new Date(anchor.getFullYear(), 0, 1);
  const currentEnd = period === "week"
    ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), 23, 59, 59, 999)
    : period === "month"
      ? new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999)
      : new Date(anchor.getFullYear(), 11, 31, 23, 59, 59, 999);
  const previousStart = period === "week"
    ? new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() - 7)
    : period === "month"
      ? new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
      : new Date(anchor.getFullYear() - 1, 0, 1);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const inRange = (createdAt: string, start: Date, end: Date) => { const date = new Date(createdAt); return date >= start && date <= end; };
  const transactions = allTransactions.filter((tx) => inRange(tx.created_at, currentStart, currentEnd));
  const previousTransactions = allTransactions.filter((tx) => inRange(tx.created_at, previousStart, previousEnd));
  const totalIncome = allTransactions.filter((tx) => tx.jenis === "pemasukan").reduce((sum, tx) => sum + tx.nominal, 0);
  const totalExpense = allTransactions.filter((tx) => tx.jenis === "pengeluaran").reduce((sum, tx) => sum + tx.nominal, 0);
  const totalBalance = totalIncome - totalExpense;
  const income = transactions.filter((tx) => tx.jenis === "pemasukan").reduce((sum, tx) => sum + tx.nominal, 0);
  const expense = transactions.filter((tx) => tx.jenis === "pengeluaran").reduce((sum, tx) => sum + tx.nominal, 0);
  const balance = income - expense;
  const previousIncome = previousTransactions.filter((tx) => tx.jenis === "pemasukan").reduce((sum, tx) => sum + tx.nominal, 0);
  const previousExpense = previousTransactions.filter((tx) => tx.jenis === "pengeluaran").reduce((sum, tx) => sum + tx.nominal, 0);
  const comparison = [
    ["Income", income, previousIncome],
    ["Expense", expense, previousExpense],
    ["Net balance", balance, previousIncome - previousExpense],
  ] as const;
  const burnRate = income ? Math.round((expense / income) * 100) : 0;
  const bucketCount = period === "week" ? 7 : period === "month" ? 5 : 12;
  const cashflow = Array.from({ length: bucketCount }, (_, index) => {
    const start = period === "year"
      ? new Date(anchor.getFullYear(), index, 1)
      : period === "month"
        ? new Date(anchor.getFullYear(), anchor.getMonth(), index * 7 + 1)
        : new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate() + index);
    const end = period === "year"
      ? new Date(anchor.getFullYear(), index + 1, 0, 23, 59, 59, 999)
      : period === "month"
        ? new Date(Math.min(new Date(anchor.getFullYear(), anchor.getMonth(), (index + 1) * 7, 23, 59, 59, 999).getTime(), currentEnd.getTime()))
        : new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
    const bucketTransactions = transactions.filter((tx) => inRange(tx.created_at, start, end));
    const bucketIncome = bucketTransactions.filter((tx) => tx.jenis === "pemasukan").reduce((sum, tx) => sum + tx.nominal, 0);
    const bucketExpense = bucketTransactions.filter((tx) => tx.jenis === "pengeluaran").reduce((sum, tx) => sum + tx.nominal, 0);
    const label = period === "week" ? start.toLocaleDateString("en-US", { weekday: "short" }) : period === "year" ? start.toLocaleDateString("en-US", { month: "short" }) : `${start.getDate()}–${end.getDate()}`;
    return { label, income: bucketIncome, expense: bucketExpense };
  });
  const maxCashflow = Math.max(...cashflow.flatMap(({ income, expense }) => [income, expense]), 1);
  const categories = [...transactions.filter((tx) => tx.jenis === "pengeluaran").reduce((map, tx) => map.set(tx.kategori, (map.get(tx.kategori) ?? 0) + tx.nominal), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const topCategory = categories[0];
  const totalBalanceChange = totalIncome ? Math.round((totalBalance / totalIncome) * 100) : 0;
  const periodLabel = period[0].toUpperCase() + period.slice(1);
  const periodName = period === "week" ? "Week" : period === "month" ? "Month" : "Year";
  const rangeLabel = (start: Date, end: Date) => {
    if (period === "year") return start.getFullYear().toString();
    if (period === "month") return start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const startLabel = start.toLocaleDateString("en-US", { day: "numeric", ...(sameMonth ? {} : { month: "short" as const }) });
    const endLabel = end.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    return `${startLabel}–${endLabel}`;
  };

  return (
    <main className="shell">
      <AppHeader active="dashboard" />

      <section className="welcome" id="dashboard"><h1>Hello, <span>{name}</span></h1></section>

      <section className="period-filter" aria-label="Dashboard period">
        <div className="period-range"><i><CalendarDays /></i><div><span>This {periodName.toLowerCase()}</span><strong>{rangeLabel(currentStart, currentEnd)}</strong></div></div>
        <nav>{(["week", "month", "year"] as const).map((value) => <Link className={period === value ? "active" : ""} href={`/?period=${value}`} key={value}>{value}</Link>)}</nav>
      </section>

      <section className="dashboard-grid">
        <article className="card balance-card">
          <div className="card-title"><h2>Total balance</h2></div>
          <p className="muted all-time-label">All-time across all transactions</p>
          <strong>{currency.format(totalBalance)}</strong>
          <div className="balance-change"><TrendingUp /> {totalBalanceChange}% <span>of total income</span></div>
        </article>

        <article className="card cashflow-card" id="analytics">
          <div className="card-title"><h2>Cash flow</h2></div>
          <div className="cashflow-total"><span>{periodLabel} net flow</span><strong>{currency.format(balance)}</strong></div>
          <div className="chart-legend"><span><i className="income-dot" />Income</span><span><i className="expense-dot" />Expense</span></div>
          <div className="bars">{cashflow.map(({ label, income, expense }, index) => <div className="bar-group" key={`${label}-${index}`}><span className="chart-tooltip"><b>{label}</b><small><i className="income-dot" />Income <strong>{currency.format(income)}</strong></small><small><i className="expense-dot" />Expense <strong>{currency.format(expense)}</strong></small></span><i className="income-bar" style={{ height: `${Math.max((income / maxCashflow) * 100, income ? 6 : 0)}%` }} /><i className="expense-bar" style={{ height: `${Math.max((expense / maxCashflow) * 100, expense ? 6 : 0)}%` }} /></div>)}</div>
          <div className="days">{cashflow.map(({ label }, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
        </article>

        <article className="lime-spend">
          <h2>{periodLabel} spend</h2>
          <p className="muted">Total expenses for this period</p>
          <strong>{currency.format(expense)}</strong>
          <div className="balance-change"><TrendingDown /> {burnRate}% <span>of total income</span></div>
          <div className="spend-insight">
            <span>Top category</span>
            <b>{topCategory ? translateCategory(topCategory[0]) : "No expenses"}</b>
            <small>{topCategory ? `${currency.format(topCategory[1])} · ${expense ? Math.round((topCategory[1] / expense) * 100) : 0}% of spend` : "No transaction in this period"}</small>
          </div>
        </article>

        <article className="card category-card">
          <div className="card-title"><h2>Spending categories</h2></div>
          <ul>{categories.map(([category, amount], index) => <li key={category}><span className="round-icon">{index === 0 ? <TrendingDown /> : <CreditCard />}</span><div><b>{translateCategory(category)}</b><small>{currency.format(amount)}</small></div><em>{expense ? `${Math.round((amount / expense) * 100)}%` : "—"}</em></li>)}</ul>
          {!categories.length && <p className="category-empty">No expenses in this period.</p>}
        </article>

        <article className="card activity-card" id="transactions">
          <div className="activity-head"><span>Recent activity</span><button><CalendarDays /></button></div>
          <div className="transaction-list">{transactions.slice(0, 3).map((tx) => <div key={tx.id}><span className="round-icon"><CreditCard /></span><div><b>{tx.item}</b><small>{dateLabel.format(new Date(tx.created_at))} · {translateCategory(tx.kategori)}</small></div><strong className={tx.jenis === "pemasukan" ? "income" : ""}>{tx.jenis === "pemasukan" ? "+ " : "− "}{currency.format(tx.nominal)}</strong></div>)}</div>
        </article>

        <article className="card comparison-card">
          <div className="comparison-heading"><div><span>{periodName} comparison</span><h2>This {periodName.toLowerCase()} vs last {periodName.toLowerCase()}</h2></div><TrendingUp /></div>
          <div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>Metric</th><th>This {periodName.toLowerCase()} <small>{rangeLabel(currentStart, currentEnd)}</small></th><th>Last {periodName.toLowerCase()} <small>{rangeLabel(previousStart, previousEnd)}</small></th><th>Difference</th><th>Change</th></tr></thead><tbody>{comparison.map(([label, current, previous]) => {
            const difference = current - previous;
            const change = previous ? Math.round((difference / Math.abs(previous)) * 100) : current ? 100 : 0;
            const positive = label === "Expense" ? difference <= 0 : difference >= 0;
            return <tr key={label}><th>{label}</th><td>{currency.format(current)}</td><td>{currency.format(previous)}</td><td className={positive ? "positive" : "negative"}>{difference >= 0 ? "+" : "−"}{currency.format(Math.abs(difference))}</td><td><span className={positive ? "positive" : "negative"}>{change >= 0 ? "+" : ""}{change}%</span></td></tr>;
          })}</tbody></table></div>
        </article>
      </section>
    </main>
  );
}
