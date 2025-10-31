"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

interface UploadedImage {
  file: File;
  preview: string;
}

export default function AIImageEnhancerClient() {
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 开始增强
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isEnhancing && originalImage) {
        e.preventDefault();
        enhanceImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnhancing, originalImage]);

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage({
          file,
          preview: e.target?.result as string
        });
        // 重置之前的结果
        setEnhancedImage(null);
        setProgress(0);
        setEstimatedTime("");
        setTaskId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const enhanceImage = async () => {
    if (!originalImage) {
      alert("Please upload an image first");
      return;
    }

    setIsEnhancing(true);
    setEnhancedImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 上传图片并获取文件名
      const imageData = await uploadImageToRunningHub(originalImage.file);
      
      // 调用RunningHub API开始图片增强
      const response = await fetch('/api/runninghub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enhance-image',
          webappId: "1958797744955613186",
          apiKey: "fb88fac46b0349c1986c9cbb4f14d44e",
          nodeInfoList: [
            {
              nodeId: "2",
              fieldName: "image",
              fieldValue: imageData,
              description: "image"
            }
          ]
        })
      });

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success && result.data.taskId) {
        setTaskId(result.data.taskId);
        // 开始轮询任务状态
        pollTaskStatus(result.data.taskId);
      } else {
        console.error('API Error:', result);
        throw new Error(result.error || 'Failed to start image enhancement');
      }
      
    } catch (error) {
      console.error('Image enhancement error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to enhance image, please try again";
      alert(errorMessage);
      setIsEnhancing(false);
      setTaskId(null);
      setProgress(0);
      setEstimatedTime("");
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 120; // 最多轮询10分钟 (120 * 5秒 = 600秒 = 10分钟)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch('/api/runninghub', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'status',
            taskId: taskId
          })
        });

        const result = await response.json();
        console.log(`Status check result (attempt ${attempts + 1}):`, result);
        
        if (result.success) {
          if (result.data.status === 'completed' && result.data.imageUrl) {
            console.log('Task completed, image URL:', result.data.imageUrl);
            
            setEnhancedImage(result.data.imageUrl);
            setIsEnhancing(false);
            setTaskId(null);
            return;
          } else if (result.data.status === 'running') {
            attempts++;
            
            // 计算进度 (基于时间估算，图片增强通常比视频生成快)
            const elapsedMinutes = (attempts * 5) / 60; // 已经过的分钟数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedMinutes < 1) {
              progressPercent = Math.min(30, elapsedMinutes * 30); // 前1分钟到30%
              timeEstimate = "Analyzing image...";
            } else if (elapsedMinutes < 3) {
              progressPercent = 30 + Math.min(40, (elapsedMinutes - 1) * 20); // 1-3分钟到70%
              timeEstimate = "Enhancing image quality...";
            } else if (elapsedMinutes < 5) {
              progressPercent = 70 + Math.min(20, (elapsedMinutes - 3) * 10); // 3-5分钟到90%
              timeEstimate = "Finalizing enhancement...";
            } else {
              progressPercent = Math.min(95, 90 + (elapsedMinutes - 5) * 2); // 5分钟后到95%
              timeEstimate = "Almost done...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`Task still running, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%, message: ${result.data.message}`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('Task timeout - Image enhancement took longer than expected (10 minutes). Please try again.');
            }
          } else {
            console.error('Unexpected status:', result.data.status, 'Message:', result.data.message);
            throw new Error(result.data.message || `Unexpected status: ${result.data.status}`);
          }
        } else {
          throw new Error(result.error || 'Status check failed');
        }
      } catch (error) {
        console.error('Status check error:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to check image enhancement status";
        
        // 如果是网络错误且重试次数少于3次，则自动重试
        if (attempts < 3 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
          console.log(`Network error, retrying in 10 seconds... (attempt ${attempts + 1}/3)`);
          setTimeout(checkStatus, 10000);
          return;
        }
        
        alert(errorMessage);
        setIsEnhancing(false);
        setTaskId(null);
        setProgress(0);
        setEstimatedTime("");
      }
    };

    checkStatus();
  };

  // 下载增强后的图片
  const downloadEnhancedImage = async (imageUrl: string, originalFileName?: string) => {
    setIsDownloading(true);
    
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const baseName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, '') : 'image';
    const filename = `enhanced-${baseName}-${timestamp}.png`;
    
    try {
      console.log('Starting download for:', imageUrl);
      
      // 方法1：尝试使用服务端代理下载
      try {
        console.log('Trying server proxy download...');
        const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
        
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Server proxy download initiated');
        return; // 成功，直接返回
      } catch (proxyError) {
        console.log('Server proxy failed, trying direct fetch...', proxyError);
      }
      
      // 方法2：直接fetch图片数据
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob created, size:', blob.size, 'type:', blob.type);
      
      // 创建对象URL
      const url = window.URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Direct fetch download successful');
      
    } catch (error) {
      console.error('Primary download methods failed:', error);
      
      // 方法3：备用方案 - 直接链接下载
      try {
        console.log('Trying direct link download...');
        
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Direct link download attempted');
        
      } catch (directError) {
        console.error('Direct link download failed:', directError);
        
        // 方法4：最后的备用方案 - 在新窗口中打开
        try {
          const newWindow = window.open(imageUrl, '_blank', 'noopener,noreferrer');
          if (newWindow) {
            setTimeout(() => {
              alert('The enhanced image has opened in a new tab. Please right-click on the image and select "Save image as..." to download it.');
            }, 1000);
          } else {
            // 弹窗被阻止，显示URL
            const userChoice = confirm(
              'Download failed and popup was blocked. Would you like to copy the image URL to clipboard so you can paste it in a new tab?'
            );
            if (userChoice && navigator.clipboard) {
              navigator.clipboard.writeText(imageUrl).then(() => {
                alert('Image URL copied to clipboard! Please paste it in a new browser tab to download.');
              }).catch(() => {
                alert('Failed to copy URL. Please manually copy this URL: ' + imageUrl);
              });
            } else {
              alert('Please copy this URL and open it in a new tab to download: ' + imageUrl);
            }
          }
        } catch (windowError) {
          console.error('Window open failed:', windowError);
          alert('All download methods failed. Please copy this URL and open it in a new tab: ' + imageUrl);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // 上传图片到RunningHub并获取文件ID
  const uploadImageToRunningHub = async (file: File): Promise<string> => {
    console.log('Uploading file to RunningHub:', file.name, file.size, file.type);
    
    // 创建FormData上传图片到RunningHub
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 调用我们的API来上传到RunningHub
      const response = await fetch('/api/runninghub-upload', {
        method: 'POST',
        body: formData
      });

      console.log('RunningHub upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RunningHub upload failed:', errorText);
        throw new Error(`Failed to upload image to RunningHub: ${response.status}`);
      }

      const result = await response.json();
      console.log('RunningHub upload result:', result);
      
      if (!result.success || !result.fileId) {
        throw new Error('No file ID returned from RunningHub upload');
      }
      
      return result.fileId; // 返回RunningHub的文件ID，格式如：pasted/xxx.png
    } catch (error) {
      console.error('RunningHub upload error:', error);
      throw error;
    }
  };

  const UploadArea = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        Upload Image to Enhance
        <span className="text-red-500">*</span>
      </h3>
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          "focus-within:border-primary focus-within:bg-primary/5",
          originalImage ? "border-primary bg-primary/10" : "border-muted-foreground/25"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => imageInputRef.current?.click()}
      >
        <Input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
        
        {originalImage ? (
          <div className="space-y-3">
            <img
              src={originalImage.preview}
              alt="Original image"
              className="max-h-48 mx-auto rounded-md object-cover"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{originalImage.file.name}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setOriginalImage(null);
                  setEnhancedImage(null);
                }}
              >
                Replace Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="RiImageAddLine" className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Click to upload or drag image here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports JPG, PNG, GIF formats, size up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "AI Image Enhancer",
            "description": "Ultimate AI Image Enhancer that elevates your images to stunning quality with advanced artificial intelligence technology",
            "url": "https://www.imagetovideo-ai.net/image-editor/AI-Image-Enhancer",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered image enhancement",
              "Super-resolution and upscaling",
              "Intelligent denoising",
              "Color correction and vibrancy",
              "Professional quality results"
            ],
            "creator": {
              "@type": "Organization",
              "name": "imagetovideo-ai"
            }
          })
        }}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Free AI Image Enhancer - 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Professional Photo Enhancement
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Transform your photos with our advanced <strong>free AI image enhancer</strong>! 
                Professional photo enhancement with <strong>AI upscaling</strong>, super resolution, 
                noise reduction, and color correction. No registration required, instant results in minutes.
              </p>
            </div>

            {/* Main Workspace Area */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiImageLine" className="w-5 h-5 text-primary" />
                  AI Image Enhancement Workspace
                </CardTitle>
                <CardDescription>
                  Upload your image and let our advanced AI technology enhance it to professional quality instantly.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Image Upload and Preview Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Upload Area */}
                  <div>
                    <UploadArea />
                  </div>
                  
                  {/* Enhanced Image Preview */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Enhanced Result</h3>
                    <div className={cn(
                      "relative border-2 border-dashed rounded-lg p-6 min-h-[200px] flex items-center justify-center",
                      enhancedImage ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-muted-foreground/25"
                    )}>
                      {enhancedImage ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={enhancedImage}
                            alt="Enhanced image"
                            className="max-h-48 mx-auto rounded-md object-cover"
                          />
                          <div className="text-center">
                            <Button
                              onClick={() => downloadEnhancedImage(enhancedImage, originalImage?.file.name)}
                              disabled={isDownloading}
                              className="flex items-center gap-2"
                            >
                              {isDownloading ? (
                                <>
                                  <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Icon name="RiDownloadLine" className="w-4 h-4" />
                                  Download Enhanced Image
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-3">
                          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Icon name="RiImageLine" className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Enhanced image will appear here
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhancement Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                      <Icon name="RiZoomInLine" className="w-4 h-4" />
                      <span className="font-medium">Super-Resolution</span>
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 text-xs">
                      Transform low-resolution photos into high-definition masterpieces
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                      <Icon name="RiContrastLine" className="w-4 h-4" />
                      <span className="font-medium">Intelligent Denoising</span>
                    </div>
                    <p className="text-green-600 dark:text-green-400 text-xs">
                      Remove grain and digital noise while preserving image details
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 mb-2">
                      <Icon name="RiPaletteLine" className="w-4 h-4" />
                      <span className="font-medium">Color Enhancement</span>
                    </div>
                    <p className="text-purple-600 dark:text-purple-400 text-xs">
                      Automatically adjust brightness, contrast, and vibrancy
                    </p>
                  </div>
                </div>

                {/* Enhance Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={enhanceImage}
                    disabled={!originalImage || isEnhancing}
                    className="px-8 py-3 text-base font-medium"
                    size="lg"
                  >
                    {isEnhancing ? (
                      <>
                        <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin mr-2" />
                        {taskId ? 'Enhancing...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="RiMagicLine" className="w-4 h-4 mr-2" />
                        Enhance Image
                        <span className="ml-2 text-xs opacity-60">
                          (Ctrl+Enter)
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Task Status */}
                {taskId && isEnhancing && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                      <Icon name="RiInformationLine" className="w-4 h-4" />
                      <span className="text-sm font-medium">Task ID: {taskId}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          AI Image Enhancement in Progress
                        </span>
                        <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto">
                          {progress}%
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-blue-100 dark:bg-blue-800/30 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-600 dark:text-blue-400">
                          Processing with advanced AI algorithms
                        </span>
                        <span className="text-blue-500 dark:text-blue-400 font-medium">
                          {estimatedTime}
                        </span>
                      </div>
                      
                      <div className="bg-blue-100 dark:bg-blue-800/30 rounded-md p-3 mt-3">
                        <div className="flex items-start gap-2">
                          <Icon name="RiTimeLine" className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            <p className="font-medium mb-1">Expected Enhancement Time:</p>
                            <p>• Typical: 2-5 minutes</p>
                            <p>• Maximum: up to 10 minutes</p>
                            <p className="mt-2 font-medium">Please keep this page open. Your enhanced image will appear automatically when ready.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Sections */}
            <div className="space-y-12">
              {/* Unlocking Potential Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">
                  Unlocking Potential with a Powerful AI Image Enhancer
                </h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p>
                    In a digital world driven by visuals, the quality of your content is paramount. Whether you're a professional content creator, 
                    a digital artist, or a small business owner, high-resolution, captivating images are no longer a luxury—they are a necessity. 
                    This is precisely where a sophisticated <strong>AI Image Enhancer</strong> becomes an essential tool. Unlike traditional editing software, 
                    which demands time, technical skill, and a deep understanding of complex features, our AI-powered solution at <strong>imagetovideo-ai</strong> 
                    simplifies the entire process.
                  </p>
                  <p>
                    We leverage advanced artificial intelligence to analyze and improve your images with a single click. Our technology goes beyond simple filters, 
                    intelligently correcting imperfections, sharpening details, and enriching colors to produce professional-grade results effortlessly. 
                    We believe that stunning visual content should be accessible to everyone, regardless of their editing experience.
                  </p>
                </div>
              </section>

              {/* How It Works Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">
                  How Our AI Image Enhancer Works: The Science Behind the Magic
                </h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p>
                    At the core of our platform's capabilities is our advanced <strong>ai生图</strong> technology. When you upload an image to our 
                    <strong>AI Image Enhancer</strong>, the system immediately performs a deep analysis. It scans for common visual defects, 
                    such as low resolution, digital noise, and color imbalances. Our deep learning models then apply a series of intelligent, 
                    non-destructive enhancements.
                  </p>
                  <p>
                    For example, our super-resolution algorithm can generate new pixels to upscale an image without any loss of quality, 
                    a feat that is nearly impossible with traditional methods. Our denoising feature distinguishes between genuine detail 
                    and unwanted noise, removing the latter while preserving the integrity of the image.
                  </p>
                </div>
              </section>

              {/* Key Features Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">
                  Key Features of the Imagetovideo-ai AI Image Enhancer
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="RiZoomInLine" className="w-5 h-5 text-blue-600" />
                        Super-Resolution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Transform small, low-resolution photos into high-definition masterpieces. 
                        Ideal for old digital photos or images from web archives.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="RiContrastLine" className="w-5 h-5 text-green-600" />
                        Intelligent Denoising
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Remove grain and digital noise from photos taken in low-light conditions, 
                        leaving you with a clean, clear image.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="RiPaletteLine" className="w-5 h-5 text-purple-600" />
                        Color Enhancement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Automatically adjust brightness, contrast, and saturation to make colors pop 
                        and bring life back to dull images.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="RiFocusLine" className="w-5 h-5 text-orange-600" />
                        Sharpening & Clarity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Fix blurry photos and bring out fine details with our precise sharpening algorithm.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="RiUserLine" className="w-5 h-5 text-pink-600" />
                        Portrait Enhancement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        AI trained to recognize and enhance facial features, smoothing skin and adding clarity to eyes.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="RiStackLine" className="w-5 h-5 text-indigo-600" />
                        Batch Processing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Enhance multiple images at once, saving you significant time and effort for large projects.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Applications Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">
                  Applications and Use Cases for Our AI Image Enhancer
                </h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p>
                    The versatility of our <strong>AI Image Enhancer</strong> makes it suitable for a wide range of professional and personal applications. 
                    For <strong>e-commerce businesses</strong>, high-quality product photos are crucial for attracting customers. Our tool can enhance 
                    product images to highlight details and textures, leading to higher conversion rates.
                  </p>
                  <p>
                    <strong>Photographers</strong> can use our platform to streamline their post-production workflow, delivering stunning, enhanced photos 
                    to clients faster than ever before. For <strong>social media influencers</strong> and <strong>marketers</strong>, our 
                    <strong>AI Image Enhancer</strong> ensures that every post is visually striking and engaging, helping to grow their audience.
                  </p>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">
                  FAQ: Your Questions About Our AI Image Enhancer Answered
                </h2>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What exactly is an AI Image Enhancer?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        An <strong>AI Image Enhancer</strong> is a tool that uses artificial intelligence to automatically improve the quality 
                        of a digital image, performing tasks like sharpening, color correction, and denoising without manual editing.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Is the imagetovideo-ai AI Image Enhancer free to use?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        We offer a free trial that allows you to test the power of our <strong>AI Image Enhancer</strong>. 
                        We also have various paid plans with more features and usage limits to suit your professional needs.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">How does your AI Image Enhancer compare to traditional editing software?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Our <strong>AI Image Enhancer</strong> is significantly faster and easier to use. It automates complex tasks 
                        that would take a long time to do manually, delivering professional results in seconds.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What image formats does your AI Image Enhancer support?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Our platform supports all popular image formats, including JPG, PNG, and more. We are continuously 
                        expanding our support to include new and emerging formats.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* SEO Content Area */}
              <div className="space-y-8 mt-16">
                {/* AI Image Enhancer Comparison */}
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    Free AI Image Enhancer vs Traditional Photo Enhancement Tools
                  </h2>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Comprehensive AI Image Enhancement Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="font-semibold text-lg text-primary mb-2">imagetovideo-ai Enhancer</h3>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                              <ul className="text-sm space-y-2 text-left">
                                <li>✅ <strong>Completely Free</strong> to use</li>
                                <li>✅ <strong>AI-Powered</strong> enhancement</li>
                                <li>✅ <strong>Super Resolution</strong> upscaling</li>
                                <li>✅ <strong>No Registration</strong> required</li>
                                <li>✅ <strong>Instant Results</strong> in minutes</li>
                                <li>✅ <strong>Noise Reduction</strong> AI</li>
                                <li>✅ <strong>Color Correction</strong> automatic</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="font-semibold text-lg text-muted-foreground mb-2">Adobe Lightroom</h3>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                              <ul className="text-sm space-y-2 text-left">
                                <li>❌ <strong>$9.99/month</strong> subscription</li>
                                <li>⚠️ Manual adjustment required</li>
                                <li>⚠️ Limited AI features</li>
                                <li>❌ Software installation needed</li>
                                <li>⚠️ Time-consuming process</li>
                                <li>⚠️ Learning curve required</li>
                                <li>⚠️ Basic upscaling only</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="font-semibold text-lg text-muted-foreground mb-2">Topaz Gigapixel</h3>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                              <ul className="text-sm space-y-2 text-left">
                                <li>❌ <strong>$99.99</strong> one-time cost</li>
                                <li>⚠️ Desktop software only</li>
                                <li>⚠️ Limited to upscaling</li>
                                <li>❌ No cloud processing</li>
                                <li>⚠️ Slow processing times</li>
                                <li>⚠️ Complex interface</li>
                                <li>❌ No automatic enhancement</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">
                          Why Choose Our Free AI Image Enhancer?
                        </h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Our <strong>AI image enhancer</strong> combines cutting-edge artificial intelligence with user-friendly design 
                          to deliver professional photo enhancement results instantly. No expensive software, no complex learning curves—
                          just upload your image and let our AI do the work with <strong>super resolution</strong>, noise reduction, 
                          and intelligent color correction.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Use Cases */}
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    AI Image Enhancement Use Cases: Professional Applications
                  </h2>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Transform Your Images for Every Purpose</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-semibold text-primary mb-2">Photography & Portrait Enhancement</h4>
                            <p className="text-sm text-muted-foreground">
                              Enhance portrait photos with <strong>AI upscaling</strong>, noise reduction, and color correction. 
                              Perfect for professional headshots, wedding photos, and family portraits.
                            </p>
                          </div>
                          
                          <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-semibold text-primary mb-2">E-commerce Product Images</h4>
                            <p className="text-sm text-muted-foreground">
                              Improve product photo quality with our <strong>free AI image enhancer</strong>. 
                              Enhance clarity, reduce noise, and optimize colors for better online sales conversion.
                            </p>
                          </div>
                          
                          <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-semibold text-primary mb-2">Real Estate Photography</h4>
                            <p className="text-sm text-muted-foreground">
                              Transform property photos with professional enhancement. Improve lighting, 
                              reduce noise, and enhance architectural details for stunning real estate listings.
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-semibold text-primary mb-2">Social Media Content</h4>
                            <p className="text-sm text-muted-foreground">
                              Create eye-catching social media posts with enhanced image quality. 
                              Perfect for Instagram, Facebook, and other platforms requiring high-quality visuals.
                            </p>
                          </div>
                          
                          <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-semibold text-primary mb-2">Print & Publishing</h4>
                            <p className="text-sm text-muted-foreground">
                              Prepare images for print with <strong>super resolution</strong> upscaling and enhancement. 
                              Ideal for magazines, brochures, posters, and high-quality print materials.
                            </p>
                          </div>
                          
                          <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-semibold text-primary mb-2">Vintage Photo Restoration</h4>
                            <p className="text-sm text-muted-foreground">
                              Restore old and vintage photos with AI-powered noise reduction and enhancement. 
                              Bring new life to family memories and historical photographs.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Technology Explanation */}
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                    How Our AI Image Enhancement Technology Works
                  </h2>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced AI Algorithms for Professional Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <p>
                            Our <strong>AI image enhancer</strong> utilizes state-of-the-art deep learning models trained on 
                            millions of high-quality images. The system automatically analyzes your photo and applies 
                            multiple enhancement techniques simultaneously for optimal results.
                          </p>
                          <p>
                            The <strong>super resolution</strong> algorithm intelligently reconstructs image details, 
                            while our noise reduction AI removes unwanted artifacts without losing important image information. 
                            Color correction algorithms automatically balance exposure, contrast, and saturation for 
                            professional-quality results.
                          </p>
                        </div>
                        <div>
                          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
                            <h3 className="font-semibold text-lg mb-4">Enhancement Features:</h3>
                            <ul className="space-y-2 text-sm">
                              <li>🔍 <strong>Super Resolution</strong> - Up to 4x upscaling</li>
                              <li>🎯 <strong>Noise Reduction</strong> - Advanced denoising</li>
                              <li>🌈 <strong>Color Correction</strong> - Automatic optimization</li>
                              <li>✨ <strong>Sharpening</strong> - Intelligent detail enhancement</li>
                              <li>💡 <strong>Exposure Fix</strong> - Lighting adjustment</li>
                              <li>⚡ <strong>Fast Processing</strong> - Results in minutes</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
