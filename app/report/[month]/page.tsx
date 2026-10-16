import "./report.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AppHeader } from "@/app/components/AppHeader";
import { getTransactions } from "@/lib/supabase";
import { translateCategory } from "@/lib/utils";

const PAGE_SIZE = 10;
const colors = ["#c5ff4a", "#72d6b9", "#f4c95d", "#f28b82", "#8ea7ff", "#c79af2", "#66c7e8", "#e8e3d5", "#9cb56b", "#d98ca3"];
const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const monthKey = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" });
const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" });
const date = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function ReportDetailPage({ params, searchParams }: { params: Promise<{ month: string }>; searchParams: Promise<{ page?: string }> }) {
  const { month } = await params;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) notFound();
  const transactions = (await getTransactions()).filter((tx) => monthKey.format(new Date(tx.created_at)) === month);
  const requestedPage = Number((await searchParams).page ?? 1);
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const page = Number.isSafeInteger(requestedPage) ? Math.min(totalPages, Math.max(1, requestedPage)) : 1;
  const start = (page - 1) * PAGE_SIZE;
  const rows = transactions.slice(start, start + PAGE_SIZE);
  const categories = new Map<string, { income: number; expense: number }>();
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    const totals = categories.get(tx.kategori) ?? { income: 0, expense: 0 };
    if (tx.jenis === "pemasukan") { totals.income += tx.nominal; income += tx.nominal; }
    else { totals.expense += tx.nominal; expense += tx.nominal; }
    categories.set(tx.kategori, totals);
  }

  return (
    <main className="shell report-detail-page">
      <AppHeader active="report" />
      <section className="page-heading"><div><Link className="report-month" href="/report">← All reports</Link><h1>{monthLabel.format(new Date(`${month}-01T00:00:00+07:00`))}</h1></div><p>Net balance: {currency.format(income - expense)}</p></section>
      <div className="report-detail">
        <section className="analytics-lifetime" aria-label="Monthly totals">
          <article className="card analytics-total"><div><span>Income</span><small>{transactions.length} transactions this month</small></div><ArrowUpRight /><strong>{currency.format(income)}</strong></article>
          <article className="card analytics-total expense"><div><span>Expense</span><small>Monthly spending</small></div><ArrowDownRight /><strong>{currency.format(expense)}</strong></article>
        </section>
        <article className="card comparison-card report-categories">
          <div className="comparison-heading"><div><span>Breakdown</span><h2>Categories</h2></div></div>
          {!categories.size && <p className="empty-transactions">No categories in this month.</p>}
          {(["expense", "income"] as const).map((type) => {
            const items = [...categories].filter(([, totals]) => totals[type] > 0).sort(([, a], [, b]) => b[type] - a[type]);
            const total = type === "expense" ? expense : income;
            return items.length > 0 && <section className="report-category-group" key={type} aria-label={`${type} categories`}>
              <h3>{type === "expense" ? "Expense" : "Income"}</h3>
              <ul className="report-category-list">{items.map(([category, totals], index) => <li key={category}>
                <i style={{ background: colors[index % colors.length] }} />
                <div><b>{translateCategory(category)}</b><small>{currency.format(totals[type])}</small></div>
                <em>{Math.round(totals[type] / total * 100)}%</em>
              </li>)}</ul>
            </section>;
          })}
        </article>
        <article className="card comparison-card">
          <div className="comparison-heading"><div><span>{transactions.length} transactions</span><h2>Transactions</h2></div></div>
          {!transactions.length ? <p className="empty-transactions">No transactions in this month.</p> : <div className="comparison-table-wrap"><table className="comparison-table">
            <thead><tr><th scope="col">Description</th><th scope="col">Date (WIB)</th><th scope="col">Category</th><th scope="col">Type</th><th scope="col">Amount</th></tr></thead>
            <tbody>{rows.map((tx) => <tr key={tx.id}><th scope="row">{tx.item}</th><td>{date.format(new Date(tx.created_at))}</td><td>{translateCategory(tx.kategori)}</td><td>{tx.jenis === "pemasukan" ? "Income" : "Expense"}</td><td className={tx.jenis === "pemasukan" ? "positive" : "negative"}>{tx.jenis === "pemasukan" ? "+ " : "− "}{currency.format(tx.nominal)}</td></tr>)}</tbody>
          </table></div>}
          {transactions.length > 0 && <footer className="table-pagination report-pagination">
            <span>Showing <b>{start + 1}–{Math.min(start + PAGE_SIZE, transactions.length)}</b> of {transactions.length}</span>
            <nav className="pagination-controls" aria-label="Report transactions pagination">
              {page > 1 ? <Link href={`/report/${month}?page=${page - 1}`} scroll={false} aria-label="Previous page"><ChevronLeft /></Link> : <span className="disabled" aria-disabled="true" aria-label="Previous page"><ChevronLeft /></span>}
              <strong><small>Page</small>{page} <i>/</i> {totalPages}</strong>
              {page < totalPages ? <Link href={`/report/${month}?page=${page + 1}`} scroll={false} aria-label="Next page"><ChevronRight /></Link> : <span className="disabled" aria-disabled="true" aria-label="Next page"><ChevronRight /></span>}
            </nav>
          </footer>}
        </article>
      </div>
    </main>
  );
}
