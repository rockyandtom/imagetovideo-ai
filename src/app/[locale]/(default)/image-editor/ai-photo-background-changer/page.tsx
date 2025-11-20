import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import AIPhotoBackgroundChangerClient from "./client";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "AI Photo Background Changer: Replace Image Background Online (Free)",
    description: "Use our Free AI Photo Background Changer to replace image backgrounds instantly. Perfect for e-commerce products, professional headshots, and social media posts. No signup required.",
    keywords: "AI photo background changer, replace image background, change photo background online, background removal, AI background generator, e-commerce product photography, professional headshot background, free background changer, imagetovideo-ai",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "image-editor/ai-photo-background-changer"),
    },
    openGraph: {
      title: "AI Photo Background Changer: Replace Image Background Online (Free)",
      description: "Transform your photos with our Free AI Background Changer. Instantly replace backgrounds for products, portraits, and creative projects. No registration needed.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "AI Photo Background Changer | imagetovideo-ai",
      description: "Transform photo backgrounds with AI. Free online tool for e-commerce, social media, and professional use. Change backgrounds instantly with advanced AI.",
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

export default async function AIPhotoBackgroundChangerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AIPhotoBackgroundChangerClient />;
}

