import { CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/app/components/AppHeader";

const steps = [
  { label: "9Router", title: "Create a 9Router API key", text: "Open 9Router, create an API key, and note the model or combo ID you want to use. Never share the key in chat or commit it to source control." },
  { label: "Account", title: "Connect 9Router to Expanse", text: "Open Account, enter your 9Router API key and model ID, then select Save. Expanse validates the key and stores it encrypted in Supabase Vault." },
  { label: "Telegram", title: "Generate a link code", text: "From Account → Telegram & AI, select Generate link code. Copy the one-time /link command before its 10-minute expiration." },
  { label: "Telegram", title: "Send the command to your bot", text: "Open your Expanse Telegram bot and paste the complete command, for example /link A1B2C3D4. Wait for the connected confirmation." },
  { label: "Ready", title: "Record your first transaction", text: "Send a natural-language message containing an item and amount. The AI parser will categorize it and save it to your account." },
];

export default function TutorialPage() {
  return <main className="shell"><AppHeader active="tutorial" /><section className="page-heading"><div><span>Getting started</span><h1>Tutorial</h1></div><p>Connect Telegram and Groq in a few minutes</p></section><section className="tutorial-steps">{steps.map(({ label, title, text }, index) => <article key={title}><span className="tutorial-number">{String(index + 1).padStart(2, "0")}</span><div><small>{label}</small><h2>{title}</h2><p>{text}</p></div></article>)}</section><section className="tutorial-example"><div><span>Try it</span><h2>Messages the bot understands</h2></div><div className="tutorial-messages"><code>beli makan 26k</code><code>bensin motor 50k</code><code>gaji bulanan 5000k</code></div></section><section className="tutorial-note"><div><span className="tutorial-note-title"><CheckCircle2 />Connection checklist</span><p>Account shows both “Telegram connected” and “Groq connected” before you send a transaction.</p></div></section></main>;
}
