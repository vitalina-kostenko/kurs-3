import createMiddleware from "next-intl/middleware";
import { routing } from "@/pkg/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(de|en)/:path*"],
};
