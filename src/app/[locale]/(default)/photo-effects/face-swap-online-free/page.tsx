import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import FaceSwapOnlineFreeClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Ultimate Face Swap Online Free Tool by imagetovideo-ai",
    description: "Experience the best face swap online free with imagetovideo-ai's cutting-edge AI technology. Seamlessly blend faces onto any image with photorealistic results. Our easy-to-use tool is 100% free and fast. Start your AI image creation today!",
    keywords: "face swap online free, face swap, AI face swap, free face swap, face swap tool, AI face replacement, face swap generator, imagetovideo-ai",
    alternates: {
      canonical: `/${locale}/photo-effects/face-swap-online-free`,
    },
    openGraph: {
      title: "Ultimate Face Swap Online Free Tool by imagetovideo-ai",
      description: "Experience the best face swap online free with imagetovideo-ai's cutting-edge AI technology. Seamlessly blend faces onto any image with photorealistic results.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Face Swap Online Free - imagetovideo-ai",
      description: "Transform your images with photorealistic face swapping. 100% free and easy to use.",
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

export default async function FaceSwapOnlineFreePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FaceSwapOnlineFreeClient />;
}

