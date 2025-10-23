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
    <div className="container py-8">
      {/* Page Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Text to Video Generator
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Enter your text description and AI will generate stunning video content for you
        </p>
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
      <div className="mt-16 space-y-16">
        {/* Main Title Section */}
        <section className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            Unlock Creative Potential with AI Text to Video Technology
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Welcome to imagetovideo-ai, the pioneering platform dedicated to revolutionizing content creation through advanced <strong>AI text to video</strong> capabilities. In the modern digital landscape, video is king, and speed is paramount. Our tool is engineered to bridge the gap between imagination and execution, allowing creators, marketers, and businesses to convert mere words—scripts, blog posts, articles, or simple ideas—into high-quality, engaging video content within minutes.
          </p>
        </section>

        {/* Why Choose AI Text to Video */}
        <section className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">The Evolution of Content: Why Choose AI Text to Video?</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
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
        </section>

        {/* Key Features */}
        <section className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Key Features of the imagetovideo-ai Text to Video Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        </section>

        {/* Workflow */}
        <section className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">How imagetovideo-ai Simplifies the Text to Video Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Input Your Text</h3>
              <p className="text-muted-foreground">
                Paste your script, article, or bullet points into our editor. Our AI immediately analyzes the content's semantics and emotions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Customize and Preview</h3>
              <p className="text-muted-foreground">
                The system automatically generates a draft video, segmenting your text into scenes. You can easily adjust visuals, choose voiceover, and select background music.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Generate and Download</h3>
              <p className="text-muted-foreground">
                With one click, the final high-definition video is rendered and ready for download or direct sharing to major platforms.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto">
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
      </div>
    </div>
  );
}
