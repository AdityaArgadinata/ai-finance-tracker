import { AppHeader } from "@/app/components/AppHeader";
import { TransactionsTable } from "@/app/components/TransactionsTable";
import { getTransactions } from "@/lib/supabase";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <main className="shell">
      <AppHeader active="transactions" />
      <section className="page-heading">
        <div><span>Expanse</span><h1>Transactions</h1></div>
        <p>{transactions.length} records</p>
      </section>
      <TransactionsTable transactions={transactions} />
    </main>
  );
}
