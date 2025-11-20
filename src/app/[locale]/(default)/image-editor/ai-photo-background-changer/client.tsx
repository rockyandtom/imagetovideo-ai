"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadedImage {
  file: File;
  preview: string;
}

interface ProcessResult {
  imageUrl: string;
  taskId: string;
}

interface ShowcasePair {
  originalSrc: string;
  originalAlt: string;
  resultSrc: string;
  resultAlt: string;
  originalLabel: string;
  resultLabel: string;
}

export default function AIPhotoBackgroundChangerClient() {
  const [image1, setImage1] = useState<UploadedImage | null>(null);
  const [image2, setImage2] = useState<UploadedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<ProcessResult | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const image1InputRef = useRef<HTMLInputElement>(null);
  const image2InputRef = useRef<HTMLInputElement>(null);

  const showcasePairs: Record<"introduction" | "features" | "useCases" | "technology", ShowcasePair> = {
    introduction: {
      originalSrc: "/imgs/showcases/ai-photo-background-changer-digital-brand-original.webp",
      originalAlt: "Original ecommerce product photo before AI background changer branding enhancement",
      resultSrc: "/imgs/showcases/ai-photo-background-changer-digital-brand-result.webp",
      resultAlt: "AI photo background changer result with cohesive brand environment for ecommerce imagery",
      originalLabel: "Original Image",
      resultLabel: "AI Background Result",
    },
    features: {
      originalSrc: "/imgs/showcases/ai-photo-background-changer-scene-generation-original.webp",
      originalAlt: "Original lifestyle photo before contextual AI background generation",
      resultSrc: "/imgs/showcases/ai-photo-background-changer-scene-generation-result.webp",
      resultAlt: "AI-generated contextual scene created by the AI photo background changer",
      originalLabel: "Before AI Scene",
      resultLabel: "AI Generated Scene",
    },
    useCases: {
      originalSrc: "/imgs/showcases/ai-photo-background-changer-marketing-use-case-original.webp",
      originalAlt: "Original marketing image prior to AI background changer optimization",
      resultSrc: "/imgs/showcases/ai-photo-background-changer-marketing-use-case-result.webp",
      resultAlt: "Marketing-ready visual after AI photo background changer transformation",
      originalLabel: "Original Creative",
      resultLabel: "AI Optimized Visual",
    },
    technology: {
      originalSrc: "/imgs/showcases/ai-photo-background-changer-gan-technology-original.webp",
      originalAlt: "Original studio portrait before GAN and diffusion background replacement",
      resultSrc: "/imgs/showcases/ai-photo-background-changer-gan-technology-result.webp",
      resultAlt: "GAN-enhanced background result produced by the AI photo background changer",
      originalLabel: "Source Capture",
      resultLabel: "GAN + Diffusion Result",
    },
  };

  const renderShowcase = (pair: ShowcasePair) => (
    <div className="mx-auto my-8 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
      <figure className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className="inline-flex items-center rounded-full bg-background px-3 py-1 text-xs uppercase tracking-wide text-foreground">
            {pair.originalLabel}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/20 bg-muted/10 shadow-sm">
          <img
            src={pair.originalSrc}
            alt={pair.originalAlt}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </div>
        <figcaption className="text-xs text-muted-foreground lg:text-sm">
          {pair.originalAlt}
        </figcaption>
      </figure>
      <figure className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-wide text-primary">
            {pair.resultLabel}
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/20 bg-muted/10 shadow-sm">
          <img
            src={pair.resultSrc}
            alt={pair.resultAlt}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </div>
        <figcaption className="text-xs text-muted-foreground lg:text-sm">
          {pair.resultAlt}
        </figcaption>
      </figure>
    </div>
  );

  // 处理图片上传
  const handleImageUpload = (file: File, setImage: (img: UploadedImage | null) => void) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage({
          file,
          preview: e.target?.result as string
        });
        // 重置结果
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select a valid image file");
    }
  };

  const handleDrop = (e: React.DragEvent, setImage: (img: UploadedImage | null) => void) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0], setImage);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 上传图片到服务器
  const uploadImageToServer = async (file: File): Promise<string> => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File is too large. Maximum allowed size is 10MB.");
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/runninghub-upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.fileId) {
      throw new Error(result.error || 'Upload did not return file ID');
    }
    
    return result.fileId;
  };

  // 处理背景更换
  const handleBackgroundChange = async () => {
    if (!image1 || !image2) {
      toast.error("Please upload both images");
      return;
    }

    setIsProcessing(true);
    setResultImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 上传两张图片
      toast.info("Uploading images...");
      setProgress(10);
      const image1Id = await uploadImageToServer(image1.file);
      setProgress(30);
      const image2Id = await uploadImageToServer(image2.file);
      setProgress(50);

      // 调用API开始处理
      toast.info("Starting background change...");
      const response = await fetch('/api/runninghub/ai-photo-background-changer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image1Id,
          image2Id
        })
      });

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success && result.taskId) {
        setTaskId(result.taskId);
        setProgress(60);
        // 开始轮询任务状态
        pollTaskStatus(result.taskId);
      } else {
        console.error('API Error:', result);
        throw new Error(result.error || 'Background change failed');
      }
      
    } catch (error) {
      console.error('Background change error:', error);
      const errorMessage = error instanceof Error ? error.message : "Background change failed, please try again";
      toast.error(errorMessage);
      setIsProcessing(false);
      setTaskId(null);
      setProgress(0);
      setEstimatedTime("");
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 120; // 最多轮询10分钟
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/runninghub/status/${taskId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check task status');
        }

        const result = await response.json();
        console.log(`Status check result (attempt ${attempts + 1}):`, result);
        
        if (result.status === 'completed' && result.videoUrl) {
          // 对于图片处理，结果可能在 videoUrl 字段中
          console.log('Task completed, image URL:', result.videoUrl);
          
          setResultImage({
            imageUrl: result.videoUrl,
            taskId: taskId
          });
          setIsProcessing(false);
          setTaskId(null);
          setProgress(100);
          setEstimatedTime("Completed");
          toast.success("Background changed successfully!");
          return;
        } else if (result.status === 'processing' || result.status === 'pending') {
          attempts++;
          
          // 计算进度
          const elapsedMinutes = (attempts * 5) / 60;
          let progressPercent = 60;
          let timeEstimate = "";
          
          if (elapsedMinutes < 2) {
            progressPercent = Math.min(70, 60 + elapsedMinutes * 5);
            timeEstimate = "Analyzing images...";
          } else if (elapsedMinutes < 4) {
            progressPercent = 70 + Math.min(20, (elapsedMinutes - 2) * 10);
            timeEstimate = "Changing background...";
          } else if (elapsedMinutes < 6) {
            progressPercent = 90 + Math.min(5, (elapsedMinutes - 4) * 2.5);
            timeEstimate = "Optimizing output...";
          } else {
            progressPercent = Math.min(95, 95 + (elapsedMinutes - 6) * 1);
            timeEstimate = "Almost done...";
          }
          
          setProgress(Math.round(progressPercent));
          setEstimatedTime(timeEstimate);
          
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000); // 5秒后再次检查
          } else {
            throw new Error('Task timeout - Background change took longer than expected. Please try again.');
          }
        } else if (result.status === 'failed') {
          throw new Error(result.error || 'Background change failed');
        } else {
          throw new Error(result.error || `Unexpected status: ${result.status}`);
        }
      } catch (error) {
        console.error('Status check error:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to check background change status";
        
        if (attempts < 3 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
          console.log(`Network error, retrying in 10 seconds... (attempt ${attempts + 1}/3)`);
          setTimeout(checkStatus, 10000);
          return;
        }
        
        toast.error(errorMessage);
        setIsProcessing(false);
        setTaskId(null);
        setProgress(0);
        setEstimatedTime("");
      }
    };

    checkStatus();
  };

  // 图片上传区域组件
  const ImageUploadArea = ({ 
    image, 
    setImage, 
    inputRef, 
    label 
  }: { 
    image: UploadedImage | null; 
    setImage: (img: UploadedImage | null) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    label: string;
  }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        {label}
        <span className="text-red-500">*</span>
      </h3>
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          "focus-within:border-primary focus-within:bg-primary/5",
          image ? "border-primary bg-primary/10" : "border-muted-foreground/25"
        )}
        onDrop={(e) => handleDrop(e, setImage)}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, setImage);
          }}
        />
        
        {image ? (
          <div className="space-y-3">
            <img
              src={image.preview}
              alt={label}
              className="max-h-48 mx-auto rounded-md object-cover"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{image.file.name}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setImage(null);
                  setResultImage(null);
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
                Supports JPG, PNG, WebP formats
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
              "name": "AI Photo Background Changer",
              "description": "Revolutionize your images with imagetovideo-ai's powerful AI photo background changer. Effortlessly transform any photo background using advanced AI generation.",
              "url": "https://imagetovideo-ai.net/image-editor/ai-photo-background-changer",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "AI-powered background changing",
                "One-click background removal",
                "AI-generated backgrounds",
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
                  "name": "How accurate is the subject removal feature of the AI photo background changer?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our proprietary AI model is trained for pixel-perfect edge detection, handling complex details like flyaway hair, translucent objects (glass/water), and fine textures with industry-leading precision."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does the AI photo background changer work with all types of images?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, it is designed to work with photos of products, people, animals, and objects. The best results are achieved when the subject is clearly defined in the original image."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does the AI ensure realistic lighting and shadows with the new background?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The AI analyzes the light source, intensity, and color temperature of the newly generated background and applies corresponding adjustments to the foreground subject, including generating appropriate contact shadows."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can the AI photo background changer be used for commercial purposes?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, all images generated using the imagetovideo-ai AI photo background changer are safe for commercial use, provided you adhere to our terms of service and have the rights to the original subject image."
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
                  "name": "Image Editor",
                  "item": "https://imagetovideo-ai.net/image-editor"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "AI Photo Background Changer",
                  "item": "https://imagetovideo-ai.net/image-editor/ai-photo-background-changer"
                }
              ]
            }
          ])
        }}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <Icon name="RiSparklingLine" className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Free to Use
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                The Ultimate AI Photo Background Changer: Redefine Your Visuals with{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  imagetovideo-ai
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Revolutionize your images with our powerful <strong>AI photo background changer</strong>. 
                Effortlessly transform any photo background using advanced <strong>AI image generation</strong>, 
                perfect for e-commerce, social media, and more.
              </p>
            </div>

            {/* Main Workspace */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiEditLine" className="w-5 h-5 text-primary" />
                  AI Photo Background Changer Workspace
                </CardTitle>
                <CardDescription>
                  Upload your original image and background image. Our AI will seamlessly change the background for you.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Image Upload and Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Upload Area - Left Side with two upload boxes */}
                  <div className="space-y-6">
                    <ImageUploadArea 
                      image={image1}
                      setImage={setImage1}
                      inputRef={image1InputRef}
                      label="Upload Original Image"
                    />
                    <ImageUploadArea 
                      image={image2}
                      setImage={setImage2}
                      inputRef={image2InputRef}
                      label="Upload Background Image"
                    />
                  </div>
                  
                  {/* Preview Area - Right Side */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Result Preview</h3>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                      {resultImage ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={resultImage.imageUrl}
                            alt="Result Image"
                            className="max-h-96 mx-auto rounded-md object-contain"
                          />
                          <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Background Changed Successfully</p>
                            <div className="flex gap-2 justify-center">
                              <Button
                                onClick={async () => {
                                  if (isDownloading) return;
                                  
                                  setIsDownloading(true);
                                  try {
                                    const response = await fetch(resultImage.imageUrl);
                                    if (!response.ok) throw new Error('Failed to fetch image');
                                    
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    
                                    let fileExtension = 'png';
                                    if (blob.type.includes('jpeg') || blob.type.includes('jpg')) {
                                      fileExtension = 'jpg';
                                    } else if (blob.type.includes('webp')) {
                                      fileExtension = 'webp';
                                    }
                                    
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `ai-background-changed-${Date.now()}.${fileExtension}`;
                                    document.body.appendChild(link);
                                    link.click();
                                    
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                    toast.success("Image downloaded successfully!");
                                  } catch (error) {
                                    console.error('Download failed:', error);
                                    toast.error('Download failed. Please try again.');
                                  } finally {
                                    setIsDownloading(false);
                                  }
                                }}
                                size="sm"
                                variant="default"
                                disabled={isDownloading}
                              >
                                {isDownloading ? (
                                  <>
                                    <Icon name="RiLoader4Line" className="w-4 h-4 mr-1 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Icon name="RiDownloadLine" className="w-4 h-4 mr-1" />
                                    Download
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Icon name="RiImageLine" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Result image will be displayed here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleBackgroundChange}
                    disabled={!image1 || !image2 || isProcessing}
                    className="px-8 py-3 text-base font-medium"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin mr-2" />
                        {taskId ? 'Processing...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="RiMagicLine" className="w-4 h-4 mr-2" />
                        Change Background
                      </>
                    )}
                  </Button>
                </div>

                {/* Task Status */}
                {taskId && isProcessing && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                      <Icon name="RiInformationLine" className="w-4 h-4" />
                      <span className="text-sm font-medium">Task ID: {taskId}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Changing Background in Progress
                        </span>
                        <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto">
                          {progress}%
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <Progress value={progress} className="w-full" />
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-600 dark:text-blue-400">
                          Using AI Background Changer Technology
                        </span>
                        <span className="text-blue-500 dark:text-blue-400 font-medium">
                          {estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Sections based on JSON */}
            <div className="space-y-12">
              {/* Introduction Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Why an AI Photo Background Changer is Essential in the Digital Age
                  </h2>
                </div>
                <Card className="p-8 space-y-8">
                  <p className="text-muted-foreground leading-relaxed">
                    In today's visual-first digital landscape, the quality and context of your images are paramount. 
                    Whether you're an e-commerce seller, a social media influencer, a professional photographer, or simply 
                    someone looking to enhance personal photos, a superior <strong>AI photo background changer</strong> is no longer 
                    a luxury—it's a necessity. <strong>imagetovideo-ai</strong> leverages cutting-edge <strong>AI image generation</strong> 
                    technology to offer the most intuitive and powerful background replacement tool on the market. We move beyond 
                    simple cut-and-paste editing. Our tool is designed to intelligently analyze the subject, understand the lighting, 
                    and seamlessly integrate it into a completely new, AI-generated environment. This level of sophistication ensures 
                    that every background change looks authentic, professional, and visually stunning.
                  </p>
                  {renderShowcase(showcasePairs.introduction)}
                </Card>
              </div>

              {/* Features Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Key Features of the imagetovideo-ai AI Photo Background Changer
                  </h2>
                </div>
                <Card className="p-8 space-y-8">
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    <strong>imagetovideo-ai</strong> stands out in a crowded market because our <strong>AI photo background changer</strong> 
                    is built on a foundation of proprietary <strong>AI image generation</strong> models. We offer a suite of features 
                    designed for both power and ease of use. If you need to make specific edits to your subject before changing the background, 
                    try our <a href="/image-editor/qwen-image-edit" className="text-primary hover:underline">Qwen Image Editor</a> first.
                  </p>
                  <ul className="space-y-4 text-muted-foreground">
                    <li>
                      <strong>One-Click Background Removal:</strong> Our AI automatically detects the subject's edges with pixel-perfect 
                      precision, instantly isolating it from the original background, regardless of complexity (e.g., hair, fur, transparent objects).
                    </li>
                    <li>
                      <strong>AI-Powered Contextual Scene Generation:</strong> Unlike tools that use stock images, our platform, powered by 
                      advanced <strong>AI photo generation</strong>, creates brand-new, realistic backgrounds based on a simple text prompt.
                    </li>
                    <li>
                      <strong>Seamless Subject-Background Blending:</strong> The most challenging aspect of background changing is achieving 
                      realistic lighting and shadows. Our AI automatically adjusts the subject's lighting, color temperature, and shadows to 
                      perfectly match the newly generated background.
                    </li>
                    <li>
                      <strong>Batch Processing Capabilities:</strong> Optimize your workflow by processing multiple images simultaneously. 
                      Ideal for e-commerce stores that need hundreds of product shots updated quickly and consistently.
                    </li>
                    <li>
                      <strong>High-Resolution Output:</strong> Generate and download your final images in high resolution, suitable for 
                      printing, professional marketing materials, and high-DPI web displays.
                    </li>
                  </ul>
                  {renderShowcase(showcasePairs.features)}
                </Card>
              </div>

              {/* Technology Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    The Technology Behind the imagetovideo-ai AI Photo Background Changer
                  </h2>
                </div>
                <Card className="p-8 space-y-8">
                  <p className="text-muted-foreground leading-relaxed">
                    What sets <strong>imagetovideo-ai</strong> apart is the proprietary machine learning engine that powers our 
                    <strong> AI photo background changer</strong>. A two-stage pipeline combines precision segmentation with a GAN and 
                    diffusion model workflow, ensuring perfect edge handling, lighting consistency, and natural color harmony. Each 
                    generation learns from previous outputs, delivering increasingly realistic background replacements that feel 
                    professionally retouched.
                  </p>
                  {renderShowcase(showcasePairs.technology)}
                </Card>
              </div>

              {/* Use Cases Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Transform Your Marketing: Practical Applications for Our AI Photo Background Changer
                  </h2>
                </div>
                <Card className="p-8 space-y-8">
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    The utility of the <strong>AI photo background changer</strong> extends across numerous industries and creative needs. 
                    <strong>imagetovideo-ai</strong> has become the go-to tool for rapid visual content production across the board.
                  </p>
                  <ol className="space-y-4 text-muted-foreground list-decimal list-inside">
                    <li>
                      <strong>E-commerce Product Photography:</strong> Instantly create professional-grade white, gray, or lifestyle backgrounds. 
                      Test different visual concepts for A/B testing your listings without costly reshoots.
                    </li>
                    <li>
                      <strong>Social Media Content Creation:</strong> Keep your feed fresh and engaging. Quickly swap mundane backgrounds 
                      for trending, aesthetic, or conceptual scenes that capture attention and drive engagement. Once you have the perfect background, 
                      bring your image to life with our <a href="/image-to-video" className="text-primary hover:underline">Image to Video</a> tool.
                    </li>
                    <li>
                      <strong>Real Estate & Interior Design:</strong> Stage empty rooms virtually. Add furniture, change wall colors, or 
                      replace dreary outdoor views with sunny skies.
                    </li>
                    <li>
                      <strong>Professional Headshots & Branding:</strong> Need a consistent professional backdrop for your team's headshots? 
                      Our <strong>AI photo background changer</strong> can standardize every photo, placing your team in a sleek, branded 
                      virtual office or studio environment.
                    </li>
                    <li>
                      <strong>Creative Storytelling:</strong> Artists and bloggers can use the <strong>AI photo background changer</strong> 
                      to place characters or objects into fantastical, surreal, or historical settings, significantly enhancing their visual 
                      narrative without complex digital painting or rendering.
                    </li>
                  </ol>
                  {renderShowcase(showcasePairs.useCases)}
                </Card>
              </div>

              {/* FAQ Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    FAQ: Everything You Need to Know About the AI Photo Background Changer
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">
                      How accurate is the subject removal feature of the AI photo background changer?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Our proprietary AI model is trained for pixel-perfect edge detection, handling complex details like flyaway hair, 
                      translucent objects (glass/water), and fine textures with industry-leading precision.
                    </p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">
                      Does the AI photo background changer work with all types of images?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Yes, it is designed to work with photos of products, people, animals, and objects. The best results are achieved 
                      when the subject is clearly defined in the original image.
                    </p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">
                      How does the AI ensure realistic lighting and shadows with the new background?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      The AI analyzes the light source, intensity, and color temperature of the newly generated background and applies 
                      corresponding adjustments to the foreground subject, including generating appropriate contact shadows.
                    </p>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">
                      Can the AI photo background changer be used for commercial purposes?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Yes, all images generated using the <strong>imagetovideo-ai AI photo background changer</strong> are safe for commercial 
                      use, provided you adhere to our terms of service and have the rights to the original subject image.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



