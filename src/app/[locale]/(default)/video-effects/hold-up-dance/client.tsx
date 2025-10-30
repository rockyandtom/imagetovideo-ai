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

export default function HoldUpDanceClient() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 下载视频函数
  const downloadVideo = async (videoUrl: string) => {
    setIsDownloading(true);
    try {
      console.log('Starting video download for:', videoUrl);
      
      // 方法1: 尝试使用 fetch 下载
      const response = await fetch(videoUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hold-up-dance-${Date.now()}.mp4`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理 URL 对象
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Video download completed successfully');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Video download failed:', error);
      
      // 方法2: 如果 fetch 失败，尝试使用代理下载
      try {
        const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(videoUrl)}`;
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = `hold-up-dance-${Date.now()}.mp4`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Proxy video download initiated');
      } catch (proxyError) {
        console.error('Proxy video download failed:', proxyError);
        
        // 方法3: 最后的备选方案 - 在新窗口打开
        window.open(videoUrl, '_blank');
        alert('Direct download failed. The video has been opened in a new tab. You can right-click and save it.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 生成视频
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && uploadedImage) {
        e.preventDefault();
        generateVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, uploadedImage]);

  // 处理图片上传
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

  // 处理拖拽上传
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

  // 生成Hold Up Dance视频
  const generateVideo = async () => {
    if (!uploadedImage) {
      alert("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 上传图片并获取文件名
      const imageData = await uploadImageToRunningHub(uploadedImage.file);
      
      // 调用RunningHub API开始生成Hold Up Dance视频
      const response = await fetch('/api/runninghub-hold-up-dance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imageData
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
        throw new Error(result.error || 'Failed to start Hold Up Dance generation');
      }
      
    } catch (error) {
      console.error('Hold Up Dance generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate Hold Up Dance video, please try again";
      alert(errorMessage);
      setIsGenerating(false);
      setTaskId(null);
      setProgress(0);
      setEstimatedTime("");
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 360; // 最多轮询30分钟
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
          if (result.data.status === 'completed' && result.data.videoUrl) {
            console.log('Task completed, video URL:', result.data.videoUrl);
            
            setGeneratedVideo(result.data.videoUrl);
            setIsGenerating(false);
            setTaskId(null);
            return;
          } else if (result.data.status === 'running') {
            attempts++;
            
            // 计算进度
            const elapsedMinutes = (attempts * 5) / 60;
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedMinutes < 5) {
              progressPercent = Math.min(20, elapsedMinutes * 4);
              timeEstimate = "Processing Hold Up Dance...";
            } else if (elapsedMinutes < 10) {
              progressPercent = 20 + Math.min(30, (elapsedMinutes - 5) * 6);
              timeEstimate = "Generating dance movements...";
            } else if (elapsedMinutes < 15) {
              progressPercent = 50 + Math.min(25, (elapsedMinutes - 10) * 5);
              timeEstimate = "Rendering Hold Up Dance video...";
            } else if (elapsedMinutes < 25) {
              progressPercent = 75 + Math.min(15, (elapsedMinutes - 15) * 1.5);
              timeEstimate = "Final processing...";
            } else {
              progressPercent = Math.min(95, 90 + (elapsedMinutes - 25) * 1);
              timeEstimate = "Almost done...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000);
            } else {
              throw new Error('Task timeout - Hold Up Dance generation took longer than expected (30 minutes). Please try again.');
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
        const errorMessage = error instanceof Error ? error.message : "Failed to check Hold Up Dance generation status";
        
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
        throw new Error(`Failed to upload image to RunningHub: ${response.status}`);
      }

      const result = await response.json();
      console.log('RunningHub upload result:', result);
      
      if (!result.success || !result.fileId) {
        throw new Error('No file ID returned from RunningHub upload');
      }
      
      return result.fileId;
    } catch (error) {
      console.error('RunningHub upload error:', error);
      throw error;
    }
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Hold Up Dance AI Generator",
            "description": "Transform images into dynamic Hold Up Dance videos with AI-powered generation",
            "url": "https://imagetovideoai.com/video-effects/hold-up-dance",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered Hold Up Dance generation",
              "Image to video conversion",
              "Professional video effects",
              "Free to use",
              "No registration required"
            ],
            "creator": {
              "@type": "Organization",
              "name": "ImageToVideoAI"
            }
          })
        }}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Transform Your Vision into a 
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {" "}Hold Up Dance
                </span>
                {" "}Masterpiece with AI
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Welcome to imagetovideo-ai, your ultimate destination for innovative AI-powered creative tools. 
                Create stunning Hold Up Dance visuals with unparalleled ease and speed.
              </p>
            </div>

            {/* Main Workspace */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiDanceLine" className="w-5 h-5 text-primary" />
                  Hold Up Dance Generator
                </CardTitle>
                <CardDescription>
                  Upload an image and our AI will transform it into a dynamic Hold Up Dance video with the iconic pose and movement.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Upload and Preview Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Image Upload Area */}
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
                        uploadedImage ? "border-primary bg-primary/10" : "border-muted-foreground/25",
                        "min-h-[400px] flex items-center justify-center"
                      )}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                      
                      {uploadedImage ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={uploadedImage.preview}
                            alt="Uploaded image"
                            className="max-h-48 mx-auto rounded-lg object-cover shadow-md"
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

                  {/* Video Preview Area */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Hold Up Dance Video Preview
                    </h3>
                    <div className="relative border-2 border-dashed rounded-lg p-4 transition-colors border-muted-foreground/25 min-h-[400px] flex items-center justify-center">
                      {generatedVideo ? (
                        <div className="space-y-4 w-full">
                          <video
                            src={generatedVideo}
                            className="w-full h-auto max-h-80 mx-auto rounded-lg shadow-lg"
                            controls
                            playsInline
                            preload="metadata"
                          />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">Your Hold Up Dance video is ready!</p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <Button
                                onClick={() => downloadVideo(generatedVideo)}
                                disabled={isDownloading}
                                size="sm"
                                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
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
                                      title: 'My Hold Up Dance Video',
                                      url: generatedVideo
                                    });
                                  } else {
                                    navigator.clipboard.writeText(generatedVideo);
                                    alert('Video URL copied to clipboard!');
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
                            <Icon name="RiVideoLine" className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Generated Hold Up Dance video will be displayed here
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
                    onClick={generateVideo}
                    disabled={!uploadedImage || isGenerating}
                    className="px-8 py-3 text-base font-medium bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin mr-2" />
                        {taskId ? 'Generating Hold Up Dance...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="RiPlayLine" className="w-4 h-4 mr-2" />
                        Generate Hold Up Dance Video
                        <span className="ml-2 text-xs opacity-60">
                          (Ctrl+Enter)
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Display */}
                {taskId && isGenerating && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                      <Icon name="RiInformationLine" className="w-4 h-4" />
                      <span className="text-sm font-medium">Task ID: {taskId}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Hold Up Dance Generation in Progress
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
                          Creating Hold Up Dance video from your image
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
                            <p>• Typical: 3-10 minutes</p>
                            <p>• Maximum: up to 15 minutes</p>
                            <p className="mt-2 font-medium">Please keep this page open. Your Hold Up Dance video will appear automatically when ready.</p>
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
                <p>generatedVideo: {generatedVideo ? 'SET' : 'NULL'}</p>
                <p>isGenerating: {isGenerating ? 'TRUE' : 'FALSE'}</p>
                <p>taskId: {taskId || 'NULL'}</p>
                <p>uploadedImage: {uploadedImage ? 'SET' : 'NULL'}</p>
              </div>
            )}

            {/* Content Sections */}
            <div className="space-y-12">
              {/* Why Use AI Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-center">Why Use AI to Generate the Hold Up Dance?</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p>
                    The <strong>Hold Up Dance</strong> is more than just a simple gesture; it's a powerful statement of emotion and style. 
                    The pose, characterized by hands raised in a recognizable gesture of surrender or celebration, is a staple in music, 
                    film, and popular culture. Yet, creating a perfect visual representation can be a challenge.
                  </p>
                  <p>
                    Sourcing the right models, setting up a photo shoot, and capturing the perfect moment is both time-consuming and expensive. 
                    Our AI provides a revolutionary alternative. It's trained on vast datasets, allowing it to understand the nuances of the 
                    <strong> Hold Up Dance</strong> and generate a new, unique image from scratch.
                  </p>
                </div>
              </section>

              {/* Technology Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-center">The Technology Behind the Perfect Hold Up Dance Image</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p>
                    At imagetovideo-ai, we leverage state-of-the-art AI models, including diffusion and transformer networks, 
                    to power our image generation engine. When you input a prompt, such as 'futuristic <strong>Hold Up Dance</strong> with glowing tattoos,' 
                    our AI doesn't just search a database; it constructs a new image pixel by pixel.
                  </p>
                  <p>
                    This generative process ensures that every creation is a unique piece of art. We have meticulously fine-tuned our models 
                    to handle complex human poses and detailed environments, making the generation of a realistic and expressive 
                    <strong> Hold Up Dance</strong> a core capability.
                  </p>
                </div>
              </section>

              {/* Customization Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-center">Customizing Your Hold Up Dance Creations</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p>
                    One of the most exciting aspects of using imagetovideo-ai is the incredible level of customization available for your 
                    <strong> Hold Up Dance</strong> images. You are the director of your own visual narrative. You can specify the subject's 
                    gender, age, clothing, and even emotional expression.
                  </p>
                  <p>
                    The environment is also fully customizable. Imagine a 'dramatic <strong>Hold Up Dance</strong> on a foggy mountaintop' 
                    or a 'joyful <strong>Hold Up Dance</strong> at a vibrant music festival.' You can also choose from a wide range of 
                    artistic styles, including 'oil painting,' 'digital art,' 'anime,' and 'photorealistic.'
                  </p>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="space-y-6">
                <h2 className="text-3xl font-bold text-center">FAQ: Your Questions About the Hold Up Dance and Our AI</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What is the Hold Up Dance?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        The <strong>Hold Up Dance</strong> is a widely recognized and culturally significant pose where a person raises 
                        their hands in the air, often in a gesture of celebration, surrender, or a mix of both. It's a popular subject 
                        for artistic expression due to its strong visual and emotional impact.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">How does imagetovideo-ai generate a Hold Up Dance image?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Our platform uses advanced AI models that interpret your text prompts. The AI synthesizes a new, original image 
                        from scratch, understanding the core elements of the <strong>Hold Up Dance</strong> and incorporating all the 
                        details you've specified, such as style, environment, and lighting.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Can I customize the images of the Hold Up Dance?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Yes, our platform offers extensive customization options. You can use detailed text prompts to describe the exact 
                        image you want, including the style, mood, and elements. You can also use advanced settings to fine-tune the 
                        final result for a perfect <strong>Hold Up Dance</strong> image.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">What is the quality of the generated Hold Up Dance images?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Our AI models are trained to produce high-resolution, professional-grade images. The quality is suitable for a 
                        wide range of applications, from digital art and social media content to commercial projects that require sharp, 
                        detailed visuals of the <strong>Hold Up Dance</strong>.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
