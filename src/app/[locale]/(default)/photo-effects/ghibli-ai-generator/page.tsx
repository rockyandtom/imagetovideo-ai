import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import GhibliAIGeneratorClient from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Ghibli AI Generator: Photo to Studio Ghibli Style Art (Free)",
    description: "Turn your photos into Studio Ghibli style art instantly with our Free Ghibli AI Generator. Create Miyazaki-inspired anime backgrounds and characters. No sign-up required.",
    keywords: "Ghibli AI generator, Studio Ghibli filter, photo to anime, Ghibli style art, AI art generator, Miyazaki style, anime background generator, image to ghibli, free anime filter, imagetovideo-ai",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "photo-effects/ghibli-ai-generator"),
    },
    openGraph: {
      title: "Ghibli AI Generator: Turn Photos into Anime Art | imagetovideo-ai",
      description: "Transform your real photos into stunning Studio Ghibli style art. Free online tool to create Miyazaki-inspired anime scenes from your images.",
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
