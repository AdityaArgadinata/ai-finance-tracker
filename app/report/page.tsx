import "./report.css";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { getTransactions } from "@/lib/supabase";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const monthKey = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" });
const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" });

export default async function ReportPage() {
  const transactions = await getTransactions();
  const months = new Map<string, { income: number; expense: number; count: number }>();
  for (const tx of transactions) {
    const key = monthKey.format(new Date(tx.created_at));
    const totals = months.get(key) ?? { income: 0, expense: 0, count: 0 };
    totals[tx.jenis === "pemasukan" ? "income" : "expense"] += tx.nominal;
    totals.count += 1;
    months.set(key, totals);
  }

  return (
    <main className="shell">
      <AppHeader active="report" />
      <section className="page-heading"><div><span>Expanse</span><h1>Report</h1></div><p>Monthly financial summary</p></section>
      <article className="card comparison-card">
        <div className="comparison-heading"><div><span>Monthly report</span><h2>Income, expense and net balance</h2></div></div>
        {!months.size ? <p className="empty-transactions">No transactions yet.</p> : <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead><tr><th scope="col">Month</th><th scope="col">Transactions</th><th scope="col">Income</th><th scope="col">Expense</th><th scope="col">Net balance</th></tr></thead>
            <tbody>{[...months].sort(([a], [b]) => b.localeCompare(a)).map(([month, totals]) => <tr className="report-row" key={month}>
              <th scope="row"><Link className="report-row-link" href={`/report/${month}`}>{monthLabel.format(new Date(`${month}-01T00:00:00+07:00`))}</Link></th>
              <td>{totals.count}</td><td>{currency.format(totals.income)}</td><td>{currency.format(totals.expense)}</td>
              <td className={totals.income >= totals.expense ? "positive" : "negative"}>{currency.format(totals.income - totals.expense)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </article>
    </main>
  );
}
