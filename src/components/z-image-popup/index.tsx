"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

const Z_IMAGE_POPUP_KEY = "z-image-popup-shown";

export default function ZImagePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 确保在客户端环境运行
    if (typeof window === 'undefined') {
      return;
    }

    // 检查用户是否已经看过这个弹窗
    const checkShouldShow = () => {
      try {
        const storedDate = localStorage.getItem(Z_IMAGE_POPUP_KEY);
        
        if (!storedDate) {
          // 没有记录，可以显示
          return true;
        }
        
        // 检查是否过期（30天后重新显示）
        const expiryDate = new Date(storedDate);
        const now = new Date();
        
        if (now > expiryDate) {
          // 已过期，清除记录并显示
          localStorage.removeItem(Z_IMAGE_POPUP_KEY);
          return true;
        }
        
        // 未过期，不显示
        return false;
      } catch (error) {
        // localStorage 可能不可用，不显示
        return false;
      }
    };

    if (checkShouldShow()) {
      // 延迟一点显示，让页面先加载完成
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000); // 2秒后显示，给页面更多加载时间

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      // 记录用户已看过，30天内不再显示
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      localStorage.setItem(Z_IMAGE_POPUP_KEY, expiryDate.toISOString());
    } catch (error) {
      console.error("Error saving popup status:", error);
    }
  };

  const handleGoToZImage = () => {
    handleClose();
    // 跳转逻辑会在 Link 组件中处理
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      } else {
        setOpen(isOpen);
      }
    }}>
      <DialogContent className="w-[90vw] sm:w-[50vw] max-w-[800px] min-w-[90vw] sm:min-w-[600px] p-0 overflow-hidden aspect-video">
        <div className="relative w-full h-full flex flex-col">
          {/* 背景图片 */}
          <div className="relative h-24 flex-shrink-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="RiImageAddLine" className="w-16 h-16 text-white/80" />
            </div>
            {/* 新功能标签 */}
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-500 text-white border-none shadow-lg text-xs px-2 py-0.5">
                <Icon name="RiSparklingLine" className="w-3 h-3 mr-1" />
                New Feature
              </Badge>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl font-bold text-center">
                🎨 Introducing Z Image - AI Image Generation
              </DialogTitle>
              <DialogDescription className="text-center text-sm">
                Generate high-fidelity images using Alibaba's open-source Z Image AI model
              </DialogDescription>
            </DialogHeader>

            {/* 功能特点和预览图片并排显示 */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              {/* 左侧：功能特点 */}
              <div className="flex flex-col justify-center space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Icon name="RiCheckboxCircleLine" className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Open-source AI model</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Icon name="RiCheckboxCircleLine" className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Multiple aspect ratios</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Icon name="RiCheckboxCircleLine" className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>High-quality output</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Icon name="RiCheckboxCircleLine" className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Free to use</span>
                </div>
              </div>

              {/* 右侧：预览图片 */}
              <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                <img
                  src="/imgs/showcases/z-image-core-technology-diffusion-architecture-generated-result-example-1.webp"
                  alt="Z Image AI generation example - showcasing advanced image generation capabilities"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 text-sm h-9"
              >
                Maybe Later
              </Button>
              <Link href="/text-to-video/z-image" className="flex-1">
                <Button
                  onClick={handleGoToZImage}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm h-9"
                >
                  <Icon name="RiArrowRightLine" className="w-4 h-4 mr-2" />
                  Try Z Image Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}