"use client";

import { useState } from "react";
import { Bot, Check, Copy, KeyRound, Unlink } from "lucide-react";
import { createTelegramLinkCode, disconnectTelegram } from "@/app/actions/telegram";
import { removeGroqApiKey, saveGroqApiKey } from "@/app/actions/ai-settings";

export function TelegramIntegration({ telegram, linkCode, groq, aiStatus }: { telegram: { chatId: number; linkedAt: string } | null; linkCode: { code: string; expiresAt: string } | null; groq: { keyHint: string; updatedAt: string } | null; aiStatus?: string }) {
  const [copied, setCopied] = useState(false);

  const command = linkCode ? `/link ${linkCode.code}` : "";

  return (
    <article className="telegram-card">
      <header><div><span>Integration</span><h2>Telegram & AI</h2></div><Bot /></header>
      {telegram ? <div className="telegram-connected"><i /><div><strong>Telegram connected</strong><small>Chat ID {telegram.chatId} · Linked {telegram.linkedAt}</small></div><form action={disconnectTelegram}><button><Unlink /> Disconnect</button></form></div> : <div className="telegram-connected integration-pending"><i /><div><strong>Connect Telegram</strong><small>Link your account to record transactions from the bot.</small></div>{linkCode ? <div className="telegram-code"><span>One-time command</span><strong>{command}</strong><button type="button" aria-label="Copy link command" onClick={async () => { await navigator.clipboard.writeText(command); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</button><small>Expires {linkCode.expiresAt}</small></div> : <form action={createTelegramLinkCode}><button><Bot /> Generate link code</button></form>}</div>}
      {groq ? <div className="telegram-connected"><i /><div><strong>Groq connected</strong><small>{groq.keyHint} · Updated {groq.updatedAt}</small></div><form action={removeGroqApiKey}><button><Unlink /> Revoke</button></form></div> : <div className="telegram-connected integration-pending"><i /><div><strong>Connect Groq</strong><small>Your key is validated by Groq and stored encrypted in our database.</small>{aiStatus === "invalid" && <small className="ai-key-error">The API key is invalid or could not connect to Groq.</small>}</div><form className="integration-key-form" action={saveGroqApiKey}><input required type="password" name="api_key" autoComplete="off" placeholder="gsk_..." /><button><KeyRound /> Save key</button></form></div>}
    </article>
  );
}
