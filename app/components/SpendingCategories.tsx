"use client";

import { useState } from "react";
import { translateCategory } from "@/lib/utils";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const colors = ["#c5ff4a", "#72d6b9", "#f4c95d", "#f28b82", "#8ea7ff", "#c79af2", "#66c7e8", "#e8e3d5", "#9cb56b", "#d98ca3"];

export function SpendingCategories({ categories, expense }: { categories: [string, number][]; expense: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const ringStep = 64 / Math.max(categories.length - 1, 1);
  const ringWidth = Math.min(14, 64 / Math.max(categories.length, 1));
  const activeCategory = hovered === null ? undefined : categories[hovered];

  return (
    <article className="card category-card">
      <div className="card-title"><h2>Spending categories</h2></div>
      {!categories.length && <p className="category-empty">No expenses in this period.</p>}
      {categories.length > 0 && <div className="category-chart">
        <div className="category-chart-visual" onMouseLeave={() => setHovered(null)}><svg className={`category-pie${hovered === null ? "" : " has-hover"}`} role="img" aria-label="Expense distribution by category" viewBox="0 0 240 240">{categories.map(([category, amount], index) => { const radius = 100 - index * ringStep; const percentage = amount / expense * 100; return <g className={hovered === index ? "active" : ""} onMouseEnter={() => setHovered(index)} key={category}><circle className="category-ring-bg" cx="120" cy="120" r={radius} strokeWidth={ringWidth} /><circle className="category-ring-value" cx="120" cy="120" r={radius} pathLength="100" stroke={colors[index % colors.length]} strokeDasharray={`${percentage} ${100 - percentage}`} strokeWidth={ringWidth} transform="rotate(-90 120 120)" /></g>; })}<circle className="category-ring-center" cx="120" cy="120" r="27" /></svg>{activeCategory && <div className="category-pie-tooltip"><i style={{ background: colors[hovered! % colors.length] }} /><b>{translateCategory(activeCategory[0])}</b><span>{currency.format(activeCategory[1])}</span><em>{Math.round(activeCategory[1] / expense * 100)}%</em></div>}</div>
        <div className="category-chart-legend">{categories.map(([category, amount], index) => <div key={category}><i style={{ background: colors[index % colors.length] }} /><span><b>{translateCategory(category)}</b><small>{currency.format(amount)}</small></span><em>{Math.round((amount / expense) * 100)}%</em></div>)}</div>
      </div>}
    </article>
  );
}
