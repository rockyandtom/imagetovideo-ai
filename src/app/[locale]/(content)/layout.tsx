import { ReactNode } from "react";
import ToolSidebar from "@/components/blocks/tool-sidebar";
import Header from "@/components/blocks/header";
import { getLandingPage } from "@/services/page";

export default async function ContentLayout({
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
    <div className="flex flex-col h-screen min-h-0 w-full bg-background">
      {/* 顶部导航栏固定 */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Header header={header} />
      </div>
      {/* 主体区域：内容区margin-left让出侧边栏空间，paddingTop让出Header空间 */}
      <ToolSidebar />
      <main
        className="flex-1 min-w-0 min-h-0 overflow-auto bg-background px-4 py-8 md:px-8"
        style={{ position: 'fixed', top: 64, left: 224, width: 'calc(100vw - 224px)', height: 'calc(100vh - 64px)' }}
      >
        {children}
      </main>
    </div>
  );
}

