import { BadgeCheck, CalendarDays, Clock3, KeyRound, Mail } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { createAuthClient } from "@/lib/supabase-auth";

const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" });

export default async function AccountPage() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email?.split("@")[0] ?? "Expanse User";
  const avatar = typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const provider = String(user.app_metadata.provider ?? "google");

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
      </section>
    </main>
  );
}
