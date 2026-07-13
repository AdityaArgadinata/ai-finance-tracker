"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { createAuthClient } from "@/lib/supabase-auth";

function transactionFrom(formData: FormData) {
  const jenis = formData.get("jenis");
  const kategori = String(formData.get("kategori") ?? "").trim();
  const item = String(formData.get("item") ?? "").trim();
  const nominal = Number(formData.get("nominal"));
  const createdAt = String(formData.get("created_at") ?? "");
  if ((jenis !== "pemasukan" && jenis !== "pengeluaran") || !kategori || !item || !Number.isFinite(nominal) || nominal <= 0 || !createdAt) throw new Error("Invalid transaction");
  return { jenis, kategori: kategori.slice(0, 100), item: item.slice(0, 150), nominal, created_at: new Date(createdAt).toISOString() };
}

async function authorize() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

function refresh() { ["/", "/transactions", "/analytics"].forEach((path) => revalidatePath(path)); }

export async function createTransaction(formData: FormData) {
  const { supabase, user } = await authorize();
  const { error } = await supabase.from("transactions").insert({ ...transactionFrom(formData), user_id: user.id });
  if (error) throw new Error(error.message);
  refresh();
}

export async function updateTransaction(formData: FormData) {
  const { supabase } = await authorize();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid transaction id");
  const { error } = await supabase.from("transactions").update(transactionFrom(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteTransaction(formData: FormData) {
  const { supabase } = await authorize();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid transaction id");
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function importTransactions(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000 || !file.name.toLowerCase().endsWith(".xlsx")) return { error: "Choose an .xlsx file under 5 MB." };

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet) return { error: "The spreadsheet has no worksheet." };

    const aliases = { created_at: ["date", "tanggal"], item: ["description", "deskripsi", "catatan", "item"], kategori: ["category", "kategori"], jenis: ["type", "jenis"], nominal: ["amount", "jumlah", "nominal"] } as const;
    type Field = keyof typeof aliases;
    let headerRow = 0;
    let columns: Partial<Record<Field, number>> = {};
    for (let number = 1; number <= Math.min(sheet.rowCount, 50); number++) {
      const found: Partial<Record<Field, number>> = {};
      sheet.getRow(number).eachCell((cell, column) => {
        const header = cell.text.trim().toLowerCase();
        for (const [field, names] of Object.entries(aliases) as [Field, readonly string[]][]) if (names.includes(header)) found[field] = column;
      });
      if (Object.keys(found).length === Object.keys(aliases).length) { headerRow = number; columns = found; break; }
    }
    if (!headerRow) return { error: "Required columns were not found: Date, Description, Category, Type, and Amount." };
    if (sheet.rowCount - headerRow > 5_000) return { error: "Import is limited to 5,000 transactions at a time." };

    const rows: ReturnType<typeof transactionFrom>[] = [];
    let skipped = 0;
    sheet.eachRow((row, number) => {
      if (number <= headerRow || !row.hasValues) return;
      try {
        const type = row.getCell(columns.jenis!).text.trim().toLowerCase();
        const date = row.getCell(columns.created_at!).value;
        const amount = row.getCell(columns.nominal!).value;
        const data = new FormData();
        data.set("created_at", date instanceof Date ? date.toISOString() : row.getCell(columns.created_at!).text);
        data.set("item", row.getCell(columns.item!).text);
        data.set("kategori", row.getCell(columns.kategori!).text);
        data.set("jenis", type === "income" || type === "pemasukan" ? "pemasukan" : type === "expense" || type === "pengeluaran" ? "pengeluaran" : type);
        data.set("nominal", typeof amount === "number" ? String(amount) : row.getCell(columns.nominal!).text.replace(/[^\d.-]/g, ""));
        rows.push(transactionFrom(data));
      } catch {
        skipped++;
      }
    });
    if (!rows.length) return { error: "The spreadsheet has no transactions." };

    const { supabase, user } = await authorize();
    const { error } = await supabase.from("transactions").insert(rows.map((row) => ({ ...row, user_id: user.id })));
    if (error) return { error: error.message };
    refresh();
    return { count: rows.length, skipped };
  } catch {
    return { error: "The spreadsheet contains invalid transaction data." };
  }
}
