import { LeadStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = new Set(Object.values(LeadStatus));

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");

    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        ...(status && statuses.has(status as LeadStatus) ? { status: status as LeadStatus } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { company: { contains: q, mode: "insensitive" } },
                { tags: { has: q } }
              ]
            }
          : {})
      },
      include: { notes: { orderBy: { createdAt: "desc" }, take: 1 }, emails: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(leads);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        company: String(body.company || "").trim() || null,
        status: statuses.has(body.status) ? body.status : LeadStatus.NEW,
        tags: Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : parseTags(body.tags),
        summary: String(body.notes || "").trim() || null,
        userId: user.id
      }
    });

    if (String(body.notes || "").trim()) {
      await prisma.note.create({
        data: {
          content: String(body.notes).trim(),
          leadId: lead.id
        }
      });
    }

    return NextResponse.json(lead, { status: 201 });
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
