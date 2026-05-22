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
    <div className="space-y-3 font-mono text-xs">
      <RecentTransactions transactions={paginatedTransactions} />

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#333] bg-[#0c0c0c] p-3 text-slate-300">
          <div>
            Showing <span className="font-bold text-white">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-white">
              {Math.min(endIndex, transactions.length)}
            </span>{" "}
            of <span className="font-bold text-white">{transactions.length}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center justify-center gap-1 border border-[#333] bg-[#111] px-3 py-1.5 font-bold text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>PREV</span>
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === "number" && handlePageChange(page)}
                  disabled={page === "..." || page === currentPage}
                  className={`px-3 py-1.5 font-bold transition-colors ${
                    page === currentPage
                      ? "bg-[#00a2ff] text-white border border-[#00a2ff]"
                      : page === "..."
                        ? "cursor-default text-slate-600"
                        : "border border-[#333] bg-[#111] text-slate-300 hover:text-white cursor-pointer"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center gap-1 border border-[#333] bg-[#111] px-3 py-1.5 font-bold text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              <span>NEXT</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
