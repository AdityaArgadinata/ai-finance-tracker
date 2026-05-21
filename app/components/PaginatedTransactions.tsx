"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecentTransactions } from "./RecentTransactions";

interface Transaction {
  id: number;
  created_at: string;
  jenis: "pemasukan" | "pengeluaran";
  kategori: string;
  item: string;
  nominal: number;
}

interface PaginatedTransactionsProps {
  transactions: Transaction[];
  itemsPerPage?: number;
}

export function PaginatedTransactions({
  transactions,
  itemsPerPage = 10,
}: PaginatedTransactionsProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      <RecentTransactions transactions={paginatedTransactions} />

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Menampilkan{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {startIndex + 1}
            </span>{" "}
            hingga{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(endIndex, transactions.length)}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {transactions.length}
            </span>{" "}
            transaksi
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === "number" && handlePageChange(page)}
                  disabled={page === "..." || page === currentPage}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : page === "..."
                        ? "cursor-default text-slate-400 dark:text-slate-600"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
