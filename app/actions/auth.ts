"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase-auth";

export async function loginWithGoogle() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) redirect("/login?error=config");

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`).replace(/\/$/, "");
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function logout() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}
