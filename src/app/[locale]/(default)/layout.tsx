import { ReactNode } from "react";
import Header from "@/components/blocks/header";
import { getLandingPage } from "@/services/page";

export default async function DefaultLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);
  const header = page.header;

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 shadow bg-background">
        <Header header={header} />
      </div>
      <main className="overflow-x-hidden">{children}</main>
      {/* Footer unchanged */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-300 hover:text-white">
                    Video Generator
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="text-gray-300 hover:text-white">
                    Video History
                  </a>
                </li>
              </ul>
            </div>
            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/pricing" className="text-gray-300 hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="text-gray-300 hover:text-white">
                    Portal
                  </a>
                </li>
                <li>
                  <a href="/#faq" className="text-gray-300 hover:text-white">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/privacy-policy" className="text-gray-300 hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="text-gray-300 hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/refund-policy" className="text-gray-300 hover:text-white">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          {/* Bottom Footer */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 ImageToVideoAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
