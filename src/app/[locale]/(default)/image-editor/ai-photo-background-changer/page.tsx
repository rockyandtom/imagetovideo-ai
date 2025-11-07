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
    title: "AI Photo Background Changer | imagetovideo-ai",
    description: "Transform photo backgrounds with AI. Free online tool for e-commerce, social media, and professional use. Change backgrounds instantly with advanced AI.",
    keywords: "AI photo background changer, background removal, AI image generation, photo editor, background replacement, AI tools, image editing",
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "image-editor/ai-photo-background-changer"),
    },
    openGraph: {
      title: "AI Photo Background Changer | imagetovideo-ai",
      description: "Transform photo backgrounds with AI. Free online tool for e-commerce, social media, and professional use. Change backgrounds instantly with advanced AI.",
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

