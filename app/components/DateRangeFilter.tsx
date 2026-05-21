"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { format, subDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface DateRangeFilterProps {
  onFiltered?: () => void;
}

export function DateRangeFilter({ onFiltered }: DateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const [startDate, setStartDate] = useState(startDateParam || "");
  const [endDate, setEndDate] = useState(endDateParam || "");

  const applyDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);

    const params = new URLSearchParams(searchParams);
    params.set("startDate", start);
    params.set("endDate", end);

    const queryString = params.toString();
    router.push(`/?${queryString}`);
    onFiltered?.();
  };

  const handleLast7Days = () => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 7);

    const start = format(sevenDaysAgo, "yyyy-MM-dd");
    const end = format(today, "yyyy-MM-dd");

    applyDateRange(start, end);
  };

  const handleLast30Days = () => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    const start = format(thirtyDaysAgo, "yyyy-MM-dd");
    const end = format(today, "yyyy-MM-dd");

    applyDateRange(start, end);
  };

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      const params = new URLSearchParams(searchParams);
      params.set("startDate", startDate);
      params.set("endDate", endDate);
      const queryString = params.toString();
      router.push(`/?${queryString}`);
      onFiltered?.();
    }
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    router.push("/");
    onFiltered?.();
  };

  const hasActiveFilter = startDate || endDate;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800" style={{ fontFamily: "system-ui, -apple-system, San Francisco, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      {/* Quick Filter Buttons */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={handleLast7Days}
          className={`flex-1 py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all ${
            startDate && endDate
              ? new Date(endDate).getTime() - new Date(startDate).getTime() ===
                7 * 24 * 60 * 60 * 1000
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          7 Hari
        </button>
        <button
          onClick={handleLast30Days}
          className={`flex-1 py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all ${
            startDate && endDate
              ? new Date(endDate).getTime() - new Date(startDate).getTime() ===
                30 * 24 * 60 * 60 * 1000
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          30 Hari
        </button>
      </div>

      {/* Date Pickers - Left Right Layout */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Dari
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 transition-all"
          />
        </div>

        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Sampai
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={handleApplyFilter}
          disabled={!startDate || !endDate}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Terapkan
        </button>
        {hasActiveFilter && (
          <button
            onClick={handleClearFilter}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            <span>Hapus</span>
          </button>
        )}
      </div>

      {/* Active Filter Badge */}
      {hasActiveFilter && (
        <div className="mt-4 flex flex-wrap gap-2">
          {startDate && (
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {format(new Date(startDate), "dd MMM", { locale: idLocale })}
            </span>
          )}
          {startDate && endDate && (
            <span className="inline-block text-xs font-medium text-slate-500 dark:text-slate-400 py-1.5">
              →
            </span>
          )}
          {endDate && (
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {format(new Date(endDate), "dd MMM", { locale: idLocale })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
