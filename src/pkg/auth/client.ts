"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { queryClient } from "@/pkg/query/provider";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionStore {
  user: SessionUser | null;
  token: string | null;
  initialized: boolean;
  setSession: (user: SessionUser, token: string) => void;
  clearSession: () => void;
  setInitialized: () => void;
}

const useSessionStore = create<SessionStore>((set) => ({
  user: null,
  token: null,
  initialized: false,
  setSession: (user, token) => set({ user, token, initialized: true }),
  clearSession: () => set({ user: null, token: null, initialized: true }),
  setInitialized: () => set({ initialized: true }),
}));

export function useSession() {
  const { user, token, initialized, setSession, clearSession, setInitialized } = useSessionStore();

  useEffect(() => {
    if (initialized) return;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((res) => {
        if (res.user) setSession(res.user, res.session.token);
        else clearSession();
      })
      .catch(() => { clearSession(); setInitialized(); });
  }, [initialized, setSession, clearSession, setInitialized]);

  if (!initialized) return { data: null, isPending: true };
  if (!user) return { data: null, isPending: false };
  return { data: { user, session: { token } }, isPending: false };
}

export async function signIn(email: string, password: string) {
  const res = await fetch("/api/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) return { error: body };
  queryClient.clear();
  useSessionStore.getState().setSession(body.user, body.token);
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
  queryClient.clear();
  useSessionStore.getState().clearSession();
}
