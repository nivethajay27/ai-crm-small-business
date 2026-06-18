import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Email and an 8+ character password are required." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hash(password, 12)
    }
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
