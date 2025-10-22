import "@/app/globals.css";
import React from "react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container py-3">
          <nav className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <a
              href="/"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Home
            </a>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              Privacy Policy
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="min-h-screen bg-white dark:bg-slate-900">
        <div className="container py-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
