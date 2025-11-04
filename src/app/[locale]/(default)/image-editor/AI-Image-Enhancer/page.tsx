import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import AIImageEnhancerClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Free AI Image Enhancer - Photo Enhancement",
    description: "Transform photos with free AI image enhancer. Professional enhancement, upscaling, super resolution, noise reduction, and color correction. No registration.",
    keywords: "free AI image enhancer, photo enhancement, AI upscaling, super resolution, image quality improvement, noise reduction, color correction, photo enhancer, AI photo editor, image enhancement tool, imagetovideo-ai",
    alternates: {
      canonical: `https://imagetovideo-ai.net/${locale}/image-editor/AI-Image-Enhancer`,
    },
    openGraph: {
      title: "Free AI Image Enhancer - Professional Photo Enhancement Tool | imagetovideo-ai",
      description: "Transform your photos with our advanced free AI image enhancer! Professional photo enhancement, AI upscaling, super resolution, and noise reduction. No registration required.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Free AI Image Enhancer - imagetovideo-ai",
      description: "Advanced AI photo enhancement with super resolution, noise reduction, and color correction. Professional results in minutes, completely free.",
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

export default async function AIImageEnhancerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AIImageEnhancerClient />;
}
