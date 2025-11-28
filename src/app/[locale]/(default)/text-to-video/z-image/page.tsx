import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import ZImageClient from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Z Image: Alibaba's New Open-Source AI Model | ImageToVideo-AI",
    description: "Discover Z Image, the revolutionary open-source AI model by Alibaba available on ImageToVideo-AI. Generate high-fidelity visuals using the advanced Z Image architecture today.",
    keywords: "z image, Alibaba AI model, open-source AI, AI image generation, text to image, z image model, AI visual generation, ImageToVideo-AI",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "text-to-video/z-image"),
    },
    openGraph: {
      title: "Z Image: Alibaba's New Open-Source AI Model | ImageToVideo-AI",
      description: "Discover Z Image, the revolutionary open-source AI model by Alibaba available on ImageToVideo-AI. Generate high-fidelity visuals using the advanced Z Image architecture today.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Z Image: Alibaba's New Open-Source AI Model",
      description: "Generate high-fidelity visuals using the advanced Z Image architecture.",
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

export default async function ZImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ZImageClient />;
}


