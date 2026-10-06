"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase-auth";

export async function resetAllTransactions() {
  const supabase = await createAuthClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Your session has expired. Please sign in again." };

  const { error } = await supabase.from("transactions").delete().eq("user_id", user.id);
  if (error) {
    console.error("Failed to reset transactions:", error);
    return { error: "Failed to reset transactions. Please try again." };
  }

  for (const path of ["/", "/transactions", "/analytics"]) {
    revalidatePath(path);
  }
  return { error: null };
}
