import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export async function generateAIResponse(prompt: string, systemInstruction?: string) {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are a helpful IT Management Assistant for the HypeRemote platform. You help IT administrators manage devices, tickets, and system alerts. Keep your answers concise and professional.",
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function analyzeSystemStatus(stats: any, alerts: any[]) {
  const prompt = `
    Analyze the following system statistics and alerts for an IT management platform:
    Stats: ${JSON.stringify(stats)}
    Recent Alerts: ${JSON.stringify(alerts.slice(0, 5))}
    
    Provide a brief (2-3 sentences) executive summary of the system health and any urgent actions needed.
  `;

  return generateAIResponse(prompt, "You are a senior IT infrastructure analyst. Provide high-level insights.");
}
