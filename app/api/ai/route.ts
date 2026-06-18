import { NextResponse } from "next/server";
import { emailPrompt, followupPrompt, generateStructuredAi, summaryPrompt } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "email") {
      const lead = await getLead(body.leadId, user.id);
      const latestNote = lead.notes[0]?.content || lead.summary || "";
      const result = await generateStructuredAi<{ subject: string; body: string }>(
        "email",
        emailPrompt({
          lead: { name: lead.name, email: lead.email, company: lead.company, notes: latestNote },
          emailType: body.emailType || "cold",
          tone: body.tone || "professional"
        }),
        user
      );
      return NextResponse.json(result);
    }

    if (action === "summary") {
      const notes = String(body.notes || "").trim();
      if (!notes) return NextResponse.json({ error: "Notes are required." }, { status: 400 });
      const result = await generateStructuredAi("summary", summaryPrompt(notes), user);
      return NextResponse.json(result);
    }

    if (action === "followup") {
      const lead = await getLead(body.leadId, user.id);
      const result = await generateStructuredAi(
        "followup",
        followupPrompt({
          name: lead.name,
          email: lead.email,
          company: lead.company,
          notes: lead.notes.map((note) => note.content).join("\n\n")
        }),
        user
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown AI action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI request failed.";
    const status = message === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function getLead(leadId: string, userId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId },
    include: { notes: { orderBy: { createdAt: "desc" } } }
  });
  if (!lead) throw new Error("Lead not found.");
  return lead;
}
