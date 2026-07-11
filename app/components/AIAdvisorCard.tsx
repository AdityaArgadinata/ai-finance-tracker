"use client";

import { useState } from "react";
import { getFinancialAdvice } from "@/app/actions/ai-advisor";

interface AIAdvisorCardProps {
  summaryData: {
    totalIncome: number;
    totalExpense: number;
    totalBalance: number;
    burnRate: number;
    topCategories: Array<{
      kategori: string;
      nominal: number;
    }>;
  };
}

export function AIAdvisorCard({ summaryData }: AIAdvisorCardProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFinancialAdvice(summaryData);
      setAdvice(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "KESALAHAN SYS: Koneksi ke agen AI gagal"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-xs flex flex-col justify-between h-full bg-white">
      {!advice ? (
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <p className="text-slate-400 leading-relaxed">
            Dapatkan saran singkat berdasarkan arus kas saat ini.
          </p>

          {loading && (
            <div className="space-y-1 bg-[#111] p-2 border border-[#222] text-[#ffb000]">
              <div>Menyiapkan data transaksi...</div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-ping bg-[#ffb000] rounded-full"></span>
                <span>Menyusun saran...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="border border-[#ff4444] bg-[#3d0f0f] p-2 text-[#ff4444] font-bold">
              {error}
            </div>
          )}

          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="w-full text-center border border-[#00ff66] text-[#00ff66] hover:bg-[#00ff66]/10 py-2 font-bold cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent transition-colors uppercase tracking-wider"
          >
            {loading ? "Menganalisis..." : "Dapatkan Saran AI"}
          </button>
        </div>
      ) : (
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <div className="border border-[#333] bg-[#080808] p-3 text-slate-200 leading-relaxed max-h-[160px] overflow-y-auto clean-scroll whitespace-pre-line text-[11px]">
            <span className="text-[#00ff66] font-bold block mb-1">Saran untuk Anda</span>
            {advice}
          </div>

          <button
            onClick={() => {
              setAdvice(null);
              setError(null);
            }}
            className="w-full text-center border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000]/10 py-1.5 font-bold cursor-pointer transition-colors uppercase tracking-wider"
          >
            Analisis Ulang
          </button>
        </div>
      )}
    </div>
  );
}
