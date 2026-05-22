"use server";

import Groq from "groq-sdk";
import { translateCategory } from "@/lib/utils";

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

  // Translate top categories for the AI context so the advisor can discuss them in English
  const translatedSummary = {
    ...summaryData,
    topCategories: summaryData.topCategories.map((c) => ({
      category: translateCategory(c.kategori),
      amount: c.nominal,
    })),
  };

  const systemPrompt = `You are a friendly, professional, and smart personal financial advisor. Analyze the summary of the user's financial telemetry data (provided in JSON). Provide a brief insight of maximum 3 sentences. Congratulate them if they have positive cash flow / solid remaining balance, and provide a gentle warning if expenses are too high (burn rate approaching/exceeding 100%). Keep your tone casual but professional in English. Do not repeat raw numbers stiffly; use percentages or relative comparisons.`;

  const userMessage = `This month's financial data: ${JSON.stringify(translatedSummary, null, 2)}`;

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

