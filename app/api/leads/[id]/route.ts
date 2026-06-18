import { LeadStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = new Set(Object.values(LeadStatus));

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        emails: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    for (const key of ["name", "email", "company", "summary"] as const) {
      if (key in body) data[key] = String(body[key] || "").trim() || null;
    }
    if ("status" in body && statuses.has(body.status)) data.status = body.status;
    if ("tags" in body) data.tags = Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : parseTags(body.tags);

    const lead = await prisma.lead.updateMany({ where: { id, userId: user.id }, data });
    if (!lead.count) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

    const updated = await prisma.lead.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const deleted = await prisma.lead.deleteMany({ where: { id, userId: user.id } });
    if (!deleted.count) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function parseTags(value: unknown) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
