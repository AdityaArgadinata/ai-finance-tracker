import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTelegramTransaction, parse9RouterResponse, parseTelegramNominal } from "./telegram-transaction.ts";

test("parses 9Router responses with trailing stream marker", () => {
  assert.deepEqual(parse9RouterResponse('{"ok":true}data: [DONE]\n\n'), { ok: true });
});

test("parses supported rupiah formats", () => {
  for (const [input, expected] of [
    ["1jt", 1_000_000], ["1 juta", 1_000_000], ["1000k", 1_000_000],
    ["1.5jt", 1_500_000], ["1500k", 1_500_000], ["1.500.000", 1_500_000],
    ["1000000", 1_000_000], ["2,7 juta", 2_700_000],
  ]) assert.equal(parseTelegramNominal(input), expected, input);
});

test("treats investment purchases as expenses", () => {
  const parsed = { jenis: "pemasukan", kategori: "Lain-lain", item: "saham us", nominal: 1_000_000_000 };
  assert.deepEqual(normalizeTelegramTransaction("investasi saham us 1000000", parsed), { ...parsed, jenis: "pengeluaran", kategori: "Investasi", nominal: 1_000_000 });
  assert.equal(normalizeTelegramTransaction("dividen saham 1jt", parsed).jenis, "pemasukan");
});
