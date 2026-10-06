"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase-auth";

export async function resetAllTransactions() {
  const supabase = await createAuthClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("reset_transactions");
  if (error) throw new Error(error.message);

  for (const path of ["/", "/transactions", "/analytics"]) {
    revalidatePath(path);
  }
}
