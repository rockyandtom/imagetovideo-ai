import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import TextToVideoClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Best AI Text to Video Generator | imagetovideo-ai",
    description: "Transform your scripts into stunning videos instantly with imagetovideo-ai, the leading AI text to video platform. Experience the future of content creation today.",
  };
}

export default async function TextToVideoPage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TextToVideoClient />
    </div>
  );
}
