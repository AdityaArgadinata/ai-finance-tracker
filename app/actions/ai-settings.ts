"use server";

import Groq from "groq-sdk";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase-auth";

export async function saveGroqApiKey(formData: FormData) {
  const apiKey = String(formData.get("api_key") ?? "").trim();
  if (!apiKey.startsWith("gsk_") || apiKey.length < 20) redirect("/accounts?ai=invalid");

  try { await new Groq({ apiKey }).models.list(); }
  catch { redirect("/accounts?ai=invalid"); }

  const supabase = await createAuthClient();
  const { error } = await supabase.rpc("set_groq_api_key", { p_api_key: apiKey });
  if (error) throw new Error(error.message);
  redirect("/accounts?ai=connected");
}

export async function removeGroqApiKey() {
  const supabase = await createAuthClient();
  const { error } = await supabase.rpc("remove_groq_api_key");
  if (error) throw new Error(error.message);
  redirect("/accounts?ai=removed");
}
