import { db } from "@/pkg/db";
import { user } from "@/pkg/db/schema";
import { signToken } from "@/pkg/auth/jwt";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    const [found] = await db.select().from(user).where(eq(user.email, email));

    if (!found || !found.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await compare(password, found.passwordHash);
    
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken({ id: found.id, name: found.name, email: found.email, role: found.role });
    const sessionUser = { id: found.id, name: found.name, email: found.email, role: found.role };

    const response = NextResponse.json({ token, user: sessionUser });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("[sign-in]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
