"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase-auth";

async function account() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createTelegramLinkCode() {
  const { supabase, user } = await account();
  const code = randomBytes(4).toString("hex").toUpperCase();
  const { error } = await supabase.from("telegram_link_codes").upsert({ user_id: user.id, code, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}

export async function disconnectTelegram() {
  const { supabase, user } = await account();
  const { error } = await supabase.from("telegram_accounts").delete().eq("user_id", user.id);
  if (error) throw new Error(error.message);
  await supabase.from("telegram_link_codes").delete().eq("user_id", user.id);
  revalidatePath("/accounts");
}
