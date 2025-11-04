import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import ImageToVideoClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "ImageToVideoAI - Free AI Image to Video Generator Online",
    description: "ImageToVideoAI transforms static images into dynamic videos instantly. Create professional video content with our free AI-powered image to video generator. No signup required.",
    keywords: "ImageToVideoAI, image to video AI, free video generator, AI video creation, photo to video converter, image animation, video maker online",
    alternates: {
      canonical: `https://imagetovideo-ai.net/${locale}/Image-to-Video`,
    },
    openGraph: {
      title: "ImageToVideoAI - Free AI Image to Video Generator",
      description: "Transform your images into stunning videos with ImageToVideoAI. Free, fast, and professional AI-powered video generation.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "ImageToVideoAI - Free AI Image to Video Generator",
      description: "Transform your images into stunning videos with ImageToVideoAI. Free, fast, and professional AI-powered video generation.",
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

export default async function ImageToVideoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ImageToVideoClient />;
}