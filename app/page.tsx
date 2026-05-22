import { getTransactions, type Transaction } from "@/lib/supabase";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { SummaryCards } from "@/app/components/SummaryCards";
import { AIAdvisorCard } from "@/app/components/AIAdvisorCard";
import { DashboardClient } from "@/app/components/DashboardClient";
import { DateRangeFilter } from "@/app/components/DateRangeFilter";
import { PaginatedTransactions } from "@/app/components/PaginatedTransactions";

interface TrendDataPoint {
  date: string;
  pemasukan: number;
  pengeluaran: number;
}

interface CategoryBreakdown {
  kategori: string;
  nominal: number;
}

function aggregateTrendData(transactions: Transaction[]): TrendDataPoint[] {
  const trendMap = new Map<string, { pemasukan: number; pengeluaran: number }>();

  transactions.forEach((tx) => {
    const date = format(new Date(tx.created_at), "dd MMM", { locale: idLocale });

    const existing = trendMap.get(date) || {
      pemasukan: 0,
      pengeluaran: 0,
    };

    if (tx.jenis === "pemasukan") {
      existing.pemasukan += tx.nominal;
    } else {
      existing.pengeluaran += tx.nominal;
    }

    trendMap.set(date, existing);
  });

  return Array.from(trendMap.entries())
    .reverse()
    .map(([date, values]) => ({
      date,
      pemasukan: values.pemasukan,
      pengeluaran: values.pengeluaran,
    }));
}

function aggregateCategoryBreakdown(
  transactions: Transaction[]
): CategoryBreakdown[] {
  const categoryMap = new Map<string, number>();

  transactions.forEach((tx) => {
    if (tx.jenis === "pengeluaran") {
      const existing = categoryMap.get(tx.kategori) || 0;
      categoryMap.set(tx.kategori, existing + tx.nominal);
    }
  });

  return Array.from(categoryMap.entries())
    .map(([kategori, nominal]) => ({ kategori, nominal }))
    .sort((a, b) => b.nominal - a.nominal);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const startDateParam = params.startDate as string | undefined;
  const endDateParam = params.endDate as string | undefined;

  const allTransactions = await getTransactions();

  // Filter transactions by date range if provided
  let filteredTransactions = allTransactions;

  if (startDateParam || endDateParam) {
    filteredTransactions = allTransactions.filter((tx) => {
      const txDate = new Date(tx.created_at);

      if (startDateParam) {
        const startDate = new Date(startDateParam);
        startDate.setHours(0, 0, 0, 0);
        if (txDate < startDate) return false;
      }

      if (endDateParam) {
        const endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
        if (txDate > endDate) return false;
      }

      return true;
    });
  }

  // Calculate summary statistics from filtered data
  const totalIncome = filteredTransactions
    .filter((tx) => tx.jenis === "pemasukan")
    .reduce((sum, tx) => sum + tx.nominal, 0);

  const totalExpense = filteredTransactions
    .filter((tx) => tx.jenis === "pengeluaran")
    .reduce((sum, tx) => sum + tx.nominal, 0);

  const totalBalance = totalIncome - totalExpense;
  
  // Calculate burn rate percentage
  const burnRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // Aggregate data for charts
  const trendData = aggregateTrendData(filteredTransactions);
  const categoryBreakdown = aggregateCategoryBreakdown(filteredTransactions);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard Keuangan
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Analisis real-time transaksi dan pengeluaran Anda
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Date Range Filter */}
          <section>
            <DateRangeFilter />
          </section>

          {/* Summary Cards Section */}
          <section>
            <SummaryCards
              totalBalance={totalBalance}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              burnRate={burnRate}
            />
          </section>

          {/* AI Advisor Section */}
          <section>
            <AIAdvisorCard
              summaryData={{
                totalIncome,
                totalExpense,
                totalBalance,
                burnRate,
                topCategories: categoryBreakdown.slice(0, 3),
              }}
            />
          </section>

          {/* Charts Section */}
          <section>
            <DashboardClient
              trendData={trendData}
              categoryBreakdown={categoryBreakdown}
            />
          </section>

          {/* Paginated Recent Transactions Section */}
          <section>
            <PaginatedTransactions transactions={filteredTransactions} />
          </section>
        </div>
      </div>
    </div>
  );
}
