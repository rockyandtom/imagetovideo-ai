import { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/locale";
import { CANONICAL_DOMAIN } from "@/lib/constants";

// 定义页面路由列表
// 注意：路径必须与文件系统中的文件夹名称完全匹配
const routes = [
  "", // 首页
  "/text-to-image",
  "/text-to-video",
  "/text-to-video/sora-2-ai-video-generator",
  "/Image-to-Video",
  "/image-editor",
  "/image-editor/qwen-image-edit",
  "/image-editor/AI-Image-Enhancer",
  "/image-editor/image-upscaler",
  "/image-editor/ai-photo-background-changer",
  "/photo-effects",
  "/photo-effects/ghibli-ai-generator",
  "/photo-effects/nano-banana-anime-figure-generator",
  "/photo-effects/face-swap-online-free",
  "/video-effects",
  "/video-effects/hold-up-dance",
  "/refund-policy",
  "/privacy-policy",
  "/terms-of-service",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    locales.forEach((locale) => {
      // 根据 localePrefix = "as-needed" 逻辑生成 URL
      // 默认语言 (en) 不带前缀，其他语言带前缀
      let fullUrl = "";
      
      if (locale === defaultLocale) {
        fullUrl = `${CANONICAL_DOMAIN}${route}`;
      } else {
        // 确保 route 以 / 开头（如果不是空字符串）
        const path = route.startsWith("/") || route === "" ? route : `/${route}`;
        fullUrl = `${CANONICAL_DOMAIN}/${locale}${path}`;
      }

      sitemapEntries.push({
        url: fullUrl,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
      });
    });
  });

  return sitemapEntries;
}

