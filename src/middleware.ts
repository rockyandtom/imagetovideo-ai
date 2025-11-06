import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

// 规范域名（不带www）
const CANONICAL_HOST = "imagetovideo-ai.net";

// 创建国际化中间件
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // 处理域名规范化：重定向www版本到非www版本
  // 如果访问的是www版本（www.imagetovideo-ai.net），重定向到非www版本
  if (hostname === "www.imagetovideo-ai.net" || hostname.startsWith("www.imagetovideo-ai.net:")) {
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    // 使用308永久重定向（SEO友好）
    return NextResponse.redirect(url, 308);
  }

  // 处理HTTP到HTTPS重定向（如果请求是HTTP）
  if (request.nextUrl.protocol === "http:") {
    url.protocol = "https:";
    // 使用308永久重定向（SEO友好）
    return NextResponse.redirect(url, 308);
  }

  // 继续处理国际化路由
  return intlMiddleware(request);
}

export const config = {
  // The matcher should apply the middleware to all paths except for static files and API routes.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
