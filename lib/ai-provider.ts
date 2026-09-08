export interface AiProviderPreset {
  id: string;
  name: string;
  defaultEndpoint: string;
  defaultModel: string;
  placeholderKey: string;
  docsUrl?: string;
}

export const AI_PRESETS: AiProviderPreset[] = [
  {
    id: "openai",
    name: "OpenAI",
    defaultEndpoint: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    placeholderKey: "sk-proj-...",
    docsUrl: "https://platform.openai.com",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultEndpoint: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    placeholderKey: "sk-...",
    docsUrl: "https://platform.deepseek.com",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    defaultEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    placeholderKey: "AIzaSy...",
    docsUrl: "https://aistudio.google.com",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    defaultEndpoint: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-haiku-20241022",
    placeholderKey: "sk-ant-...",
    docsUrl: "https://console.anthropic.com",
  },
  {
    id: "groq",
    name: "Groq",
    defaultEndpoint: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    placeholderKey: "gsk_...",
    docsUrl: "https://console.groq.com",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    defaultEndpoint: "https://openrouter.ai/api/v1",
    defaultModel: "deepseek/deepseek-chat",
    placeholderKey: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai",
  },
  {
    id: "9router",
    name: "9Router",
    defaultEndpoint: "https://9router.com/v1",
    defaultModel: "if/kimi-k2",
    placeholderKey: "sk-...",
    docsUrl: "https://9router.com",
  },
  {
    id: "custom",
    name: "Custom / Local Endpoint",
    defaultEndpoint: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    placeholderKey: "API Key",
  },
];

export function extractJsonFromText(raw: string): any {
  const cleaned = raw.replace(/\s*data:\s*\[DONE\]\s*$/, "").trim();

  // Try parsing directly
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Try finding ```json ... ``` markdown block
  const jsonBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlock?.[1]) {
    try {
      return JSON.parse(jsonBlock[1].trim());
    } catch {}
  }

  // Try finding outermost { ... }
  const jsonObject = cleaned.match(/\{[\s\S]*\}/);
  if (jsonObject?.[0]) {
    try {
      return JSON.parse(jsonObject[0].trim());
    } catch {}
  }

  throw new Error(`Failed to extract JSON from: ${raw.slice(0, 120)}`);
}

export interface AiCallOptions {
  endpoint: string;
  apiKey: string;
  model: string;
  provider?: string;
  systemPrompt: string;
  userPrompt: string;
}

export async function callAiCompletion({
  endpoint,
  apiKey,
  model,
  provider,
  systemPrompt,
  userPrompt,
}: AiCallOptions): Promise<string> {
  const cleanEndpoint = endpoint.trim().replace(/\/$/, "");
  const isAnthropic = provider === "claude" || cleanEndpoint.includes("api.anthropic.com");
  const signal = AbortSignal.timeout(7_000);

  if (isAnthropic) {
    const url = cleanEndpoint.endsWith("/messages") ? cleanEndpoint : `${cleanEndpoint}/messages`;
    const res = await fetch(url, {
      method: "POST",
      signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const resText = await res.text();
    if (!res.ok) {
      throw new Error(`Anthropic error (${res.status}): ${resText}`);
    }

    const data = JSON.parse(resText);
    const content = data.content?.[0]?.text;
    if (!content) throw new Error("Empty response from Anthropic Claude");
    return content;
  }

  // Standard OpenAI-compatible API
  const url = cleanEndpoint.endsWith("/chat/completions") ? cleanEndpoint : `${cleanEndpoint}/chat/completions`;

  let res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  // If 400 because response_format json_object is unsupported, retry without response_format
  if (!res.ok && res.status === 400) {
    const errorText = await res.text();
    if (/response_format|json_object/i.test(errorText)) {
      res = await fetch(url, {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
    } else {
      throw new Error(`AI API error (${res.status}): ${errorText}`);
    }
  }

  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(`AI API error (${res.status}): ${responseText}`);
  }

  const parsed = extractJsonFromText(responseText);
  const content = parsed?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned in choices from AI completion");
  }

  return content;
}

export async function validateAiConfig(
  endpoint: string,
  apiKey: string,
  model: string,
  provider?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const cleanEndpoint = endpoint.trim().replace(/\/$/, "");
    if (!cleanEndpoint) return { ok: false, error: "Endpoint URL is required" };
    if (!model.trim()) return { ok: false, error: "Model ID is required" };
    if (!apiKey.trim()) return { ok: false, error: "API Key is required" };

    const isAnthropic = provider === "claude" || cleanEndpoint.includes("api.anthropic.com");

    if (isAnthropic) {
      const url = cleanEndpoint.endsWith("/messages") ? cleanEndpoint : `${cleanEndpoint}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Anthropic (${res.status}): ${text}` };
      }
      return { ok: true };
    }

    // Try GET /models first for OpenAI-compatible endpoint
    try {
      const modelsUrl = `${cleanEndpoint}/models`;
      const res = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) return { ok: true };
    } catch {
      // If /models fails or doesn't exist, proceed to test completion
    }

    // Try a minimal chat completion
    const chatUrl = cleanEndpoint.endsWith("/chat/completions") ? cleanEndpoint : `${cleanEndpoint}/chat/completions`;
    const chatRes = await fetch(chatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 5,
        messages: [{ role: "user", content: "ping" }],
      }),
    });

    if (!chatRes.ok) {
      const errorText = await chatRes.text();
      return { ok: false, error: `API error (${chatRes.status}): ${errorText}` };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to reach AI endpoint" };
  }
}
