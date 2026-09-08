"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, Copy, ExternalLink, KeyRound, RefreshCw, Sparkles, Unlink } from "lucide-react";
import { createTelegramLinkCode, disconnectTelegram } from "@/app/actions/telegram";
import { removeGroqApiKey, saveGroqApiKey } from "@/app/actions/ai-settings";
import { AI_PRESETS, type AiProviderPreset } from "@/lib/ai-provider";

interface TelegramIntegrationProps {
  telegram: { chatId: number; linkedAt: string } | null;
  linkCode: { code: string; expiresAt: string } | null;
  groq: {
    keyHint: string;
    model: string;
    endpoint?: string;
    provider?: string;
    updatedAt: string;
  } | null;
  aiStatus?: string;
  aiReason?: string;
}

export function TelegramIntegration({
  telegram,
  linkCode,
  groq,
  aiStatus,
  aiReason,
}: TelegramIntegrationProps) {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const router = useRouter();

  const [selectedPresetId, setSelectedPresetId] = useState<string>("deepseek");
  const currentPreset = AI_PRESETS.find((p) => p.id === selectedPresetId) ?? AI_PRESETS[1];
  const [endpoint, setEndpoint] = useState<string>(currentPreset.defaultEndpoint);
  const [model, setModel] = useState<string>(currentPreset.defaultModel);

  const command = linkCode ? `/link ${linkCode.code}` : "";

  function handlePresetChange(presetId: string) {
    setSelectedPresetId(presetId);
    const preset = AI_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setEndpoint(preset.defaultEndpoint);
      setModel(preset.defaultModel);
    }
  }

  const activeProviderPreset = groq?.provider
    ? AI_PRESETS.find((p) => p.id === groq.provider.toLowerCase())
    : null;
  const connectedProviderName = activeProviderPreset?.name ?? (groq?.provider ? groq.provider.toUpperCase() : "AI");

  return (
    <article className="telegram-card">
      <header>
        <div>
          <span>Integration</span>
          <h2>Telegram & AI Integration</h2>
        </div>
        <button
          className="integration-refresh"
          type="button"
          aria-label="Refresh integrations"
          data-tooltip="Refresh"
          disabled={isRefreshing}
          onClick={() => startRefresh(() => router.refresh())}
        >
          <RefreshCw />
        </button>
      </header>

      {/* Telegram Connection Section */}
      {telegram ? (
        <div className="telegram-connected">
          <i />
          <div>
            <strong>Telegram connected</strong>
            <small>Chat ID {telegram.chatId} · Linked {telegram.linkedAt}</small>
          </div>
          <form action={disconnectTelegram}>
            <button><Unlink /> Disconnect</button>
          </form>
        </div>
      ) : (
        <div className="telegram-connected integration-pending">
          <i />
          <div>
            <strong>Connect Telegram</strong>
            <small>Link your account to record transactions from the bot.</small>
          </div>
          {linkCode ? (
            <div className="telegram-code">
              <div className="telegram-command">
                <strong>{command}</strong>
                <button
                  type="button"
                  aria-label="Copy link command"
                  onClick={async () => {
                    await navigator.clipboard.writeText(command);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="telegram-code-meta">
                <small title={`Expires ${linkCode.expiresAt}`}>10 min</small>
                <a href="https://telegram.me/normiuz_bot" target="_blank" rel="noreferrer">
                  Visit bot <ExternalLink />
                </a>
              </div>
            </div>
          ) : (
            <form action={createTelegramLinkCode}>
              <button><Bot /> Generate link code</button>
            </form>
          )}
        </div>
      )}

      {/* AI Provider Section */}
      {groq ? (
        <div className="telegram-connected">
          <i />
          <div>
            <strong>{connectedProviderName} connected</strong>
            <small>
              {groq.keyHint} · {groq.model}
              {groq.endpoint ? ` · ${groq.endpoint.replace(/^https?:\/\//, "")}` : ""} · Updated {groq.updatedAt}
            </small>
            {activeProviderPreset?.docsUrl && (
              <a
                className="integration-site-link"
                href={activeProviderPreset.docsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Visit {activeProviderPreset.name} <ExternalLink />
              </a>
            )}
          </div>
          <form action={removeGroqApiKey}>
            <button><Unlink /> Revoke</button>
          </form>
        </div>
      ) : (
        <div className="telegram-connected integration-pending ai-integration-box">
          <i />
          <div style={{ width: "100%" }}>
            <strong>Connect AI Provider</strong>
            <small>
              Gunakan API key dan endpoint pilihan Anda (DeepSeek, Google Gemini, OpenAI, Claude, Groq, 9Router, atau Custom). Kunci disimpan terenkripsi di Supabase Vault.
            </small>
            {aiStatus === "invalid" && (
              <small className="ai-key-error">
                {aiReason
                  ? `Koneksi gagal: ${aiReason}`
                  : "API key atau model tidak valid, atau endpoint tidak dapat dihubungi."}
              </small>
            )}

            <form className="integration-ai-form" action={saveGroqApiKey}>
              <input type="hidden" name="provider" value={selectedPresetId} />

              <div className="integration-ai-grid">
                <div className="ai-form-group">
                  <label htmlFor="ai-preset-select">Provider Preset</label>
                  <select
                    id="ai-preset-select"
                    value={selectedPresetId}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="ai-select"
                  >
                    {AI_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ai-form-group">
                  <label htmlFor="ai-endpoint-input">API Base URL / Endpoint</label>
                  <input
                    id="ai-endpoint-input"
                    required
                    name="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="ai-input"
                  />
                </div>

                <div className="ai-form-group">
                  <label htmlFor="ai-model-input">Model ID</label>
                  <input
                    id="ai-model-input"
                    required
                    name="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. deepseek-chat"
                    className="ai-input"
                  />
                </div>

                <div className="ai-form-group">
                  <label htmlFor="ai-key-input">API Key</label>
                  <input
                    id="ai-key-input"
                    required
                    type="password"
                    name="api_key"
                    autoComplete="off"
                    placeholder={currentPreset.placeholderKey}
                    className="ai-input"
                  />
                </div>

                <div className="ai-form-submit">
                  <button type="submit" className="ai-submit-btn">
                    <KeyRound /> Connect
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
