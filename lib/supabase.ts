import { createAuthClient } from "@/lib/supabase-auth";

export interface Transaction {
  id: number;
  created_at: string;
  jenis: "pemasukan" | "pengeluaran";
  kategori: string;
  item: string;
  nominal: number;
  user_id: string;
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data ?? [];
}
