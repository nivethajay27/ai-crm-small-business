import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      name: user.name,
      company: user.company,
      email: user.email,
      groqApiKey: user.groqApiKey ? "configured" : "",
      resendApiKey: user.resendApiKey ? "configured" : "",
      emailFrom: user.emailFrom || ""
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: clean(body.name),
        company: clean(body.company),
        emailFrom: clean(body.emailFrom),
        ...(body.groqApiKey && body.groqApiKey !== "configured" ? { groqApiKey: clean(body.groqApiKey) } : {}),
        ...(body.resendApiKey && body.resendApiKey !== "configured" ? { resendApiKey: clean(body.resendApiKey) } : {})
      }
    });

    return NextResponse.json({
      name: updated.name,
      company: updated.company,
      email: updated.email,
      groqApiKey: updated.groqApiKey ? "configured" : "",
      resendApiKey: updated.resendApiKey ? "configured" : "",
      emailFrom: updated.emailFrom || ""
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function clean(value: unknown) {
  return String(value || "").trim() || null;
}
