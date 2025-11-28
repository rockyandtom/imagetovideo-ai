import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import Flux2Client from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Flux 2 AI Image Generator: Create Stunning Art",
    description: "Experience the power of Flux 2 at imagetovideo-ai. The ultimate open-source model for hyper-realistic AI generation. Try Flux 2 online today.",
    keywords: "Flux 2, AI image generator, Flux 2 model, text to image, AI art generator, open-source AI, hyper-realistic images, Flux Dev, ComfyUI, imagetovideo-ai",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "text-to-image/flux-2"),
    },
    openGraph: {
      title: "Flux 2 AI Image Generator: Create Stunning Art | imagetovideo-ai",
      description: "Experience the power of Flux 2 at imagetovideo-ai. The ultimate open-source model for hyper-realistic AI generation. Try Flux 2 online today.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Flux 2 AI Image Generator: Create Stunning Art",
      description: "Experience the power of Flux 2 at imagetovideo-ai. The ultimate open-source model for hyper-realistic AI generation.",
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

export default async function Flux2Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Flux2Client />;
}

