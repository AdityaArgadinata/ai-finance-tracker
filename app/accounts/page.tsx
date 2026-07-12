import { BadgeCheck, CalendarDays, Clock3, KeyRound, Mail, MessageCircle, Unlink } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { createAuthClient } from "@/lib/supabase-auth";
import { createTelegramLinkCode, disconnectTelegram } from "@/app/actions/telegram";

const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" });

export default async function AccountPage() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email?.split("@")[0] ?? "Expanse User";
  const avatar = typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const provider = String(user.app_metadata.provider ?? "google");
  const [{ data: telegram }, { data: linkCode }] = await Promise.all([
    supabase.from("telegram_accounts").select("chat_id, linked_at").maybeSingle(),
    supabase.from("telegram_link_codes").select("code, expires_at").maybeSingle(),
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

        <article className="telegram-card">
          <header><div><span>Integration</span><h2>Telegram & AI</h2></div><MessageCircle /></header>
          {telegram ? <div className="telegram-connected"><i /><div><strong>Telegram connected</strong><small>Chat ID {telegram.chat_id} · Linked {date.format(new Date(telegram.linked_at))}</small></div><form action={disconnectTelegram}><button><Unlink /> Disconnect</button></form></div> : <div className="telegram-connect"><div><strong>Record transactions from Telegram</strong><p>Connect your Telegram account before using the bot and AI transaction parser.</p></div>{activeCode ? <div className="telegram-code"><span>Your one-time command</span><strong>/link {activeCode.code}</strong><small>Expires {date.format(new Date(activeCode.expires_at))}</small></div> : <form action={createTelegramLinkCode}><button><MessageCircle /> Generate link code</button></form>}</div>}
        </article>
      </section>
    </main>
  );
}
