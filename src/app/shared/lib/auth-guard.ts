import { getSession } from "@/pkg/auth/server";
import { jsonError } from "./api-helpers";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return { session: null, error: jsonError("Unauthorized", 401) } as const;
  }
  return { session, error: null } as const;
}

export async function requireRole(role: "admin") {
  const session = await getSession();
  if (!session) {
    return { session: null, error: jsonError("Unauthorized", 401) } as const;
  }
  if (session.user.role !== role) {
    return { session, error: jsonError("Forbidden: insufficient permissions", 403) } as const;
  }
  return { session, error: null } as const;
}
