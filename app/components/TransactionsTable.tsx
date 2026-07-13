"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { createTransaction, deleteTransaction, importTransactions, updateTransaction } from "@/app/actions/transactions";
import type { Transaction } from "@/lib/supabase";
import { translateCategory } from "@/lib/utils";

const PAGE_SIZE = 10;
const STANDARD_CATEGORIES = ["Cafe", "Date", "Makanan & Minuman", "Rokok", "Transportasi", "Belanja", "Tagihan & Utilitas", "Hiburan", "Kesehatan", "Pendidikan", "Gaji", "Investasi", "Bisnis", "Lain-lain"];
const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState<Transaction | null>();
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<{ message: string; error?: boolean }>();
  const fileInput = useRef<HTMLInputElement>(null);
  const [now] = useState(() => new Date());
  const categories = useMemo(() => [...new Set(transactions.map((tx) => tx.kategori))].sort(), [transactions]);
  const availableCategories = useMemo(() => [...new Set([...STANDARD_CATEGORIES, ...categories])], [categories]);
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
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setNotice(undefined);
    const data = new FormData();
    data.set("file", file);
    try {
      const result = await importTransactions(data);
      setNotice(result.error ? { message: result.error, error: true } : { message: `${result.count} transactions imported${result.skipped ? `, ${result.skipped} skipped` : ""}.` });
      if (result.count) router.refresh();
    } catch {
      setNotice({ message: "Import failed. Please try again.", error: true });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <section className="transactions-card">
      <div className="transactions-toolbar"><div className="excel-actions"><button onClick={() => location.assign("/api/transactions/export")}><Download /> Export</button><button disabled={importing} onClick={() => fileInput.current?.click()}><Upload /> {importing ? "Importing…" : "Import"}</button><input ref={fileInput} type="file" onChange={importFile} /></div>{notice && <p className={`import-notice${notice.error ? " error" : ""}`}>{notice.message}</p>}<button className="add-transaction" onClick={() => setEditing(null)}><Plus /> Add transaction</button></div>
      <div className="table-filters">
        <label><span>From</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => changeFilter(setStartDate, event.target.value)} /></label>
        <label><span>To</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => changeFilter(setEndDate, event.target.value)} /></label>
        <label><span>Category</span><select value={category} onChange={(event) => changeFilter(setCategory, event.target.value)}><option value="">All categories</option>{categories.map((value) => <option value={value} key={value}>{translateCategory(value)}</option>)}</select></label>
        {(startDate || endDate || category) && <button className="clear-filters" onClick={clearFilters}><X /> Clear</button>}
      </div>
      <div className="transactions-head"><span>Date</span><span>Description</span><span>Category</span><span>Type</span><span>Amount</span><span /></div>
      {rows.map((tx) => (
        <div className="transaction-row" key={tx.id}>
          <time>{date.format(new Date(tx.created_at))}</time>
          <strong>{tx.item}</strong>
          <span>{translateCategory(tx.kategori)}</span>
          <span className={`type ${tx.jenis}`}>{tx.jenis}</span>
          <b className={tx.jenis === "pemasukan" ? "income" : "expense"}>{tx.jenis === "pemasukan" ? "+ " : "− "}{currency.format(tx.nominal)}</b>
          <span className="transaction-actions"><button aria-label={`Edit ${tx.item}`} onClick={() => setEditing(tx)}><Pencil /></button><button aria-label={`Delete ${tx.item}`} onClick={() => setDeleting(tx)}><Trash2 /></button></span>
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
      {editing !== undefined && <div className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-form-title"><form action={async (formData) => { if (editing) await updateTransaction(formData); else await createTransaction(formData); setEditing(undefined); }}><header><h2 id="transaction-form-title">{editing ? "Edit transaction" : "Add transaction"}</h2><button type="button" aria-label="Close" onClick={() => setEditing(undefined)}><X /></button></header>{editing && <input type="hidden" name="id" value={editing.id} />}<label><span>Date</span><input required type="datetime-local" name="created_at" defaultValue={new Date((editing ? new Date(editing.created_at) : now).getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)} /></label><label><span>Description</span><input required maxLength={150} name="item" defaultValue={editing?.item} /></label><label><span>Category</span><select required name="kategori" defaultValue={editing?.kategori ?? "Makanan & Minuman"}>{availableCategories.map((value) => <option value={value} key={value}>{value}</option>)}</select></label><label><span>Type</span><select required name="jenis" defaultValue={editing?.jenis ?? "pengeluaran"}><option value="pengeluaran">Expense</option><option value="pemasukan">Income</option></select></label><label><span>Amount</span><input required min="1" step="1" type="number" name="nominal" defaultValue={editing?.nominal} /></label><div className="transaction-modal-actions"><button type="button" onClick={() => setEditing(undefined)}>Cancel</button><button type="submit">Save transaction</button></div></form></div>}
      {deleting && <div className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="delete-transaction-title"><form className="delete-transaction-modal" action={async (formData) => { await deleteTransaction(formData); setDeleting(null); }}><header><h2 id="delete-transaction-title">Delete transaction?</h2><button type="button" aria-label="Close" onClick={() => setDeleting(null)}><X /></button></header><p><strong>{deleting.item}</strong><span>{translateCategory(deleting.kategori)} · {currency.format(deleting.nominal)}</span>This action cannot be undone.</p><input type="hidden" name="id" value={deleting.id} /><div className="transaction-modal-actions"><button type="button" onClick={() => setDeleting(null)}>Cancel</button><button type="submit">Delete transaction</button></div></form></div>}
    </section>
  );
}
