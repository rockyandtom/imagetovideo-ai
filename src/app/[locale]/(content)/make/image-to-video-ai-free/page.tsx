import Hero from "@/components/blocks/hero";
import Feature from "@/components/blocks/feature";
import Feature3 from "@/components/blocks/feature3";
import Testimonial from "@/components/blocks/testimonial";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";
import { Metadata } from "next";
import { getCanonicalUrlWithLocale } from "@/lib/constants";

// 为这个页面生成SEO友好的元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Multi-language support can be added here if needed
  const title = "Image to Video AI Free - Create Videos Instantly";
  const description = "Turn any image into dynamic videos with free AI generator. Create stunning, high-quality videos from photos. No credit card required.";

  return {
    title: title,
    description: description,
    alternates: {
      canonical: getCanonicalUrlWithLocale(locale, "make/image-to-video-ai-free"),
    },
  };
}

export default function AiVideoGeneratorPage() {
  // 1. Hero Section Data (包含 H1)
  const heroData = {
    title: "Image to Video AI Free",
    highlight_text: "Generator",
    description: "Unleash your creativity. Transform static photos into captivating, professional-grade videos with our powerful and completely free AI generator. Get started in seconds.",
    buttons: [
      {
        title: "Get Started for Free",
        icon: "RiPlayFill",
        url: "/auth/signin",
        target: "_self",
        variant: "default" as const,
      },
      {
        title: "View Showcase",
        icon: "RiImageLine",
        url: "/showcase",
        target: "_self",
        variant: "outline" as const,
      },
    ],
    show_happy_users: true,
  };

  // 2. Feature Section Data (包含第一个 H2)
  const featureData = {
    name: "feature",
    title: "Why Use Our AI Image to Video Generator Free?",
    description: "Explore the powerful features that make our tool the best choice for bringing your static images to life, completely free of charge.",
    items: [
      {
        title: "Instant Animation",
        description: "Our AI intelligently analyzes your image and applies realistic motion with a single click. No manual editing needed.",
        icon: "RiMagicLine",
      },
      {
        title: "Stunning HD Quality",
        description: "Export your videos in high-definition, ensuring your creations look crisp and professional on any platform.",
        icon: "RiHdLine",
      },
      {
        title: "Completely Free",
        description: "Get started without any costs. Our free plan offers generous credits for you to explore the full potential of our AI.",
        icon: "RiMoneyDollarCircleLine",
      },
    ],
  };

  // 3. Usage Section Data (包含第二个 H2)
  const usageData = {
    name: "usage",
    title: "How Our Free Image to Video AI Works",
    description: "Creating stunning videos from your images is a simple, four-step process. See how easy it is to get started.",
    image: { src: "/imgs/features/1.png" },
    image_position: "left",
    text_align: "left",
    items: [
      {
        title: "1. Upload Your Image",
        description: "Start with any photo. For best results, use a high-resolution image in a 16:9 aspect ratio.",
        image: { src: "/imgs/features/5.png" },
      },
      {
        title: "2. AI Works Its Magic",
        description: "Our system analyzes your image, identifying subjects and backgrounds to create natural motion paths.",
        image: { src: "/imgs/features/7.png" },
      },
      {
        title: "3. Generate Your Video",
        description: "In 30 to 120 seconds, your dynamic, AI-powered video will be ready for the world.",
        image: { src: "/imgs/features/8.png" },
      },
    ],
  };
  
  // 4. Testimonial Section Data (包含第三个 H2)
  const testimonialData = {
    name: "testimonial",
    label: "Testimonials",
    title: "What Creators Say About Our Image to Video AI Generator Free",
    description: "Hear from thousands of satisfied users who are transforming their content with our industry-leading AI technology.",
    icon: "GoThumbsup",
    items: [
       {
        title: "Sarah Johnson",
        label: "Content Creator",
        description: "This tool is a game-changer! I turned my photos into engaging videos for social media in minutes. And it's free!",
        image: { src: "/imgs/users/1.png" },
      },
      {
        title: "Mike Chen",
        label: "Marketing Director",
        description: "The quality is incredible for a free generator. Our engagement rates have skyrocketed since using these AI videos.",
        image: { src: "/imgs/users/2.png" },
      },
      {
        title: "Emily Rodriguez",
        label: "Digital Artist",
        description: "I love how this tool brings my static art to life. The AI understands my art style perfectly, which is rare for free tools.",
        image: { src: "/imgs/users/3.png" },
      },
    ]
  }

  // 5. FAQ Section Data
  const faqData = {
    name: "faq",
    label: "FAQ",
    title: "Frequently Asked Questions",
    description: "Have questions? We have answers. Find the most common queries about our free video generation service below.",
    items: [
      {
        title: "Is this AI video generator truly free?",
        description: "Yes! Our free plan provides you with weekly credits to generate videos. For higher volume needs, we offer affordable premium plans.",
      },
      {
        title: "What image formats are supported?",
        description: "We support standard formats like JPEG, PNG, and WEBP. High-resolution images produce the best results.",
      },
      {
        title: "Can I use the generated videos commercially?",
        description: "Yes, all videos created, even on the free plan, can be used for commercial purposes. We believe in empowering creators.",
      },
    ],
  };

  // 6. CTA Section Data
  const ctaData = {
    name: "cta",
    title: "Ready to Animate Your Images?",
    description: "Join thousands of creators and start bringing your photos to life. Sign up today and experience the future of content creation, for free.",
    buttons: [
      {
        title: "Start Generating For Free",
        url: "/auth/signin",
        target: "_self",
        icon: "RiPlayFill",
      },
    ],
  };

  return (
    <>
      <Hero hero={heroData} />
      <Feature section={featureData} />
      <Feature3 section={usageData} />
      <Testimonial section={testimonialData} />
      <FAQ section={faqData} />
      <CTA section={ctaData} />
    </>
  );
} 