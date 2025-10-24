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
    title: "Ultimate AI Image Enhancer & Video Creation | imagetovideo-ai",
    description: "Imagetovideo-ai offers a cutting-edge AI Image Enhancer. Elevate your images to stunning quality and seamlessly transform them into dynamic videos. Your creative journey starts here!",
    keywords: "AI Image Enhancer, image enhancement, photo enhancement, AI upscaling, image quality improvement, super resolution, denoising, color correction",
    alternates: {
      canonical: `/${locale}/image-editor/AI-Image-Enhancer`,
    },
    openGraph: {
      title: "Ultimate AI Image Enhancer & Video Creation",
      description: "Imagetovideo-ai offers a cutting-edge AI Image Enhancer. Elevate your images to stunning quality and seamlessly transform them into dynamic videos.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Ultimate AI Image Enhancer & Video Creation",
      description: "Elevate your images to stunning quality with our cutting-edge AI Image Enhancer technology.",
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
