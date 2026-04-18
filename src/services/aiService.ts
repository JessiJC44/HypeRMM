import { GoogleGenAI } from "@google/genai";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const GEMINI_MODEL = "gemini-2.5-flash";
const OPENROUTER_MODEL = "qwen/qwen3.6-plus:free";

let gemini: GoogleGenAI | null = null;
if (GEMINI_KEY && GEMINI_KEY !== "MY_GEMINI_API_KEY") {
  gemini = new GoogleGenAI({ apiKey: GEMINI_KEY });
}

const hasOpenRouter = (): boolean =>
  !!OPENROUTER_KEY && OPENROUTER_KEY !== "MY_OPENROUTER_API_KEY";

const hasAnyProvider = (): boolean => !!gemini || hasOpenRouter();

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!gemini) throw new Error("Gemini not configured");
  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction:
        systemInstruction ||
        "You are a helpful IT Management Assistant for the HypeRemote platform. You help IT administrators manage devices, tickets, and system alerts. Keep your answers concise and professional.",
    },
  });
  return response.text || "";
}

async function callOpenRouter(prompt: string, systemInstruction?: string): Promise<string> {
  if (!hasOpenRouter()) throw new Error("OpenRouter not configured");

  const messages: Array<{ role: string; content: string }> = [];
  messages.push({
    role: "system",
    content:
      systemInstruction ||
      "You are a helpful IT Management Assistant for the HypeRemote platform. You help IT administrators manage devices, tickets, and system alerts. Keep your answers concise and professional.",
  });
  messages.push({ role: "user", content: prompt });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer":
        typeof window !== "undefined" ? window.location.origin : "https://hyperemote.local",
      "X-Title": "HypeRemote",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`OpenRouter error ${response.status}: ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned empty response");
  return content;
}

async function callWithFallback(prompt: string, systemInstruction?: string): Promise<string> {
  if (!hasAnyProvider()) {
    throw new Error(
      "No AI provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY in your environment."
    );
  }

  if (gemini) {
    try {
      const result = await callGemini(prompt, systemInstruction);
      if (result) return result;
      throw new Error("Gemini returned empty response");
    } catch (err) {
      console.warn("Gemini call failed, falling back to OpenRouter:", err);
      if (!hasOpenRouter()) throw err;
    }
  }

  return callOpenRouter(prompt, systemInstruction);
}

export async function generateAIResponse(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  try {
    const result = await callWithFallback(prompt, systemInstruction);
    return result || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}

export async function generateScript(
  description: string,
  language: string,
  targetOs: string
): Promise<string> {
  const prompt = `Generate a ${language} script for ${targetOs} that does: ${description}. Return ONLY the script code, no explanations, no markdown code blocks. The script must be safe, idempotent if possible, and include basic error handling. Use variables like {variable_name} for values that should be configurable.`;
  const systemInstruction = "You are an expert IT administrator and script developer.";

  try {
    let text = await callWithFallback(prompt, systemInstruction);
    text = text.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "");
    return text;
  } catch (error) {
    console.error("Script Generation Error:", error);
    throw error;
  }
}

export async function analyzeSystemStatus(stats: any, alerts: any[]): Promise<string> {
  const prompt = `
    Analyze the following system statistics and alerts for an IT management platform:
    Stats: ${JSON.stringify(stats)}
    Recent Alerts: ${JSON.stringify(alerts.slice(0, 5))}
    
    Provide a brief (2-3 sentences) executive summary of the system health and any urgent actions needed.
  `;
  return generateAIResponse(
    prompt,
    "You are a senior IT infrastructure analyst. Provide high-level insights."
  );
}

export function getAIProviderStatus(): {
  gemini: boolean;
  openrouter: boolean;
  anyAvailable: boolean;
} {
  return {
    gemini: !!gemini,
    openrouter: hasOpenRouter(),
    anyAvailable: hasAnyProvider(),
  };
}
