import { Bell, CircleUserRound, WalletCards } from "lucide-react";
import Link from "next/link";

const links = [
  ["Dashboard", "/"],
  ["Transactions", "/transactions"],
  ["Analytics", "/analytics"],
  ["Accounts", "/accounts"],
];

export function AppHeader({ active }: { active: string }) {
  return (
    <header className="topbar">
      <Link className="brand" href="/"><WalletCards /> Expanse</Link>
      <nav className="nav" aria-label="Main navigation">
        {links.map(([label, href]) => <Link className={active === label.toLowerCase() ? "active" : ""} href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="actions"><button aria-label="Notifications"><Bell /></button><button aria-label="Profile"><CircleUserRound /></button></div>
    </header>
  );
}
