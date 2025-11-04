import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import ImageUpscalerClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Best Image Upscaler Free Online - imagetovideo-ai",
    description: "Enhance your images with our powerful AI Image Upscaler. Free and fast, imagetovideo-ai helps you upscale images without losing quality, perfect for creators and professionals.",
    keywords: "AI image upscaler, image enhancement, upscale images, image quality, photo enhancer, resolution enhancement, image enlarger",
    alternates: {
      canonical: `https://imagetovideo-ai.net/${locale}/image-editor/image-upscaler`,
    },
    openGraph: {
      title: "Best Image Upscaler Free Online - imagetovideo-ai",
      description: "Enhance your images with our powerful AI Image Upscaler. Free and fast, imagetovideo-ai helps you upscale images without losing quality, perfect for creators and professionals.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Best Image Upscaler Free Online - imagetovideo-ai",
      description: "Enhance your images with our powerful AI Image Upscaler. Free and fast, imagetovideo-ai helps you upscale images without losing quality, perfect for creators and professionals.",
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

export default async function ImageUpscalerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ImageUpscalerClient />;
}