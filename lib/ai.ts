import type { User } from "@prisma/client";

type AiMode = "email" | "summary" | "followup";

export type GenerateEmailInput = {
  lead: { name: string; email: string; company?: string | null; notes?: string | null };
  emailType: "cold" | "follow_up" | "re_engagement";
  tone: "professional" | "friendly" | "persuasive";
};

export async function callGroq(prompt: string, user?: Pick<User, "groqApiKey">) {
  const apiKey = user?.groqApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Add a Groq API key in Settings or GROQ_API_KEY in .env.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "You are an expert CRM assistant for small businesses. Return only valid JSON with no markdown fences."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq request failed: ${detail}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content as string;
}

export function parseJsonResponse<T>(content: string): T {
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  return JSON.parse(cleaned) as T;
}

export async function generateStructuredAi<T>(mode: AiMode, prompt: string, user?: Pick<User, "groqApiKey">) {
  const content = await callGroq(prompt, user);
  try {
    return parseJsonResponse<T>(content);
  } catch {
    throw new Error(`AI returned invalid JSON for ${mode}. Please try again.`);
  }
}

export function emailPrompt(input: GenerateEmailInput) {
  return `Generate a ${input.emailType} sales email for this CRM lead.
Lead: ${JSON.stringify(input.lead)}
Tone: ${input.tone}
Return JSON exactly as:
{
  "subject": "short subject line",
  "body": "email body under 180 words, with a clear CTA"
}`;
}

export function summaryPrompt(notes: string) {
  return `Summarize these meeting notes for a small-business CRM.
Notes:
${notes}
Return JSON exactly as:
{
  "summary": "concise paragraph",
  "actionItems": ["specific action item"],
  "followUps": ["specific follow-up"],
  "suggestedNextEmail": {
    "subject": "short subject",
    "body": "email body under 160 words"
  }
}`;
}

export function followupPrompt(lead: { name: string; email: string; company?: string | null; notes?: string | null }) {
  return `Create a practical 3-step follow-up plan for this CRM lead.
Lead: ${JSON.stringify(lead)}
Return JSON exactly as:
{
  "sequence": [
    {"timing": "Day 1", "subject": "subject", "body": "email under 140 words"},
    {"timing": "Day 3", "subject": "subject", "body": "email under 140 words"},
    {"timing": "Day 7", "subject": "subject", "body": "email under 140 words"}
  ]
}`;
}
