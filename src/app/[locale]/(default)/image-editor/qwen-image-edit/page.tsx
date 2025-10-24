import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import QwenImageEditClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Qwen Image Edit: Transform Photos to Videos with AI | ImageToVideo-AI",
    description: "Elevate your visuals with Qwen Image Edit from ImageToVideo-AI. Our powerful AI tools let you edit images and convert them into stunning videos, all for free.",
    keywords: "Qwen Image Edit, AI image editing, photo editor, image enhancement, ai生图, ComfyUI, GGUF, free image editor",
    alternates: {
      canonical: `/${locale}/image-editor/qwen-image-edit`,
    },
    openGraph: {
      title: "Qwen Image Edit: Transform Photos to Videos with AI",
      description: "Elevate your visuals with Qwen Image Edit from ImageToVideo-AI. Our powerful AI tools let you edit images and convert them into stunning videos, all for free.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Qwen Image Edit: Transform Photos to Videos with AI",
      description: "Transform your imagination with Qwen Image Edit - powerful AI tools for image editing and video creation.",
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

