import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables (SUPABASE_URL or SUPABASE_SERVICE_KEY)"
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Transaction {
  id: number;
  created_at: string;
  jenis: "pemasukan" | "pengeluaran";
  kategori: string;
  item: string;
  nominal: number;
}

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data || [];
}
