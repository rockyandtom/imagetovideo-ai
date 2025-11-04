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
    title: "Create Hold Up Dance Images with AI - ImageToVideoAI",
    description: "Generate stunning images of the Hold Up Dance with imagetovideo-ai. Our AI image generator makes it easy to create captivating visuals for any project.",
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
