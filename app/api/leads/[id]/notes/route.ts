import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const content = String(body.content || "").trim();
    if (!content) return NextResponse.json({ error: "Note content is required." }, { status: 400 });

    const lead = await prisma.lead.findFirst({ where: { id, userId: user.id } });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

    const note = await prisma.note.create({ data: { content, aiSummary: body.aiSummary || undefined, leadId: id } });
    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
