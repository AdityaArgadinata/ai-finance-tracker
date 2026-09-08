import assert from "node:assert/strict";
import test from "node:test";
import { extractJsonFromText, AI_PRESETS } from "./ai-provider.ts";

test("extractJsonFromText: parses direct JSON", () => {
  const result = extractJsonFromText('{"jenis":"pengeluaran","kategori":"Makanan","item":"nasi padang","nominal":15000}');
  assert.deepEqual(result, {
    jenis: "pengeluaran",
    kategori: "Makanan",
    item: "nasi padang",
    nominal: 15000,
  });
});

test("extractJsonFromText: parses JSON with trailing stream marker", () => {
  const result = extractJsonFromText('{"ok":true}data: [DONE]\n\n');
  assert.deepEqual(result, { ok: true });
});

test("extractJsonFromText: parses JSON wrapped in markdown code blocks", () => {
  const input = "Here is your parsed transaction:\n```json\n{\n  \"jenis\": \"pemasukan\",\n  \"kategori\": \"Gaji\",\n  \"item\": \"gaji bulanan\",\n  \"nominal\": 5000000\n}\n```\nHope that helps!";
  const result = extractJsonFromText(input);
  assert.deepEqual(result, {
    jenis: "pemasukan",
    kategori: "Gaji",
    item: "gaji bulanan",
    nominal: 5000000,
  });
});

test("AI_PRESETS contains major providers", () => {
  const ids = AI_PRESETS.map((p) => p.id);
  assert.ok(ids.includes("openai"));
  assert.ok(ids.includes("deepseek"));
  assert.ok(ids.includes("gemini"));
  assert.ok(ids.includes("claude"));
  assert.ok(ids.includes("groq"));
  assert.ok(ids.includes("9router"));
  assert.ok(ids.includes("custom"));
});
