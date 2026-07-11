import { ArrowRight, ArrowUpRight, WalletCards } from "lucide-react";
import { loginWithGoogle } from "@/app/actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const hasError = Boolean((await searchParams).error);

  return (
    <main className="login-page">
      <div className="login-shell">
        <header className="login-topbar"><div className="login-brand"><WalletCards /> Expanse</div></header>
        <section className="login-layout">
          <article className="login-hero">
            <div className="login-hero-head"><span>EXP / 2026</span><i><ArrowUpRight /></i></div>
            <div className="login-hero-copy"><h1>Money,<br />in focus.</h1><p>A clear view of every rupiah.</p></div>
          </article>
          <article className="login-card">
            <span className="login-kicker">Sign in</span>
            <h2>Good to see you.</h2>
            <p>Continue to your personal finance dashboard.</p>
            <form action={loginWithGoogle}>
              <button className="google-login" type="submit"><i>G</i> Continue with Google <ArrowRight /></button>
            </form>
            {hasError && <small className="login-error">Google sign-in could not be started. Please try again.</small>}
          </article>
        </section>
      </div>
    </main>
  );
}
