import { EmailType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const emailTypes = new Set(Object.values(EmailType));

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const lead = await prisma.lead.findFirst({ where: { id, userId: user.id } });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

    const subject = String(body.subject || "").trim();
    const emailBody = String(body.body || "").trim();
    if (!subject || !emailBody) {
      return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
    }

    let sent = false;
    let error: string | undefined;
    try {
      await sendEmail({ to: lead.email, subject, body: emailBody, user });
      sent = true;
    } catch (err) {
      error = err instanceof Error ? err.message : "Email failed.";
    }

    const log = await prisma.emailLog.create({
      data: {
        to: lead.email,
        subject,
        body: emailBody,
        type: emailTypes.has(body.type) ? body.type : EmailType.CUSTOM,
        sent,
        error,
        leadId: id
      }
    });

    return NextResponse.json(log, { status: sent ? 201 : 502 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
