import { AppHeader } from "@/app/components/AppHeader";
import { TransactionsTable } from "@/app/components/TransactionsTable";
import { getTransactions } from "@/lib/supabase";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "" } = await searchParams;
  const transactions = await getTransactions();

  return (
    <main className="shell">
      <AppHeader active="transactions" />
      <TransactionsTable key={category} transactions={transactions} initialCategory={category} />
    </main>
  );
}
