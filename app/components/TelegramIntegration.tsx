"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, MessageCircle, Unlink } from "lucide-react";
import { createTelegramLinkCode, disconnectTelegram } from "@/app/actions/telegram";

export function TelegramIntegration({ telegram, linkCode }: { telegram: { chatId: number; linkedAt: string } | null; linkCode: { code: string; expiresAt: string } | null }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (telegram || !linkCode) return;
    // ponytail: short-lived polling; use Supabase Realtime if Account traffic makes this expensive.
    const interval = window.setInterval(() => router.refresh(), 2000);
    return () => window.clearInterval(interval);
  }, [telegram, linkCode, router]);

  const command = linkCode ? `/link ${linkCode.code}` : "";

  return (
    <article className="telegram-card">
      <header><div><span>Integration</span><h2>Telegram & AI</h2></div><MessageCircle /></header>
      {telegram ? <div className="telegram-connected"><i /><div><strong>Telegram connected</strong><small>Chat ID {telegram.chatId} · Linked {telegram.linkedAt}</small></div><form action={disconnectTelegram}><button><Unlink /> Disconnect</button></form></div> : <div className="telegram-connect"><div><strong>Record transactions from Telegram</strong><p>Connect your Telegram account before using the bot and AI transaction parser.</p></div>{linkCode ? <div className="telegram-code"><span>One-time command</span><strong>{command}</strong><button type="button" aria-label="Copy link command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</button><small>Expires {linkCode.expiresAt}</small></div> : <form action={createTelegramLinkCode}><button><MessageCircle /> Generate link code</button></form>}</div>}
    </article>
  );
}
