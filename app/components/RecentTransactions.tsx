"use client";

import { format } from "date-fns";
import { translateCategory } from "@/lib/utils";

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
    return format(new Date(dateString), "dd-MMM-yyyy HH:mm");
  };

  return (
    <div className="font-mono text-xs border border-[#333] bg-[#0c0c0c]">
      <div className="border-b border-[#333] px-4 py-2.5 bg-[#111] flex justify-between items-center">
        <h2 className="font-bold text-[#ffb000] uppercase tracking-wider">
          Daftar Buku Transaksi
        </h2>
        <span className="text-[10px] text-slate-400 font-bold">
          TOTAL REKAMAN AKTIF: {transactions.length}
        </span>
      </div>

      <div className="overflow-x-auto clean-scroll">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#151515] text-slate-400 border-b border-[#333]">
              <th className="px-4 py-2 font-bold border-r border-[#222] w-1/4">
                Waktu Pencatat
              </th>
              <th className="px-4 py-2 font-bold border-r border-[#222] w-1/4">
                Item / Deskripsi
              </th>
              <th className="px-4 py-2 font-bold border-r border-[#222] w-1/6">
                Kategori
              </th>
              <th className="px-4 py-2 font-bold border-r border-[#222] w-1/6">
                Jenis
              </th>
              <th className="px-4 py-2 font-bold text-right w-1/6">
                Nilai (IDR)
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
              >
                <td className="px-4 py-2 text-slate-300 border-r border-[#222] whitespace-nowrap">
                  {formatDate(tx.created_at)}
                </td>
                <td className="px-4 py-2 text-white font-semibold border-r border-[#222]">
                  {tx.item}
                </td>
                <td className="px-4 py-2 border-r border-[#222]">
                  <span className="font-bold text-white text-[10px]">
                    {translateCategory(tx.kategori)}
                  </span>
                </td>
                <td className="px-4 py-2 border-r border-[#222]">
                  <span
                    className={`font-bold text-[10px] ${
                      tx.jenis === "pemasukan"
                        ? "text-[#00ff66]"
                        : "text-[#ff4444]"
                    }`}
                  >
                    {tx.jenis === "pemasukan" ? "PEMASUKAN" : "PENGELUARAN"}
                  </span>
                </td>
                <td
                  className={`px-4 py-2 text-right font-bold ${
                    tx.jenis === "pemasukan"
                      ? "text-[#00ff66]"
                      : "text-[#ff4444]"
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
        <div className="flex items-center justify-center py-8">
          <p className="text-slate-500 font-bold">
            NO TRANSACTION RECORDS FOUND
          </p>
        </div>
      )}
    </div>
  );
}
