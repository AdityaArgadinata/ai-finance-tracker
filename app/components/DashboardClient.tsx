"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { translateCategory } from "@/lib/utils";

interface TrendDataPoint {
  date: string;
  pemasukan: number;
  pengeluaran: number;
}

interface CategoryBreakdown {
  kategori: string;
  nominal: number;
}

interface Transaction {
  id: number;
  created_at: string;
  jenis: "pemasukan" | "pengeluaran";
  kategori: string;
  item: string;
  nominal: number;
}

interface DashboardClientProps {
  trendData: TrendDataPoint[];
  categoryBreakdown: CategoryBreakdown[];
  transactions?: Transaction[];
}

const COLORS = [
  "#00ff66", // bright green
  "#ffb000", // amber
  "#ff4444", // red
  "#00a2ff", // blue
  "#9b5de5", // purple
  "#f15bb5", // pink
  "#fee440", // yellow
  "#00f5d4", // teal
];

// Helper to subtract days
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};



export function DashboardClient({
  trendData,
  categoryBreakdown,
  transactions = [],
}: DashboardClientProps) {
  const [timeframe, setTimeframe] = useState<string>("1Y");
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [interval, setInterval] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    const handle = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Filter trendData based on timeframe
  const getFilteredTrendData = () => {
    const today = new Date();
    let cutoffDate = subDays(today, 365);
    if (timeframe === "3M") cutoffDate = subDays(today, 90);
    else if (timeframe === "6M") cutoffDate = subDays(today, 180);
    else if (timeframe === "1Y") cutoffDate = subDays(today, 365);
    else return trendData;

    return trendData.filter(d => {
      // Try to parse the date
      // Note: trendData dates are formatted like "dd MMM" (e.g., "16 Apr").
      // Since it lacks a year, we assume the current year.
      const currentYear = new Date().getFullYear();
      const dateStr = `${d.date} ${currentYear}`;
      const dDate = new Date(dateStr);
      return isNaN(dDate.getTime()) ? true : dDate >= cutoffDate;
    });
  };

  const filteredTrend = getFilteredTrendData();
  const totalExpense = categoryBreakdown.reduce((sum, item) => sum + item.nominal, 0);

  // ----------------------------------------------------
  // Historical Weekly Grid Calculations (bottom table)
  // ----------------------------------------------------
  const anchor = transactions.length > 0
    ? new Date(Math.max(...transactions.map(t => new Date(t.created_at).getTime())))
    : new Date();

  // Create 12 intervals (weeks or calendar months)
  const intervals: { start: Date; end: Date; label: string }[] = [];
  if (interval === "weekly") {
    for (let i = 0; i < 12; i++) {
      const end = addDays(anchor, -i * 7);
      const start = addDays(anchor, -(i + 1) * 7);
      const label = format(end, "dd-MMM");
      intervals.push({ start, end, label });
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const start = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1, 0, 0, 0, 0);
      const end = new Date(anchor.getFullYear(), anchor.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = format(start, "MMM-yy");
      intervals.push({ start, end, label });
    }
  }
  intervals.reverse(); // Oldest interval first

  // Get top categories
  const topCategories = categoryBreakdown.slice(0, 3).map(c => c.kategori);

  // Rows definition: Name, color class, type (for lookup)
  const rows = [
    { name: "Net Savings Trend (BI) - Median", type: "balance", color: "text-slate-400" },
    { name: "Total Expanse Ledger Inc", type: "expense", color: "text-[#00a2ff] font-bold" },
    ...topCategories.map((cat, idx) => ({
      name: translateCategory(cat),
      type: `category-${cat}`,
      color: idx === 0 ? "text-[#00ff66]" : idx === 1 ? "text-[#ffb000]" : "text-[#ff4444]"
    }))
  ];

  // Helper to compute interval value
  const getIntervalValue = (type: string, start: Date, end: Date): number => {
    const intervalTxs = transactions.filter(t => {
      const d = new Date(t.created_at);
      return d >= start && d <= end;
    });

    if (type === "balance") {
      const inc = intervalTxs.filter(t => t.jenis === "pemasukan").reduce((s, t) => s + t.nominal, 0);
      const exp = intervalTxs.filter(t => t.jenis === "pengeluaran").reduce((s, t) => s + t.nominal, 0);
      return inc - exp;
    }
    if (type === "expense") {
      return intervalTxs.filter(t => t.jenis === "pengeluaran").reduce((s, t) => s + t.nominal, 0);
    }
    if (type.startsWith("category-")) {
      const cat = type.replace("category-", "");
      return intervalTxs.filter(t => t.jenis === "pengeluaran" && t.kategori === cat).reduce((s, t) => s + t.nominal, 0);
    }
    return 0;
  };

  // Compact currency formatter (Millions/Thousands/Zero)
  const formatCompactVal = (val: number, type: string) => {
    if (val === 0) return "0";

    const isNegative = val < 0;
    const absVal = Math.abs(val);
    let suffix = "";
    let formattedNum = "";

    if (absVal >= 1000000) {
      formattedNum = (absVal / 1000000).toFixed(1).replace(/\.0$/, "");
      suffix = "M";
    } else if (absVal >= 1000) {
      formattedNum = (absVal / 1000).toFixed(1).replace(/\.0$/, "");
      suffix = "k";
    } else {
      formattedNum = absVal.toString();
    }

    const sign = isNegative ? "-" : (type === "balance" ? "+" : "");
    return `${sign}${formattedNum}${suffix}`;
  };

  // Compute nominal cell values
  const gridData = rows.map(row => {
    const cells = intervals.map((w) => {
      const val = getIntervalValue(row.type, w.start, w.end);
      return { label: w.label, val };
    });

    return { rowName: row.name, color: row.color, type: row.type, cells };
  });

  const renderGridCell = (val: number, type: string, key: string | number) => {
    const formatted = formatCompactVal(val, type);
    
    // Style classes based on requirements:
    // positive net savings green (text-[#00ff66] bg-[#0a3311])
    // negative net savings red (text-[#ff4444] bg-[#3d0f0f])
    // outflows red (text-[#ff4444]) when greater than 0
    let textClass = "text-slate-500";
    let bgClass = "";

    if (val !== 0) {
      if (type === "balance") {
        const isPositive = val > 0;
        textClass = isPositive ? "text-[#00ff66]" : "text-[#ff4444]";
        bgClass = isPositive ? "bg-[#0a3311]" : "bg-[#3d0f0f]";
      } else {
        // Outflows (expense or category spend)
        textClass = "text-[#ff4444]";
      }
    }

    return (
      <td key={key} className={`p-1.5 text-center font-mono font-bold border border-[#222] ${bgClass} ${textClass}`}>
        {formatted}
      </td>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upper Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Pemasukan vs Pengeluaran Line Chart */}
        <div className="border border-[#333] bg-[#0c0c0c] p-4 font-mono min-w-0">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#00ff66] inline-block"></span> Inflow vs Outflow Trend
          </h2>
          <div className="w-full h-[280px]">
            {isMounted ? (
              <ResponsiveContainer width="100%" height={280} minWidth={0}>
                <AreaChart data={filteredTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="terminalGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff66" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00ff66" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="terminalRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ff4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#222222" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }}
                    stroke="#333"
                  />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }}
                    stroke="#333"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000000",
                      border: "1px solid #555555",
                      color: "#ffffff",
                      fontFamily: "monospace",
                      fontSize: "11px",
                    }}
                    itemStyle={{ color: "#00ff66" }}
                    labelStyle={{ color: "#ffb000", fontWeight: "bold" }}
                    formatter={(value) => [formatCurrency(Number(value)), ""]}
                  />
                  <Legend iconType="square" wrapperStyle={{ fontSize: "11px", color: "#888" }} />
                  <Area
                    type="monotone"
                    dataKey="pemasukan"
                    stroke="#00ff66"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#terminalGreen)"
                    name="Inflow"
                    dot={{ r: 2, fill: "#00ff66" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pengeluaran"
                    stroke="#ff4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#terminalRed)"
                    name="Outflow"
                    dot={{ r: 2, fill: "#ff4444" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-[#0c0c0c] flex items-center justify-center text-slate-500 font-mono text-xs">
                Loading telemetry trend data...
              </div>
            )}
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="border border-[#333] bg-[#0c0c0c] p-4 font-mono min-w-0">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#ffb000] inline-block"></span> Expense Breakdown by Category
          </h2>
          <div className="w-full h-[280px] flex flex-col justify-center items-center">
            {categoryBreakdown.length > 0 ? (
              isMounted ? (
                <ResponsiveContainer width="100%" height={280} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      outerRadius={75}
                      dataKey="nominal"
                      nameKey="kategori"
                      label={({ percent, index }: { percent?: number; index?: number }) => {
                        const rawCat = categoryBreakdown[index ?? 0]?.kategori;
                        const labelCat = rawCat ? translateCategory(rawCat) : "";
                        return `${labelCat} (${((percent ?? 0) * 100).toFixed(0)}%)`;
                      }}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#000000"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: "#000000",
                        border: "1px solid #555555",
                        color: "#ffffff",
                        fontFamily: "monospace",
                        fontSize: "11px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-[#0c0c0c] flex items-center justify-center text-slate-500 font-mono text-xs">
                  Loading breakdown data...
                </div>
              )
            ) : (
              <div className="text-[#888] text-xs">No expenses recorded</div>
            )}
          </div>
        </div>

      </div>

      {/* Rincian List Table (Grid) */}
      <div className="border border-[#333] bg-[#0c0c0c] p-4 font-mono">
        <h2 className="text-sm font-bold text-white mb-4">
          Expense Details by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryBreakdown.map((item, index) => {
            const percentage = totalExpense > 0 ? ((item.nominal / totalExpense) * 100).toFixed(1) : "0";
            return (
              <div
                key={item.kategori}
                className="p-3 border border-[#222] bg-black flex flex-col justify-between hover:border-[#444] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                    <span className="font-bold text-white text-xs">
                      {translateCategory(item.kategori)}
                    </span>
                  </div>
                  <span className="text-[#ffb000] text-xs font-bold">{percentage}%</span>
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="text-sm font-bold text-slate-200">
                    {formatCurrency(item.nominal)}
                  </div>
                  <div className="w-[45%] bg-[#111] h-1.5 border border-[#222] overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recorded Weekly/Monthly Nominal Cash Flow Panel */}
      <div className="border border-[#333] bg-[#0c0c0c] p-4 font-mono">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#333] pb-3 mb-4">
          <div className="text-sm font-bold text-white">
            {interval === "weekly" ? "Weekly" : "Monthly"} Cash Flow Summary (Last 12 {interval === "weekly" ? "Weeks" : "Months"}) - Nominal IDR
          </div>
          
          {/* Bloomberg styled filter dropdowns & blue timeframes */}
          <div className="flex flex-wrap items-center gap-3 mt-2 lg:mt-0 text-xs">
            {/* Filter 1 */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Comp Source</span>
              <span className="bg-[#e67e22] text-black px-2 py-0.5 font-bold cursor-pointer">
                Expanse Realtime
              </span>
            </div>

            {/* Interval Filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Interval</span>
              <button
                onClick={() => setInterval(prev => prev === "weekly" ? "monthly" : "weekly")}
                className="bg-[#e67e22] text-black px-2 py-0.5 font-bold cursor-pointer uppercase border-0 font-mono"
              >
                {interval}
              </button>
            </div>

            {/* Timeframe selector buttons (Bloomberg Blue) */}
            <div className="flex border border-[#333] ml-2">
              {["3M", "6M", "1Y", "Max"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 font-bold transition-all border-r last:border-0 border-[#333] ${
                    timeframe === tf
                      ? "bg-[#00a2ff] text-white"
                      : "bg-[#111] text-[#888] hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly/Monthly Historical Nominal Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="bg-[#11] text-slate-400 border-b border-[#333]">
                <th className="p-2 border border-[#222] w-1/4">
                  {interval === "weekly" ? "Week Ending" : "Month Ending"}
                </th>
                {intervals.map((w, idx) => (
                  <th key={idx} className="p-1.5 text-center border border-[#222] whitespace-nowrap">
                    {w.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[#151515] transition-colors border-b border-[#222]">
                  <td className={`p-2 border border-[#222] font-semibold ${row.color}`}>
                    {row.rowName}
                  </td>
                  {row.cells.map((cell, cellIdx) => renderGridCell(cell.val, row.type, cellIdx))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
