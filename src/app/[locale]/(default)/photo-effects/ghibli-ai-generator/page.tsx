import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import GhibliAIGeneratorClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Ghibli AI Generator: Create Anime Art with ImageToVideo AI",
    description: "Unleash your creativity with our Ghibli AI Generator. ImageToVideo-AI brings your imagination to life, turning text into stunning Ghibli-style art with cutting-edge AI.",
    keywords: "Ghibli AI generator, Studio Ghibli art, anime AI generator, Ghibli style art, AI art generator, Miyazaki style, anime art creation, Ghibli AI art",
    alternates: {
      canonical: `https://imagetovideo-ai.net/${locale}/photo-effects/ghibli-ai-generator`,
    },
    openGraph: {
      title: "Ghibli AI Generator: Create Anime Art with ImageToVideo AI",
      description: "Unleash your creativity with our Ghibli AI Generator. ImageToVideo-AI brings your imagination to life, turning text into stunning Ghibli-style art with cutting-edge AI.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Ghibli AI Generator: Create Anime Art with ImageToVideo AI",
      description: "Transform your images into stunning Ghibli-style art with our AI-powered generator. Create magical anime art instantly.",
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

export default async function GhibliAIGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GhibliAIGeneratorClient />;
}
