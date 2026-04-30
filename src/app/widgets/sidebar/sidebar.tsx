"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/pkg/i18n/routing";
import {
  LayoutDashboard,
  Scissors,
  Users,
  DoorOpen,
  UserCircle,
  CalendarDays,
  Package,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/pkg/theme/utils";
import { Button } from "@/app/shared/ui";
import { motion } from "motion/react";
import { useParams } from "next/navigation";
import Image from "next/image";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "services", href: "/services", icon: Scissors },
  { key: "specialists", href: "/specialists", icon: Users },
  { key: "cabinets", href: "/cabinets", icon: DoorOpen },
  { key: "clients", href: "/clients", icon: UserCircle },
  { key: "appointments", href: "/appointments", icon: CalendarDays },
  { key: "materials", href: "/materials", icon: Package },
] as const;

export function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const params = useParams();
  const locale = params.locale as string;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <Image
          src="/logo.png"
          alt="Massage Center"
          width={36}
          height={36}
          className="rounded-xl"
        />
        <span className="text-lg font-semibold tracking-tight">Massage Center</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.key} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-hover hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {t(item.key)}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 h-8 w-1 rounded-r-full bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link href={pathname} locale={locale === "en" ? "de" : "en"}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Globe className="h-4 w-4" />
              {locale === "en" ? "DE" : "EN"}
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
