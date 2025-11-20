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

export default function GhibliAIGeneratorClient() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // 下载图片函数
  const downloadImage = async (imageUrl: string) => {
    setIsDownloading(true);
    try {
      console.log('Starting download for:', imageUrl);
      
      // 方法1: 尝试使用 fetch 下载
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ghibli-art-${Date.now()}.png`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理 URL 对象
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Download completed successfully');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      
      // 方法2: 如果 fetch 失败，尝试使用代理下载
      try {
        const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(imageUrl)}`;
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = `ghibli-art-${Date.now()}.png`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Proxy download initiated');
      } catch (proxyError) {
        console.error('Proxy download failed:', proxyError);
        
        // 方法3: 最后的备选方案 - 在新窗口打开
        window.open(imageUrl, '_blank');
        alert('Direct download failed. The image has been opened in a new tab. You can right-click and save it.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 生成图片
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && uploadedImage) {
        e.preventDefault();
        generateGhibliImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, uploadedImage]);

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage({
          file,
          preview: e.target?.result as string
        });
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

  const generateGhibliImage = async () => {
    if (!uploadedImage) {
      alert("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 上传图片并获取文件名
      const imageData = await uploadImageToRunningHub(uploadedImage.file);
      
      // 调用RunningHub API开始生成Ghibli风格图片
      const response = await fetch('/api/runninghub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'qwen-image-edit',
          webappId: '1958799927906365441',
          apiKey: 'fb88fac46b0349c1986c9cbb4f14d44e',
          nodeInfoList: [
            {
              nodeId: '6',
              fieldName: 'image',
              fieldValue: imageData,
              description: 'image'
            }
          ]
        })
      });

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success && result.data.taskId) {
        setTaskId(result.data.taskId);
        // 等待3秒后开始轮询任务状态，给系统时间处理任务
        console.log('Task started, waiting 3 seconds before checking status...');
        setTimeout(() => {
          pollTaskStatus(result.data.taskId);
        }, 3000);
      } else {
        console.error('API Error:', result);
        throw new Error(result.error || 'Failed to start Ghibli image generation');
      }
      
    } catch (error) {
      console.error('Ghibli image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate Ghibli image, please try again";
      alert(errorMessage);
      setIsGenerating(false);
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
          if (result.data.status === 'completed') {
            console.log('Task completed!');
            console.log('Full result data:', result.data);
            console.log('Image URL:', result.data.imageUrl);
            
            if (result.data.imageUrl) {
              setGeneratedImage(result.data.imageUrl);
              setIsGenerating(false);
              setTaskId(null);
              setProgress(100);
              setEstimatedTime("Completed!");
              return;
            } else {
              console.error('Task completed but no image URL provided');
              throw new Error('Task completed but no image URL was provided');
            }
          } else if (result.data.status === 'running') {
            attempts++;
            
            // 计算进度 (基于时间估算)
            const elapsedMinutes = (attempts * 5) / 60; // 已经过的分钟数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedMinutes < 2) {
              progressPercent = Math.min(30, elapsedMinutes * 15); // 前2分钟到30%
              timeEstimate = "Processing image...";
            } else if (elapsedMinutes < 5) {
              progressPercent = 30 + Math.min(40, (elapsedMinutes - 2) * 13.3); // 2-5分钟到70%
              timeEstimate = "Applying Ghibli style...";
            } else if (elapsedMinutes < 8) {
              progressPercent = 70 + Math.min(20, (elapsedMinutes - 5) * 6.7); // 5-8分钟到90%
              timeEstimate = "Final touches...";
            } else {
              progressPercent = Math.min(95, 90 + (elapsedMinutes - 8) * 2.5); // 8分钟后到95%
              timeEstimate = "Almost done...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`Task still running, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%, message: ${result.data.message}`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('Task timeout - Ghibli image generation took longer than expected (10 minutes). Please try again.');
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
        const errorMessage = error instanceof Error ? error.message : "Failed to check Ghibli image generation status";
        
        // 如果是网络错误且重试次数少于3次，则自动重试
        if (attempts < 3 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
          console.log(`Network error, retrying in 10 seconds... (attempt ${attempts + 1}/3)`);
          setTimeout(checkStatus, 10000);
          return;
        }
        
        alert(errorMessage);
        setIsGenerating(false);
        setTaskId(null);
        setProgress(0);
        setEstimatedTime("");
      }
    };

    checkStatus();
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
      
      return result.fileId; // 返回RunningHub的文件ID，格式如：api/xxx.png
    } catch (error) {
      console.error('RunningHub upload error:', error);
      throw error;
    }
  };

  const UploadArea = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        Upload Your Image
        <span className="text-red-500">*</span>
      </h3>
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          "focus-within:border-primary focus-within:bg-primary/5",
          uploadedImage ? "border-primary bg-primary/10" : "border-muted-foreground/25"
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
        
        {uploadedImage ? (
          <div className="space-y-3">
            <img
              src={uploadedImage.preview}
              alt="Uploaded image"
              className="max-h-32 mx-auto rounded-md object-cover"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{uploadedImage.file.name}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedImage(null);
                }}
              >
                Reselect
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
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Ghibli AI Generator",
              "description": "Transform your images into stunning Ghibli-style art with AI-powered generator",
              "url": "https://imagetovideo-ai.net/photo-effects/ghibli-ai-generator",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "AI-powered Ghibli style transformation",
                "Studio Ghibli art generation",
                "Anime art creation",
                "Free to use",
                "No registration required"
              ],
              "creator": {
                "@type": "Organization",
                "name": "ImageToVideoAI",
                "url": "https://imagetovideo-ai.net"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What exactly is the Ghibli AI Generator?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Ghibli AI Generator is an AI-powered tool on the imagetovideo-ai platform that transforms your uploaded images into the iconic art style of Studio Ghibli using advanced machine learning."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is the Ghibli AI Generator free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our Ghibli AI Generator is available with a generous free tier. This allows you to generate images and explore all the features before deciding on a paid plan."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How long does it take to generate an image?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Image generation with our Ghibli AI Generator typically takes 3-5 minutes, with a maximum of 10 minutes depending on the complexity of the image and current server load."
                  }
                }
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://imagetovideo-ai.net"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Photo Effects",
                  "item": "https://imagetovideo-ai.net/photo-effects"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Ghibli AI Generator",
                  "item": "https://imagetovideo-ai.net/photo-effects/ghibli-ai-generator"
                }
              ]
            }
          ])
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                The Ultimate 
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {" "}Ghibli AI Generator
                </span>
                <br />for Your Creative Visions
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Welcome to the enchanting world of <strong>imagetovideo-ai</strong>, where your artistic dreams become a reality. 
                Transform your images into stunning Ghibli-style art that perfectly captures that iconic aesthetic.
                This tool is a perfect first step before animating your creations with our <a href="/image-to-video" className="text-primary hover:underline">Image to Video</a> AI.
              </p>
            </div>

            {/* Workspace Card */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiMagicLine" className="w-5 h-5 text-primary" />
                  Ghibli AI Generator Workspace
                </CardTitle>
                <CardDescription>
                  Upload your image and let our AI transform it into beautiful Ghibli-style art using cutting-edge technology.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Image Upload and Preview Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upload Area */}
                  <div>
                    <UploadArea />
                  </div>
                  
                  {/* Preview Area */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Ghibli Art Preview
                    </h3>
                    <div className="relative border-2 border-dashed rounded-lg p-6 transition-colors border-muted-foreground/25 min-h-[200px] flex items-center justify-center">
                      {generatedImage ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={generatedImage}
                            alt="Generated Ghibli art"
                            className="max-h-48 mx-auto rounded-md object-cover"
                          />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">Your Ghibli masterpiece is ready!</p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <Button
                                onClick={() => downloadImage(generatedImage)}
                                disabled={isDownloading}
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                              >
                                {isDownloading ? (
                                  <>
                                    <Icon name="RiLoader4Line" className="w-4 h-4 mr-2 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Icon name="RiDownloadLine" className="w-4 h-4 mr-2" />
                                    Download
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() => {
                                  if (navigator.share) {
                                    navigator.share({
                                      title: 'My Ghibli AI Art',
                                      url: generatedImage
                                    });
                                  } else {
                                    navigator.clipboard.writeText(generatedImage);
                                    alert('Image URL copied to clipboard!');
                                  }
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <Icon name="RiShareLine" className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-3">
                          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Icon name="RiImageLine" className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Generated Ghibli art will be displayed here
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Upload an image and click generate to see the magic
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex flex-col items-center gap-4 pt-4">
                  <Button
                    onClick={generateGhibliImage}
                    disabled={!uploadedImage || isGenerating}
                    className="px-8 py-3 text-base font-medium bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin mr-2" />
                        {taskId ? 'Creating Magic...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="RiMagicLine" className="w-4 h-4 mr-2" />
                        Generate Ghibli Art
                        <span className="ml-2 text-xs opacity-60">
                          (Ctrl+Enter)
                        </span>
                      </>
                    )}
                  </Button>
                  
                </div>

                {/* Task Status */}
                {taskId && isGenerating && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-3">
                      <Icon name="RiInformationLine" className="w-4 h-4" />
                      <span className="text-sm font-medium">Task ID: {taskId}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Ghibli Art Generation in Progress
                        </span>
                        <span className="text-xs text-green-500 dark:text-green-400 ml-auto">
                          {progress}%
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-green-100 dark:bg-green-800/30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-green-600 dark:text-green-400">
                          Transforming to Ghibli style
                        </span>
                        <span className="text-green-500 dark:text-green-400 font-medium">
                          {estimatedTime}
                        </span>
                      </div>
                      
                      <div className="bg-green-100 dark:bg-green-800/30 rounded-md p-3 mt-3">
                        <div className="flex items-start gap-2">
                          <Icon name="RiTimeLine" className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-green-600 dark:text-green-400">
                            <p className="font-medium mb-1">Expected Generation Time:</p>
                            <p>• Typical: 3-5 minutes</p>
                            <p>• Maximum: up to 10 minutes</p>
                            <p className="mt-2 font-medium">Please keep this page open. Your Ghibli art will appear automatically when ready.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>generatedImage: {generatedImage ? 'SET' : 'NULL'}</p>
                <p>isGenerating: {isGenerating ? 'TRUE' : 'FALSE'}</p>
                <p>taskId: {taskId || 'NULL'}</p>
                <p>uploadedImage: {uploadedImage ? 'SET' : 'NULL'}</p>
              </div>
            )}


            {/* Content Sections */}
            <div className="space-y-12">
              {/* How It Works */}
              <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-0">
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  How Our Ghibli AI Generator Works Its Magic
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  The process behind our <strong>Ghibli AI Generator</strong> is built on a foundation of cutting-edge artificial intelligence. 
                  At its heart lies a sophisticated deep learning model that has been trained on a massive dataset, including thousands of images, 
                  frames, and concept art from the Studio Ghibli universe. This intensive training allows the AI to understand and replicate 
                  the distinct artistic elements that define the Ghibli style: the lush, painterly backgrounds, the soft, evocative color palettes, 
                  the expressive character designs, and the serene, sometimes melancholy, atmosphere.
                </p>
                
                {/* 展示案例 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="text-lg font-semibold text-foreground">Original Photo</h4>
                    </div>
                    <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                      <img
                        src="/imgs/showcases/ghibli-ai-generator-original-photo-example-1.webp"
                        alt="Original photo before Ghibli AI transformation - demonstrating input quality for best results"
                        className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h4 className="text-lg font-semibold text-foreground">Ghibli AI Result</h4>
                      <div className="ml-auto">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✨ AI Generated
                        </span>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                      <img
                        src="/imgs/showcases/ghibli-ai-generator-transformed-art-example-1.webp"
                        alt="Ghibli AI generated art showing magical transformation with Studio Ghibli style elements"
                        className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Creative Potential */}
              <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg border-0">
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Unleash Your Creative Potential with the Ghibli AI Generator
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  The applications for the <strong>Ghibli AI Generator</strong> are as boundless as your imagination. This tool isn't just for 
                  creating static images; it's a launchpad for countless creative projects. You can design original characters for your own 
                  Ghibli-inspired narrative, generate breathtaking wallpapers, or create unique concept art. 
                  For even better results, try editing your source photos first with our <a href="/image-editor/qwen-image-edit" className="text-primary hover:underline">Qwen Image Editor</a>. 
                  Once you have your Ghibli-style masterpieces, you can bring them to life using our advanced <a href="/sora-2-ai-video-generator" className="text-primary hover:underline">Sora 2 Video Generator</a> to create magical anime scenes.
                </p>
                
                {/* 展示案例 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="text-lg font-semibold text-foreground">Original Photo</h4>
                    </div>
                    <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                      <img
                        src="/imgs/showcases/ghibli-ai-generator-original-photo-example-2.webp"
                        alt="Creative potential example - original landscape photo ready for Ghibli AI transformation"
                        className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h4 className="text-lg font-semibold text-foreground">Ghibli AI Result</h4>
                      <div className="ml-auto">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✨ AI Generated
                        </span>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                      <img
                        src="/imgs/showcases/ghibli-ai-generator-transformed-art-example-2.webp"
                        alt="Ghibli AI creative transformation showcasing artistic potential and Studio Ghibli aesthetic"
                        className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Advanced Technology */}
              <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-0">
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  The Advanced Technology Behind Our Ghibli AI Generator
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  What makes the <strong>Ghibli AI Generator</strong> from <strong>imagetovideo-ai</strong> so exceptional is its foundation 
                  in state-of-the-art AI technology. We leverage a type of model known as a diffusion model. This advanced architecture functions 
                  by learning to 'de-noise' an image. It begins with a completely random pattern and progressively refines it, adding layers of 
                  detail and structure until it forms a coherent, high-quality image that matches the input requirements.
                </p>
                
                {/* 展示案例 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="text-lg font-semibold text-foreground">Original Photo</h4>
                    </div>
                    <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                      <img
                        src="/imgs/showcases/ghibli-ai-generator-original-photo-example-3.webp"
                        alt="Advanced technology demonstration - high-quality original photo for AI processing"
                        className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h4 className="text-lg font-semibold text-foreground">Ghibli AI Result</h4>
                      <div className="ml-auto">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✨ AI Generated
                        </span>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                      <img
                        src="/imgs/showcases/ghibli-ai-generator-transformed-art-example-3.webp"
                        alt="Advanced AI technology result showcasing diffusion model capabilities in Ghibli style transformation"
                        className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Pro Tips */}
              <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg border-0">
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Pro Tips for Using the Ghibli AI Generator
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon name="RiImageLine" className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">High Quality Images</h4>
                        <p className="text-sm text-muted-foreground">
                          Upload high-resolution images for the best results. Clear, well-lit photos work exceptionally well.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon name="RiPaletteLine" className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Artistic Subjects</h4>
                        <p className="text-sm text-muted-foreground">
                          Portraits, landscapes, and nature scenes transform beautifully into Ghibli style.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon name="RiMagicLine" className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Experiment Freely</h4>
                        <p className="text-sm text-muted-foreground">
                          Try different types of images to discover unique artistic interpretations.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon name="RiDownloadLine" className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Save Your Creations</h4>
                        <p className="text-sm text-muted-foreground">
                          Download your generated art in high quality for use in your projects.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 展示案例 4 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="text-lg font-semibold text-foreground">Original Photo</h4>
                    </div>
                    <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                      <img
                        src="/imgs/showcases/ghibli-ai-generator-original-photo-example-4.webp"
                        alt="Pro tips example - optimal photo composition for Ghibli AI generator best practices"
                        className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h4 className="text-lg font-semibold text-foreground">Ghibli AI Result</h4>
                      <div className="ml-auto">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✨ AI Generated
                        </span>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                      <img
                        src="/imgs/showcases/ghibli-ai-generator-transformed-art-example-4.webp"
                        alt="Pro tips result - perfect Ghibli AI transformation following best practices and techniques"
                        className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-0">
                <h2 className="text-3xl font-bold text-foreground mb-8">
                  FAQ: Your Questions About the Ghibli AI Generator Answered
                </h2>
                <div className="space-y-6">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-foreground mb-2">What exactly is the Ghibli AI Generator?</h3>
                    <p className="text-muted-foreground text-sm">
                      The <strong>Ghibli AI Generator</strong> is an AI-powered tool on the <strong>imagetovideo-ai</strong> platform 
                      that transforms your uploaded images into the iconic art style of Studio Ghibli using advanced machine learning.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Is the Ghibli AI Generator free to use?</h3>
                    <p className="text-muted-foreground text-sm">
                      Yes, our <strong>Ghibli AI Generator</strong> is available with a generous free tier. This allows you to 
                      generate images and explore all the features before deciding on a paid plan.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-foreground mb-2">How long does it take to generate an image?</h3>
                    <p className="text-muted-foreground text-sm">
                      Image generation with our <strong>Ghibli AI Generator</strong> typically takes 3-5 minutes, with a maximum 
                      of 10 minutes depending on the complexity of the image and current server load.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Can I use the images for commercial projects?</h3>
                    <p className="text-muted-foreground text-sm">
                      Please refer to our terms of service for the most up-to-date information on commercial use rights. 
                      In general, images created on our platform can be used for personal and some commercial purposes, 
                      depending on your subscription plan.
                    </p>
                  </div>
                </div>
              </section>

              {/* Conclusion */}
              <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 shadow-lg border-0 text-white text-center">
                <h2 className="text-3xl font-bold mb-6">
                  Start Your Ghibli Art Journey Today
                </h2>
                <p className="text-lg opacity-90 max-w-3xl mx-auto mb-8">
                  The <strong>Ghibli AI Generator</strong> by <strong>imagetovideo-ai</strong> is more than just a tool; it's a new way to create. 
                  We have combined state-of-the-art AI technology with the timeless beauty of Studio Ghibli to create a platform that is both 
                  powerful and accessible. Whether you are a dedicated fan, a budding artist, a writer, or just someone looking for a new creative 
                  outlet, our <strong>Ghibli AI Generator</strong> is ready to help you bring your most cherished visions to life.
                </p>
                <Button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  variant="secondary"
                  className="px-8 py-3 text-base font-medium"
                  size="lg"
                >
                  <Icon name="RiArrowUpLine" className="w-4 h-4 mr-2" />
                  Start Creating Now
                </Button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
