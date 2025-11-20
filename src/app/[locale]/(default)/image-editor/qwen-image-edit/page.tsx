import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import QwenImageEditClient from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Free AI Image Editor: Qwen Image Edit Tool (No Signup)",
    description: "Use our Free AI Image Editor powered by Qwen VL. Edit photos, remove backgrounds, and change styles instantly. No login required. Perfect for preparing images for video generation.",
    keywords: "free AI image editor, Qwen image edit, Qwen-VL, AI photo editor online, intelligent image editing, AI image enhancement, background removal AI, object manipulation, style transfer, free photo editor no watermark, AI image tools, imagetovideo-ai, edit image for video",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "image-editor/qwen-image-edit"),
    },
    openGraph: {
      title: "Free AI Image Editor - Qwen Image Edit Tool | imagetovideo-ai",
      description: "Transform your images with advanced AI editing powered by Qwen technology! Free AI image editor with intelligent editing capabilities, no registration required.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Free AI Image Editor - Qwen Image Edit",
      description: "Advanced AI image editing powered by Qwen technology. Professional results in minutes, completely free to use.",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function QwenImageEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <QwenImageEditClient />;
}

