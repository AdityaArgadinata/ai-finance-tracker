"use server";

import Groq from "groq-sdk";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase-auth";

const routerBaseUrl = process.env.NINEROUTER_BASE_URL ?? "https://9router.com/v1";

export async function saveGroqApiKey(formData: FormData) {
  const apiKey = String(formData.get("api_key") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  if (!apiKey.startsWith("sk") || apiKey.length < 20 || !model) redirect("/accounts?ai=invalid");

  try { await new Groq({ apiKey, baseURL: routerBaseUrl }).models.list(); }
  catch { redirect("/accounts?ai=invalid"); }

  const supabase = await createAuthClient();
  const { error } = await supabase.rpc("set_groq_api_key", { p_api_key: apiKey, p_model: model });
  if (error) throw new Error(error.message);
  redirect("/accounts?ai=connected");
}

export async function removeGroqApiKey() {
  const supabase = await createAuthClient();
  const { error } = await supabase.rpc("remove_groq_api_key");
  if (error) throw new Error(error.message);
  redirect("/accounts?ai=removed");
}
