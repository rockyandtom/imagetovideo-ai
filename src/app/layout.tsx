import "@/app/globals.css";

import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/locale";
import { cn } from "@/lib/utils";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const googleAdsenseCode = process.env.NEXT_PUBLIC_GOOGLE_ADCODE || "";

  return (
    <html lang={locale} suppressHydrationWarning className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {googleAdsenseCode && (
          <meta name="google-adsense-account" content={googleAdsenseCode} />
        )}

        {/* 预连接到第三方资源，提升加载性能 */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://m.stripe.network" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://m.stripe.network" />

        <link rel="icon" href="/favicon.ico" />

        {locales &&
          locales.map((loc) => (
            <link
              key={loc}
              rel="alternate"
              hrefLang={loc}
              href={`${webUrl}${loc === "en" ? "" : `/${loc}`}/`}
            />
          ))}
        <link rel="alternate" hrefLang="x-default" href={webUrl} />
      </head>
      <body className={cn("min-h-screen overflow-x-hidden")}>{children}</body>
    </html>
  );
}
