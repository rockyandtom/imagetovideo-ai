"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

interface UploadedImage {
  file: File;
  preview: string;
}

export default function ImageToVideoClient() {
  const [firstFrame, setFirstFrame] = useState<UploadedImage | null>(null);
  const [lastFrame, setLastFrame] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);

  const firstFrameRef = useRef<HTMLInputElement>(null);
  const lastFrameRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 生成视频
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && firstFrame && prompt) {
        e.preventDefault();
        generateVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, firstFrame, prompt]);

  const handleImageUpload = (file: File, setImage: (image: UploadedImage) => void) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage({
          file,
          preview: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent, setImage: (image: UploadedImage) => void) => {
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

  const generateVideo = async () => {
    if (!firstFrame || !prompt) {
      alert("Please upload at least the first frame image and enter a prompt");
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 上传图片并获取文件名
      const imageData = await uploadImageToRunningHub(firstFrame.file);
      let lastImageData = undefined;
      
      // 如果有最后一帧图片，也上传它
      if (lastFrame) {
        lastImageData = await uploadImageToRunningHub(lastFrame.file);
      }
      
      // 调用RunningHub API开始生成视频
      const response = await fetch('/api/runninghub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          image: imageData,
          lastImage: lastImageData,
          prompt: prompt
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
        throw new Error(result.error || 'Failed to start video generation');
      }
      
    } catch (error) {
      console.error('Video generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate video, please try again";
      alert(errorMessage);
      setIsGenerating(false);
      setTaskId(null);
      setProgress(0);
      setEstimatedTime("");
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 360; // 最多轮询30分钟 (360 * 5秒 = 1800秒 = 30分钟)
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
            
            // 计算进度 (基于时间估算，前10分钟进度较快，后面较慢)
            const elapsedMinutes = (attempts * 5) / 60; // 已经过的分钟数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedMinutes < 5) {
              progressPercent = Math.min(20, elapsedMinutes * 4); // 前5分钟到20%
              timeEstimate = "Initializing and processing...";
            } else if (elapsedMinutes < 10) {
              progressPercent = 20 + Math.min(30, (elapsedMinutes - 5) * 6); // 5-10分钟到50%
              timeEstimate = "Generating video frames...";
            } else if (elapsedMinutes < 15) {
              progressPercent = 50 + Math.min(25, (elapsedMinutes - 10) * 5); // 10-15分钟到75%
              timeEstimate = "Rendering and optimizing...";
            } else if (elapsedMinutes < 25) {
              progressPercent = 75 + Math.min(15, (elapsedMinutes - 15) * 1.5); // 15-25分钟到90%
              timeEstimate = "Final processing...";
            } else {
              progressPercent = Math.min(95, 90 + (elapsedMinutes - 25) * 1); // 25分钟后到95%
              timeEstimate = "Almost done...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`Task still running, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%, message: ${result.data.message}`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('Task timeout - Video generation took longer than expected (30 minutes). Please try again.');
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
        const errorMessage = error instanceof Error ? error.message : "Failed to check video generation status";
        
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

  const UploadArea = ({ 
    image, 
    setImage, 
    title, 
    inputRef, 
    required = false 
  }: {
    image: UploadedImage | null;
    setImage: (image: UploadedImage) => void;
    title: string;
    inputRef: React.RefObject<HTMLInputElement>;
    required?: boolean;
  }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        {title}
        {required && <span className="text-red-500">*</span>}
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
        <Input
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
              alt={title}
              className="max-h-32 mx-auto rounded-md object-cover"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{image.file.name}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setImage(null as any);
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
            "name": "ImageToVideoAI",
            "description": "Free AI-powered image to video generator that transforms static images into dynamic videos instantly",
            "url": "https://imagetovideoai.com/Image-to-Video",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered image to video conversion",
              "Single image and first-last frame modes",
              "Professional video generation",
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
          {/* Page Title */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              ImageToVideoAI - Free AI Image to Video Generator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your static images into dynamic videos with ImageToVideoAI's powerful AI technology.
              Upload an image, describe the effect you want, and create professional video content instantly.
            </p>
          </div>

          {/* Main Content Area */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiVideoLine" className="w-5 h-5 text-primary" />
                Create Your Video with ImageToVideoAI
              </CardTitle>
              <CardDescription>
                Upload images and add prompts, ImageToVideoAI will generate amazing video content for you using advanced AI technology.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Image Upload Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UploadArea
                  image={firstFrame}
                  setImage={setFirstFrame}
                  title="First Frame"
                  inputRef={firstFrameRef}
                  required
                />
                
                <UploadArea
                  image={lastFrame}
                  setImage={setLastFrame}
                  title="Last Frame (Optional)"
                  inputRef={lastFrameRef}
                />
              </div>

              {/* Mode Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <Icon name="RiImageLine" className="w-4 h-4" />
                    <span className="font-medium">Single Image Mode</span>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">
                    AI automatically generates natural motion and transitions from your single image
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                    <Icon name="RiVideoLine" className="w-4 h-4" />
                    <span className="font-medium">First & Last Frame Mode</span>
                  </div>
                  <p className="text-green-600 dark:text-green-400 text-xs">
                    Precise control over start and end states for smoother, more predictable transitions
                  </p>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  Video Description Prompt
                  <span className="text-red-500">*</span>
                </h3>
                <Textarea
                  placeholder="Describe the motion you want, e.g.: character moves from left to right, leaves sway in the wind, camera slowly pushes in..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                
                {/* Quick Prompt Suggestions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Camera slowly zooms in",
                      "Gentle wind effect",
                      "Soft lighting changes",
                      "Character subtle movement",
                      "Background blur effect"
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          if (prompt) {
                            setPrompt(prompt + ", " + suggestion);
                          } else {
                            setPrompt(suggestion);
                          }
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Icon name="RiLightbulbLine" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Prompt Tips:</p>
                    <ul className="space-y-1">
                      <li>• Describe camera movements (zoom, pan, rotate)</li>
                      <li>• Mention lighting changes</li>
                      <li>• Include motion details (smooth, fast, slow)</li>
                      {lastFrame && <li>• Focus on the transition between your two frames</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={generateVideo}
                  disabled={!firstFrame || !prompt || isGenerating}
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
                      <Icon name="RiPlayLine" className="w-4 h-4 mr-2" />
                      Generate Video
                      <span className="ml-2 text-xs opacity-60">
                        (Ctrl+Enter)
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* Task Status */}
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
                        Video Generation in Progress
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
                        Using {lastFrame ? "first-last frame" : "single image"} mode
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
                          <p>• Typical: 10-15 minutes</p>
                          <p>• Maximum: up to 30 minutes</p>
                          <p className="mt-2 font-medium">Please keep this page open and be patient. Your video will appear automatically when ready.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Video Result */}
          {generatedVideo && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiVideoLine" className="w-5 h-5 text-green-600" />
                  Generated Video
                </CardTitle>
                <CardDescription>
                  Your AI-generated video is ready! You can download or share it.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-border/20 bg-muted/10 relative">
                  <video
                    src={generatedVideo}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {lastFrame ? 'First-Last Frame' : 'Single Image'}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedVideo;
                      link.download = `imagetovideoai-video-${Date.now()}.mp4`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Icon name="RiDownloadLine" className="w-4 h-4" />
                    Download Video
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'My AI Generated Video',
                          url: generatedVideo
                        });
                      } else {
                        navigator.clipboard.writeText(generatedVideo);
                        alert('Video URL copied to clipboard!');
                      }
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Icon name="RiShareLine" className="w-4 h-4" />
                    Share Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
    </>
  );
}