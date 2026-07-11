import { Bell, ChevronRight, CircleUserRound, LogOut, WalletCards } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { createAuthClient } from "@/lib/supabase-auth";

const links = [
  ["Dashboard", "/"],
  ["Transactions", "/transactions"],
  ["Analytics", "/analytics"],
  ["Accounts", "/accounts"],
];

export async function AppHeader({ active }: { active: string }) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = user?.user_metadata.full_name ?? user?.user_metadata.name ?? user?.email?.split("@")[0] ?? "Expanse User";

  return (
    <header className="topbar">
      <Link className="brand" href="/"><WalletCards /> Expanse</Link>
      <nav className="nav" aria-label="Main navigation">
        {links.map(([label, href]) => <Link className={active === label.toLowerCase() ? "active" : ""} href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="actions">
        <button aria-label="Notifications"><Bell /></button>
        <details className="profile-menu">
          <summary aria-label="Profile"><CircleUserRound /></summary>
          <div className="profile-popover">
            <div className="profile-identity">
              <span>{name.charAt(0).toUpperCase()}</span>
              <div><small>Signed in as</small><strong>{name}</strong><p>{user?.email}</p></div>
            </div>
            <Link href="/accounts">View account <ChevronRight /></Link>
            <form action={logout}><button type="submit"><LogOut /> Log out</button></form>
          </div>
        </details>
      </div>
    </header>
  );
}
