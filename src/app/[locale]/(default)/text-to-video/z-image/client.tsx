"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 图片比例选项 - 根据 API fieldData 解析
const ASPECT_RATIOS = [
  { value: "1:1 square 1024x1024", label: "1:1 Square", description: "1024x1024" },
  { value: "3:4 portrait 896x1152", label: "3:4 Portrait", description: "896x1152" },
  { value: "5:8 portrait 832x1216", label: "5:8 Portrait", description: "832x1216" },
  { value: "9:16 portrait 768x1344", label: "9:16 Portrait", description: "768x1344" },
  { value: "9:21 portrait 640x1536", label: "9:21 Portrait", description: "640x1536" },
  { value: "4:3 landscape 1152x896", label: "4:3 Landscape", description: "1152x896" },
  { value: "3:2 landscape 1216x832", label: "3:2 Landscape", description: "1216x832" },
  { value: "16:9 landscape 1344x768", label: "16:9 Landscape", description: "1344x768" },
  { value: "21:9 landscape 1536x640", label: "21:9 Landscape", description: "1536x640" },
];

interface GeneratedImage {
  imageUrl: string;
  taskId: string;
}

export default function ZImageClient() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9 landscape 1344x768");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 生成图片
  const handleImageGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a text description");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 调用 RunningHub API 开始生成图片
      const response = await fetch('/api/runninghub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'z-image',
          webappId: "1993968205018447874",
          apiKey: "fb88fac46b0349c1986c9cbb4f14d44e",
          nodeInfoList: [
            {
              nodeId: "6",
              fieldName: "text",
              fieldValue: prompt.trim(),
              description: "text"
            },
            {
              nodeId: "11",
              fieldName: "aspect_ratio",
              fieldData: JSON.stringify([["custom", "1:1 square 1024x1024", "3:4 portrait 896x1152", "5:8 portrait 832x1216", "9:16 portrait 768x1344", "9:21 portrait 640x1536", "4:3 landscape 1152x896", "3:2 landscape 1216x832", "16:9 landscape 1344x768", "21:9 landscape 1536x640"]]),
              fieldValue: aspectRatio,
              description: "aspect_ratio"
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
        throw new Error(result.error || 'Image generation failed');
      }
      
    } catch (error) {
      console.error('Image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Image generation failed, please try again";
      toast.error(errorMessage);
      setIsGenerating(false);
      setTaskId(null);
      setProgress(0);
      setEstimatedTime("");
    }
  };

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 生成图片
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && prompt.trim()) {
        e.preventDefault();
        handleImageGenerate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, prompt, aspectRatio]);

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
            
            setGeneratedImage({
              imageUrl: result.data.imageUrl,
              taskId: taskId
            });
            setIsGenerating(false);
            setTaskId(null);
            setProgress(100);
            setEstimatedTime("Completed");
            toast.success("Image generated successfully!");
            return;
          } else if (result.data.status === 'running' || result.data.status === 'processing' || result.data.status === 'pending') {
            attempts++;
            
            // 计算进度 (基于时间估算)
            const elapsedMinutes = (attempts * 5) / 60; // 已经过的分钟数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedMinutes < 1) {
              progressPercent = Math.min(20, elapsedMinutes * 20); // First 1 minute to 20%
              timeEstimate = "Processing prompt...";
            } else if (elapsedMinutes < 2) {
              progressPercent = 20 + Math.min(40, (elapsedMinutes - 1) * 40); // 1-2 minutes to 60%
              timeEstimate = "Generating image...";
            } else if (elapsedMinutes < 3) {
              progressPercent = 60 + Math.min(30, (elapsedMinutes - 2) * 30); // 2-3 minutes to 90%
              timeEstimate = "Refining details...";
            } else {
              progressPercent = Math.min(95, 90 + (elapsedMinutes - 3) * 2.5); // After 3 minutes to 95%
              timeEstimate = "Almost done...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`Task still running, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('Task timeout - Image generation took longer than expected (10 minutes). Please try again.');
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
        const errorMessage = error instanceof Error ? error.message : "Failed to check image generation status";
        
        // Auto retry if network error and retry count is less than 3
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

  // 下载图片
  const handleDownload = async () => {
    if (!generatedImage || isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Fetch the image as blob to force download
      const response = await fetch(generatedImage.imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Determine file extension from blob type or URL
      let fileExtension = 'png';
      if (blob.type.includes('jpeg') || blob.type.includes('jpg')) {
        fileExtension = 'jpg';
      } else if (blob.type.includes('webp')) {
        fileExtension = 'webp';
      } else if (blob.type.includes('gif')) {
        fileExtension = 'gif';
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `z-image-${Date.now()}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
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
                Z Image: Unlocking the Future of 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Open-Source AI Visual Generation
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                In the rapidly evolving landscape of artificial intelligence, the introduction of <strong>z image</strong> marks a pivotal moment for creators, developers, and digital artists worldwide. As Alibaba's newly open-sourced AI image model, <strong>z image</strong> is designed to push the boundaries of visual fidelity, semantic understanding, and generative speed.
              </p>
            </div>

            {/* Main Workspace - 参考 qwen-image-edit 布局 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiImageAddLine" className="w-5 h-5 text-primary" />
                  Z Image Generation Workspace
                </CardTitle>
                <CardDescription>
                  Enter your text description and select an aspect ratio. Z Image will generate high-quality images using advanced AI technology.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Workspace Grid - 左侧输入，右侧预览 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Side: Input Controls */}
                  <div className="space-y-6">
                    {/* Text Input */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        Text Description
                        <span className="text-red-500">*</span>
                      </h3>
                      <Textarea
                        placeholder="Describe the image you want to generate, e.g.: A cyberpunk street scene, neon-lit streets, wet pavement, cinematic lighting, highly detailed, 8k resolution..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[120px] resize-none"
                        disabled={isGenerating}
                      />
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Icon name="RiLightbulbLine" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">Prompt Tips:</p>
                          <ul className="space-y-1">
                            <li>• Start with the subject, followed by style and details</li>
                            <li>• Be specific about colors, lighting, and composition</li>
                            <li>• Include technical terms like "8k resolution" or "highly detailed"</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Aspect Ratio Selection */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        Aspect Ratio
                      </h3>
                      <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isGenerating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIOS.map((ratio) => (
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

                    {/* Generate Button */}
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleImageGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="px-8 py-3 text-base font-medium w-full"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin mr-2" />
                            {taskId ? 'Generating...' : 'Starting...'}
                          </>
                        ) : (
                          <>
                            <Icon name="RiMagicLine" className="w-4 h-4 mr-2" />
                            Generate Image
                            <span className="ml-2 text-xs opacity-60">
                              (Ctrl+Enter)
                            </span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    {isGenerating && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Generating Image...
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
                              Using Z Image Technology
                            </span>
                            <span className="text-blue-500 dark:text-blue-400 font-medium">
                              {estimatedTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Image Preview */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Image Preview</h3>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                      {generatedImage ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={generatedImage.imageUrl}
                            alt="Generated by Z Image"
                            className="max-h-96 mx-auto rounded-md object-contain w-full"
                          />
                          <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Generation Completed</p>
                            <Button
                              onClick={handleDownload}
                              size="sm"
                              variant="default"
                              disabled={isDownloading}
                              className="w-full"
                            >
                              {isDownloading ? (
                                <>
                                  <Icon name="RiLoader4Line" className="w-4 h-4 mr-1 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Icon name="RiDownloadLine" className="w-4 h-4 mr-1" />
                                  Download Image
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Icon name="RiImageLine" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Generated image will be displayed here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Sections based on JSON */}
            <div className="mt-16 space-y-12">
              {/* Introduction Section */}
              <Card className="p-8">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: `
                    <p>In the rapidly evolving landscape of artificial intelligence, the introduction of <strong>z image</strong> marks a pivotal moment for creators, developers, and digital artists worldwide. As Alibaba's newly open-sourced AI image model, <strong>z image</strong> is designed to push the boundaries of visual fidelity, semantic understanding, and generative speed. At ImageToVideo-AI, we are thrilled to integrate this powerful tool into our ecosystem, allowing users to harness the raw power of the <strong>z image</strong> architecture to create stunning base visuals that serve as the perfect foundation for video transformation.</p>
                    <p>The release of <strong>z image</strong> represents a significant leap forward in the democratization of high-end generative AI. Unlike closed systems that limit user control, the open-source nature of <strong>z image</strong> fosters a community of innovation, allowing for continuous improvements and specialized fine-tuning. Whether you are looking to generate photorealistic landscapes, complex character designs, or abstract art, <strong>z image</strong> provides the robust neural network capabilities necessary to turn text prompts into pixel-perfect reality. By leveraging the <strong>z image</strong> model, users can experience a level of detail and coherence that was previously reserved for proprietary enterprise solutions.</p>
                    <p>Throughout this comprehensive guide, we will explore the technical nuances of <strong>z image</strong>, its seamless integration into image-to-video workflows, and why <strong>z image</strong> is rapidly becoming the preferred choice for AI enthusiasts. Join us as we dive deep into the capabilities of <strong>z image</strong> and discover how it is redefining the standards of digital creativity.</p>
                  ` }} />
                </div>
              </Card>

              {/* Section: Understanding the Core Technology */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Understanding the Core Technology Behind Z Image</h2>
                  <p className="text-muted-foreground">Advanced diffusion architecture for superior image generation</p>
                </div>
                <Card className="p-8">
                  <div className="prose prose-slate dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: `
                    <p>At its heart, <strong>z image</strong> utilizes a sophisticated diffusion architecture that differentiates it from earlier generative models. The researchers at Alibaba have engineered <strong>z image</strong> to optimize the balance between computational efficiency and output quality. When we analyze the technical specifications of <strong>z image</strong>, we see a model that has been trained on a massive, diverse dataset, enabling it to understand nuanced cultural references and complex prompt structures. The <strong>z image</strong> framework employs an advanced latent space processing technique, which allows <strong>z image</strong> to interpret text descriptions with remarkable accuracy.</p>
                    <p>One of the standout features of <strong>z image</strong> is its attention mechanism. In traditional models, losing focus on peripheral details is common, but <strong>z image</strong> maintains global coherence across the entire canvas. This means that background textures, lighting consistency, and spatial relationships are handled with precision by the <strong>z image</strong> algorithms. For developers utilizing the open-source code, <strong>z image</strong> offers a modular design, making it easier to implement custom adapters or LoRA (Low-Rank Adaptation) layers on top of the base <strong>z image</strong> weights. This flexibility is what makes <strong>z image</strong> a versatile powerhouse in the AI industry.</p>
                    <p>Furthermore, the <strong>z image</strong> training pipeline incorporated reinforcement learning from human feedback (RLHF) to align the model's outputs with human aesthetic preferences. This ensures that the images generated by <strong>z image</strong> are not only technically correct but also visually pleasing. By reducing artifacts and enhancing distinct details, <strong>z image</strong> sets a new benchmark for open-source visual models.</p>
                  ` }} />
                  
                  {/* Showcase Image */}
                  <div className="mt-8">
                    <div className="relative rounded-lg overflow-hidden border border-border/20 bg-muted/10 group">
                      <img
                        src="/imgs/showcases/z-image-core-technology-diffusion-architecture-generated-result-example-1.webp"
                        alt="Z Image core technology diffusion architecture showcase - demonstrating advanced AI image generation capabilities with sophisticated diffusion models"
                        className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Section: How Z Image Revolutionizes Workflow */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">How Z Image Revolutionizes the Image-to-Video Workflow</h2>
                  <p className="text-muted-foreground">Seamless integration for enhanced video generation</p>
                </div>
                <Card className="p-8">
                  <div className="prose prose-slate dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: `
                    <p>On our platform, ImageToVideo-AI, the quality of the input image is the single most critical factor in determining the quality of the final video output. This is where <strong>z image</strong> becomes an indispensable asset. By using <strong>z image</strong> to generate your initial static assets, you ensure that the source material has the high resolution and structural integrity required for animation. <strong>z image</strong> excels at generating consistent character features, which is crucial when an AI video generator attempts to simulate movement.</p>
                    <p>When you start your workflow with <strong>z image</strong>, you reduce the 'shimmering' and warping effects often seen in low-quality AI video generation. <strong>z image</strong> creates a stable foundation. For example, if you are creating a cinematic sequence, <strong>z image</strong> can generate a photorealistic scene with accurate lighting maps. When this <strong>z image</strong> output is fed into a video synthesis model, the motion estimation algorithms have a cleaner reference point. Consequently, the transition from a static <strong>z image</strong> creation to a dynamic video is smoother and more realistic.</p>
                    <p>Moreover, the speed of <strong>z image</strong> allows for rapid iteration. Users can generate dozens of variations using <strong>z image</strong> in minutes, select the best candidate, and immediately proceed to video animation. This tight integration of <strong>z image</strong> into the creative pipeline significantly reduces production time. Whether you are a marketer creating social media reels or a filmmaker prototyping scenes, the combination of <strong>z image</strong> generation and video animation tools creates a seamless, high-efficiency workflow.</p>
                  ` }} />
                  
                  {/* Showcase Image */}
                  <div className="mt-8">
                    <div className="relative rounded-lg overflow-hidden border border-border/20 bg-muted/10 group">
                      <img
                        src="/imgs/showcases/z-image-image-to-video-workflow-seamless-integration-generated-result-example-2.webp"
                        alt="Z Image image-to-video workflow seamless integration showcase - demonstrating how Z Image generates high-quality base images for smooth video transformation"
                        className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Section: Key Features */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Key Features that Set Z Image Apart from Competitors</h2>
                  <p className="text-muted-foreground">Why Z Image stands out in the AI image generation market</p>
                </div>
                <Card className="p-8">
                  <div className="prose prose-slate dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: `
                    <p>In a crowded market of AI models, <strong>z image</strong> distinguishes itself through several key features. Firstly, the semantic adherence of <strong>z image</strong> is superior to many existing open-source alternatives. When a user inputs a complex prompt with multiple subjects and descriptive modifiers, <strong>z image</strong> successfully renders all elements without bleeding concepts together. This 'prompt loyalty' makes <strong>z image</strong> a favorite among professional prompters who demand precision.</p>
                    <p>Secondly, <strong>z image</strong> boasts exceptional handling of text rendering within images. While many models struggle to generate legible text, <strong>z image</strong> has been trained to recognize and reproduce glyphs more accurately. This makes <strong>z image</strong> particularly useful for creating posters, book covers, and marketing materials where typography integration is essential. Additionally, <strong>z image</strong> supports a wide range of aspect ratios natively, without the need for cropping or outpainting, giving users complete compositional control.</p>
                    <p>Another competitive advantage of <strong>z image</strong> is its optimized resource consumption. Alibaba developers have fine-tuned <strong>z image</strong> to run efficiently on consumer-grade GPUs, democratizing access to high-end AI art. You do not need a supercomputer to run <strong>z image</strong> locally or via cloud APIs. This efficiency does not come at the cost of quality; <strong>z image</strong> consistently scores high on aesthetic evaluation metrics, proving that <strong>z image</strong> is both lightweight and heavy-hitting in terms of performance.</p>
                  ` }} />
                  
                  {/* Showcase Image */}
                  <div className="mt-8">
                    <div className="relative rounded-lg overflow-hidden border border-border/20 bg-muted/10 group">
                      <img
                        src="/imgs/showcases/z-image-key-features-semantic-adherence-generated-result-example-3.webp"
                        alt="Z Image key features semantic adherence showcase - demonstrating superior prompt understanding and precise element rendering capabilities"
                        className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Section: Step-by-Step Guide */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Step-by-Step Guide to Using Z Image on Our Platform</h2>
                  <p className="text-muted-foreground">Simple and intuitive workflow for creating stunning images</p>
                </div>
                <Card className="p-8">
                  <div className="prose prose-slate dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: `
                    <p>Getting started with <strong>z image</strong> on ImageToVideo-AI is a straightforward process designed for user ease. First, navigate to the generation panel and select <strong>z image</strong> as your core model. Because <strong>z image</strong> is integrated directly into our backend, there is no need for complex installations. Simply type your prompt into the text box. We recommend being descriptive, as <strong>z image</strong> thrives on detailed instructions.</p>
                    <p>Once your prompt is ready, you can adjust specific <strong>z image</strong> parameters such as the guidance scale (CFG) and sampling steps. A higher step count with <strong>z image</strong> typically yields more detailed textures, while the guidance scale controls how strictly <strong>z image</strong> adheres to your prompt. After configuring these settings, hit 'Generate'. The <strong>z image</strong> engine will process your request and deliver a high-resolution image in seconds.</p>
                    <p>After the <strong>z image</strong> result is generated, you have the option to refine it. You can use the <strong>z image</strong> in-painting tool to correct small details or use the <strong>z image</strong> variation feature to explore different artistic styles. Once you are satisfied with the <strong>z image</strong> creation, simply click the 'Animate' button to transfer this asset to our video generation pipeline. This seamless transition highlights the utility of using <strong>z image</strong> within a unified ecosystem.</p>
                  ` }} />
                  
                  {/* Showcase Image */}
                  <div className="mt-8">
                    <div className="relative rounded-lg overflow-hidden border border-border/20 bg-muted/10 group">
                      <img
                        src="/imgs/showcases/z-image-step-by-step-guide-platform-usage-generated-result-example-4.webp"
                        alt="Z Image step-by-step guide platform usage showcase - demonstrating easy-to-use interface and seamless workflow for image generation"
                        className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Section: The Architecture and Technical Specs */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">The Architecture and Technical Specs of Z Image</h2>
                  <p className="text-muted-foreground">Deep dive into the technical foundation of Z Image</p>
                </div>
                <Card className="p-8">
                  <div className="prose prose-slate dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: `
                    <p>Delving deeper into the technicalities, <strong>z image</strong> is built upon a massive transformer-based diffusion backbone. The parameter count of <strong>z image</strong> allows it to store an immense amount of visual knowledge. Alibaba has released <strong>z image</strong> in various sizes to cater to different hardware constraints, but the core <strong>z image</strong> architecture remains consistent across versions. The model utilizes a multi-stage denoising process, where <strong>z image</strong> iteratively refines random noise into a coherent image.</p>
                    <p>The training data for <strong>z image</strong> underwent rigorous filtering to ensure high aesthetic quality and safety. The <strong>z image</strong> tokenizer is capable of processing long-context prompts, allowing for storytelling-style inputs. Furthermore, <strong>z image</strong> implements an advanced Variational Autoencoder (VAE) which is responsible for compressing and decompressing images. The <strong>z image</strong> VAE is particularly good at decoding fine details like hair strands and skin textures, which often look blurry in lesser models.</p>
                    <p>For developers interested in fine-tuning, <strong>z image</strong> is compatible with standard training scripts. The <strong>z image</strong> weights are structured to be easily adaptable, meaning the community can build specialized versions of <strong>z image</strong> for anime, photorealism, or architectural visualization. This technical robustness ensures that <strong>z image</strong> is not just a toy, but a professional-grade development platform.</p>
                  ` }} />
                  
                  {/* Showcase Image */}
                  <div className="mt-8">
                    <div className="relative rounded-lg overflow-hidden border border-border/20 bg-muted/10 group">
                      <img
                        src="/imgs/showcases/z-image-architecture-technical-specs-transformer-diffusion-generated-result-example-5.webp"
                        alt="Z Image architecture technical specs transformer diffusion showcase - demonstrating advanced transformer-based diffusion architecture and technical capabilities"
                        className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* FAQ Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Frequently Asked Questions About Z Image (FAQ)</h2>
                  <p className="text-muted-foreground">Common questions and answers about Z Image</p>
                </div>
                <Card className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">1. What exactly is the z image model?</h3>
                      <p className="text-muted-foreground"><strong>z image</strong> is a cutting-edge AI image generation model recently open-sourced by Alibaba. It utilizes advanced diffusion technology to create high-quality images from text descriptions. The <strong>z image</strong> model is known for its semantic accuracy and visual fidelity.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">2. Is z image free to use for personal projects?</h3>
                      <p className="text-muted-foreground">Yes, as an open-source model, the core code of <strong>z image</strong> is available for public use. On our platform, we offer free and premium tiers to access <strong>z image</strong> via our optimized cloud infrastructure, making <strong>z image</strong> accessible to everyone.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">3. How does z image compare to other models like Midjourney?</h3>
                      <p className="text-muted-foreground">While Midjourney is a closed source service, <strong>z image</strong> provides transparency and customizability due to its open-source nature. Many users find that <strong>z image</strong> offers comparable image quality with greater control over the generation pipeline.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">4. Can I use images generated by z image for commercial purposes?</h3>
                      <p className="text-muted-foreground">Generally, yes. The open-source license for <strong>z image</strong> typically allows for commercial use, but you should always check the specific licensing terms of the <strong>z image</strong> release. Content generated on our platform using <strong>z image</strong> belongs to you.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">5. What makes z image better for video generation workflows?</h3>
                      <p className="text-muted-foreground"><strong>z image</strong> generates highly coherent and structurally sound images. This stability is crucial when the image is used as a frame for video generation, preventing the 'wobble' often seen when animating lower-quality inputs. <strong>z image</strong> provides the best starting point.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">6. Do I need a powerful computer to run z image?</h3>
                      <p className="text-muted-foreground">If running locally, <strong>z image</strong> requires a GPU with significant VRAM. However, by using <strong>z image</strong> through ImageToVideo-AI, you do not need any special hardware; our cloud servers handle the heavy lifting for the <strong>z image</strong> processing.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">7. Does z image support different aspect ratios?</h3>
                      <p className="text-muted-foreground">Absolutely. <strong>z image</strong> can generate images in various aspect ratios, including 16:9, 9:16, and 1:1. This flexibility ensures that <strong>z image</strong> outputs are ready for any platform, from YouTube to TikTok.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">8. How often is the z image model updated?</h3>
                      <p className="text-muted-foreground">Since <strong>z image</strong> is backed by Alibaba and an open-source community, updates are frequent. We ensure that our platform is always running the latest, most stable version of <strong>z image</strong> so you have access to the newest features immediately.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
