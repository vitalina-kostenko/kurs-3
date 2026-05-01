import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/pkg/auth/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ user: null, session: null });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ user: null, session: null });
    }

    return NextResponse.json({
      user: { id: payload.id, name: payload.name, email: payload.email, role: payload.role },
      session: { token },
    });
  } catch {
    return NextResponse.json({ user: null, session: null });
  }
}
