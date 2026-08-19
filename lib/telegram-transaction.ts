export interface TelegramParsedTransaction {
  jenis: "pemasukan" | "pengeluaran";
  kategori: string;
  item: string;
  nominal: number;
}

export function parse9RouterResponse(text: string) {
  return JSON.parse(text.replace(/\s*data:\s*\[DONE\]\s*$/, ""));
}

export function parseTelegramNominal(text: string) {
  const raw = [...text.toLowerCase().matchAll(/\d+(?:[.,]\d+)*(?:\s*(?:juta|jt|ribu|rb|k))?/g)].at(-1)?.[0].replace(/\s/g, "");
  if (!raw) return null;

  const suffix = raw.match(/(juta|jt|ribu|rb|k)$/)?.[1];
  const value = suffix ? raw.slice(0, -suffix.length) : raw;
  const number = suffix && /^\d+[.,]\d{1,2}$/.test(value) ? Number(value.replace(",", ".")) : Number(value.replace(/[.,]/g, ""));
  const nominal = Math.round(number * (suffix === "juta" || suffix === "jt" ? 1_000_000 : suffix ? 1_000 : 1));
  return Number.isSafeInteger(nominal) && nominal > 0 ? nominal : null;
}

export function normalizeTelegramTransaction(text: string, parsed: TelegramParsedTransaction) {
  const transaction = { ...parsed };
  const nominal = parseTelegramNominal(text);
  if (nominal) transaction.nominal = nominal;

  const investment = /\b(?:investasi|saham|stock|reksa\s?dana|crypto|kripto|obligasi)\b/i;
  const investmentIncome = /\b(?:dividen|dividend|return|hasil investasi|profit(?: investasi| saham| crypto)?|jual\s+(?:saham|stock|crypto|kripto|reksa\s?dana|obligasi))\b/i;
  if (investmentIncome.test(text)) {
    transaction.jenis = "pemasukan";
    transaction.kategori = "Investasi";
  } else if (investment.test(text)) {
    transaction.jenis = "pengeluaran";
    transaction.kategori = "Investasi";
  }

  return transaction;
}
