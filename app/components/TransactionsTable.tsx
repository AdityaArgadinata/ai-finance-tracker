"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Transaction } from "@/lib/supabase";
import { translateCategory } from "@/lib/utils";

const PAGE_SIZE = 10;
const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const categories = useMemo(() => [...new Set(transactions.map((tx) => tx.kategori))].sort(), [transactions]);
  const filtered = transactions.filter((tx) => {
    const transactionDate = new Date(tx.created_at);
    if (startDate && transactionDate < new Date(`${startDate}T00:00:00`)) return false;
    if (endDate && transactionDate > new Date(`${endDate}T23:59:59.999`)) return false;
    return !category || tx.kategori === category;
  });
  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const start = (page - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const changeFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  const clearFilters = () => { setStartDate(""); setEndDate(""); setCategory(""); setPage(1); };

  return (
    <section className="transactions-card">
      <div className="table-filters">
        <label><span>From</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => changeFilter(setStartDate, event.target.value)} /></label>
        <label><span>To</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => changeFilter(setEndDate, event.target.value)} /></label>
        <label><span>Category</span><select value={category} onChange={(event) => changeFilter(setCategory, event.target.value)}><option value="">All categories</option>{categories.map((value) => <option value={value} key={value}>{translateCategory(value)}</option>)}</select></label>
        {(startDate || endDate || category) && <button className="clear-filters" onClick={clearFilters}><X /> Clear</button>}
      </div>
      <div className="transactions-head"><span>Date</span><span>Description</span><span>Category</span><span>Type</span><span>Amount</span></div>
      {rows.map((tx) => (
        <div className="transaction-row" key={tx.id}>
          <time>{date.format(new Date(tx.created_at))}</time>
          <strong>{tx.item}</strong>
          <span>{translateCategory(tx.kategori)}</span>
          <span className={`type ${tx.jenis}`}>{tx.jenis}</span>
          <b className={tx.jenis === "pemasukan" ? "income" : "expense"}>{tx.jenis === "pemasukan" ? "+ " : "− "}{currency.format(tx.nominal)}</b>
        </div>
      ))}
      {!rows.length && <div className="empty-transactions">No transactions yet.</div>}
      <footer className="table-pagination">
        <span>Showing <b>{filtered.length ? `${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)}` : "0"}</b> of {filtered.length}</span>
        <div className="pagination-controls">
          <button aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></button>
          <strong><small>Page</small>{page} <i>/</i> {totalPages}</strong>
          <button aria-label="Next page" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight /></button>
        </div>
      </footer>
    </section>
  );
}
