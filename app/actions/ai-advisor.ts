"use server";

import Groq from "groq-sdk";

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  burnRate: number;
  topCategories: Array<{
    kategori: string;
    nominal: number;
  }>;
}

export async function getFinancialAdvice(summaryData: SummaryData): Promise<string> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // Use top categories directly without translation
  const translatedSummary = {
    ...summaryData,
    topCategories: summaryData.topCategories.map((c) => ({
      category: c.kategori,
      amount: c.nominal,
    })),
  };

  const systemPrompt = `Anda adalah penasihat keuangan pribadi yang ramah, profesional, dan cerdas. Analisis ringkasan data telemetri keuangan pengguna (disediakan dalam JSON). Berikan wawasan singkat maksimal 3 kalimat. Berikan selamat jika mereka memiliki arus kas positif / saldo yang solid, dan berikan peringatan lembut jika pengeluaran terlalu tinggi (burn rate mendekati/melebihi 100%). Pertahankan nada kasual namun profesional dalam bahasa Indonesia. Jangan ulangi angka mentah dengan kaku; gunakan persentase atau perbandingan relatif.`;

  const userMessage = `Data keuangan bulan ini: ${JSON.stringify(translatedSummary, null, 2)}`;

  try {
    const message = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Extract text from the response
    const responseText =
      message.choices[0]?.message?.content || "Unable to analyze your financial data at this moment.";

    return responseText;
  } catch (error) {
    console.error("Error fetching financial advice from Groq:", error);
    throw new Error("Failed to get financial advice from AI");
  }
}

