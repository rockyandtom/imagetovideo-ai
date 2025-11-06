import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import ImageUpscalerClient from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Free AI Image Upscaler Online | imagetovideo-ai",
    description: "Enhance images with powerful AI upscaler. Free and fast image upscaling without quality loss. Perfect for creators and professionals.",
    keywords: "AI image upscaler, image enhancement, upscale images, image quality, photo enhancer, resolution enhancement, image enlarger",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "image-editor/image-upscaler"),
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