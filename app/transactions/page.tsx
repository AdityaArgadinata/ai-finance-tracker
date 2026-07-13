import { AppHeader } from "@/app/components/AppHeader";
import { TransactionsTable } from "@/app/components/TransactionsTable";
import { getTransactions } from "@/lib/supabase";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <main className="shell">
      <AppHeader active="transactions" />
      <TransactionsTable transactions={transactions} />
    </main>
  );
}
