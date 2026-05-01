import { cookies } from "next/headers";
import { verifyToken, type AuthPayload } from "./jwt";

export type Session = {
  user: { id: string; name: string; email: string; role: string };
  token: string;
} | null;

export async function getSession(): Promise<Session> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    return {
      user: { id: payload.id, name: payload.name, email: payload.email, role: payload.role },
      token,
    };
  } catch {
    return null;
  }
}

export type { AuthPayload };
