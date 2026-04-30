import { auth } from "@/pkg/auth/server";
import { headers } from "next/headers";
import { jsonError } from "./api-helpers";

export async function getAuthSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return { session: null, error: jsonError("Unauthorized", 401) } as const;
  }
  return { session, error: null } as const;
}

export async function requireRole(role: "admin") {
  const session = await getAuthSession();
  if (!session) {
    return { session: null, error: jsonError("Unauthorized", 401) } as const;
  }
  const userRole = (session.user as { role?: string }).role ?? "user";
  if (userRole !== role) {
    return { session, error: jsonError("Forbidden: insufficient permissions", 403) } as const;
  }
  return { session, error: null } as const;
}
