import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import NanoBananaClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Nano Banana: AI Anime Figure Generator",
    description: "Create stunning anime figures with our AI-powered Nano Banana generator. imagetovideo-ai brings your anime dreams to life, transforming text into unique, high-quality figures.",
    keywords: "Nano Banana, AI anime figure generator, anime figure creator, AI character generator, anime art generator, figure generator, anime character creation",
    alternates: {
      canonical: `/${locale}/photo-effects/nano-banana-anime-figure-generator`,
    },
    openGraph: {
      title: "Nano Banana: AI Anime Figure Generator",
      description: "Create stunning anime figures with our AI-powered Nano Banana generator. imagetovideo-ai brings your anime dreams to life.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Nano Banana: AI Anime Figure Generator",
      description: "Transform images into stunning anime figures with our AI-powered generator. Create unique characters instantly.",
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

export default async function NanoBananaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NanoBananaClient />;
}
