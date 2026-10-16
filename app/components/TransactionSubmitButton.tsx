"use client";

import { useFormStatus } from "react-dom";
import styles from "./TransactionSubmitButton.module.css";

export function TransactionSubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();

  return (
    <button className={styles.button} type="submit" disabled={pending} aria-busy={pending} aria-label={pending ? "Processing transaction" : children}>
      {pending ? <span className={styles.spinner} aria-hidden="true" /> : children}
    </button>
  );
}
