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

  const systemPrompt = `Kamu adalah penasihat keuangan pribadi yang ramah, profesional, dan cerdas. Analisis ringkasan data keuangan pengguna bulan ini (diberikan dalam JSON). Berikan insight singkat maksimal 3 kalimat. Puji jika arus kas positif/saldo sisa banyak, beri peringatan halus jika pengeluaran terlalu besar (burn rate mendekati/melebihi 100%). Gunakan bahasa Indonesia yang santai tapi profesional. Jangan kaku mengulang angka, gunakan persentase atau perbandingan.`;

  const userMessage = `Data keuangan bulan ini: ${JSON.stringify(summaryData, null, 2)}`;

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
      message.choices[0]?.message?.content || "Tidak dapat menganalisis data keuangan Anda saat ini.";

    return responseText;
  } catch (error) {
    console.error("Error fetching financial advice from Groq:", error);
    throw new Error("Gagal mendapatkan saran keuangan dari AI");
  }
}
