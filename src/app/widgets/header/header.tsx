"use client";

import { useTranslations } from "next-intl";
import { useSession, signOut } from "@/pkg/auth/client";
import { Button, Badge } from "@/app/shared/ui";
import { LogOut, User, Shield } from "lucide-react";
import { useRouter, usePathname } from "@/pkg/i18n/routing";

export function Header() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const pageTitle = getPageTitle(pathname, t);
  const role = (session?.user as { role?: string } | undefined)?.role ?? "user";

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/sign-in");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
      <h1 className="text-xl font-semibold">{pageTitle}</h1>
      <div className="flex items-center gap-3">
        {session?.user && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{session.user.name}</span>
            <Badge variant={role === "admin" ? "default" : "secondary"} className="gap-1 text-xs">
              {role === "admin" && <Shield className="h-3 w-3" />}
              {tc(role as "admin" | "user")}
            </Badge>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </Button>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string, t: (key: string) => string): string {
  if (pathname.includes("/dashboard")) return t("dashboard");
  if (pathname.includes("/services")) return t("services");
  if (pathname.includes("/specialists")) return t("specialists");
  if (pathname.includes("/cabinets")) return t("cabinets");
  if (pathname.includes("/clients")) return t("clients");
  if (pathname.includes("/appointments")) return t("appointments");
  if (pathname.includes("/materials")) return t("materials");
  return t("dashboard");
}
