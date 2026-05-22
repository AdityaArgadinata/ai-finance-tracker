"use client";

interface SummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  burnRate: number;
}

export function SummaryCards({
  totalBalance,
  totalIncome,
  totalExpense,
  burnRate,
}: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Determine burn rate color and status in terminal style
  const getBurnRateColor = (rate: number) => {
    if (rate <= 50) return { textClass: "text-[#00ff66]", bgClass: "bg-[#0a3311]" };
    if (rate <= 80) return { textClass: "text-[#ffb000]", bgClass: "bg-[#3d2700]" };
    return { textClass: "text-[#ff4444]", bgClass: "bg-[#3d0f0f]" };
  };

  const burnRateColor = getBurnRateColor(burnRate);
  const balanceColor = totalBalance >= 0 ? "text-[#00ff66]" : "text-[#ff4444]";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
      
      {/* Total Balance Card */}
      <div className="border border-[#333] bg-[#0c0c0c] p-4 flex flex-col justify-between hover:border-[#444] transition-all">
        <div>
          <p className="text-slate-400 font-bold uppercase tracking-wider">
            Total Balance
          </p>
          <p className={`mt-2 text-2xl font-black ${balanceColor}`}>
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          * CURRENT NET POSITION
        </p>
      </div>

      {/* Total Income Card */}
      <div className="border border-[#333] bg-[#0c0c0c] p-4 flex flex-col justify-between hover:border-[#444] transition-all">
        <div>
          <p className="text-slate-400 font-bold uppercase tracking-wider">
            Total Inflow
          </p>
          <p className="mt-2 text-2xl font-black text-[#00ff66]">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          * SUMMED GROSS RECEIPTS
        </p>
      </div>

      {/* Total Expense Card */}
      <div className="border border-[#333] bg-[#0c0c0c] p-4 flex flex-col justify-between hover:border-[#444] transition-all">
        <div>
          <p className="text-slate-400 font-bold uppercase tracking-wider">
            Total Outflow
          </p>
          <p className="mt-2 text-2xl font-black text-[#ff4444]">
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          * AGGREGATE DEBIT OUTFLOWS
        </p>
      </div>

      {/* Burn Rate Card */}
      <div className="border border-[#333] bg-[#0c0c0c] p-4 flex flex-col justify-between hover:border-[#444] transition-all">
        <div>
          <p className="text-slate-400 font-bold uppercase tracking-wider">
            Burn Rate Indicator
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-2xl font-black ${burnRateColor.textClass}`}>
              {burnRate.toFixed(1)}%
            </span>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold ${burnRateColor.bgClass} ${burnRateColor.textClass}`}>
              {burnRate <= 50 ? "SAFE" : burnRate <= 80 ? "WARN" : "RISK"}
            </span>
          </div>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          * EXPENSE VS INCOME RATIO
        </p>
      </div>

    </div>
  );
}
