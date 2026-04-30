"use client";

import { useSession } from "@/pkg/auth/client";

export function useRole() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? "user";
  const isAdmin = role === "admin";
  return { role, isAdmin };
}
