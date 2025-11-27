"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 视频比例选项
const aspectRatios = [
  { value: "1", label: "1:1", description: "Square" },
  { value: "2", label: "3:4", description: "Portrait" },
  { value: "3", label: "4:3", description: "Standard" },
  { value: "4", label: "9:16", description: "Vertical" },
  { value: "5", label: "16:9", description: "Widescreen" },
];

export default function TextToVideoClient() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("4"); // 默认9:16
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 根据视频比例返回对应的CSS类
  const getVideoAspectClass = (ratio: string) => {
    switch (ratio) {
      case "1": return "aspect-square min-h-[350px] max-h-[400px] w-full"; // 1:1
      case "2": return "aspect-[3/4] min-h-[400px] max-h-[480px] w-full"; // 3:4
      case "3": return "aspect-[4/3] min-h-[300px] max-h-[360px] w-full"; // 4:3
      case "4": return "aspect-[9/16] min-h-[500px] max-h-[600px] w-full"; // 9:16 (竖屏)
      case "5": return "aspect-video min-h-[280px] max-h-[320px] w-full"; // 16:9
      default: return "aspect-video min-h-[280px] max-h-[320px] w-full";
    }
  };

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 生成视频
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && prompt.trim()) {
        e.preventDefault();
        generateVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, prompt]);

  const generateVideo = async () => {
    const sessionId = Math.random().toString(36).substr(2, 9);
    console.log(`[${sessionId}] ===== Video Generation Started =====`);
    console.log(`[${sessionId}] Input:`, { 
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''), 
      aspectRatio,
      promptLength: prompt.length 
    });

    if (!prompt.trim()) {
      console.log(`[${sessionId}] Validation failed: Empty prompt`);
      toast.error("Please enter text description");
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      console.log(`[${sessionId}] Sending request to /api/runninghub/text2video`);
      // 调用RunningHub API开始生成视频
      const response = await fetch('/api/runninghub/text2video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt.trim(),
          aspectRatio: aspectRatio,
        }),
      });

      console.log(`[${sessionId}] API response status:`, response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${sessionId}] API request failed:`, errorData);
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      console.log(`[${sessionId}] API response data:`, data);
      
      if (!data.success || !data.taskId) {
        console.error(`[${sessionId}] Invalid API response:`, data);
        throw new Error(data.error || 'Failed to create task');
      }

      setTaskId(data.taskId);
      console.log(`[${sessionId}] Task created successfully. TaskId: ${data.taskId}`);
      toast.success('Video generation started!');
      
      // 开始轮询任务状态
      console.log(`[${sessionId}] Starting status polling...`);
      pollTaskStatus(data.taskId, sessionId);
      
      } catch (error) {
        console.error(`[${sessionId}] Video generation failed:`, error);
        toast.error(error instanceof Error ? error.message : 'Video generation failed, please try again later');
        setIsGenerating(false);
        setProgress(0);
        setEstimatedTime("");
      }
  };

  const pollTaskStatus = async (taskId: string, sessionId?: string) => {
    const maxAttempts = 120; // 最多轮询2分钟
    let attempts = 0;
    const logPrefix = sessionId ? `[${sessionId}]` : '[POLL]';
    
    console.log(`${logPrefix} Starting status polling for task: ${taskId}`);
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`${logPrefix} Polling attempt ${attempts}/${maxAttempts}`);
        
        const response = await fetch(`/api/runninghub/status/${taskId}`);
        console.log(`${logPrefix} Status API response status:`, response.status);
        
        if (!response.ok) {
          throw new Error('Failed to get task status');
        }
        
        const data = await response.json();
        console.log(`${logPrefix} Status API response:`, data);
        
        // Update progress
        if (data.progress !== undefined) {
          setProgress(data.progress);
          console.log(`${logPrefix} Updated progress to:`, data.progress);
        }
        
        if (data.estimatedTime) {
          setEstimatedTime(data.estimatedTime);
        }
        
        if (data.status === 'completed') {
          console.log(`${logPrefix} Task completed! Video URL:`, data.videoUrl);
          if (data.videoUrl) {
            setGeneratedVideo(data.videoUrl);
            setIsGenerating(false);
            setProgress(100);
            setEstimatedTime("Completed");
            toast.success("Video generated successfully!");
            console.log(`${logPrefix} ===== Video Generation Completed Successfully =====`);
            return;
          } else {
            console.warn(`${logPrefix} Task completed but no video URL found`);
            throw new Error('Video generation completed but no video URL received');
          }
        }
        
        if (data.status === 'failed') {
          console.error(`${logPrefix} Task failed:`, data.error);
          throw new Error(data.error || 'Generation failed');
        }
        
        // If task is still in progress, continue polling
        if (data.status === 'processing' || data.status === 'pending') {
          if (attempts < maxAttempts) {
            console.log(`${logPrefix} Task still ${data.status}, continuing to poll...`);
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else {
            console.error(`${logPrefix} Polling timeout after ${maxAttempts} attempts`);
            throw new Error('Generation timeout, please try again later');
          }
        }
        
      } catch (error) {
        console.error(`${logPrefix} Task status polling failed:`, error);
        toast.error(error instanceof Error ? error.message : 'Failed to get task status');
        setIsGenerating(false);
        setProgress(0);
        setEstimatedTime("");
      }
    };
    
    poll();
  };

  const downloadVideo = async () => {
    if (!generatedVideo) return;
    
    try {
      console.log('开始下载视频:', generatedVideo);
      
      // 使用fetch获取视频文件
      const response = await fetch(generatedVideo);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = `text-to-video-${Date.now()}.mp4`;
      link.style.display = 'none';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Video download started!');
    } catch (error) {
      console.error('下载视频失败:', error);
      toast.error('Failed to download video. Please try again.');
      
      // 如果fetch失败，回退到直接链接方式
      const link = document.createElement('a');
      link.href = generatedVideo;
      link.download = `text-to-video-${Date.now()}.mp4`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
            "name": "AI Text to Video Generator",
            "description": "Advanced AI-powered text to video generator that transforms descriptive text prompts into stunning AI-generated videos",
            "url": "https://imagetovideo-ai.net/text-to-video",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered text to video conversion",
              "Multiple aspect ratio options (1:1, 3:4, 4:3, 9:16, 16:9)",
              "High-quality video generation",
              "Professional AI video creation",
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
        <div className="px-16 sm:px-20 lg:px-24 xl:px-32 py-8">
      {/* Page Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Free AI Text to Video Generator - Best AI Video Creator
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Transform your <strong>text descriptions</strong> into stunning <strong>AI-generated videos</strong> instantly! 
          No registration required, supports multiple aspect ratios, and creates professional videos in minutes.
        </p>
      </div>

      {/* Text to Video Tools Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Available Text to Video Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sora 2 AI Video Generator Card */}
          <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/text-to-video/sora-2-ai-video-generator'}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icon name="RiVideoLine" className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Sora 2 AI Video Generator</CardTitle>
              </div>
              <CardDescription>
                Transform your text prompts into cinematic videos with the Sora 2 AI Video Generator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Professional video generation</span>
                <Icon name="RiArrowRightLine" className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>

          {/* Z Image Card */}
          <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/text-to-video/z-image'}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Icon name="RiImageAddLine" className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Z Image</CardTitle>
              </div>
              <CardDescription>
                Generate high-fidelity images using Alibaba's open-source Z Image AI model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI image generation</span>
                <Icon name="RiArrowRightLine" className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-1 gap-8">
        {/* Left Workspace */}
        <div className="xl:col-span-3 lg:col-span-1 space-y-6">
          {/* Text Input Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiEditLine" className="h-5 w-5" />
                Text Description
              </CardTitle>
              <CardDescription>
                Describe in detail the video content you want to generate, including scenes, actions, style, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Example: Cinematic photography style, an oriental warrior in gorgeous robes, slowly wielding a sword, the blade gleaming in sunlight, transitioning to an ancient bamboo forest, gentle breeze moving the leaves, sunlight filtering through gaps creating spots of light, the scene filled with soft warm yellow tones..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none cursor-text relative z-10"
                  maxLength={1000}
                  disabled={isGenerating}
                  style={{ pointerEvents: 'auto' }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                <span>Supports English descriptions, recommended 50-500 characters</span>
                <span>{prompt.length}/1000</span>
              </div>
            </CardContent>
          </Card>

          {/* Video Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiSettings3Line" className="h-5 w-5" />
                Video Settings
              </CardTitle>
              <CardDescription>
                Choose the aspect ratio for your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Video Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select video aspect ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{ratio.label}</span>
                            <span className="text-muted-foreground text-sm">({ratio.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={generateVideo}
                disabled={isGenerating || !prompt.trim()}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Icon name="RiLoader4Line" className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon name="RiVideoLine" className="h-5 w-5 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
              
              {isGenerating && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Generation Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  {estimatedTime && (
                    <p className="text-sm text-muted-foreground text-center">
                      {estimatedTime}
                    </p>
                  )}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Shortcut: Ctrl/Cmd + Enter
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Preview Area */}
        <div className="xl:col-span-2 lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiPlayLine" className="h-5 w-5" />
                Video Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`bg-muted rounded-lg flex items-center justify-center relative overflow-hidden ${
                generatedVideo 
                  ? getVideoAspectClass(aspectRatio)
                  : 'aspect-video min-h-[280px] max-h-[320px] w-full'
              }`}>
                {generatedVideo ? (
                  <video
                    src={generatedVideo}
                    controls
                    className="w-full h-full object-contain rounded-lg"
                    preload="metadata"
                  >
                    Your browser does not support video playback
                  </video>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Icon name="RiVideoLine" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Video will appear here</p>
                  </div>
                )}
              </div>
              
              {generatedVideo && (
                <div className="mt-4 space-y-2">
                  <Button onClick={downloadVideo} className="w-full" variant="outline">
                    <Icon name="RiDownloadLine" className="h-4 w-4 mr-2" />
                    Download Video
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiLightbulbLine" className="h-5 w-5" />
                Usage Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Icon name="RiCheckLine" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Be specific and vivid in descriptions, include scenes, actions, and style details</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="RiCheckLine" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You can specify photography styles like "cinematic style" or "realistic photography"</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="RiCheckLine" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Recommended description length is 50-500 characters</span>
              </div>
              <div className="flex items-start gap-2">
                <Icon name="RiCheckLine" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Generation time is typically 1-3 minutes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 内容区域 - 基于JSON文件的内容 */}
      <div className="px-16 sm:px-20 lg:px-24 xl:px-32 mt-16 space-y-16">
        {/* Main Title Section */}
        <Card>
          <CardHeader>
            <CardTitle>Unlock Creative Potential with AI Text to Video Technology</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
              {/* 左侧文字 */}
              <div className="order-2 lg:order-1 prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Welcome to imagetovideo-ai, the pioneering platform dedicated to revolutionizing content creation through advanced <strong>AI text to video</strong> capabilities. In the modern digital landscape, video is king, and speed is paramount. Our tool is engineered to bridge the gap between imagination and execution, allowing creators, marketers, and businesses to convert mere words—scripts, blog posts, articles, or simple ideas—into high-quality, engaging video content within minutes.
                </p>
              </div>
              {/* 右侧图片 */}
              <div className="order-1 lg:order-2">
                <div className="relative overflow-hidden rounded-xl shadow-lg w-4/5 mx-auto">
                  <img
                    src="/imgs/showcases/ai-text-to-video-creative-potential-showcase.webp"
                    alt="AI text to video technology unlocking creative potential for content creators"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Choose AI Text to Video */}
        <Card>
          <CardHeader>
            <CardTitle>The Evolution of Content: Why Choose AI Text to Video?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
              {/* 左侧图片 */}
              <div className="order-2 lg:order-1">
                <div className="relative overflow-hidden rounded-xl shadow-lg w-4/5 mx-auto">
                  <img
                    src="/imgs/showcases/content-evolution-text-to-video-advantages.webp"
                    alt="Content evolution showing advantages of AI text to video technology"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              {/* 右侧文字和卡片 */}
              <div className="order-1 lg:order-2 space-y-6">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    The shift towards video consumption is undeniable, yet traditional video production remains a significant barrier for many. The <strong>AI text to video</strong> paradigm addresses this bottleneck head-on. Our technology analyzes your input text for context, sentiment, and key themes, then automatically sources, generates, and stitches together relevant visuals, animations, voiceovers, and background music.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    This process drastically reduces time-to-market for video content, making it possible to produce daily videos for social media, explainer content for products, or internal communication updates effortlessly. The precision of imagetovideo-ai's AI ensures that the resulting video is not only visually appealing but also contextually faithful to the original text.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Icon name="RiTimeLine" className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <h3 className="font-semibold mb-1">Fast Production</h3>
                      <p className="text-sm text-muted-foreground">Videos in minutes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Icon name="RiAiGenerate" className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <h3 className="font-semibold mb-1">AI Powered</h3>
                      <p className="text-sm text-muted-foreground">Smart content understanding</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Icon name="RiHdLine" className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <h3 className="font-semibold mb-1">Professional Quality</h3>
                      <p className="text-sm text-muted-foreground">HD video output</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Icon name="RiGlobalLine" className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <h3 className="font-semibold mb-1">Multilingual</h3>
                      <p className="text-sm text-muted-foreground">Global support</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features of the imagetovideo-ai Text to Video Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
              {/* 左侧功能卡片 */}
              <div className="order-2 lg:order-1 grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="RiBrainLine" className="h-6 w-6 text-blue-500" />
                      Smart NLP Engine
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Advanced Natural Language Processing engine that deeply understands the semantics, emotions, and key themes of text content, ensuring video content highly matches text descriptions.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="RiImageLine" className="h-6 w-6 text-purple-500" />
                      Rich Media Library
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Vast library of high-resolution assets and AI-generated resources, including diverse visual elements, animation effects, and background music.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="RiVoiceprintLine" className="h-6 w-6 text-green-500" />
                      Smart Voice Synthesis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      State-of-the-art text-to-speech engine offering diverse, natural-sounding voiceover options, supporting multiple languages and tones.
                    </p>
                  </CardContent>
                </Card>
              </div>
              {/* 右侧图片 */}
              <div className="order-1 lg:order-2">
                <div className="relative overflow-hidden rounded-xl shadow-lg w-4/5 mx-auto">
                  <img
                    src="/imgs/showcases/text-to-video-platform-key-features-overview.webp"
                    alt="Key features overview of imagetovideo-ai text to video platform"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow */}
        <Card>
          <CardHeader>
            <CardTitle>How imagetovideo-ai Simplifies the Text to Video Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
              {/* 左侧图片 */}
              <div className="order-2 lg:order-1">
                <div className="relative overflow-hidden rounded-xl shadow-lg w-4/5 mx-auto">
                  <img
                    src="/imgs/showcases/simplified-text-to-video-workflow-process.webp"
                    alt="Simplified text to video workflow process from input to output"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              {/* 右侧工作流程步骤 */}
              <div className="order-1 lg:order-2 space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Input Your Text</h3>
                    <p className="text-muted-foreground">
                      Paste your script, article, or bullet points into our editor. Our AI immediately analyzes the content's semantics and emotions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-purple-600">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Customize and Preview</h3>
                    <p className="text-muted-foreground">
                      The system automatically generates a draft video, segmenting your text into scenes. You can easily adjust visuals, choose voiceover, and select background music.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Generate and Download</h3>
                    <p className="text-muted-foreground">
                      With one click, the final high-definition video is rendered and ready for download or direct sharing to major platforms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions on AI Text to Video Generation</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What exactly is AI text to video?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI text to video is a technology that uses Artificial Intelligence and Natural Language Processing (NLP) to analyze written text and automatically generate a complete video, including visuals, audio, and animations, that accurately represents the content of the input text.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is the quality of AI-generated text to video high enough for professional use?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes. imagetovideo-ai utilizes advanced deep learning models to ensure the generated text to video content is of professional, high-definition quality, featuring contextually relevant visuals, cinematic transitions, and natural-sounding voiceovers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How long does it take to create a video using imagetovideo-ai?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  One of the biggest advantages of our text to video platform is speed. Depending on the length of your script, most videos can be generated and ready for final download in just a few minutes, drastically cutting down traditional production time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I customize the visuals and voiceover in the text to video result?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. While the AI provides a strong initial draft, you have full control to customize media, select different voice actors, change background music, and apply branding elements to your final text to video project.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What kind of text input is best for the text to video generator?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The system handles various inputs, but well-structured scripts, detailed articles, or clear bullet points work best. The clearer your text, the more precise the text to video AI can be in selecting and generating relevant visuals.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is imagetovideo-ai's text to video service multilingual?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, our AI text to video platform supports multiple languages for both text input analysis and voiceover generation, enabling you to create localized content for a global audience effortlessly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do I need any video editing skills to use the text to video tool?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No. The platform is designed to be highly intuitive. The text to video AI handles all the complex editing, meaning you can create professional videos without any prior knowledge of video production software.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does imagetovideo-ai ensure the visuals match the text content?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our proprietary NLP model analyzes the semantic meaning, emotional tone, and key entities within your text. It then uses this data to search and generate the most contextually relevant visuals from its vast library, making the text to video connection highly accurate.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SEO Content Area */}
        <div className="space-y-8 mt-16">
          {/* What is AI Text to Video Technology */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              What is AI Text to Video Technology? Understanding imagetovideo-ai's Innovation
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Revolutionary AI Video Generation Technology</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p>
                      <strong>AI text to video</strong> represents the cutting edge of artificial intelligence, where sophisticated 
                      machine learning models transform written descriptions into dynamic, high-quality video content. 
                      imagetovideo-ai leverages advanced diffusion models and temporal coherence algorithms to create 
                      videos that perfectly match your textual input.
                    </p>
                    <p>
                      Our <strong>text to video generator</strong> doesn't simply animate static images—it understands 
                      context, motion, lighting, and narrative flow to produce cinematic-quality videos that bring 
                      your words to life with unprecedented accuracy and visual appeal.
                    </p>
                  </div>
                  <div>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
                      <h3 className="font-semibold text-lg mb-4">Key Features:</h3>
                      <ul className="space-y-2 text-sm">
                        <li>✅ <strong>5 Aspect Ratios</strong> (1:1, 3:4, 4:3, 9:16, 16:9)</li>
                        <li>✅ <strong>Professional Quality</strong> HD video output</li>
                        <li>✅ <strong>Fast Generation</strong> in 3-8 minutes</li>
                        <li>✅ <strong>No Watermarks</strong> on generated videos</li>
                        <li>✅ <strong>Commercial License</strong> included</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Video Generator Comparison */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              imagetovideo-ai vs Other AI Video Generators: Why We Lead the Market
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Comprehensive AI Video Generator Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg text-primary mb-2">imagetovideo-ai</h3>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <ul className="text-sm space-y-2 text-left">
                          <li>✅ <strong>Completely Free</strong> text to video</li>
                          <li>✅ <strong>No Registration</strong> required</li>
                          <li>✅ <strong>5 Aspect Ratios</strong> supported</li>
                          <li>✅ <strong>HD Quality</strong> video output</li>
                          <li>✅ <strong>Commercial License</strong> included</li>
                          <li>✅ <strong>No Watermarks</strong></li>
                          <li>✅ <strong>3-8 Minutes</strong> generation time</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg text-muted-foreground mb-2">Runway ML</h3>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <ul className="text-sm space-y-2 text-left">
                          <li>❌ <strong>$12-76/month</strong> subscription</li>
                          <li>❌ Registration required</li>
                          <li>⚠️ Limited aspect ratios</li>
                          <li>⚠️ Watermarked videos (free)</li>
                          <li>⚠️ Limited commercial rights</li>
                          <li>❌ Usage credits system</li>
                          <li>⚠️ Queue waiting times</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg text-muted-foreground mb-2">Pika Labs</h3>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <ul className="text-sm space-y-2 text-left">
                          <li>❌ <strong>$10-70/month</strong> subscription</li>
                          <li>❌ Discord-based interface</li>
                          <li>⚠️ Fixed 16:9 aspect ratio</li>
                          <li>⚠️ 3-second video limit (free)</li>
                          <li>⚠️ Community-based generation</li>
                          <li>❌ No direct download</li>
                          <li>⚠️ Inconsistent quality</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">
                    Why imagetovideo-ai is the Best Free AI Video Generator?
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    As the only platform offering <strong>completely free text to video generation</strong> with 
                    <strong>professional HD quality</strong> and <strong>no watermarks</strong>, imagetovideo-ai 
                    democratizes AI video creation. Our advanced algorithms ensure consistent, high-quality results 
                    that rival expensive commercial platforms, making professional video creation accessible to everyone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Video Generation Use Cases */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              AI Text to Video Use Cases: Transform Your Content Strategy
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Professional Applications for AI Video Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-primary mb-2">Social Media Marketing</h4>
                      <p className="text-sm text-muted-foreground">
                        Create engaging <strong>AI-generated videos</strong> for Instagram, TikTok, and YouTube. 
                        Transform product descriptions into compelling video ads that drive engagement and conversions.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-primary mb-2">Educational Content</h4>
                      <p className="text-sm text-muted-foreground">
                        Convert lesson plans and educational materials into dynamic video content. 
                        Make complex concepts visual and engaging for better student comprehension.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-primary mb-2">Content Creation</h4>
                      <p className="text-sm text-muted-foreground">
                        Transform blog posts, articles, and stories into captivating video content. 
                        Expand your content reach across multiple platforms and formats.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-primary mb-2">Business Presentations</h4>
                      <p className="text-sm text-muted-foreground">
                        Create professional presentation videos from meeting notes and business concepts. 
                        Enhance corporate communication with visually appealing video content.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-primary mb-2">Creative Projects</h4>
                      <p className="text-sm text-muted-foreground">
                        Bring creative writing, poetry, and artistic concepts to life through 
                        <strong>AI video generation</strong>. Perfect for artists, writers, and creative professionals.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-primary mb-2">Product Demonstrations</h4>
                      <p className="text-sm text-muted-foreground">
                        Generate product demo videos from feature descriptions. 
                        Create compelling visual narratives that showcase your products effectively.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              Frequently Asked Questions: Everything About AI Text to Video Generation
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Common Questions About AI Video Generation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h4 className="font-semibold mb-2">How does AI text to video generation work?</h4>
                    <p className="text-sm text-muted-foreground">
                      Our <strong>AI text to video generator</strong> uses advanced machine learning models to analyze your text description, 
                      understand the context, visual elements, and motion requirements, then generates a corresponding video 
                      that matches your description with high accuracy and visual quality.
                    </p>
                  </div>
                  
                  <div className="border-b border-border pb-4">
                    <h4 className="font-semibold mb-2">Is imagetovideo-ai really free to use?</h4>
                    <p className="text-sm text-muted-foreground">
                      Yes! imagetovideo-ai offers completely <strong>free AI video generation</strong> with no hidden costs, 
                      no watermarks, and no registration requirements. You can create professional-quality videos 
                      instantly without any payment or subscription.
                    </p>
                  </div>
                  
                  <div className="border-b border-border pb-4">
                    <h4 className="font-semibold mb-2">What video formats and quality does the AI generator support?</h4>
                    <p className="text-sm text-muted-foreground">
                      Our <strong>text to video generator</strong> produces high-definition MP4 videos in multiple aspect ratios 
                      (1:1, 3:4, 4:3, 9:16, 16:9) suitable for all social media platforms, presentations, and professional use.
                    </p>
                  </div>
                  
                  <div className="border-b border-border pb-4">
                    <h4 className="font-semibold mb-2">How long does it take to generate a video from text?</h4>
                    <p className="text-sm text-muted-foreground">
                      Video generation typically takes 3-8 minutes depending on complexity and current server load. 
                      Our optimized infrastructure ensures fast processing while maintaining high video quality.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Can I use the generated videos for commercial purposes?</h4>
                    <p className="text-sm text-muted-foreground">
                      Absolutely! All videos generated through imagetovideo-ai come with full commercial usage rights. 
                      You can use them for marketing, advertising, social media, presentations, and any business purposes 
                      without additional licensing fees.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
      </div>
    </div>
    </>
  );
}
