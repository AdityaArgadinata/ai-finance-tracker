"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { format, subDays } from "date-fns";

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

  // Check if active preset matches 7 days or 30 days
  const is7DaysActive = startDate && endDate && 
    (new Date(endDate).getTime() - new Date(startDate).getTime() === 7 * 24 * 60 * 60 * 1000);

  const is30DaysActive = startDate && endDate && 
    (new Date(endDate).getTime() - new Date(startDate).getTime() === 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="font-mono text-xs text-white space-y-4">
      {/* Date Pickers - Left Right Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        {/* Preset Buttons */}
        <div className="flex gap-2 h-9 items-center">
          <button
            onClick={handleLast7Days}
            className={`flex-1 h-full font-bold border transition-colors cursor-pointer ${
              is7DaysActive
                ? "bg-[#00a2ff] border-[#00a2ff] text-white"
                : "border-[#333] bg-[#111] text-slate-300 hover:text-white"
            }`}
          >
            [ 7 Hari ]
          </button>
          <button
            onClick={handleLast30Days}
            className={`flex-1 h-full font-bold border transition-colors cursor-pointer ${
              is30DaysActive
                ? "bg-[#00a2ff] border-[#00a2ff] text-white"
                : "border-[#333] bg-[#111] text-slate-300 hover:text-white"
            }`}
          >
            [ 30 Hari ]
          </button>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
            Tanggal Mulai (Dari)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-9 bg-black border border-[#333] px-2 text-white font-mono placeholder-[#555] focus:outline-none focus:border-[#ffb000]"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
            Tanggal Akhir (Ke)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full h-9 bg-black border border-[#333] px-2 text-white font-mono placeholder-[#555] focus:outline-none focus:border-[#ffb000]"
          />
        </div>

        {/* Action Triggers */}
        <div className="flex gap-2 h-9 items-center">
          <button
            onClick={handleApplyFilter}
            disabled={!startDate || !endDate}
            className="flex-1 h-full font-bold border border-[#00ff66] text-[#00ff66] hover:bg-[#00ff66]/10 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent transition-all"
          >
            [ Terapkan ]
          </button>
          {hasActiveFilter && (
            <button
              onClick={handleClearFilter}
              className="px-2.5 h-full font-bold border border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444]/10 cursor-pointer transition-all flex items-center justify-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badge */}
      {hasActiveFilter && (
        <div className="flex items-center gap-2 text-[10px] text-[#ffb000]">
          <span>&gt; BATAS RENTANG TANGGAL AKTIF:</span>
          {startDate && (
            <span className="underline">
              {format(new Date(startDate), "dd MMM yyyy")}
            </span>
          )}
          {startDate && endDate && <span>KE</span>}
          {endDate && (
            <span className="underline">
              {format(new Date(endDate), "dd MMM yyyy")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
