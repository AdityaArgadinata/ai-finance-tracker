export function translateCategory(cat: string): string {
  const mapping: Record<string, string> = {
    "makanan & minuman": "Food & Beverage",
    "rokok": "Tobacco & Vape",
    "transportasi": "Transportation",
    "belanja": "Shopping",
    "tagihan & utilitas": "Bills & Utilities",
    "hiburan": "Entertainment",
    "kesehatan": "Healthcare",
    "pendidikan": "Education",
    "lain-lain": "Others",
    "gaji": "Salary",
    "investasi": "Investment",
    "bisnis": "Business",
  };
  const normalized = cat.trim().toLowerCase();
  if (mapping[normalized]) {
    return mapping[normalized];
  }
  // Fallback: title case
  return cat
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
