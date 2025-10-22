"use client";

import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Icon from "@/components/icon";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

const tools = [
  { name: "图生视频", icon: "RiImageAddLine", href: "/make/create" }, // 修正为 locale 下的 make/create
  { name: "视频工作室", icon: "RiVideoLine", href: "/content/make/studio" },
  { name: "特效库", icon: "RiSparklingLine", href: "/content/effects" },
  { name: "API", icon: "RiCodeSSlashLine", href: "/content/api" },
];

export default function ToolSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarProvider>
      <Sidebar
        className="border-r-0 bg-gradient-to-b from-[#181c24]/95 via-[#181c24]/90 to-[#23272f]/95 backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300"
        style={{ position: 'fixed', left: 0, top: 64, width: collapsed ? 64 : 224, minWidth: collapsed ? 64 : 224, height: 'calc(100vh - 64px)', zIndex: 20 }}
      >
        {/* 顶部logo和折叠按钮同一行 */}
        <div className="flex items-center justify-between px-4 py-5 mb-2 border-b border-white/10">
          <Image src="/logo.png" alt="logo" width={32} height={32} className="rounded-lg shadow" />
          <button
            className="rounded-full p-2 hover:bg-white/10 transition-colors ml-2 border border-white/10 shadow"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            <Icon name={collapsed ? "RiArrowRightSLine" : "RiArrowLeftSLine"} className="w-6 h-6 text-white" />
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-2 mt-2 overflow-y-auto">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group flex items-center gap-3 px-4 py-3 mx-2 rounded-2xl transition-all duration-200 text-base font-semibold select-none
                ${pathname.startsWith(tool.href)
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 shadow-lg border border-blue-500/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white border border-transparent'}
                ${collapsed ? 'justify-center px-2' : ''}`}
              title={tool.name}
              style={{ marginBottom: 2 }}
            >
              <Icon name={tool.icon} className={`h-6 w-6 ${pathname.startsWith(tool.href) ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
              {!collapsed && <span className="truncate">{tool.name}</span>}
            </Link>
          ))}
        </nav>
      </Sidebar>
    </SidebarProvider>
  );
} 