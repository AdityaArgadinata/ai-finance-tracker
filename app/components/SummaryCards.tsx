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

  // Determine burn rate color and status
  const getBurnRateColor = (rate: number) => {
    if (rate <= 50) return { textClass: "text-[#00ff66]", bgClass: "bg-[#0a3311]" };
    if (rate <= 80) return { textClass: "text-[#ffb000]", bgClass: "bg-[#3d2700]" };
    return { textClass: "text-[#ff4444]", bgClass: "bg-[#3d0f0f]" };
  };

  const burnRateColor = getBurnRateColor(burnRate);
  const balanceColor = totalBalance >= 0 ? "text-[#00ff66]" : "text-[#ff4444]";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
      
      {/* Total Balance Card */}
      <div className="min-h-48 border border-[#333] bg-[#0c0c0c] p-6 flex flex-col justify-between hover:-translate-y-1 transition-all">
        <div>
          <p className="text-slate-400 font-bold uppercase tracking-wider">
            Total Saldo
          </p>
          <p className={`mt-4 text-3xl font-medium ${balanceColor}`}>
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          * POSISI BERSIH SAAT INI
        </p>
      </div>

      {/* Total Income Card */}
      <div className="min-h-48 border border-[#333] bg-[#0c0c0c] p-6 flex flex-col justify-between hover:-translate-y-1 transition-all">
        <div>
          <p className="text-slate-400 font-bold uppercase tracking-wider">
            Total Pemasukan
          </p>
          <p className="mt-4 text-3xl font-medium text-[#00ff66]">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          * TOTAL PENERIMAAN KOTOR
        </p>
      </div>

      {/* Total Expense Card */}
      <div className="min-h-48 border border-[#333] bg-[#0c0c0c] p-6 flex flex-col justify-between hover:-translate-y-1 transition-all">
        <div>
          <p className="text-slate-400 font-bold uppercase tracking-wider">
            Total Pengeluaran
          </p>
          <p className="mt-4 text-3xl font-medium text-[#ff4444]">
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          * TOTAL PENGELUARAN DEBIT
        </p>
      </div>

      {/* Burn Rate Card */}
      <div className="min-h-48 border border-[#333] bg-[#0c0c0c] p-6 flex flex-col justify-between hover:-translate-y-1 transition-all">
        <div>
          <p className="text-slate-400 font-bold uppercase tracking-wider">
            Indikator Tingkat Pembakaran
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-2xl font-black ${burnRateColor.textClass}`}>
              {burnRate.toFixed(1)}%
            </span>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold ${burnRateColor.bgClass} ${burnRateColor.textClass}`}>
              {burnRate <= 50 ? "AMAN" : burnRate <= 80 ? "PERINGATAN" : "RISIKO"}
            </span>
          </div>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          * RASIO PENGELUARAN VS PEMASUKAN
        </p>
      </div>

    </div>
  );
}
