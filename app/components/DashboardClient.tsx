"use client";

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

interface TrendDataPoint {
  date: string;
  pemasukan: number;
  pengeluaran: number;
}

interface CategoryBreakdown {
  kategori: string;
  nominal: number;
}

interface DashboardClientProps {
  trendData: TrendDataPoint[];
  categoryBreakdown: CategoryBreakdown[];
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

export function DashboardClient({
  trendData,
  categoryBreakdown,
}: DashboardClientProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total for percentage
  const totalExpense = categoryBreakdown.reduce((sum, item) => sum + item.nominal, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trend Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 dark:text-white">
          Tren Pemasukan vs Pengeluaran
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="colorPengeluaran"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              className="dark:stroke-slate-700"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#94a3b8"
              className="dark:stroke-slate-500"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#94a3b8"
              className="dark:stroke-slate-500"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="pemasukan"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorPemasukan)"
              name="Pemasukan"
            />
            <Area
              type="monotone"
              dataKey="pengeluaran"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorPengeluaran)"
              name="Pengeluaran"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown by Category */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 dark:text-white">
          Breakdown Pengeluaran per Kategori
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryBreakdown}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ kategori, percent }) => {
                const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
                return isMobile 
                  ? `${(percent * 100).toFixed(0)}%`
                  : `${kategori} (${(percent * 100).toFixed(0)}%)`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="nominal"
            >
              {categoryBreakdown.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => {
                const item = categoryBreakdown.find(x => x.nominal === label);
                return item ? `${item.kategori}` : "";
              }}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#f3f4f6",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Category Table */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 dark:text-white">
          Rincian Pengeluaran per Kategori
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryBreakdown.map((item, index) => {
            const percentage = totalExpense > 0 ? ((item.nominal / totalExpense) * 100).toFixed(1) : "0";
            return (
              <div
                key={item.kategori}
                className="flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                  <span className="font-medium text-slate-900 dark:text-white capitalize">
                    {item.kategori}
                  </span>
                </div>
                
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(item.nominal)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {percentage}% dari total
                    </div>
                  </div>
                  
                  {/* Percentage Bar */}
                  <div className="flex-1 flex items-end gap-1">
                    <div className="w-full h-16 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
