import { CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/app/components/AppHeader";

const steps = [
  {
    label: "AI Provider",
    title: "Obtain an API key from your preferred AI provider",
    text: "Choose any provider: DeepSeek, Google Gemini, OpenAI, Anthropic Claude, Groq, 9Router, or your own custom/local endpoint. Generate an API key from their developer console.",
  },
  {
    label: "Account",
    title: "Connect AI Provider to Expanse",
    text: "Open Account → Telegram & AI Integration. Select your provider preset (or Custom), verify the endpoint and model ID, enter your API key, then select Connect. Expanse validates the connection and encrypts the key in Supabase Vault.",
  },
  {
    label: "Telegram",
    title: "Generate a link code",
    text: "From Account → Telegram & AI, select Generate link code. Copy the one-time /link command before its 10-minute expiration.",
  },
  {
    label: "Telegram",
    title: "Send the command to your bot",
    text: "Open your Expanse Telegram bot and paste the complete command, for example /link A1B2C3D4. Wait for the connected confirmation.",
  },
  {
    label: "Ready",
    title: "Record your first transaction",
    text: "Send a natural-language message containing an item and amount (e.g. 'beli makan 26k'). The AI parser will categorize it and save it to your account.",
  },
];

export default function TutorialPage() {
  return (
    <main className="shell">
      <AppHeader active="tutorial" />
      <section className="page-heading">
        <div>
          <span>Getting started</span>
          <h1>Tutorial</h1>
        </div>
        <p>Connect Telegram and your favorite AI provider in a few minutes</p>
      </section>
      <section className="tutorial-steps">
        {steps.map(({ label, title, text }, index) => (
          <article key={title}>
            <span className="tutorial-number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <small>{label}</small>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="tutorial-example">
        <div>
          <span>Try it</span>
          <h2>Messages the bot understands</h2>
        </div>
        <div className="tutorial-messages">
          <code>beli makan 26k</code>
          <code>bensin motor 50k</code>
          <code>gaji bulanan 5000k</code>
        </div>
      </section>
      <section className="tutorial-note">
        <div>
          <span className="tutorial-note-title">
            <CheckCircle2 />Connection checklist
          </span>
          <p>Make sure Account shows both “Telegram connected” and “AI Provider connected” before sending transactions.</p>
        </div>
      </section>
    </main>
  );
}
