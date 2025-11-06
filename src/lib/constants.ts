/**
 * 网站配置常量
 * 统一管理域名和URL配置，确保SEO一致性
 */

/**
 * 规范域名（不带www版本）
 * 这是Google Search Console和sitemap使用的规范域名
 * 所有HTTP和www版本都应该重定向到这个域名
 */
export const CANONICAL_DOMAIN = "https://imagetovideo-ai.net";

/**
 * 获取规范URL
 * @param path - 路径（例如："/text-to-video" 或 "text-to-video"）
 * @returns 完整的规范URL
 */
export function getCanonicalUrl(path: string = ""): string {
  // 确保路径以/开头
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // 移除末尾的斜杠（除了根路径）
  const cleanPath = normalizedPath === "/" ? "" : normalizedPath.replace(/\/$/, "");
  return `${CANONICAL_DOMAIN}${cleanPath}`;
}

/**
 * 获取带语言前缀的规范URL
 * @param locale - 语言代码（例如："zh"）
 * @param path - 路径（例如："text-to-video"）
 * @returns 完整的规范URL
 */
export function getCanonicalUrlWithLocale(locale: string | undefined, path: string = ""): string {
  // 验证locale参数，防止undefined导致URL错误
  if (!locale || locale === "undefined") {
    // 如果locale未定义，使用默认路径（英文，无语言前缀）
    return getCanonicalUrl(path);
  }
  
  // 英文是默认语言，不需要语言前缀
  if (locale === "en") {
    return getCanonicalUrl(path);
  }
  
  // 确保路径不以/开头
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  // 构建带语言前缀的路径
  const fullPath = normalizedPath ? `/${locale}/${normalizedPath}` : `/${locale}`;
  return `${CANONICAL_DOMAIN}${fullPath}`;
}
