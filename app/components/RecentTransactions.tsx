"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Transaction {
  id: number;
  created_at: string;
  jenis: "pemasukan" | "pengeluaran";
  kategori: string;
  item: string;
  nominal: number;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm", {
      locale: idLocale,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Transaksi Terakhir
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                Item
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-400">
                Jenis
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-400">
                Nominal
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {formatDate(tx.created_at)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                  {tx.item}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium">
                    {tx.kategori}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {tx.jenis === "pemasukan" ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Masuk
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          Keluar
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td
                  className={`px-6 py-4 text-right text-sm font-semibold ${
                    tx.jenis === "pemasukan"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.jenis === "pemasukan" ? "+" : "-"}
                  {formatCurrency(tx.nominal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="flex items-center justify-center px-6 py-12">
          <p className="text-slate-500 dark:text-slate-400">
            Belum ada transaksi
          </p>
        </div>
      )}
    </div>
  );
}
