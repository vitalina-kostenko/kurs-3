"use client";

import { useEffect, useState } from "react";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionData {
  user: SessionUser;
  session: { token: string };
}

export function useSession() {
  const [data, setData] = useState<SessionData | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((res) => {
        setData(res.user ? res : null);
      })
      .catch(() => setData(null))
      .finally(() => setIsPending(false));
  }, []);

  return { data, isPending };
}

export async function signIn(email: string, password: string) {
  const res = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) return { error: body };
  return { data: body, error: null };
}

export async function signUp(name: string, email: string, password: string) {
  const res = await fetch("/api/auth/sign-up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const body = await res.json();
  if (!res.ok) return { error: body };
  return { data: body, error: null };
}

export async function signOut() {
  await fetch("/api/auth/sign-out", { method: "POST" });
}
