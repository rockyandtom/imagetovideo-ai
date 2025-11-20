import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import KirkifyAiClient from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Kirkify AI: Create Neon Avatars with imagetovideo-ai",
    description: "Transform your photos with Kirkify AI at imagetovideo-ai. Generate stunning neon-effect avatars instantly using our advanced Kirkify AI technology today.",
    keywords: "Kirkify AI, neon avatar generator, AI neon filter, cyberpunk avatar, AI photo effects, imagetovideo-ai",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "photo-effects/kirkify-ai"),
    },
    openGraph: {
      title: "Kirkify AI: Create Neon Avatars with imagetovideo-ai",
      description: "Transform your photos with Kirkify AI at imagetovideo-ai. Generate stunning neon-effect avatars instantly using our advanced Kirkify AI technology today.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Kirkify AI: Create Neon Avatars",
      description: "Generate stunning neon-effect avatars instantly using our advanced Kirkify AI technology.",
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

export default async function KirkifyAiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <KirkifyAiClient />;
}

