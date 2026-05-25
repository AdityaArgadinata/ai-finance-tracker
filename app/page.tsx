import { getTransactions, type Transaction } from "@/lib/supabase";
import { format } from "date-fns";
import { SummaryCards } from "@/app/components/SummaryCards";
import { AIAdvisorCard } from "@/app/components/AIAdvisorCard";
import { DashboardClient } from "@/app/components/DashboardClient";
import { DateRangeFilter } from "@/app/components/DateRangeFilter";
import { PaginatedTransactions } from "@/app/components/PaginatedTransactions";
import { ClientGate } from "@/app/components/ClientGate";

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
    const date = format(new Date(tx.created_at), "dd MMM");

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
  const burnRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // Aggregate data for charts
  const trendData = aggregateTrendData(filteredTransactions);
  const categoryBreakdown = aggregateCategoryBreakdown(filteredTransactions);

  // ----------------------------------------------------
  // Upper Table YoY and PoP Calculations (Monospace UI)
  // ----------------------------------------------------
  const anchorDate = allTransactions.length > 0
    ? new Date(Math.max(...allTransactions.map(t => new Date(t.created_at).getTime())))
    : new Date();

  // Month boundaries based on anchorDate
  const currentMonthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1, 0, 0, 0, 0);
  const currentMonthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const prevMonthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1, 0, 0, 0, 0);
  const prevMonthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 0, 23, 59, 59, 999);

  const currMonthTxs = allTransactions.filter(tx => {
    const d = new Date(tx.created_at);
    return d >= currentMonthStart && d <= currentMonthEnd;
  });

  const prevMonthTxs = allTransactions.filter(tx => {
    const d = new Date(tx.created_at);
    return d >= prevMonthStart && d <= prevMonthEnd;
  });

  const getMetricsForPeriod = (txs: Transaction[]) => {
    const income = txs.filter(t => t.jenis === "pemasukan").reduce((sum, t) => sum + t.nominal, 0);
    const expense = txs.filter(t => t.jenis === "pengeluaran").reduce((sum, t) => sum + t.nominal, 0);
    const balance = income - expense;
    const avgTx = txs.length > 0 ? txs.reduce((sum, t) => sum + t.nominal, 0) / txs.length : 0;
    const count = txs.length;

    // Top category spend
    const catMap = new Map<string, number>();
    txs.filter(t => t.jenis === "pengeluaran").forEach(t => {
      catMap.set(t.kategori, (catMap.get(t.kategori) || 0) + t.nominal);
    });
    let maxCatSpend = 0;
    catMap.forEach((val) => {
      if (val > maxCatSpend) maxCatSpend = val;
    });

    return { income, expense, balance, avgTx, count, maxCatSpend };
  };

  const currM = getMetricsForPeriod(currMonthTxs);
  const prevM = getMetricsForPeriod(prevMonthTxs);

  const currBurn = currM.income > 0 ? (currM.expense / currM.income) * 100 : 0;
  const prevBurn = prevM.income > 0 ? (prevM.expense / prevM.income) * 100 : 0;

  const computeGrowthRate = (curr: number, prev: number) => {
    if (prev === 0 && curr === 0) {
      return 0;
    }
    if (prev === 0) {
      return 100;
    }
    if (curr === 0) {
      return -100;
    }
    return parseFloat((((curr - prev) / prev) * 100).toFixed(2));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderCells = (
    curr: number,
    prev: number,
    type: "currency" | "percent" | "number",
    isInverse: boolean = false
  ) => {
    const diff = curr - prev;
    const growth = computeGrowthRate(curr, prev);

    let currStr = "";
    let prevStr = "";
    let diffStr = "";
    const growthStr = (growth >= 0 ? "+" : "") + growth.toFixed(1) + "%";

    if (type === "currency") {
      currStr = formatCurrency(curr);
      prevStr = formatCurrency(prev);
      diffStr = (diff >= 0 ? "+" : "-") + formatCurrency(Math.abs(diff));
    } else if (type === "percent") {
      currStr = curr.toFixed(1) + "%";
      prevStr = prev.toFixed(1) + "%";
      diffStr = (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
    } else {
      currStr = curr.toString();
      prevStr = prev.toString();
      diffStr = (diff >= 0 ? "+" : "") + diff.toString();
    }

    const isZero = diff === 0;
    const isPositive = diff > 0;
    const isGood = isZero ? null : (isInverse ? !isPositive : isPositive);

    const textClass = isZero ? "text-slate-400" : isGood ? "text-[#00ff66]" : "text-[#ff4444]";
    const bgClass = isZero ? "" : isGood ? "bg-[#0a3311]" : "bg-[#3d0f0f]";

    return (
      <>
        <td className="px-2 py-1 text-right font-mono border border-[#222222] text-slate-200">
          {currStr}
        </td>
        <td className="px-2 py-1 text-right font-mono border border-[#222222] text-slate-300">
          {prevStr}
        </td>
        <td className={`px-2 py-1 text-right font-mono font-semibold border border-[#222222] ${textClass}`}>
          {diffStr}
        </td>
        <td className={`px-2 py-1 text-center font-mono font-bold border border-[#222222] ${bgClass} ${textClass}`}>
          {growthStr}
        </td>
      </>
    );
  };

  return (
    <ClientGate>
      <div className="min-h-screen bg-black text-white font-mono overflow-x-hidden">
      {/* Bloomberg Top Title Bar */}
      <div className="w-full bg-[#52031a] flex items-center justify-between border-b border-[#222] text-sm font-bold">
        <div className="flex items-center">
          <div className="bg-[#e67e22] text-black px-4 py-1.5 font-black uppercase tracking-wider">
            EXPANSE MY Equity
          </div>
          <div className="bg-[#6d0925] text-white px-4 py-1.5 cursor-pointer hover:bg-[#800d2f] border-r border-[#444] flex items-center gap-1.5 transition-colors">
            Export <span className="text-xs">▼</span>
          </div>
        </div>
        <div className="text-slate-300 pr-4 text-xs font-semibold hidden md:block">
          Equity Dashboard v1.0.4
        </div>
      </div>

      {/* Bloomberg Navigation Menu Tabs */}
      <div className="w-full bg-[#161616] border-b border-[#222] flex items-center text-xs">
        <button className="px-5 py-2 border-r border-t border-[#333] border-t-white/30 text-white bg-black font-semibold font-mono tracking-wider">
          Inflection
        </button>
        <button className="px-5 py-2 border-r border-[#222] text-[#888] hover:text-white transition-colors font-mono tracking-wider cursor-not-allowed">
          KPI Correlation
        </button>
        <button className="px-5 py-2 border-r border-[#222] text-[#888] hover:text-white transition-colors font-mono tracking-wider cursor-not-allowed">
          Trend Analysis
        </button>
      </div>

      {/* Main Container */}
      <div className="p-4 space-y-6">
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#333] pb-2">
          <h1 className="text-lg font-bold text-white tracking-tight">
            Ringkasan Telemetri Keuangan - Keuangan Expanse
          </h1>
          <div className="text-[#888] text-xs mt-1 md:mt-0 flex items-center gap-1.5">
            Data hingga {format(anchorDate, "yyyy-MM-dd")} <span className="cursor-pointer text-white border border-[#555] rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px]" title="Info Telemetri DB Expanse">i</span> Tentang Data
          </div>
        </div>

        {/* Top Section Layout: Metrics Table + Side Panel Information */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Left Side: Alt Data Metrics Table */}
          <div className="xl:col-span-2 overflow-x-auto border border-[#333] bg-[#0c0c0c]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#111111] text-slate-400 border-b border-[#333]">
                  <th className="p-2 font-mono font-medium border-r border-[#222] w-[28%]">
                    Perbandingan Arus Kas Bulanan
                  </th>
                  <th className="p-2 text-right font-mono font-medium border-r border-[#222] w-[18%]">
                    {format(currentMonthStart, "MMM yyyy")} (Saat Ini)
                  </th>
                  <th className="p-2 text-right font-mono font-medium border-r border-[#222] w-[18%]">
                    {format(prevMonthStart, "MMM yyyy")} (Prev)
                  </th>
                  <th className="p-2 text-right font-mono font-medium border-r border-[#222] w-[18%]">
                    Perubahan Nominal
                  </th>
                  <th className="p-2 text-center font-mono font-medium w-[18%]">
                    Perubahan %
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Expanse Telemetry Core Section */}
                <tr className="bg-[#050505]">
                  <td colSpan={5} className="px-2 py-1.5 text-[#ffb000] font-bold border-b border-[#222]">
                    Inti Telemetri Expanse
                  </td>
                </tr>

                {/* Pemasukan Tercatat */}
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-2 border border-[#222] font-semibold text-slate-200">
                    <span className="text-[#00ff66] mr-1.5">●</span> Pemasukan Tercatat
                  </td>
                  {renderCells(currM.income, prevM.income, "currency")}
                </tr>

                {/* Pengeluaran Tercatat */}
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-2 border border-[#222] font-semibold text-slate-200">
                    <span className="text-[#ff4444] mr-1.5">●</span> Pengeluaran Tercatat
                  </td>
                  {renderCells(currM.expense, prevM.expense, "currency", true)}
                </tr>

                {/* Net Savings */}
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-2 border border-[#222] font-semibold text-slate-200">
                    <span className="text-[#00a2ff] mr-1.5">●</span> Recorded Net Savings
                  </td>
                  {renderCells(currM.balance, prevM.balance, "currency")}
                </tr>

                {/* Burn Rate */}
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-2 border border-[#222] font-semibold text-slate-200">
                    <span className="text-yellow-500 mr-1.5">●</span> Burn Rate
                  </td>
                  {renderCells(currBurn, prevBurn, "percent", true)}
                </tr>

                {/* Average Transaction Value */}
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-2 border border-[#222] font-semibold text-slate-200">
                    <span className="text-slate-400 mr-1.5">●</span> Nilai Rata-Rata Tercatat
                  </td>
                  {renderCells(currM.avgTx, prevM.avgTx, "currency")}
                </tr>

                {/* Transaction Frequency */}
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-2 border border-[#222] font-semibold text-slate-200">
                    <span className="text-slate-400 mr-1.5">●</span> Volume Transaksi Tercatat
                  </td>
                  {renderCells(currM.count, prevM.count, "number")}
                </tr>

                {/* Category-Level Spend Section */}
                <tr className="bg-[#050505]">
                  <td colSpan={5} className="px-2 py-1.5 text-[#ffb000] font-bold border-b border-[#222]">
                    Metrik Kategori
                  </td>
                </tr>

                {/* Recorded Top Category Outflow */}
                <tr className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-2 border border-[#222] font-semibold text-slate-200">
                    <span className="text-[#e67e22] mr-1.5">●</span> Pengeluaran Kategori Top Tercatat
                  </td>
                  {renderCells(currM.maxCatSpend, prevM.maxCatSpend, "currency", true)}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right Side: Expanse Telemetry Core Info Boxes */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Box 1 */}
            <div className="border border-[#333] bg-[#0c0c0c] p-4 text-xs font-mono">
              <div className="flex justify-between items-center text-[#ffb000] font-bold mb-2">
                <span>Inti Telemetri Expanse:</span>
                <span className="border border-[#555] px-1 hover:bg-[#222] cursor-pointer">?</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                <li><span className="text-slate-400 font-bold">Sumber:</span> Telemetri Real-time Supabase</li>
                <li><span className="text-slate-400 font-bold">Ruang Lingkup:</span> Log Pemasukan & Pengeluaran Pribadi</li>
                <li><span className="text-slate-400 font-bold">Volume:</span> {allTransactions.length} Tx Terdaftar</li>
                <li><span className="text-slate-400 font-bold">Mata Uang:</span> IDR (Rp)</li>
                <li><span className="text-slate-400 font-bold">Link Terminal:</span> SECM &lt;GO&gt;</li>
              </ul>
            </div>

            {/* AI Advisor Panel (Box 2) */}
            <div className="border border-[#333] bg-[#0c0c0c] p-4 text-xs font-mono flex-1 flex flex-col justify-between mt-0 xl:mt-2">
              <div className="flex justify-between items-center text-[#ffb000] font-bold mb-2">
                <span>Penasihat AI Expanse:</span>
                <span className="border border-[#555] px-1 hover:bg-[#222] cursor-pointer">?</span>
              </div>
              <AIAdvisorCard
                summaryData={{
                  totalIncome,
                  totalExpense,
                  totalBalance,
                  burnRate,
                  topCategories: categoryBreakdown.slice(0, 3),
                }}
              />
            </div>
          </div>

        </div>

        {/* Date Filters Area */}
        <section className="bg-black border border-[#333] p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">
            Filter Terminal
          </div>
          <DateRangeFilter />
        </section>

        {/* Summary Value Cards Panel */}
        <section>
          <div className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">
            Ledger Totals
          </div>
          <SummaryCards
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            burnRate={burnRate}
          />
        </section>

        {/* Chart Section */}
        <section>
          <DashboardClient
            trendData={trendData}
            categoryBreakdown={categoryBreakdown}
            transactions={filteredTransactions}
          />
        </section>

        {/* Paginated Transactions Section */}
        <section className="border border-[#333] bg-[#0c0c0c] p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-3">
            Transaction Ledger List
          </div>
          <PaginatedTransactions transactions={filteredTransactions} />
        </section>

      </div>
    </div>
  </ClientGate>
);
}
