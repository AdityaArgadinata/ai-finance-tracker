"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
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
        err instanceof Error ? err.message : "Terjadi kesalahan saat memproses AI"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-gradient-to-r dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          AI Financial Insight
        </h3>
      </div>

      {!advice ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Dapatkan insight keuangan personal dari AI Financial Advisor kami yang
            akan menganalisis pola pengeluaran dan memberikan rekomendasi.
          </p>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Minta Saran AI</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/30">
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {advice}
            </p>
          </div>

          <button
            onClick={() => {
              setAdvice(null);
              setError(null);
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            ← Kembali
          </button>
        </div>
      )}
    </div>
  );
}
