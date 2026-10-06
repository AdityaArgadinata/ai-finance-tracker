"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { resetAllTransactions } from "@/app/actions/account";

export function ResetAllData() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleReset() {
    startTransition(async () => {
      try {
        await resetAllTransactions();
        setOpen(false);
        setError("");
        router.refresh();
      } catch {
        setError("Failed to reset transactions. Please try again.");
      }
    });
  }

  return (
    <>
      <article className="account-reset">
        <div>
          <span>Data management</span>
          <h2>Reset all data</h2>
          <p>Remove all transactions recorded in your account.</p>
        </div>
        <button type="button" onClick={() => { setError(""); setOpen(true); }}><Trash2 /> Reset all data</button>
      </article>

      {open && (
        <div className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="reset-all-title">
          <form className="delete-transaction-modal" onSubmit={(event) => { event.preventDefault(); handleReset(); }}>
            <header>
              <h2 id="reset-all-title">Reset all transactions?</h2>
              <button type="button" aria-label="Close" disabled={pending} onClick={() => setOpen(false)}><X /></button>
            </header>
            <p><strong>All your transactions</strong><span>Income and expenses</span>This action cannot be undone.</p>
            {error && <div className="account-reset-error" role="alert">{error}</div>}
            <div className="transaction-modal-actions">
              <button type="button" disabled={pending} onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" disabled={pending}>{pending ? "Resetting..." : "Reset transactions"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
