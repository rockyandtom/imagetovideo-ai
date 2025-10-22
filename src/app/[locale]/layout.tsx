import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { AppContextProvider } from "@/contexts/app";
import { Metadata } from "next";
import { NextAuthSessionProvider } from "@/auth/session";
import { NextIntlClientProvider } from "next-intl";
import Script from "next/script";
import Header from "@/components/blocks/header";
import Footer from "@/components/blocks/footer";
import { getLandingPage } from "@/services/page";
// ThemeProvider removed

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();

  return {
    title: {
      template: `%s`,
      default: t("metadata.title") || "",
    },
    description: t("metadata.description") || "",
    keywords: t("metadata.keywords") || "",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();

  // Fetch original header and footer data.
  const page = await getLandingPage(locale);
  const { header, footer } = page;

  return (
    <NextIntlClientProvider messages={messages}>
      <NextAuthSessionProvider>
        <AppContextProvider>
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-9YPHKGTMZG"
          ></Script>
          <Script id="google-analytics">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            
              gtag('config', 'G-9YPHKGTMZG');
            `}
          </Script>
          <div className="sticky top-0 z-30 shadow bg-background">
            {/* Pass the original, unmodified header data */}
            <Header header={header} />
          </div>
          {children}
          <Footer footer={footer} />
        </AppContextProvider>
      </NextAuthSessionProvider>
    </NextIntlClientProvider>
  );
}
