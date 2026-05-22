"use client";

import { TrendingUp, TrendingDown, Wallet, Flame } from "lucide-react";

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
    if (rate <= 50) return { bgClass: "bg-green-100 dark:bg-green-900", textClass: "text-green-600 dark:text-green-400" };
    if (rate <= 80) return { bgClass: "bg-yellow-100 dark:bg-yellow-900", textClass: "text-yellow-600 dark:text-yellow-400" };
    return { bgClass: "bg-red-100 dark:bg-red-900", textClass: "text-red-600 dark:text-red-400" };
  };

  const burnRateColor = getBurnRateColor(burnRate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Total Balance Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Saldo
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 ml-4">
            <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Balance terakhir
        </p>
      </div>

      {/* Total Income Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Pemasukan
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0 ml-4">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Semua pemasukan
        </p>
      </div>

      {/* Total Expense Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Pengeluaran
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 flex-shrink-0 ml-4">
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Semua pengeluaran
        </p>
      </div>

      {/* Burn Rate Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Indikator Burn Rate
            </p>
            <p className={`mt-2 text-3xl font-bold ${burnRateColor.textClass}`}>
              {burnRate.toFixed(1)}%
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${burnRateColor.bgClass} flex-shrink-0 ml-4`}>
            <Flame className={`h-5 w-5 ${burnRateColor.textClass}`} />
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Pengeluaran vs pemasukan bulan ini
        </p>
      </div>
    </div>
  );
}
