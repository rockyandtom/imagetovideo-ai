import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import TextToImageClient from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Free AI Text to Image Generator | imagetovideo-ai",
    description: "Transform text into stunning AI images instantly! Free AI image generator with no registration. Supports multiple languages. Convert to video with one click.",
    keywords: "free AI image generator, text to image, AI image generation, free AI art generator, AI image creator, text to image generator, artificial intelligence images, free image generation, AI art tools, imagetovideo-ai, online AI generator",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "text-to-image"),
    },
    openGraph: {
      title: "Free AI Text to Image Generator - Best AI Image Creator | imagetovideo-ai",
      description: "Experience the most advanced free AI image generator! Transform text descriptions into stunning AI-generated images. No registration required, supports multiple languages, and converts to AI video with one click.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Free AI Text to Image Generator - imagetovideo-ai",
      description: "The most advanced free AI image generator. Supports multiple languages, no registration required, and converts to AI video with one click.",
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

export default async function TextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TextToImageClient />;
}
