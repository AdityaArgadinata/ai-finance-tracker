"use server";

import { revalidatePath } from "next/cache";
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
