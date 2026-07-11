import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = new URL(code ? "/" : "/login?error=oauth", request.url);

  if (!code) return NextResponse.redirect(url);

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=oauth", request.url));

  return NextResponse.redirect(url);
}
