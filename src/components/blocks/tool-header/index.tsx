"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import Icon from "@/components/icon";
import ThemeToggle from "@/components/theme/toggle";
import SignToggle from "@/components/sign/toggle";

export default function ToolHeader() {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Icon name="RiVideoLine" className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ImageToVideoAI</span>
          </Link>
          
          {/* 工具导航 */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            <Link href="/tools">
              <Button variant="ghost" size="sm">
                <Icon name="RiToolsLine" className="h-4 w-4 mr-2" />
                工具集
              </Button>
            </Link>
            <Link href="/make/create">
              <Button variant="ghost" size="sm">
                <Icon name="RiAddLine" className="h-4 w-4 mr-2" />
                创建视频
              </Button>
            </Link>
            <Link href="/make/studio">
              <Button variant="ghost" size="sm">
                <Icon name="RiPaletteLine" className="h-4 w-4 mr-2" />
                视频工作室
              </Button>
            </Link>
            <Link href="/effects">
              <Button variant="ghost" size="sm">
                <Icon name="RiSparklingLine" className="h-4 w-4 mr-2" />
                特效库
              </Button>
            </Link>
            <Link href="/api">
              <Button variant="ghost" size="sm">
                <Icon name="RiCodeLine" className="h-4 w-4 mr-2" />
                API
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Icon name="RiQuestionLine" className="h-4 w-4" />
            帮助
          </Button>
          <Button variant="ghost" size="sm">
            <Icon name="RiSettings3Line" className="h-4 w-4" />
            设置
          </Button>
          <ThemeToggle />
          <SignToggle />
        </div>
      </div>
    </div>
  );
} 