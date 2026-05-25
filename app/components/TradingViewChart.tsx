"use client";

import React, { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, HistogramSeries, ColorType, LineStyle, CrosshairMode } from "lightweight-charts";
import { format } from "date-fns";
import { Transaction } from "@/lib/supabase";

interface TradingViewChartProps {
  transactions: Transaction[];
}

export default function TradingViewChart({ transactions }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Currency formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Process transactions into daily OHLC and Volume during render phase
  const { candlestickData, volumeData } = React.useMemo(() => {
    if (transactions.length === 0) {
      return { candlestickData: [], volumeData: [] };
    }

    // Group transactions by date (local YYYY-MM-DD)
    const dailyTransactions: { [date: string]: Transaction[] } = {};
    
    // Sort all transactions chronologically first to ensure correct cumulative calculation
    const sortedRawTxs = [...transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sortedRawTxs.forEach((tx) => {
      const dateStr = format(new Date(tx.created_at), "yyyy-MM-dd");
      if (!dailyTransactions[dateStr]) {
        dailyTransactions[dateStr] = [];
      }
      dailyTransactions[dateStr].push(tx);
    });

    const sortedDates = Object.keys(dailyTransactions).sort();
    let runningBalance = 0;
    const candlesticks = [];
    const volumes = [];

    for (const dateStr of sortedDates) {
      const txs = dailyTransactions[dateStr];
      const open = Math.max(0, runningBalance);
      let high = open;
      let low = open;
      let dailyVolume = 0;

      for (const tx of txs) {
        if (tx.jenis === "pemasukan") {
          runningBalance += tx.nominal;
        } else {
          runningBalance -= tx.nominal;
        }
        const visualBalance = Math.max(0, runningBalance);
        if (visualBalance > high) high = visualBalance;
        if (visualBalance < low) low = visualBalance;
        dailyVolume += tx.nominal;
      }

      const close = Math.max(0, runningBalance);

      candlesticks.push({
        time: dateStr,
        open,
        high,
        low,
        close,
      });

      const isGreen = close >= open;
      volumes.push({
        time: dateStr,
        value: dailyVolume,
        color: isGreen ? "rgba(0, 255, 102, 0.4)" : "rgba(255, 68, 68, 0.4)",
      });
    }

    return { candlestickData: candlesticks, volumeData: volumes };
  }, [transactions]);

  useEffect(() => {
    if (!chartContainerRef.current || candlestickData.length === 0) {
      return;
    }

    // 2. Initialize Chart
    const container = chartContainerRef.current;
    const initialWidth = wrapperRef.current?.clientWidth || container.clientWidth || 300;
    const chart = createChart(container, {
      width: initialWidth,
      height: 320,
      layout: {
        background: { type: ColorType.Solid, color: "#0c0c0c" },
        textColor: "#888888",
        fontFamily: "monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#222222", style: LineStyle.Dotted },
        horzLines: { color: "#222222", style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: "#333333",
        scaleMargins: {
          top: 0.1,
          bottom: 0.25, // Leave space for volume histogram at bottom
        },
      },
      timeScale: {
        borderColor: "#333333",
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
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
      },
    });

    // 3. Add Candlestick Series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00ff66",
      downColor: "#ff4444",
      borderVisible: false,
      wickUpColor: "#00ff66",
      wickDownColor: "#ff4444",
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

    // 4. Add Volume (Histogram) Series as Overlay
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Sets it as overlay (separate scale from candlesticks)
    });

    // Position volume histogram overlay at the bottom 20%
    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    candlestickSeries.setData(candlestickData);
    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();

    // 5. Custom Floating Tooltip Logic
    const tooltip = tooltipRef.current;
    
    chart.subscribeCrosshairMove((param) => {
      if (!tooltip) return;

      if (
        param.time === undefined ||
        !param.point ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > 320
      ) {
        tooltip.style.display = "none";
        return;
      }

      // Find candlestick data point
      const candleData = param.seriesData.get(candlestickSeries);
      if (!candleData) {
        tooltip.style.display = "none";
        return;
      }

      const candle = candleData as { open?: number; high?: number; low?: number; close?: number };
      if (
        candle.open === undefined ||
        candle.close === undefined ||
        candle.high === undefined ||
        candle.low === undefined
      ) {
        tooltip.style.display = "none";
        return;
      }

      // Find volume data point
      const volData = param.seriesData.get(volumeSeries) as { value?: number };
      const volume = volData?.value;

      tooltip.style.display = "block";
      
      // Formatting time
      let timeStr = "";
      if (typeof param.time === "string") {
        const dateObj = new Date(param.time);
        timeStr = format(dateObj, "dd MMM yyyy");
      }

      // Calculate candlestick gain/loss percentage
      const diff = candle.close - candle.open;
      const diffPercent = candle.open !== 0 ? (diff / Math.abs(candle.open)) * 100 : 0;
      const isDiffPositive = diff >= 0;
      const diffColorClass = isDiffPositive ? "text-[#00ff66]" : "text-[#ff4444]";
      const diffSign = isDiffPositive ? "+" : "";
      
      const changeHtml = `<span class="${diffColorClass} font-bold ml-1">
        (${diffSign}${diffPercent.toFixed(1)}%)
      </span>`;

      tooltip.innerHTML = `
        <div class="text-[10px] text-slate-400 font-semibold mb-1">${timeStr}</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-mono">
          <div><span class="text-slate-500">O:</span> <span class="text-slate-200">${formatCurrency(candle.open)}</span></div>
          <div><span class="text-slate-500">C:</span> <span class="text-slate-200">${formatCurrency(candle.close)}</span> ${changeHtml}</div>
          <div><span class="text-slate-500">H:</span> <span class="text-slate-200">${formatCurrency(candle.high)}</span></div>
          <div><span class="text-slate-500">L:</span> <span class="text-slate-200">${formatCurrency(candle.low)}</span></div>
        </div>
        ${volume !== undefined ? `
        <div class="text-[11px] font-mono mt-1 border-t border-[#222] pt-1">
          <span class="text-slate-500">Vol:</span> <span class="text-slate-200 font-bold">${formatCurrency(volume)}</span>
        </div>` : ""}
      `;

      // Position the tooltip
      const tooltipWidth = 250;
      const tooltipHeight = 85;
      const margin = 15;

      let left = param.point.x + margin;
      if (left > container.clientWidth - tooltipWidth - margin) {
        left = param.point.x - tooltipWidth - margin;
      }

      let top = param.point.y + margin;
      if (top > 320 - tooltipHeight - margin) {
        top = param.point.y - tooltipHeight - margin;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    });

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      chart.resize(width, 320);
    });
    
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    // 7. Cleanup
    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candlestickData, volumeData]);

  if (candlestickData.length === 0) {
    return (
      <div className="w-full h-[320px] bg-[#0c0c0c] border border-[#222] flex items-center justify-center text-slate-500 font-mono text-xs">
        Belum ada data transaksi yang memadai untuk grafik.
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full h-[320px] bg-[#0c0c0c] overflow-hidden select-none">
      <div ref={chartContainerRef} className="w-full h-full" />
      {/* Floating custom tooltip */}
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "absolute",
          zIndex: 50,
          pointerEvents: "none",
          backgroundColor: "#050505",
          border: "1px solid #333333",
          borderRadius: "3px",
          padding: "6px 10px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.5)",
          minWidth: "180px",
        }}
        className="font-mono text-left"
      />
    </div>
  );
}
