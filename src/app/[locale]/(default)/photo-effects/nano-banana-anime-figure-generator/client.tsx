"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadedImage {
  file: File;
  preview: string;
}

export default function NanoBananaClient() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键支持：Ctrl/Cmd + Enter 生成图片
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && uploadedImage) {
        e.preventDefault();
        generateImage();
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
        // 清空之前生成的结果
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload a valid image file");
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

  // 上传图片到 RunningHub
  const uploadImageToRunningHub = async (file: File): Promise<string> => {
    console.log('Uploading image to RunningHub:', file.name, file.size, file.type);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/runninghub-upload', {
        method: 'POST',
        body: formData
      });

      console.log('RunningHub upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RunningHub upload failed:', errorText);
        throw new Error(`Failed to upload image: ${response.status}`);
      }

      const result = await response.json();
      console.log('RunningHub upload result:', result);
      
      if (!result.success || !result.fileId) {
        throw new Error('No file ID returned from RunningHub upload');
      }
      
      return result.fileId; // 返回文件ID，格式如：c40ceb9fe3d34cbaf2443cdf09607bbf6ccb7097920cfbd49f9fd866dccd5035.png
    } catch (error) {
      console.error('RunningHub upload error:', error);
      throw error;
    }
  };

  // 生成图片
  const generateImage = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 上传图片并获取文件ID
      const imageFileId = await uploadImageToRunningHub(uploadedImage.file);
      console.log('Image uploaded, fileId:', imageFileId);
      
      // 调用 Nano Banana API 开始生成
      const response = await fetch('/api/runninghub/nano-banana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageFileId
        })
      });

      const result = await response.json();
      console.log('Nano Banana API Response:', result);
      
      if (result.success && result.taskId) {
        setTaskId(result.taskId);
        toast.success('Image generation started!');
        // 开始轮询任务状态
        pollTaskStatus(result.taskId);
      } else {
        console.error('API Error:', result);
        throw new Error(result.error || 'Failed to start image generation');
      }
      
    } catch (error) {
      console.error('Image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image, please try again";
      toast.error(errorMessage);
      setIsGenerating(false);
      setTaskId(null);
      setProgress(0);
      setEstimatedTime("");
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 180; // 最多轮询15分钟 (180 * 5秒 = 900秒 = 15分钟)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch('/api/runninghub/nano-banana/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskId: taskId
          })
        });

        const result = await response.json();
        console.log(`Status check result (attempt ${attempts + 1}):`, result);
        
        if (result.success) {
          if (result.status === 'completed' && result.imageUrl) {
            console.log('Task completed, image URL:', result.imageUrl);
            
            setGeneratedImage(result.imageUrl);
            setIsGenerating(false);
            setTaskId(null);
            setProgress(100);
            setEstimatedTime("Completed!");
            toast.success('Image generated successfully!');
            return;
          } else if (result.status === 'running' || result.status === 'pending') {
            attempts++;
            
            // 计算进度 (基于时间估算)
            const elapsedSeconds = attempts * 5; // 已经过的秒数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedSeconds < 60) {
              progressPercent = Math.min(30, (elapsedSeconds / 60) * 30); // 前1分钟到30%
              timeEstimate = "Processing image...";
            } else if (elapsedSeconds < 180) {
              progressPercent = 30 + Math.min(40, ((elapsedSeconds - 60) / 120) * 40); // 1-3分钟到70%
              timeEstimate = "Generating anime figure...";
            } else if (elapsedSeconds < 600) {
              progressPercent = 70 + Math.min(25, ((elapsedSeconds - 180) / 420) * 25); // 3-10分钟到95%
              timeEstimate = "Finalizing details...";
            } else {
              progressPercent = Math.min(98, 95 + ((elapsedSeconds - 600) / 300) * 3); // 10分钟后到98%
              timeEstimate = "Almost done...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`Task still running, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('Task timeout - Image generation took longer than expected (15 minutes). Please try again.');
            }
          } else {
            console.error('Unexpected status:', result.status);
            throw new Error(result.message || `Unexpected status: ${result.status}`);
          }
        } else {
          throw new Error(result.error || 'Status check failed');
        }
      } catch (error) {
        console.error('Status check error:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to check image generation status";
        
        // 如果是网络错误且重试次数少于3次，则自动重试
        if (attempts < 3 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
          console.log(`Network error, retrying in 10 seconds... (attempt ${attempts + 1}/3)`);
          setTimeout(checkStatus, 10000);
          return;
        }
        
        toast.error(errorMessage);
        setIsGenerating(false);
        setTaskId(null);
        setProgress(0);
        setEstimatedTime("");
      }
    };

    checkStatus();
  };

  // 下载生成的图片
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
        link.download = `nano-banana-anime-figure-${Date.now()}.png`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理 URL 对象
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Download completed successfully');
        toast.success('Image downloaded successfully!');
      } else {
        // 方法2: 如果 fetch 失败，尝试直接下载
        console.log('Fetch failed, trying direct download');
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `nano-banana-anime-figure-${Date.now()}.png`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image download started!');
      }
    } catch (error) {
      console.error('Download error:', error);
      // 方法3: 最终后备方案 - 直接下载
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `nano-banana-anime-figure-${Date.now()}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image download started!');
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        toast.error('Download failed. Please try right-clicking on the image and selecting "Save image as"');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // 上传区域组件
  const UploadArea = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        Upload Image
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
              alt="Uploaded"
              className="max-h-48 mx-auto rounded-md object-cover"
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
                  setGeneratedImage(null);
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
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Nano Banana: AI Anime Figure Generator",
            "description": "Create stunning anime figures with our AI-powered Nano Banana generator. Transform images into unique, high-quality anime figures instantly.",
            "url": "https://imagetovideoai.com/photo-effects/nano-banana-anime-figure-generator",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered anime figure generation",
              "Image to anime figure conversion",
              "High-quality anime art generation",
              "Free to use",
              "No registration required"
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
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Nano Banana Anime Figure Generator: Create Your Dream Characters
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create stunning anime figures with our AI-powered Nano Banana generator. Transform your images into unique, high-quality anime figures instantly.
              </p>
            </div>

            {/* Workspace Section - 工作区 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiMagicLine" className="w-5 h-5 text-primary" />
                  Generate Your Anime Figure
                </CardTitle>
                <CardDescription>
                  Upload an image and let Nano Banana AI transform it into a stunning anime figure. The AI understands your image and creates a beautiful, detailed anime-style character.
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
                      Anime Figure Preview
                    </h3>
                    <div className="relative border-2 border-dashed rounded-lg p-6 transition-colors border-muted-foreground/25 min-h-[200px] flex items-center justify-center">
                      {generatedImage ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={generatedImage}
                            alt="Generated anime figure"
                            className="max-h-48 mx-auto rounded-md object-cover"
                          />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">Your anime figure is ready!</p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <Button
                                onClick={() => downloadImage(generatedImage)}
                                disabled={isDownloading}
                                size="sm"
                                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
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
                                      title: 'My Nano Banana Anime Figure',
                                      url: generatedImage
                                    });
                                  } else {
                                    navigator.clipboard.writeText(generatedImage);
                                    toast.success('Image URL copied to clipboard!');
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
                              Generated anime figure will be displayed here
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
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={generateImage}
                    disabled={!uploadedImage || isGenerating}
                    className="px-8 py-3 text-base font-medium"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin mr-2" />
                        {taskId ? 'Processing...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="RiSparklingLine" className="w-4 h-4 mr-2" />
                        Generate Anime Figure
                        <span className="ml-2 text-xs opacity-60">
                          (Ctrl+Enter)
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Task Status - 进度条 */}
                {taskId && isGenerating && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                      <Icon name="RiInformationLine" className="w-4 h-4" />
                      <span className="text-sm font-medium">Task ID: {taskId}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Generating Anime Figure
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
                          Processing your image
                        </span>
                        <span className="text-blue-500 dark:text-blue-400 font-medium">
                          {estimatedTime}
                        </span>
                      </div>
                      
                      <div className="bg-blue-100 dark:bg-blue-800/30 rounded-md p-3 mt-3">
                        <div className="flex items-start gap-2">
                          <Icon name="RiTimeLine" className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            <p className="font-medium mb-1">Expected Generation Time:</p>
                            <p>• Typical: 2-5 minutes</p>
                            <p>• Maximum: up to 15 minutes</p>
                            <p className="mt-2 font-medium">Please keep this page open. Your anime figure will appear automatically when ready.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Sections from JSON */}
            <div className="space-y-8">
              {/* Main Content Paragraphs */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="text-foreground leading-relaxed">
                  Welcome to <strong>imagetovideo-ai</strong>, where we unleash the power of AI to transform your creative visions into reality. Our groundbreaking <strong>Nano Banana</strong> anime figure generator is designed for artists, fans, and creators who want to bring their unique characters to life without the need for complex 3D modeling or physical sculpting. Imagine describing your ideal anime character—from their hairstyle and outfit to their pose and expression—and watching as our advanced AI crafts a beautiful, detailed figure just for you. With <strong>Nano Banana</strong>, the only limit is your imagination. Our tool is built on a robust AI model trained on millions of images, ensuring that every figure you generate is not only unique but also maintains the distinctive aesthetic of anime and manga art. Whether you're a professional concept artist looking for a quick prototype or a hobbyist who dreams of having a figure of your own original character, <strong>Nano Banana</strong> provides an intuitive and powerful solution. The process is simple: input your text prompt, and let the magic happen. The AI understands nuances in language, allowing you to specify intricate details, such as "a stoic samurai with a katana, wearing traditional armor with cherry blossom motifs." The result is a high-resolution, visually stunning image that looks like it could have been meticulously designed by a master artist. Beyond simple character generation, <strong>Nano Banana</strong> offers a suite of customization options, allowing you to fine-tune your creations. You can adjust lighting, background scenes, and even the art style to perfectly match your creative vision. This level of control, combined with the speed of AI generation, makes <strong>Nano Banana</strong> an invaluable tool for any creative workflow. Our mission at <strong>imagetovideo-ai</strong> is to make high-quality character creation accessible to everyone, and with the <strong>Nano Banana</strong> generator, we are doing just that. Say goodbye to creative blocks and hello to a world of endless possibilities. Start creating with <strong>Nano Banana</strong> today and see what incredible characters you can dream up.
                </p>
              </div>

              {/* H2 Section: Why Nano Banana */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Why Nano Banana is the Ultimate AI Anime Figure Generator</h2>
                
                {/* Showcase Images - 展示案例图片 */}
                <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Original Image</div>
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                      <img
                        src="/imgs/showcases/nano-banana-ultimate-ai-anime-figure-generator-original-image.webp"
                        alt="Original image example for Nano Banana AI anime figure generator - showcasing high-quality input"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Generated Anime Figure</div>
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                      <img
                        src="/imgs/showcases/nano-banana-ultimate-ai-anime-figure-generator-generated-result.webp"
                        alt="AI-generated anime figure result from Nano Banana - stunning anime character transformation"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="text-foreground leading-relaxed">
                  In a crowded market of AI art tools, <strong>Nano Banana</strong> stands out for its specialized focus and exceptional quality. Unlike general-purpose image generators, our AI model is specifically optimized for creating anime figures, understanding the unique anatomy, color palettes, and stylistic conventions of the genre. This specialization means you get results that are not just beautiful, but also authentically anime. The figures generated by <strong>Nano Banana</strong> possess a level of detail that is truly remarkable, from the folds in the fabric of their clothing to the subtle highlights in their hair. We continuously update and refine our model to keep up with the latest trends and styles in the anime world, ensuring that your creations always look modern and fresh. At <strong>imagetovideo-ai</strong>, we are committed to providing a user-friendly experience. The interface for the <strong>Nano Banana</strong> generator is clean and intuitive, making it easy for both beginners and experienced creators to get started. You don't need any technical expertise or prior experience with AI. Just type your prompt, and let the AI handle the rest. The speed of the generation process is also a major advantage. In a matter of seconds, you can have a fully rendered anime figure, allowing for rapid prototyping and idea iteration. This efficiency is a game-changer for artists on a deadline or for anyone who wants to quickly explore different design concepts. Furthermore, the high-resolution output from the <strong>Nano Banana</strong> generator is perfect for a variety of applications, whether you want to use the images for social media, print, or as a reference for your own artistic projects. Our dedication to quality and ease of use makes <strong>Nano Banana</strong> the premier choice for anyone serious about creating incredible anime figures with AI. We are proud to offer a tool that empowers creativity and helps artists of all levels achieve their goals.
                </p>
              </div>

              {/* H2 Section: Technology */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">The Technology Behind Nano Banana: A New Era of Character Creation</h2>
                
                {/* Showcase Images - 展示案例图片 */}
                <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Original Image</div>
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                      <img
                        src="/imgs/showcases/nano-banana-technology-character-creation-original-image.webp"
                        alt="Original photo example demonstrating Nano Banana AI technology capabilities"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Generated Anime Figure</div>
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                      <img
                        src="/imgs/showcases/nano-banana-technology-character-creation-generated-result.webp"
                        alt="Advanced AI-generated anime figure showcasing Nano Banana deep learning technology"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="text-foreground leading-relaxed">
                  The magic of <strong>Nano Banana</strong> is powered by a sophisticated deep learning model that has been fine-tuned for the specific task of generating anime figures. Our AI doesn't just randomly combine images; it understands the complex relationships between different elements of a character—their pose, expression, clothing, and environment. This deep understanding allows the AI to create cohesive and believable figures that feel alive. We have invested heavily in curating a massive dataset of high-quality anime art, which serves as the foundation for the <strong>Nano Banana</strong> model. This careful selection ensures that the AI learns from the best examples of the genre, resulting in superior output quality. The model can interpret a wide range of prompts, from simple descriptions to highly detailed ones, and can even handle stylistic variations. For example, you can ask for a figure in the style of a specific anime artist or a particular series. This flexibility is what makes <strong>Nano Banana</strong> a truly powerful tool for creative expression. Our <strong>imagetovideo-ai</strong> team of AI researchers and developers is constantly working on new features and improvements to the <strong>Nano Banana</strong> generator. We are exploring advanced functionalities, such as in-painting (editing specific parts of a generated image) and multi-character scenes. Our goal is to push the boundaries of what is possible with AI art and provide our users with the most advanced tools on the market. The technology is designed to be scalable, meaning we can handle a high volume of requests without compromising on speed or quality. This ensures a smooth and reliable experience for all our users. With <strong>Nano Banana</strong>, you are not just using a tool; you are tapping into the future of digital art creation. The intricate algorithms and neural networks work together seamlessly to bring your wildest character ideas to life. The efficiency and quality of <strong>Nano Banana</strong> set a new standard for AI-powered creativity, making it an essential tool for anyone in the anime and manga community.
                </p>
              </div>

              {/* H2 Section: Creative Potential */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Explore Your Creative Potential with Nano Banana and Anime Art</h2>
                
                {/* Showcase Images - 展示案例图片 */}
                <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Original Image</div>
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                      <img
                        src="/imgs/showcases/nano-banana-creative-potential-anime-art-original-image.webp"
                        alt="Creative input image for exploring anime art potential with Nano Banana generator"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Generated Anime Figure</div>
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                      <img
                        src="/imgs/showcases/nano-banana-creative-potential-anime-art-generated-result.webp"
                        alt="Creative anime figure result exploring artistic potential with Nano Banana AI generator"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="text-foreground leading-relaxed">
                  The <strong>Nano Banana</strong> generator is more than just a tool for generating images; it's a catalyst for creative exploration. It allows you to rapidly prototype ideas, test different character designs, and even generate a portfolio of unique figures. Artists can use it as a source of inspiration, generating a variety of poses or outfits that they can then refine and incorporate into their own work. The speed of generation means you can explore dozens of concepts in the time it would take to sketch a single one. This makes <strong>Nano Banana</strong> an ideal companion for brainstorming sessions. For writers and storytellers, the <strong>Nano Banana</strong> generator can help visualize characters from their stories, providing a tangible representation that can bring their narratives to life. Imagine being able to see your protagonist and antagonist standing side by side, their designs brought to life by AI. This can be a powerful way to refine character descriptions and visualize scenes. The community of creators using <strong>Nano Banana</strong> is growing every day, sharing their stunning creations and inspiring others. We encourage you to join our community forums and share your work. The collaborative spirit of the <strong>imagetovideo-ai</strong> platform makes it a great place to learn, grow, and connect with other artists. The possibilities are truly endless. You can generate figures for a TTRPG campaign, create avatars for your social media profiles, or even design characters for a personal comic or webtoon. The high-quality output from <strong>Nano Banana</strong> ensures that your creations will look professional and polished, no matter the application. Whether you're a seasoned artist or a curious newcomer, the <strong>Nano Banana</strong> generator is a gateway to a world of limitless creativity. It's time to unleash your imagination and see what amazing anime figures you can bring to life.
                </p>
              </div>

              {/* H2 Section: Game-Changer */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Nano Banana: A Game-Changer for Character Design and Anime Art</h2>
                
                {/* Showcase Images - 展示案例图片 */}
                <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Original Image</div>
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                      <img
                        src="/imgs/showcases/nano-banana-game-changer-character-design-original-image.webp"
                        alt="Character design input image showcasing Nano Banana game-changing anime art capabilities"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Generated Anime Figure</div>
                    <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10">
                      <img
                        src="/imgs/showcases/nano-banana-game-changer-character-design-generated-result.webp"
                        alt="Professional character design result from Nano Banana - game-changing anime figure generation"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="text-foreground leading-relaxed">
                  Character design is a crucial aspect of any creative project, whether it's an animation, a video game, or a comic book. The <strong>Nano Banana</strong> generator revolutionizes this process by providing a tool that can rapidly generate diverse and high-quality character concepts. Instead of spending hours sketching and refining a single design, you can generate hundreds of variations in minutes. This not only saves time but also encourages you to be more experimental and explore ideas you might not have considered otherwise. The <strong>Nano Banana</strong> model is trained on a vast array of character archetypes, from classic shonen heroes to gothic lolitas and everything in between. This broad knowledge base allows the AI to generate figures that fit a wide range of genres and styles. You can specify details like "a steampunk detective with a brass monocle" or "a magical girl with a flowing, rainbow-colored dress," and the AI will deliver a stunning result. The high-resolution images generated by <strong>Nano Banana</strong> can serve as excellent reference material for artists. You can use them to study anatomy, lighting, and color, or as a starting point for a digital painting or an illustration. The figures are rendered with such precision that they can be directly used in presentations, storyboards, and mood boards. At <strong>imagetovideo-ai</strong>, we understand the importance of having powerful and reliable tools. The <strong>Nano Banana</strong> generator is designed to be a dependable part of your creative workflow. Its speed, quality, and versatility make it an indispensable asset for character designers, illustrators, and anyone who works with visual media. We are confident that once you experience the power of <strong>Nano Banana</strong>, you'll wonder how you ever created characters without it. It truly is a game-changer for the world of anime art.
                </p>
              </div>

              {/* H2 Section: Step-by-Step Guide */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Step-by-Step Guide to Using the Nano Banana AI Generator</h2>
                <div className="text-foreground leading-relaxed space-y-4">
                  <p>Getting started with the <strong>Nano Banana</strong> generator is incredibly easy. Here's a simple guide to walk you through the process:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li><strong>Visit the ImageToVideo-AI Website:</strong> Navigate to the main <strong>Nano Banana</strong> page on <strong>imagetovideo-ai</strong>. You'll be greeted by a clean and user-friendly interface.</li>
                    <li><strong>Upload Your Image:</strong> Click the upload area or drag and drop your image file. The AI will analyze your image to understand the character you want to transform.</li>
                    <li><strong>Generate:</strong> Click the "Generate Anime Figure" button and watch as the <strong>Nano Banana</strong> AI works its magic. The process typically takes a few minutes.</li>
                    <li><strong>Review and Download:</strong> Once the image is generated, you can review it. If you're happy with the result, you can download the high-resolution image to your device. If you want to make changes, simply upload a different image and try again.</li>
                  </ol>
                  <p>We also offer a variety of pre-set styles and prompts to help you get started if you're feeling uninspired. The <strong>Nano Banana</strong> generator is designed to be a flexible and fun tool for everyone, regardless of their artistic skill level. Start your journey into AI-powered art today with <strong>Nano Banana</strong> and discover the joy of effortless character creation.</p>
                </div>
              </div>

              {/* H2 Section: Professional and Hobbyist */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Nano Banana for Professional and Hobbyist Creators</h2>
                <p className="text-foreground leading-relaxed">
                  Whether you are a professional artist, a game developer, a writer, or simply an anime enthusiast, the <strong>Nano Banana</strong> generator offers something for everyone. For professionals, it's a powerful tool for ideation and prototyping, allowing for rapid iteration of character designs. It can be integrated seamlessly into existing workflows, providing high-quality visual assets on demand. For example, a game studio can use <strong>Nano Banana</strong> to quickly generate character concepts for a new project, saving countless hours of manual design work. The high-quality output ensures that the concepts are production-ready. For hobbyists, <strong>Nano Banana</strong> is a fantastic way to bring personal projects to life. You can create unique avatars for your online profiles, design characters for a personal story, or simply enjoy the process of seeing your ideas come to life. The accessibility of the tool means that you don't need to be an expert in any software to create stunning art. The community aspect of <strong>imagetovideo-ai</strong> also provides a great platform for hobbyists to share their work, get feedback, and connect with like-minded individuals. We believe that creativity should be accessible to all, and <strong>Nano Banana</strong> is our way of making that a reality. By democratizing the process of character creation, we are empowering a new generation of artists and storytellers. The versatility and ease of use of the <strong>Nano Banana</strong> generator make it an indispensable asset for anyone with a passion for anime and a creative spirit. Join the thousands of creators who are already using <strong>Nano Banana</strong> to build their worlds, one character at a time.
                </p>
              </div>

              {/* H2 Section: Unleashing Imagination */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Nano Banana: Unleashing Your Imagination with AI-Powered Anime Art</h2>
                <p className="text-foreground leading-relaxed">
                  The fusion of AI and art has opened up a new frontier for creativity, and <strong>Nano Banana</strong> is at the forefront of this revolution. By providing a tool that can transform a simple text description into a stunning anime figure, we are removing the technical barriers that often stand in the way of creative expression. The <strong>Nano Banana</strong> generator is intuitive enough for beginners to use, yet powerful enough to meet the demands of professionals. It's a tool that grows with you, allowing you to explore more complex prompts and styles as you become more familiar with its capabilities. Our commitment at <strong>imagetovideo-ai</strong> is to create tools that are not only powerful but also ethical and responsible. We ensure that our AI models are trained on licensed datasets and that our platform is a safe space for all users. The high-quality output of the <strong>Nano Banana</strong> generator is a testament to our dedication to excellence. We believe that AI can be a powerful partner for human creativity, and <strong>Nano Banana</strong> is a prime example of this synergy. It's a tool that enhances your imagination, allowing you to bring ideas to life faster and with greater detail than ever before. Whether you're dreaming up a new character for a novel or creating a stunning visual for a personal project, <strong>Nano Banana</strong> is here to help. The future of anime art is here, and it's powered by <strong>Nano Banana</strong>.
                </p>
              </div>

              {/* FAQ Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">FAQ: Frequently Asked Questions About Nano Banana</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">What is Nano Banana?</h3>
                    <p className="text-foreground leading-relaxed">
                      <strong>Nano Banana</strong> is a specialized AI-powered anime figure generator developed by <strong>imagetovideo-ai</strong>. It uses advanced deep learning technology to create high-quality, unique anime figures from images.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">How is Nano Banana different from other AI image generators?</h3>
                    <p className="text-foreground leading-relaxed">
                      Unlike general-purpose AI tools, <strong>Nano Banana</strong> is specifically trained on anime art and character design. This specialized focus ensures that the figures it generates are stylistically accurate, detailed, and authentic to the anime genre.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Do I need any special skills to use Nano Banana?</h3>
                    <p className="text-foreground leading-relaxed">
                      No, the <strong>Nano Banana</strong> generator is designed to be user-friendly. You only need to upload an image. The AI handles all the complex artistic and technical aspects.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Is the Nano Banana service free?</h3>
                    <p className="text-foreground leading-relaxed">
                      <strong>imagetovideo-ai</strong> offers various plans for the <strong>Nano Banana</strong> generator, including a free tier for users to test the service. We also offer premium plans with more features and faster generation speeds.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Can I use the images generated by Nano Banana for commercial purposes?</h3>
                    <p className="text-foreground leading-relaxed">
                      Yes, depending on your subscription plan, you may be able to use the images for commercial projects. Please check our terms of service for more details regarding the usage rights for content generated by <strong>Nano Banana</strong>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">What kind of images work best with Nano Banana?</h3>
                    <p className="text-foreground leading-relaxed">
                      The <strong>Nano Banana</strong> AI works best with clear, well-lit images of characters or figures. The more detailed your input image, the better the AI can understand and transform it into an anime figure.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">How long does it take to generate an image with Nano Banana?</h3>
                    <p className="text-foreground leading-relaxed">
                      The <strong>Nano Banana</strong> AI is fast. Most images are generated in just a few minutes, allowing you to quickly iterate on your ideas and explore many different designs in a short amount of time.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Is there a community for Nano Banana users?</h3>
                    <p className="text-foreground leading-relaxed">
                      Yes, <strong>imagetovideo-ai</strong> has a vibrant community where users can share their creations, get inspiration, and connect with other anime and AI art enthusiasts. We encourage you to join and be a part of our creative community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

