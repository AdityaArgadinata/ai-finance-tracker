import ExcelJS from "exceljs";
import { createAuthClient } from "@/lib/supabase-auth";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase.from("transactions").select("created_at,item,kategori,jenis,nominal").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return new Response(error.message, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Transactions");
  sheet.columns = [
    { header: "Date", key: "date", width: 22 },
    { header: "Description", key: "description", width: 32 },
    { header: "Category", key: "category", width: 24 },
    { header: "Type", key: "type", width: 14 },
    { header: "Amount", key: "amount", width: 18 },
  ];
  for (const transaction of data ?? []) sheet.addRow({ date: new Date(transaction.created_at), description: transaction.item, category: transaction.kategori, type: transaction.jenis === "pemasukan" ? "Income" : "Expense", amount: transaction.nominal });
  sheet.getRow(1).font = { bold: true };
  sheet.getColumn("date").numFmt = "dd mmm yyyy hh:mm";
  sheet.getColumn("amount").numFmt = '"Rp" #,##0';

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="expanse-transactions-${new Date().toISOString().slice(0, 10)}.xlsx"` } });
}
