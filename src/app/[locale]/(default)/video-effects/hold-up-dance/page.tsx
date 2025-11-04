import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import HoldUpDanceClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Hold Up Dance AI Generator | ImageToVideoAI",
    description: "Generate stunning Hold Up Dance images with AI. Create captivating visuals for any project using our AI image generator.",
    keywords: "Hold Up Dance, AI image generator, dance images, AI art, image to video, dance poses, AI creativity",
    alternates: {
      canonical: `https://imagetovideo-ai.net/${locale}/video-effects/hold-up-dance`,
    },
    openGraph: {
      title: "Create Hold Up Dance Images with AI - ImageToVideoAI",
      description: "Transform your vision into a Hold Up Dance masterpiece with AI. Generate stunning images and videos of the iconic Hold Up Dance pose.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Create Hold Up Dance Images with AI - ImageToVideoAI",
      description: "Transform your vision into a Hold Up Dance masterpiece with AI. Generate stunning images and videos of the iconic Hold Up Dance pose.",
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

export default async function HoldUpDancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HoldUpDanceClient />;
}
