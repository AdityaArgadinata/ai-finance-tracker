import { Bell, ChevronRight, CircleUserRound, LogOut, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { createAuthClient } from "@/lib/supabase-auth";
import { DismissibleDetails } from "@/app/components/DismissibleDetails";

const links = [
  ["Dashboard", "/"],
  ["Transactions", "/transactions"],
  ["Analytics", "/analytics"],
  ["Accounts", "/accounts"],
  ["Tutorial", "/tutorial"],
];

export async function AppHeader({ active }: { active: string }) {
  const supabase = await createAuthClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const name = user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email?.split("@")[0];
  if (error || !user || !name) redirect("/login");

  return (
    <header className="topbar">
      <Link className="brand" href="/"><Image src="/normiuz.png" alt="" width={30} height={30} priority unoptimized /> Normiuz</Link>
      <nav className="nav" aria-label="Main navigation">
        {links.map(([label, href]) => <Link className={active === label.toLowerCase() ? "active" : ""} href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="actions">
        <DismissibleDetails className="mobile-nav">
          <summary aria-label="Open navigation"><Menu /></summary>
          <nav className="mobile-links" aria-label="Mobile navigation">
            {links.map(([label, href]) => <Link className={active === label.toLowerCase() ? "active" : ""} href={href} key={href}>{label}</Link>)}
          </nav>
        </DismissibleDetails>
        <DismissibleDetails className="notification-menu">
          <summary aria-label="Notifications"><Bell /></summary>
          <div className="profile-popover notification-popover"><div><Bell /><span>Notifications</span><strong>Coming soon</strong></div></div>
        </DismissibleDetails>
        <DismissibleDetails className="profile-menu">
          <summary aria-label="Profile"><CircleUserRound /></summary>
          <div className="profile-popover">
            <div className="profile-identity">
              <span>{name.charAt(0).toUpperCase()}</span>
              <div><small>Signed in as</small><strong>{name}</strong><p>{user?.email}</p></div>
            </div>
            <Link href="/accounts">View account <ChevronRight /></Link>
            <form action={logout}><button type="submit"><LogOut /> Log out</button></form>
          </div>
        </DismissibleDetails>
      </div>
    </header>
  );
}
