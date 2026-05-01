"use client";

import { useSession } from "@/pkg/auth/client";

export function useRole() {
  const { data } = useSession();
  const role = data?.user?.role ?? "user";
  const isAdmin = role === "admin";
  return { role, isAdmin };
}
