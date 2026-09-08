"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase-auth";
import { validateAiConfig } from "@/lib/ai-provider";

export async function saveGroqApiKey(formData: FormData) {
  const apiKey = String(formData.get("api_key") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const endpointInput = String(formData.get("endpoint") ?? "").trim();
  const provider = String(formData.get("provider") ?? "custom").trim().toLowerCase();

  const endpoint = (
    endpointInput ||
    process.env.AI_BASE_URL ||
    process.env.NINEROUTER_BASE_URL ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");

  if (!apiKey || !model || !endpoint) {
    redirect("/accounts?ai=invalid&reason=missing_fields");
  }

  const validation = await validateAiConfig(endpoint, apiKey, model, provider);
  if (!validation.ok) {
    console.error("AI validation failed:", validation.error);
    redirect(`/accounts?ai=invalid&reason=${encodeURIComponent(validation.error || "connection_failed")}`);
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.rpc("set_groq_api_key", {
    p_api_key: apiKey,
    p_model: model,
    p_endpoint: endpoint,
    p_provider: provider,
  });

  if (error) {
    console.error("Database error saving AI settings:", error.message);
    throw new Error(error.message);
  }

  redirect("/accounts?ai=connected");
}

export const saveAiSettings = saveGroqApiKey;

export async function removeGroqApiKey() {
  const supabase = await createAuthClient();
  const { error } = await supabase.rpc("remove_groq_api_key");
  if (error) throw new Error(error.message);
  redirect("/accounts?ai=removed");
}

export const removeAiSettings = removeGroqApiKey;
