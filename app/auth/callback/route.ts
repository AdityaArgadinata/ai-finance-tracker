import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const url = new URL(code ? "/" : "/login?error=oauth", request.url);

  if (!code) return NextResponse.redirect(url);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) return NextResponse.redirect(url);

  const response = NextResponse.redirect(url);
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
  response.cookies.set("sb-access-token", data.session.access_token, { ...options, maxAge: data.session.expires_in });
  response.cookies.set("sb-refresh-token", data.session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
  return response;
}
