"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, LineSeries, ColorType, LineStyle, CrosshairMode, ISeriesApi } from "lightweight-charts";
import { format } from "date-fns";
import { Transaction } from "@/lib/supabase";

interface TradingViewCategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
  "#00ff66", // bright green
  "#ffb000", // amber
  "#ff4444", // red
  "#00a2ff", // blue
  "#9b5de5", // purple
];

export default function TradingViewCategoryChart({ transactions }: TradingViewCategoryChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Keep track of series instances for tooltip lookup (strictly typed to avoid 'any')
  const seriesRefs = useRef<{ [cat: string]: ISeriesApi<"Line"> }>({});

  // Currency formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Process data: get top 5 categories and their daily spending
  const { chartDataMap, categoriesList } = React.useMemo(() => {
    const categoryTotals: { [cat: string]: number } = {};
    const dailySpend: { [date: string]: { [cat: string]: number } } = {};
    const allDatesSet = new Set<string>();

    transactions.forEach((tx) => {
      if (tx.jenis === "pengeluaran") {
        const dateStr = format(new Date(tx.created_at), "yyyy-MM-dd");
        allDatesSet.add(dateStr);
        categoryTotals[tx.kategori] = (categoryTotals[tx.kategori] || 0) + tx.nominal;

        if (!dailySpend[dateStr]) {
          dailySpend[dateStr] = {};
        }
        dailySpend[dateStr][tx.kategori] = (dailySpend[dateStr][tx.kategori] || 0) + tx.nominal;
      }
    });

    // Sort categories by total spending descending
    const sortedCats = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);
    const topCats = sortedCats.slice(0, 5);

    const sortedDates = Array.from(allDatesSet).sort();

    // Build data array for each category (fill 0 if no spend on that day)
    const dataMap: { [cat: string]: { time: string; value: number }[] } = {};
    topCats.forEach((cat) => {
      dataMap[cat] = [];
    });

    sortedDates.forEach((dateStr) => {
      topCats.forEach((cat) => {
        const value = dailySpend[dateStr]?.[cat] || 0;
        dataMap[cat].push({
          time: dateStr,
          value,
        });
      });
    });

    return { chartDataMap: dataMap, categoriesList: topCats };
  }, [transactions]);

  // Keep track of which categories are hidden
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!chartContainerRef.current || categoriesList.length === 0) {
      return;
    }

    const container = chartContainerRef.current;
    
    // 1. Initialize Chart (read parent width and height dynamically)
    const initialWidth = wrapperRef.current?.clientWidth || container.clientWidth || 300;
    const initialHeight = wrapperRef.current?.clientHeight || 200;

    const chart = createChart(container, {
      width: initialWidth,
      height: initialHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#202020" },
        textColor: "#8b8b8b",
        fontFamily: "system-ui",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#303030", style: LineStyle.Dotted },
        horzLines: { color: "#303030", style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: "#303030",
        scaleMargins: {
          top: 0.15,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: "#303030",
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#444444",
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: "#444444",
          width: 1,
          style: LineStyle.Dashed,
        },
      },
    });

    // Clear previous refs
    seriesRefs.current = {};

    // 2. Add Line Series for each visible category
    let addedAny = false;
    categoriesList.forEach((cat, idx) => {
      const isVisible = !hiddenCategories.has(cat);
      if (!isVisible) return;

      const color = COLORS[idx % COLORS.length];
      const series = chart.addSeries(LineSeries, {
        color: color,
        lineWidth: 2,
        priceFormat: {
          type: "custom",
          formatter: (price: number) => {
            const absPrice = Math.abs(price);
            const sign = price < 0 ? "-" : "";
            if (absPrice >= 1000000) {
              return `${sign}${(absPrice / 1000000).toFixed(1)}M`;
            } else if (absPrice >= 1000) {
              return `${sign}${(absPrice / 1000).toFixed(0)}k`;
            }
            return `${price}`;
          },
        },
      });

      series.setData(chartDataMap[cat]);
      seriesRefs.current[cat] = series;
      addedAny = true;
    });

    if (addedAny) {
      chart.timeScale().fitContent();
    }

    // 3. Custom Hover Tooltip
    const tooltip = tooltipRef.current;
    
    chart.subscribeCrosshairMove((param) => {
      if (!tooltip) return;

      const currentHeight = container.clientHeight || 200;

      if (
        param.time === undefined ||
        !param.point ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > currentHeight
      ) {
        tooltip.style.display = "none";
        return;
      }

      tooltip.style.display = "block";
      
      let timeStr = "";
      if (typeof param.time === "string") {
        const dateObj = new Date(param.time);
        timeStr = format(dateObj, "dd MMM yyyy");
      }

      let tooltipContent = `<div class="text-[10px] text-slate-400 font-semibold mb-1">${timeStr}</div>`;
      tooltipContent += `<div class="space-y-0.5 text-[10px] font-mono">`;
      
      let hasData = false;
      categoriesList.forEach((cat, idx) => {
        const isVisible = !hiddenCategories.has(cat);
        if (!isVisible) return;

        const series = seriesRefs.current[cat];
        if (!series) return;
        const dataPoint = param.seriesData.get(series);
        if (dataPoint) {
          const val = (dataPoint as { value?: number }).value || 0;
          const color = COLORS[idx % COLORS.length];
          tooltipContent += `<div class="flex justify-between gap-4">
            <span style="color: ${color}">● ${cat}:</span>
            <span class="text-slate-200 font-bold">${formatCurrency(val)}</span>
          </div>`;
          hasData = true;
        }
      });
      tooltipContent += `</div>`;

      if (hasData) {
        tooltip.innerHTML = tooltipContent;
      } else {
        tooltip.style.display = "none";
      }

      // Position tooltip
      const tooltipWidth = 180;
      const tooltipHeight = 110;
      const margin = 15;

      let left = param.point.x + margin;
      if (left > container.clientWidth - tooltipWidth - margin) {
        left = param.point.x - tooltipWidth - margin;
      }

      let top = param.point.y + margin;
      if (top > currentHeight - tooltipHeight - margin) {
        top = param.point.y - tooltipHeight - margin;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    // 4. Responsive Resize Observer (observes parent wrapper width and height)
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.resize(width, height || 200);
    });
    
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    // 5. Cleanup
    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [chartDataMap, categoriesList, hiddenCategories]);

  if (categoriesList.length === 0) {
    return (
      <div className="w-full h-full bg-[#0c0c0c] border border-[#222] flex items-center justify-center text-slate-500 font-mono text-xs">
        Belum ada data pengeluaran kategori.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Category Checkboxes Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] font-mono flex-shrink-0">
        {categoriesList.map((cat, idx) => {
          const color = COLORS[idx % COLORS.length];
          const isVisible = !hiddenCategories.has(cat);
          return (
            <label
              key={cat}
              className="flex items-center gap-1.5 cursor-pointer select-none border border-[#222] px-2 py-0.5 rounded hover:bg-[#151515] transition-colors"
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => toggleCategory(cat)}
                className="sr-only"
              />
              <span
                className={`w-2 h-2 rounded-full inline-block ${
                  isVisible ? "" : "opacity-30"
                }`}
                style={{ backgroundColor: color }}
              />
              <span className={isVisible ? "text-slate-200" : "text-slate-600 line-through"}>
                {cat}
              </span>
            </label>
          );
        })}
      </div>

      {/* Chart container wrapper (flex-grow so it dynamically stretches to fill parent height) */}
      <div ref={wrapperRef} className="relative w-full flex-grow bg-[#0c0c0c] overflow-hidden select-none min-h-0">
        <div ref={chartContainerRef} className="w-full h-full" />
        {/* Floating custom tooltip */}
        <div
          ref={tooltipRef}
          style={{
            display: "none",
            position: "absolute",
            zIndex: 50,
            pointerEvents: "none",
            backgroundColor: "#292929",
            border: "1px solid #3a3a3a",
            borderRadius: "3px",
            padding: "6px 10px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.5)",
            minWidth: "150px",
          }}
          className="font-mono text-left"
        />
      </div>
    </div>
  );
}
