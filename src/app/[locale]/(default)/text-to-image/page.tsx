import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import TextToImageClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Unlock Creativity: The Ultimate Text to Image AI Generator | imagetovideo-ai",
    description: "Revolutionize your visuals with the powerful text to image capabilities of imagetovideo-ai. Effortlessly convert text prompts into stunning AI-generated images and video content. Start your free trial today!",
    keywords: "text to image, AI image generation, AI-generated images, text to image generator, AI art, image creation, artificial intelligence, digital art",
    alternates: {
      canonical: `/${locale}/text-to-image`,
    },
    openGraph: {
      title: "Unlock Creativity: The Ultimate Text to Image AI Generator",
      description: "Revolutionize your visuals with the powerful text to image capabilities of imagetovideo-ai. Effortlessly convert text prompts into stunning AI-generated images.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Ultimate Text to Image AI Generator",
      description: "Transform text prompts into stunning AI-generated images with imagetovideo-ai's advanced technology.",
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

export default async function TextToImagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TextToImageClient />;
}
