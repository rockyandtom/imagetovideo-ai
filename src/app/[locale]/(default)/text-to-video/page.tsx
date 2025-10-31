import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import TextToVideoClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Free AI Text to Video Generator - Best AI Video Creator | imagetovideo-ai",
    description: "Transform your text descriptions into stunning AI-generated videos instantly! imagetovideo-ai offers the most advanced free text to video generation. No registration required, supports multiple aspect ratios, and creates professional videos in minutes. Start your video creation journey today!",
    keywords: "free AI video generator, text to video, AI video generation, free AI video creator, text to video generator, AI video maker, artificial intelligence videos, free video generation, AI video tools, imagetovideo-ai, online video generator",
    alternates: {
      canonical: "/text-to-video",
    },
    openGraph: {
      title: "Free AI Text to Video Generator - Best AI Video Creator | imagetovideo-ai",
      description: "Transform text descriptions into stunning AI-generated videos instantly! No registration required, supports multiple aspect ratios, and creates professional videos in minutes.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Free AI Text to Video Generator - imagetovideo-ai",
      description: "The most advanced free AI video generator. Transform text to professional videos instantly, no registration required.",
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

export default async function TextToVideoPage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TextToVideoClient />
    </div>
  );
}
