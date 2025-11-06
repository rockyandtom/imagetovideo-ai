import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import Sora2VideoGeneratorClient from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Sora 2 AI Video Generator: The Future of Video Creation | imagetovideo-ai",
    description: "Explore the revolutionary potential of the Sora 2 AI Video Generator. Transform your concepts into cinematic scenes instantly with imagetovideo-ai, your go-to platform for advanced AI-driven video and image generation.",
    keywords: "Sora 2 AI Video Generator, AI video generation, text to video, AI video creator, cinematic video generation, Sora 2, AI video maker",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "text-to-video/sora-2-ai-video-generator"),
    },
    openGraph: {
      title: "Sora 2 AI Video Generator: The Future of Video Creation",
      description: "Transform your concepts into cinematic scenes instantly with the Sora 2 AI Video Generator. Advanced AI-driven video generation powered by imagetovideo-ai.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Sora 2 AI Video Generator: The Future of Video Creation",
      description: "Transform your concepts into cinematic scenes instantly with the Sora 2 AI Video Generator.",
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

export default async function Sora2VideoGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Sora2VideoGeneratorClient />;
}

