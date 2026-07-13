import { BadgeCheck, CalendarDays, Clock3, KeyRound, Mail } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { createAuthClient } from "@/lib/supabase-auth";
import { TelegramIntegration } from "@/app/components/TelegramIntegration";

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ai?: string }> }) {
  const aiStatus = (await searchParams).ai;
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email?.split("@")[0] ?? "Expanse User";
  const avatar = typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const provider = String(user.app_metadata.provider ?? "google");
  const [{ data: telegram }, { data: linkCode }, { data: aiSettings }] = await Promise.all([
    supabase.from("telegram_accounts").select("chat_id, linked_at").maybeSingle(),
    supabase.from("telegram_link_codes").select("code, expires_at").maybeSingle(),
    supabase.from("user_ai_settings").select("key_hint, updated_at").maybeSingle(),
  ]);
  const activeCode = linkCode && new Date(linkCode.expires_at) > new Date() ? linkCode : null;

  return (
    <main className="shell">
      <AppHeader active="accounts" />
      <section className="page-heading"><div><span>Expanse</span><h1>Account</h1></div><p>Your profile and login details</p></section>

      <section className="account-grid">
        <article className="account-profile">
          <div className="account-avatar">{avatar ? <Image src={avatar} alt="" width={84} height={84} referrerPolicy="no-referrer" /> : name.charAt(0).toUpperCase()}</div>
          <span className="account-provider"><i /> {provider} account</span>
          <h2>{name}</h2>
          <p>{user.email}</p>
          <div className="account-verified"><BadgeCheck /> {user.email_confirmed_at ? "Email verified" : "Verification pending"}</div>
        </article>

        <article className="account-details">
          <header><div><span>Profile</span><h2>Account details</h2></div><BadgeCheck /></header>
          <dl>
            <div><dt><Mail /> Email</dt><dd>{user.email}</dd></div>
            <div><dt><KeyRound /> Sign-in method</dt><dd>{provider}</dd></div>
            <div><dt><CalendarDays /> Joined</dt><dd>{date.format(new Date(user.created_at))}</dd></div>
            <div><dt><Clock3 /> Last sign-in</dt><dd>{user.last_sign_in_at ? date.format(new Date(user.last_sign_in_at)) : "—"}</dd></div>
            <div><dt><KeyRound /> User ID</dt><dd>{user.id}</dd></div>
          </dl>
        </article>

        <TelegramIntegration telegram={telegram ? { chatId: telegram.chat_id, linkedAt: date.format(new Date(telegram.linked_at)) } : null} linkCode={activeCode ? { code: activeCode.code, expiresAt: date.format(new Date(activeCode.expires_at)) } : null} groq={aiSettings ? { keyHint: aiSettings.key_hint, updatedAt: date.format(new Date(aiSettings.updated_at)) } : null} aiStatus={aiStatus} />
      </section>
    </main>
  );
}
