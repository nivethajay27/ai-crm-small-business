import type { User } from "@prisma/client";

export async function sendEmail({
  to,
  subject,
  body,
  user
}: {
  to: string;
  subject: string;
  body: string;
  user?: Pick<User, "resendApiKey" | "emailFrom">;
}) {
  const apiKey = user?.resendApiKey || process.env.RESEND_API_KEY;
  const from = user?.emailFrom || process.env.EMAIL_FROM || "AI CRM <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("Add a Resend API key in Settings or RESEND_API_KEY in .env.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: body
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend request failed: ${detail}`);
  }

  return response.json();
}
