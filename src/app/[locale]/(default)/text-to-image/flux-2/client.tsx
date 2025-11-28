"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

// Flux 2 图片比例选项，基于API文档
const ASPECT_RATIOS = [
  { value: "custom", label: "Custom", description: "Custom aspect ratio" },
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

export default function Flux2Client() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("4:3 landscape 1152x896");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 生成图片
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && prompt.trim()) {
        e.preventDefault();
        generateImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, prompt]);

  const generateImage = async () => {
    if (!prompt.trim()) {
      alert("Please enter a text description to generate an image");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 调用 Flux 2 API
      const response = await fetch('/api/runninghub/flux-2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          prompt: prompt.trim(),
          aspectRatio: aspectRatio
        })
      });

      const result = await response.json();
      console.log('Flux 2 API Response:', result);
      
      if (result.success && result.data.taskId) {
        setTaskId(result.data.taskId);
        // 开始轮询任务状态
        pollTaskStatus(result.data.taskId);
      } else {
        console.error('API Error:', result);
        // 提供更友好的错误信息
        let errorMessage = result.error || 'Failed to start image generation';
        
        // 如果是队列已满的错误，提供更详细的提示
        if (result.error && result.error.includes('queue is full')) {
          errorMessage = 'The server is currently busy processing many requests. Please wait a moment and try again.';
        } else if (result.code === 421) {
          errorMessage = 'Task queue is full. Please try again in a few moments.';
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('Image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Image generation failed, please try again";
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
        const response = await fetch('/api/runninghub/flux-2', {
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
            return;
          } else if (result.data.status === 'running') {
            attempts++;
            
            // 计算进度 (基于时间估算)
            const elapsedMinutes = (attempts * 5) / 60; // 已经过的分钟数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedMinutes < 2) {
              progressPercent = Math.min(30, elapsedMinutes * 15); // 前2分钟到30%
              timeEstimate = "Processing text description...";
            } else if (elapsedMinutes < 5) {
              progressPercent = 30 + Math.min(40, (elapsedMinutes - 2) * 13.3); // 2-5分钟到70%
              timeEstimate = "Generating image...";
            } else if (elapsedMinutes < 8) {
              progressPercent = 70 + Math.min(20, (elapsedMinutes - 5) * 6.7); // 5-8分钟到90%
              timeEstimate = "Optimizing image quality...";
            } else {
              progressPercent = Math.min(95, 90 + (elapsedMinutes - 8) * 2.5); // 8分钟后到95%
              timeEstimate = "Almost done...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`Task still running, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('Task timeout - Image generation exceeded expected time (10 minutes). Please try again.');
            }
          } else {
            console.error('Unexpected status:', result.data.status);
            throw new Error(result.data.message || `Unexpected status: ${result.data.status}`);
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
        
        alert(errorMessage);
        setIsGenerating(false);
        setTaskId(null);
        setProgress(0);
        setEstimatedTime("");
      }
    };

    checkStatus();
  };

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
      link.download = `flux-2-generated-${Date.now()}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Flux 2 AI Image Generator",
            "description": "Advanced AI-powered text to image generator using Flux 2 model for hyper-realistic image generation",
            "url": "https://imagetovideo-ai.net/text-to-image/flux-2",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Flux 2 AI-powered text to image conversion",
              "Multiple aspect ratio options",
              "High-quality hyper-realistic image generation",
              "Open-source AI model",
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
          <div className="space-y-8">
            {/* 页面标题 */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Unleash Creativity with the Flux 2 AI Image Generator
              </h1>
              <div 
                className="text-lg text-muted-foreground max-w-3xl mx-auto prose prose-slate dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: `<p>In the rapidly evolving landscape of artificial intelligence, the arrival of <strong>Flux 2</strong> marks a pivotal moment for digital artists, developers, and content creators worldwide. At <strong>imagetovideo-ai</strong>, we are proud to integrate this cutting-edge technology into our platform, offering users unprecedented control over AI image generation. <strong>Flux 2</strong> is not just an update; it is a transformative open-source model that redefines the boundaries of prompt adherence, visual fidelity, and text rendering capability.</p>`
                }}
              />
            </div>

            {/* 主要工作区 - 第一个 Section */}
            <section>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="RiImageLine" className="w-5 h-5 text-primary" />
                    Flux 2 Generation Workspace
                  </CardTitle>
                  <CardDescription>
                    Enter a detailed description and select your preferred aspect ratio to generate stunning AI images with Flux 2.
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
                          placeholder="A photorealistic Shiba Inu wearing a small red bow tie, sitting on a vintage leather armchair in a library, cinematic lighting, golden hour, detailed fur texture, warm atmosphere..."
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
                              <li>• Be specific and detailed in your descriptions</li>
                              <li>• Include artistic style (e.g., 'photorealistic,' 'digital art,' 'oil painting')</li>
                              <li>• Specify lighting and mood (e.g., 'cinematic lighting,' 'golden hour')</li>
                              <li>• Mention composition and framing preferences</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Aspect Ratio Selection */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground">
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
                          onClick={generateImage}
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
                                Generating Image with Flux 2...
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
                                Aspect Ratio: {ASPECT_RATIOS.find(r => r.value === aspectRatio)?.label || aspectRatio}
                              </span>
                              <span className="text-blue-500 dark:text-blue-400 font-medium">
                                {estimatedTime}
                              </span>
                            </div>
                            
                            {taskId && (
                              <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-md">
                                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                  <Icon name="RiInformationLine" className="w-4 h-4" />
                                  <span>Task ID: {taskId}</span>
                                </div>
                              </div>
                            )}
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
                              alt="Generated by Flux 2"
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
            </section>

            {/* 内容区域 - 基于 JSON 文件内容 */}
            <div className="space-y-8 mt-16">
              {/* Introduction Section */}
              <section>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{
                    __html: `<p>As the successor to previous iterations, <strong>Flux 2</strong> addresses the core challenges faced by generative AI users. Whether you are looking to create photorealistic portraits, complex architectural renders, or stylized fantasy art, <strong>Flux 2</strong> delivers results with startling accuracy. By leveraging the computational power of <strong>imagetovideo-ai</strong>, you can access the full potential of <strong>Flux 2</strong> without the need for expensive local hardware. This comprehensive guide will explore why <strong>Flux 2</strong> is the new standard in the industry, how it integrates with tools like <strong>ComfyUI</strong> and <strong>Flux Dev</strong>, and how you can start creating masterpieces today using our intuitive interface.</p>`
                  }} />
                </div>
              </section>

              {/* Content Sections from JSON */}
              {[
                {
                  h2: "What Makes Flux 2 the Ultimate AI Image Generation Model?",
                  body: "<p>The release of <strong>Flux 2</strong> has sent shockwaves through the AI community, and for good reason. Unlike its predecessors, <strong>Flux 2</strong> is built on a highly refined architecture that significantly increases the parameter count while optimizing inference efficiency. This means that <strong>Flux 2</strong> can understand complex, multi-layered prompts with a level of nuance that was previously unattainable. When you use <strong>Flux 2</strong> on <strong>imagetovideo-ai</strong>, you are tapping into a system designed for precision.</p><p>One of the standout features of <strong>Flux 2</strong> is its enhanced dynamic range and color accuracy. Many earlier models struggled with lighting consistency or texture details, but <strong>Flux 2</strong> excels in generating images that feel organic and grounded in reality. Furthermore, <strong>Flux 2</strong> boasts improved spatial awareness. When you ask <strong>Flux 2</strong> to place an object \"to the left of a red chair under a window,\" it adheres to these spatial instructions with rigorous fidelity. This makes <strong>Flux 2</strong> an indispensable tool for storyboard artists and concept designers who require exact composition.</p><p>Additionally, the open-source nature of <strong>Flux 2</strong> encourages a vibrant ecosystem of fine-tunes and adaptations. However, using the base <strong>Flux 2</strong> model provided by <strong>imagetovideo-ai</strong> ensures you are getting the purest, most versatile form of this technology. The <strong>Flux 2</strong> model creates a bridge between human imagination and digital realization, making it the ultimate choice for modern creators.</p>",
                  image: "/imgs/showcases/flux-2-ultimate-ai-image-generation-model-showcase-example.webp",
                  imageAlt: "Flux 2 AI image generation model showcase - demonstrating ultimate precision and visual fidelity in hyper-realistic image creation"
                },
                {
                  h2: "How Flux 2 Revolutionizes Text-to-Image Synthesis",
                  body: "<p>Text-to-image synthesis has always been about the struggle between the user's intent and the model's interpretation. <strong>Flux 2</strong> revolutionizes this dynamic by incorporating advanced natural language processing (NLP) capabilities directly into its diffusion process. When you input a prompt into <strong>Flux 2</strong>, the model deconstructs the semantic meaning of every word, ensuring that adjectives, verbs, and nouns are all given appropriate weight. This results in <strong>Flux 2</strong> generations that are remarkably true to the prompt.</p><p>A critical area where <strong>Flux 2</strong> outperforms competitors is in text rendering within images. Previous models often generated gibberish when asked to display signs, logos, or book titles. <strong>Flux 2</strong>, however, has been trained on a massive dataset that includes typography, allowing <strong>Flux 2</strong> to render legible and stylistically correct text embedded within the artwork. This feature alone makes <strong>Flux 2</strong> a game-changer for graphic designers creating marketing materials via <strong>imagetovideo-ai</strong>.</p><p>Moreover, <strong>Flux 2</strong> introduces a more stable diffusion process that reduces artifacts and \"hallucinations\"—unwanted elements that appear in generated images. The stability of <strong>Flux 2</strong> ensures that hands, fingers, and architectural lines are rendered correctly. By utilizing <strong>Flux 2</strong> through our platform, you benefit from these advancements instantly. The revolution brought by <strong>Flux 2</strong> is not just about better pixels; it's about a deeper understanding of visual semantics.</p>",
                  image: "/imgs/showcases/flux-2-revolutionizes-text-to-image-synthesis-showcase-example.webp",
                  imageAlt: "Flux 2 text-to-image synthesis revolution - showcasing advanced NLP capabilities and accurate text rendering within generated images"
                },
                {
                  h2: "Integrating Flux 2 with ComfyUI for Advanced Workflows",
                  body: "<p>For power users and technical artists, the compatibility of <strong>Flux 2</strong> with <strong>ComfyUI</strong> is a significant advantage. <strong>ComfyUI</strong> is a node-based interface that allows for granular control over the image generation pipeline. When combining <strong>Flux 2</strong> with <strong>ComfyUI</strong>, users can manipulate every stage of the generation process, from the initial noise injection to the final upscaling. <strong>Flux 2</strong> thrives in this environment because its architecture is transparent and modular.</p><p>Using <strong>Flux 2</strong> inside <strong>ComfyUI</strong> workflows allows for advanced techniques like ControlNet integration and img2img transformations. You can build a <strong>ComfyUI</strong> workflow that utilizes the <strong>Flux 2</strong> checkpoint to generate a base image, and then refine specific regions using high-res fix nodes. The synergy between <strong>Flux 2</strong> and <strong>ComfyUI</strong> unlocks capabilities such as consistent character generation across multiple poses, a feature highly sought after by comic book creators and game developers.</p><p>At <strong>imagetovideo-ai</strong>, we recognize the power of this combination. While our platform offers a streamlined interface, understanding the mechanics of <strong>Flux 2</strong> in a <strong>ComfyUI</strong> context helps users appreciate the robustness of the model. <strong>Flux 2</strong> is optimized to handle the complex conditioning that <strong>ComfyUI</strong> nodes provide, ensuring that even the most convoluted node trees result in coherent and stunning <strong>Flux 2</strong> outputs. If you are a developer, the <strong>Flux 2</strong> and <strong>ComfyUI</strong> pairing is the gold standard for automated image pipelines.</p>",
                  image: "/imgs/showcases/flux-2-comfyui-advanced-workflows-integration-showcase-example.webp",
                  imageAlt: "Flux 2 and ComfyUI integration showcase - demonstrating advanced node-based workflows and granular control over image generation pipeline"
                },
                {
                  h2: "The Differences Between Flux 2 and Flux Dev Models",
                  body: "<p>Navigating the ecosystem of new AI models can be confusing, especially when terms like <strong>Flux Dev</strong> and <strong>Flux 2</strong> are used. It is essential to understand the distinction to choose the right tool for your project. Generally, <strong>Flux 2</strong> refers to the fully trained, stable release intended for general public use and production environments. In contrast, <strong>Flux Dev</strong> often refers to a developmental branch or a distilled version of the model released for research, testing, or non-commercial optimization.</p><p>The <strong>Flux 2</strong> model hosted on <strong>imagetovideo-ai</strong> is the production-ready version, optimized for reliability and highest quality output. <strong>Flux Dev</strong>, while powerful, may sometimes prioritize speed or experimental features over the supreme consistency found in the main <strong>Flux 2</strong> release. Developers often use <strong>Flux Dev</strong> to test new quantization methods or fine-tuning techniques before applying them to the robust <strong>Flux 2</strong> architecture.</p><p>However, the lineage is shared. <strong>Flux 2</strong> benefits from the innovations tested in <strong>Flux Dev</strong>. When you use <strong>Flux 2</strong>, you are utilizing the culmination of rigorous testing. For most users on <strong>imagetovideo-ai</strong>, the standard <strong>Flux 2</strong> is the superior choice because it guarantees the best balance of prompt adherence and visual fidelity. While <strong>Flux Dev</strong> is excellent for those who want to tinker with the weights, <strong>Flux 2</strong> is the engine built for creators who demand results. Understanding the relationship between <strong>Flux Dev</strong> and <strong>Flux 2</strong> helps you appreciate the stability of the tools we provide.</p>",
                  image: "/imgs/showcases/flux-2-differences-flux-dev-models-showcase-example.webp",
                  imageAlt: "Flux 2 vs Flux Dev models comparison showcase - highlighting production-ready stability and reliability of Flux 2 AI image generation"
                },
                {
                  h2: "Why Choose imagetovideo-ai for Your Flux 2 Creations?",
                  body: "<p>While <strong>Flux 2</strong> is an open-source model that can be run locally, the hardware requirements are steep. Running <strong>Flux 2</strong> at full precision requires a high-end GPU with significant VRAM. This is where <strong>imagetovideo-ai</strong> steps in as the ideal solution. We host <strong>Flux 2</strong> on enterprise-grade servers, allowing you to generate professional-grade images from any device, be it a laptop, tablet, or smartphone. Our platform is optimized specifically for <strong>Flux 2</strong> inference speed.</p><p>Beyond hardware access, <strong>imagetovideo-ai</strong> offers a user experience tailored to the strengths of <strong>Flux 2</strong>. We have fine-tuned our user interface to expose the specific parameters that make <strong>Flux 2</strong> shine, such as guidance scale and step count adjustments. We also ensure that the version of <strong>Flux 2</strong> we run is always the latest patched version, saving you the hassle of constant updates.</p><p>Furthermore, <strong>imagetovideo-ai</strong> provides a gallery and community features where you can see what others are creating with <strong>Flux 2</strong>. You can remix prompts, learn from successful <strong>Flux 2</strong> workflows, and store your high-resolution generations securely. Choosing <strong>imagetovideo-ai</strong> means you are choosing the most accessible, fast, and community-driven way to experience the power of <strong>Flux 2</strong>.</p>"
                },
                {
                  h2: "Step-by-Step Guide to Using Our Flux 2 Online Tool",
                  body: "<p>Getting started with <strong>Flux 2</strong> on <strong>imagetovideo-ai</strong> is a seamless process. First, navigate to the creation dashboard. You will see a text box prominently displayed; this is where the magic of <strong>Flux 2</strong> begins. Enter a descriptive prompt. Remember, <strong>Flux 2</strong> excels with natural language, so be descriptive. Instead of just \"cat,\" try \"a fluffy Siamese cat sitting on a velvet sofa, cinematic lighting, 8k resolution, shot on 35mm lens.\" The more detail you provide, the better <strong>Flux 2</strong> can visualize your concept.</p><p>Next, adjust your settings. <strong>Flux 2</strong> offers various aspect ratios. Select the one that fits your needs, whether it's 16:9 for wallpapers or 9:16 for social media. You can also adjust the 'Guidance Scale.' A standard setting works well, but increasing it forces <strong>Flux 2</strong> to adhere more strictly to your prompt. Once you are ready, hit the 'Generate' button. Our powerful servers will process your request through the <strong>Flux 2</strong> model.</p><p>Within seconds, <strong>Flux 2</strong> will render your image. You can then upscale it, download it, or refine the prompt to generate a new variation. The iterative process is fast on <strong>imagetovideo-ai</strong>, allowing you to perfect your <strong>Flux 2</strong> artwork efficiently. Experimenting with different styles—from anime to photorealism—is the best way to learn the capabilities of <strong>Flux 2</strong>.</p>"
                },
                {
                  h2: "The Future of Generative Art with Flux 2 Technology",
                  body: "<p>The launch of <strong>Flux 2</strong> is not the end of the road; it is a new beginning. As we look to the future, <strong>Flux 2</strong> technology sets the stage for even more immersive media. The consistency provided by <strong>Flux 2</strong> is already being adapted for video generation workflows, bridging the gap between static images and motion—a core mission of <strong>imagetovideo-ai</strong>. We anticipate that <strong>Flux 2</strong> will serve as the foundational layer for upcoming text-to-video models.</p><p>We also expect to see <strong>Flux 2</strong> integrated into real-time rendering engines for gaming and virtual reality. The speed and quality of <strong>Flux 2</strong> make it a viable candidate for generating assets on the fly. Furthermore, the community surrounding <strong>Flux 2</strong> is rapidly developing Low-Rank Adaptation (LoRA) models, allowing <strong>Flux 2</strong> to be trained on specific styles or characters with minimal data.</p><p>At <strong>imagetovideo-ai</strong>, we are committed to staying at the forefront of this evolution. As <strong>Flux 2</strong> evolves, our platform will evolve with it, ensuring that our users always have access to the absolute cutting edge of AI generation. <strong>Flux 2</strong> is driving the democratization of high-end digital art, and the future looks incredibly bright for creators who master <strong>Flux 2</strong> today.</p>"
                },
                {
                  h2: "Frequently Asked Questions About Flux 2",
                  body: "<ul><li><strong>What is Flux 2?</strong><br><strong>Flux 2</strong> is a state-of-the-art, open-source AI image generation model known for its high prompt adherence, photorealism, and ability to render text accurately within images.</li><li><strong>Is Flux 2 free to use on imagetovideo-ai?</strong><br>Yes, <strong>imagetovideo-ai</strong> allows users to generate images using <strong>Flux 2</strong> with free daily credits, making high-end AI art accessible to everyone.</li><li><strong>How does Flux 2 compare to Midjourney?</strong><br><strong>Flux 2</strong> offers comparable, if not superior, photorealism and better text rendering than many competitors. Additionally, as an open model, <strong>Flux 2</strong> offers more control over the generation process.</li><li><strong>Can I use Flux 2 for commercial purposes?</strong><br>Yes, images generated with <strong>Flux 2</strong> on our platform can generally be used for commercial projects, but always check the specific licensing terms provided on <strong>imagetovideo-ai</strong>.</li><li><strong>Does Flux 2 support text rendering?</strong><br>Absolutely. One of the major upgrades in <strong>Flux 2</strong> is its ability to correctly spell words and render typography within the generated image based on your prompt.</li><li><strong>What is the difference between Flux 2 and Flux Dev?</strong><br><strong>Flux 2</strong> is the stable, production-ready release, whereas <strong>Flux Dev</strong> typically refers to open-weight versions used for development, research, and technical fine-tuning.</li><li><strong>Do I need a powerful GPU to use Flux 2?</strong><br>Not if you use <strong>imagetovideo-ai</strong>. We process the <strong>Flux 2</strong> computations on our cloud servers, so you can use it on any device without hardware limitations.</li><li><strong>Can I use Flux 2 with ComfyUI?</strong><br>Yes, <strong>Flux 2</strong> is fully compatible with <strong>ComfyUI</strong>. This allows advanced users to create complex node-based workflows for granular control over the <strong>Flux 2</strong> generation pipeline.</li></ul>"
                }
              ].map((section, index) => (
                <section key={index}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">{section.h2}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Showcase Image - 展示案例图片 */}
                      {section.image && (
                        <div className="my-8 flex justify-center">
                          <div className="rounded-lg overflow-hidden border border-border/20 bg-muted/10 shadow-sm max-w-full">
                            <img
                              src={section.image}
                              alt={section.imageAlt || `${section.h2} showcase example`}
                              className="max-w-[960px] w-full h-auto object-contain"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div 
                        className="prose prose-slate dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: section.body }}
                      />
                    </CardContent>
                  </Card>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

