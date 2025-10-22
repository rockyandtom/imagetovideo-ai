import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // The matcher should apply the middleware to all paths except for static files and API routes.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
