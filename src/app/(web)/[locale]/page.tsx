import { redirect } from "@/pkg/i18n/routing";

export default function HomePage() {
  redirect({ href: "/dashboard", locale: "en" });
}
