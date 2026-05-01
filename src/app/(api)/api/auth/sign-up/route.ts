import { db } from "@/pkg/db";
import { user } from "@/pkg/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const [existing] = await db.select().from(user).where(eq(user.email, email));
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = await hash(password, 12);
    const id = crypto.randomUUID();

    await db.insert(user).values({ id, name, email, passwordHash });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
