import { setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Photo Effects - AI-Powered Photo Enhancement Tools | imagetovideo-ai",
    description: "Transform your photos with stunning AI-powered effects. Apply filters, background effects, and artistic style transfers with advanced artificial intelligence technology.",
    keywords: "photo effects, AI photo filters, background effects, style transfer, photo enhancement, AI filters, artistic effects",
    alternates: {
      canonical: `/${locale}/photo-effects`,
    },
    openGraph: {
      title: "Photo Effects - AI-Powered Photo Enhancement Tools",
      description: "Transform your photos with stunning AI-powered effects. Apply filters, background effects, and artistic style transfers with advanced artificial intelligence technology.",
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "AI-Powered Photo Effects",
      description: "Transform your photos with stunning AI effects. Professional photo enhancement tools at your fingertips.",
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

export default async function PhotoEffectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* 页面主要内容区域 */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered 
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {" "}Photo Effects
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your photos with stunning AI-powered effects. Apply professional filters, create amazing backgrounds, and transfer artistic styles with cutting-edge technology.
          </p>
        </div>

        {/* 功能预览区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Ghibli AI Generator 功能卡片 */}
          <Link href="/photo-effects/ghibli-ai-generator" className="block">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">Ghibli AI Generator</h3>
                <span className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  LIVE
                </span>
              </div>
              <p className="text-gray-600">
                Transform your images into stunning Studio Ghibli-style art with our AI-powered generator. Create magical anime art instantly.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">Available Now</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Nano Banana Anime Figure Generator 功能卡片 */}
          <Link href="/photo-effects/nano-banana-anime-figure-generator" className="block">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">Nano Banana</h3>
                <span className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  LIVE
                </span>
              </div>
              <p className="text-gray-600">
                Create stunning anime figures with our AI-powered Nano Banana generator. Transform your images into unique, high-quality anime figures instantly.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">Available Now</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* AI Photo Filters 功能卡片 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v2m0 0v14a2 2 0 01-2 2H5a2 2 0 01-2-2V4m0 0V2a1 1 0 011-1h2a1 1 0 011 1v2m0 0h14" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">AI Photo Filters</h3>
              <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                NEW
              </span>
            </div>
            <p className="text-gray-600">
              Apply stunning AI-powered filters to transform your photos. Choose from vintage, modern, artistic, and cinematic effects.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Coming Soon</span>
            </div>
          </div>

          {/* Background Effects 功能卡片 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">Background Effects</h3>
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                HOT
              </span>
            </div>
            <p className="text-gray-600">
              Create amazing background effects and transformations. Remove, replace, or enhance backgrounds with AI precision.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Coming Soon</span>
            </div>
          </div>

          {/* Style Transfer 功能卡片 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">Style Transfer</h3>
              <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                PRO
              </span>
            </div>
            <p className="text-gray-600">
              Transform your photos with artistic style transfer technology. Apply famous art styles and create unique masterpieces.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Coming Soon</span>
            </div>
          </div>

          {/* 额外功能卡片 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Color Enhancement</h3>
            <p className="text-gray-600">Enhance colors, adjust brightness, and improve overall photo quality with AI algorithms.</p>
            <div className="mt-4 text-sm text-gray-500">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Coming Soon</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lighting Effects</h3>
            <p className="text-gray-600">Add dramatic lighting effects, shadows, and highlights to create professional-looking photos.</p>
            <div className="mt-4 text-sm text-gray-500">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Coming Soon</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Portrait Enhancement</h3>
            <p className="text-gray-600">Enhance portraits with skin smoothing, teeth whitening, and eye brightening effects.</p>
            <div className="mt-4 text-sm text-gray-500">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* 特色功能展示 */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 mb-16">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Professional Photo Effects</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our AI-powered photo effects tools provide professional-grade results with just a few clicks. Transform ordinary photos into extraordinary works of art.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Lightning Fast</h4>
                <p className="text-gray-600 text-sm">Process your photos in seconds with our optimized AI algorithms.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">High Quality</h4>
                <p className="text-gray-600 text-sm">Maintain original image quality while applying stunning effects.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Easy to Use</h4>
                <p className="text-gray-600 text-sm">No technical skills required. Upload, select effect, and download.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 即将推出提示 */}
        <div className="text-center bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-12 text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">More Effects Coming Soon</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            We're constantly developing new AI-powered photo effects. Stay tuned for more amazing features including advanced portrait enhancement, creative artistic filters, and professional photography tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              Get Notified
            </button>
            <button className="px-8 py-3 border-2 border-white/30 text-white font-semibold rounded-lg hover:border-white/50 hover:bg-white/10 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
