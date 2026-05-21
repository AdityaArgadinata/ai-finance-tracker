"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface SummaryCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export function SummaryCards({
  totalBalance,
  totalIncome,
  totalExpense,
}: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Total Balance Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Saldo
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Balance terakhir
        </p>
      </div>

      {/* Total Income Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Pemasukan
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Semua pemasukan
        </p>
      </div>

      {/* Total Expense Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Pengeluaran
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Semua pengeluaran
        </p>
      </div>
    </div>
  );
}
