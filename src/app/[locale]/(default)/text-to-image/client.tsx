"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

// 图片比例选项，基于API文档
const ASPECT_RATIOS = [
  "1:1 (Perfect Square)",
  "2:3 (Classic Portrait)", 
  "3:4 (Golden Ratio)",
  "3:5 (Elegant Vertical)",
  "4:5 (Artistic Frame)",
  "5:7 (Balanced Portrait)",
  "5:8 (Tall Portrait)",
  "7:9 (Modern Portrait)",
  "9:16 (Slim Vertical)",
  "9:19 (Tall Slim)",
  "9:21 (Ultra Tall)",
  "9:32 (Skyline)",
  "3:2 (Golden Landscape)",
  "4:3 (Classic Landscape)",
  "5:3 (Wide Horizon)",
  "5:4 (Balanced Frame)",
  "7:5 (Elegant Landscape)",
  "8:5 (Cinematic View)",
  "9:7 (Artful Horizon)",
  "16:9 (Panorama)",
  "19:9 (Cinematic Ultrawide)",
  "21:9 (Epic Ultrawide)",
  "32:9 (Extreme Ultrawide)"
];

export default function TextToImageClient() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1 (Perfect Square)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);

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
      alert("请输入文字描述来生成图片");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setProgress(0);
    setEstimatedTime("正在初始化...");
    
    try {
      // 调用文生图API
      const response = await fetch('/api/runninghub/text-to-image', {
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
      console.log('文生图API响应:', result);
      
      if (result.success && result.data.taskId) {
        setTaskId(result.data.taskId);
        // 开始轮询任务状态
        pollTaskStatus(result.data.taskId);
      } else {
        console.error('API错误:', result);
        throw new Error(result.error || '启动图片生成失败');
      }
      
    } catch (error) {
      console.error('图片生成错误:', error);
      const errorMessage = error instanceof Error ? error.message : "生成图片失败，请重试";
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
        const response = await fetch('/api/runninghub/text-to-image', {
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
        console.log(`状态检查结果 (第${attempts + 1}次):`, result);
        
        if (result.success) {
          if (result.data.status === 'completed' && result.data.imageUrl) {
            console.log('任务完成，图片URL:', result.data.imageUrl);
            
            setGeneratedImage(result.data.imageUrl);
            setIsGenerating(false);
            setTaskId(null);
            setProgress(100);
            setEstimatedTime("完成");
            return;
          } else if (result.data.status === 'running') {
            attempts++;
            
            // 计算进度 (基于时间估算)
            const elapsedMinutes = (attempts * 5) / 60; // 已经过的分钟数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedMinutes < 2) {
              progressPercent = Math.min(30, elapsedMinutes * 15); // 前2分钟到30%
              timeEstimate = "正在处理文字描述...";
            } else if (elapsedMinutes < 5) {
              progressPercent = 30 + Math.min(40, (elapsedMinutes - 2) * 13.3); // 2-5分钟到70%
              timeEstimate = "正在生成图片...";
            } else if (elapsedMinutes < 8) {
              progressPercent = 70 + Math.min(20, (elapsedMinutes - 5) * 6.7); // 5-8分钟到90%
              timeEstimate = "正在优化图片质量...";
            } else {
              progressPercent = Math.min(95, 90 + (elapsedMinutes - 8) * 2.5); // 8分钟后到95%
              timeEstimate = "即将完成...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`任务仍在运行，第${attempts}/${maxAttempts}次，进度: ${progressPercent.toFixed(1)}%`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('任务超时 - 图片生成时间超过预期（10分钟）。请重试。');
            }
          } else {
            console.error('意外状态:', result.data.status);
            throw new Error(result.data.message || `意外状态: ${result.data.status}`);
          }
        } else {
          throw new Error(result.error || '状态检查失败');
        }
      } catch (error) {
        console.error('状态检查错误:', error);
        const errorMessage = error instanceof Error ? error.message : "检查图片生成状态失败";
        
        // 如果是网络错误且重试次数少于3次，则自动重试
        if (attempts < 3 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
          console.log(`网络错误，10秒后重试... (第${attempts + 1}/3次)`);
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

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Text to Image AI Generator",
            "description": "Advanced AI-powered text to image generator that transforms descriptive text prompts into stunning AI-generated images",
            "url": "https://imagetovideoai.com/text-to-image",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered text to image conversion",
              "Multiple aspect ratio options",
              "High-quality image generation",
              "Professional AI art creation",
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
            {/* 页面标题 */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Mastering the Art of Text to Image Generation with imagetovideo-ai
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Welcome to imagetovideo-ai, the cutting-edge platform where your imagination takes tangible, visual form. 
                Transform descriptive text prompts into stunning AI-generated images with our advanced machine learning technology.
              </p>
            </div>

            {/* 主要工作区 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiImageLine" className="w-5 h-5 text-primary" />
                  Text to Image Generator
                </CardTitle>
                <CardDescription>
                  Enter a detailed description and select your preferred aspect ratio to generate stunning AI images.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* 文字输入区域 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    Image Description Prompt
                    <span className="text-red-500">*</span>
                  </h3>
                  <Textarea
                    placeholder="A photorealistic Shiba Inu wearing a small red bow tie, sitting on a vintage leather armchair in a library, cinematic lighting, golden hour, detailed fur texture, warm atmosphere..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  
                  {/* 快速提示建议 */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Quick Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "photorealistic portrait",
                        "digital art style",
                        "cinematic lighting",
                        "watercolor painting",
                        "cyberpunk aesthetic"
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
                        <li>• Be specific and detailed in your descriptions</li>
                        <li>• Include artistic style (e.g., 'photorealistic,' 'digital art,' 'oil painting')</li>
                        <li>• Specify lighting and mood (e.g., 'cinematic lighting,' 'golden hour')</li>
                        <li>• Mention composition and framing preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 图片比例选择 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">
                    Aspect Ratio
                  </h3>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择图片比例" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio} value={ratio}>
                          {ratio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 生成按钮 */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={generateImage}
                    disabled={!prompt.trim() || isGenerating}
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
                        <Icon name="RiImageLine" className="w-4 h-4 mr-2" />
                        Generate Image
                        <span className="ml-2 text-xs opacity-60">
                          (Ctrl+Enter)
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                {/* 任务状态 */}
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
                          Image Generation in Progress
                        </span>
                        <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto">
                          {progress}%
                        </span>
                      </div>
                      
                      {/* 进度条 */}
                      <div className="w-full bg-blue-100 dark:bg-blue-800/30 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-600 dark:text-blue-400">
                          Aspect Ratio: {aspectRatio}
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
                            <p>• Maximum: up to 10 minutes</p>
                            <p className="mt-2 font-medium">Please keep this page open. Your image will appear automatically when ready.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 生成的图片结果 */}
            {generatedImage && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="RiImageLine" className="w-5 h-5 text-green-600" />
                    Generated Image
                  </CardTitle>
                  <CardDescription>
                    Your AI-generated image is ready! You can download or use it for further processing.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="w-full overflow-hidden rounded-lg border border-border/20 bg-muted/10 relative">
                    <img
                      src={generatedImage}
                      alt="AI Generated Image"
                      className="w-full h-auto object-contain max-h-[600px]"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {aspectRatio}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedImage;
                        link.download = `text-to-image-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <Icon name="RiDownloadLine" className="w-4 h-4" />
                      Download Image
                    </Button>
                    
                    <Button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'My AI Generated Image',
                            url: generatedImage
                          });
                        } else {
                          navigator.clipboard.writeText(generatedImage);
                          alert('Image URL copied to clipboard!');
                        }
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Icon name="RiShareLine" className="w-4 h-4" />
                      Share Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 内容区域 - 基于texttovideo.json完整内容 */}
            <div className="space-y-8">
              {/* 技术介绍 */}
              <Card>
                <CardHeader>
                  <CardTitle>The Core Technology Behind Our Advanced Text to Image System</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p>
                    The future of content creation is here, and it's powered by AI. At imagetovideo-ai, our system employs 
                    state-of-the-art diffusion models, which represent the pinnacle of <strong>text to image</strong> technology. 
                    These models have been trained on vast, curated datasets to understand the nuanced relationship between 
                    language and visual elements.
                  </p>
                  <p>
                    When you input a descriptive text prompt, the AI doesn't just pull up a matching image; it synthesizes 
                    a completely new, unique visual piece. This sophisticated process involves interpreting the semantics of 
                    your prompt, including style, mood, composition, and specific subject matter, to produce a high-fidelity output.
                  </p>
                  <p>
                    The resulting <strong>AI-generated image</strong> is not a mere compilation of existing parts but a novel creation 
                    that perfectly aligns with your textual command. This meticulous approach ensures that every <strong>text to image</strong> 
                    result from imagetovideo-ai is a work of digital art, ready for use in commercial projects, social media, or personal artistic endeavors.
                  </p>
                </CardContent>
              </Card>

              {/* 工作流程 */}
              <Card>
                <CardHeader>
                  <CardTitle>From Simple Concept to Stunning Visuals: The Text to Image Workflow</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p>
                    The simplicity of our workflow belies the complexity of the AI working under the hood. Generating a 
                    high-quality <strong>AI image</strong> with imagetovideo-ai is a straightforward process, designed for 
                    maximum efficiency and ease of use. It begins with your text prompt—the single most crucial element in the 
                    <strong>text to image</strong> process.
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">1</div>
                      <div>
                        <h4 className="font-semibold">The Prompt</h4>
                        <p className="text-sm text-muted-foreground">
                          Craft a clear, detailed, and expressive prompt. Think of your text as the director's script for the AI. 
                          High-quality input is the key to high-quality <strong>text to image</strong> output.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">2</div>
                      <div>
                        <h4 className="font-semibold">Generation</h4>
                        <p className="text-sm text-muted-foreground">
                          Our platform processes the textual data through its deep learning model. Within moments, the AI starts 
                          'painting' pixel by pixel, iteratively refining the image based on the prompt's instructions.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">3</div>
                      <div>
                        <h4 className="font-semibold">Refinement and Iteration</h4>
                        <p className="text-sm text-muted-foreground">
                          Users can then fine-tune the results. If the initial <strong>text to image</strong> output is close but not perfect, 
                          minor adjustments to the prompt, or the use of in-built style modifiers and aspect ratio controls, allow for rapid iteration.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 内容策略提升 */}
              <Card>
                <CardHeader>
                  <CardTitle>Elevating Your Content Strategy with Powerful Text to Image Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p>
                    In the digital age, content is king, and speed is the currency of creativity. imagetovideo-ai's <strong>text to image</strong> 
                    functionality offers significant advantages across various industries and creative pursuits.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Marketing Professionals</h4>
                      <p className="text-sm text-muted-foreground">
                        Rapid prototyping of ad creatives, banner images, and social media content, drastically reducing time-to-market. 
                        Generate unique visuals for entire campaigns with descriptive text prompts.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Game Developers & Artists</h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>AI image generation</strong> provides an inexhaustible source of inspiration, quickly visualizing 
                        environments, characters, and assets that can then be refined by human hands.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Writers & Authors</h4>
                      <p className="text-sm text-muted-foreground">
                        Bring scenes from novels to life, transforming complex narrative descriptions into vivid 
                        <strong>text to image</strong> illustrations.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Creative Enthusiasts</h4>
                      <p className="text-sm text-muted-foreground">
                        This feature democratizes art, empowering anyone to create museum-quality pieces with just a few lines of text. 
                        The efficiency is unmatched for modern creators.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 最佳实践 */}
              <Card>
                <CardHeader>
                  <CardTitle>Best Practices for Crafting Effective Text to Image Prompts</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p>
                    Achieving phenomenal results with any <strong>text to image</strong> generator relies heavily on the quality of your input. 
                    To unlock the full potential of imagetovideo-ai, follow these expert prompting guidelines:
                  </p>
                  <div className="space-y-4 mt-6">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Be Specific and Detailed</h4>
                      <p className="text-sm text-muted-foreground">
                        Instead of 'a dog,' try 'A photorealistic Shiba Inu wearing a small red bow tie, sitting on a vintage leather armchair 
                        in a library, cinematic lighting.' The more specific your <strong>text to image</strong> prompt, the better the AI can execute your vision.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Include Artistic Style</h4>
                      <p className="text-sm text-muted-foreground">
                        Specify the medium or artist you want to emulate. Keywords like 'Impressionist painting,' 'digital art,' 
                        'isometric 3D render,' or 'Vaporwave aesthetic' guide the AI's stylistic choices.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Define Composition and Framing</h4>
                      <p className="text-sm text-muted-foreground">
                        Use photography terms such as 'wide-angle shot,' 'macro close-up,' 'low-angle perspective,' or 
                        'Rule of Thirds composition' to control the final <strong>AI image</strong> layout.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Control Lighting and Mood</h4>
                      <p className="text-sm text-muted-foreground">
                        Descriptions like 'golden hour,' 'neon light reflections,' 'dark and moody,' or 'bright and cheerful' 
                        are critical for setting the atmosphere of your <strong>text to image</strong> output.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">Use Negative Prompts</h4>
                      <p className="text-sm text-muted-foreground">
                        While not always necessary, specifying elements you wish to exclude (e.g., 'no watermark, low quality, blurred') 
                        can help refine the final <strong>text to image</strong> generation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 与AI视频的连接 */}
              <Card>
                <CardHeader>
                  <CardTitle>The Seamless Connection Between Text to Image and AI Video on imagetovideo-ai</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p>
                    What truly sets imagetovideo-ai apart is the integrated ecosystem. We recognize that static <strong>AI images</strong> 
                    often need to evolve into dynamic media. After successfully generating a stunning <strong>text to image</strong> asset, 
                    our platform offers a one-click solution to transform that image into a high-definition, animated <strong>AI video</strong>.
                  </p>
                  <p>
                    This unique functionality leverages advanced temporal coherence models to intelligently generate movement, camera transitions, 
                    and visual effects that honor the original aesthetic and subject matter of the <strong>AI-generated image</strong>. 
                    Whether you need a simple zoom and pan, or complex character animation derived from your initial <strong>text to image</strong> concept, 
                    imagetovideo-ai provides the tools.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 font-medium">
                      Complete Creative Pipeline
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Your entire creative pipeline—from <strong>text to image</strong> inception to final <strong>AI video</strong> render—exists 
                      within the powerful and intuitive interface of imagetovideo-ai. No more switching between multiple software applications.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 道德考虑 */}
              <Card>
                <CardHeader>
                  <CardTitle>Ethical Considerations and Responsible Text to Image Generation</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p>
                    As a leader in <strong>AI image generation</strong> technology, imagetovideo-ai is deeply committed to ethical and responsible deployment. 
                    The power of <strong>text to image</strong> is immense, and we have implemented robust safeguards to prevent misuse.
                  </p>
                  <p>
                    Our models are trained with a focus on respecting copyright and avoiding the generation of harmful, hateful, or inappropriate content. 
                    We believe that <strong>AI-generated content</strong> should enhance human creativity, not detract from it. Transparency is key; 
                    every image created through our <strong>text to image</strong> system is a unique synthetic creation, and we provide clear usage rights to our users.
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-4">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      By choosing imagetovideo-ai, you are opting for a platform that not only offers unparalleled <strong>AI image</strong> and 
                      <strong>AI video</strong> capabilities but also champions a thoughtful and principled approach to artificial intelligence.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 未来创新 */}
              <Card>
                <CardHeader>
                  <CardTitle>Future Innovations and the Evolution of Text to Image Technology</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <p>
                    The world of AI evolves at an exponential pace, and imagetovideo-ai is committed to staying at the forefront of this revolution. 
                    Our research and development team is constantly exploring next-generation models to improve the fidelity, coherence, and speed 
                    of our <strong>text to image</strong> outputs.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Enhanced Control Mechanisms</h4>
                      <p className="text-sm text-muted-foreground">
                        Future updates will focus on allowing users to manipulate specific elements within the generated <strong>AI image</strong> 
                        without altering the entire composition.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Deeper Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        We are working on deeper integration between our <strong>text to image</strong> and <strong>AI video</strong> features, 
                        promising even more sophisticated, high-quality animations and cinematic sequences.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Specialized Models</h4>
                      <p className="text-sm text-muted-foreground">
                        Expect new style packs, model variations optimized for specific use cases (e.g., product photography, architectural rendering), 
                        and even more intuitive prompting interfaces.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-primary">Effortless Creation</h4>
                      <p className="text-sm text-muted-foreground">
                        Our goal is to make <strong>text to image</strong> generation feel less like a technical process and more like an effortless 
                        extension of the human mind.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ部分 - 完整版本 */}
              <Card>
                <CardHeader>
                  <CardTitle>FAQ: Common Questions About Text to Image and imagetovideo-ai</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h4 className="font-semibold mb-2">What exactly is 'text to image' and how does imagetovideo-ai utilize it?</h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>Text to image</strong> is an AI process where a descriptive sentence or phrase (the prompt) 
                        is automatically converted into a corresponding visual image. imagetovideo-ai uses advanced deep learning 
                        diffusion models to interpret your text prompt's semantics and artistic instructions, synthesizing a completely 
                        unique, high-resolution <strong>AI-generated image</strong> that perfectly matches your description.
                      </p>
                    </div>
                    
                    <div className="border-b border-border pb-4">
                      <h4 className="font-semibold mb-2">How long does it take to generate a high-quality AI image using the text to image feature?</h4>
                      <p className="text-sm text-muted-foreground">
                        Due to our highly optimized infrastructure and cutting-edge model architecture, imagetovideo-ai can 
                        typically generate a high-quality <strong>text to image</strong> result in a matter of seconds. Complex prompts 
                        may take slightly longer, but the process is significantly faster than traditional digital content creation.
                      </p>
                    </div>
                    
                    <div className="border-b border-border pb-4">
                      <h4 className="font-semibold mb-2">Can I use the text to image creations from imagetovideo-ai for commercial purposes?</h4>
                      <p className="text-sm text-muted-foreground">
                        Yes, all <strong>AI images</strong> generated through imagetovideo-ai's <strong>text to image</strong> 
                        service, under a paid subscription, come with full commercial usage rights. This allows you to freely use 
                        the generated content in your marketing, advertising, product design, and other commercial projects.
                      </p>
                    </div>
                    
                    <div className="border-b border-border pb-4">
                      <h4 className="font-semibold mb-2">What is the difference between AI image generation and AI video generation on imagetovideo-ai?</h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>AI image generation</strong> (or <strong>text to image</strong>) creates a single, static visual asset from a text prompt. 
                        <strong>AI video</strong> generation, unique to imagetovideo-ai, takes that static <strong>AI image</strong> or another prompt 
                        and animates it, creating dynamic, moving footage with camera movements and visual effects, offering a comprehensive creative solution.
                      </p>
                    </div>
                    
                    <div className="border-b border-border pb-4">
                      <h4 className="font-semibold mb-2">Are there any limits to what I can describe in my text to image prompts?</h4>
                      <p className="text-sm text-muted-foreground">
                        While our <strong>text to image</strong> AI is incredibly versatile, imagetovideo-ai has implemented ethical guardrails. 
                        The system will reject prompts that attempt to generate illegal, hateful, explicit, or copyrighted material, 
                        ensuring responsible <strong>AI image generation</strong>.
                      </p>
                    </div>
                    
                    <div className="border-b border-border pb-4">
                      <h4 className="font-semibold mb-2">What are the best tips for a beginner to get great text to image results?</h4>
                      <p className="text-sm text-muted-foreground">
                        Beginners should focus on descriptive language. Include the subject, the action, the scene, and a specific artistic style 
                        (e.g., 'photorealistic,' 'cartoon,' 'surreal'). Specificity in your <strong>text to image</strong> prompt is the single 
                        most important factor for achieving superior <strong>AI image</strong> results.
                      </p>
                    </div>
                    
                    <div className="border-b border-border pb-4">
                      <h4 className="font-semibold mb-2">Can I edit the generated AI image after the text to image process is complete?</h4>
                      <p className="text-sm text-muted-foreground">
                        Yes. Once the initial <strong>text to image</strong> output is generated, you can download the image for external editing, 
                        or you can use our in-platform tools to refine the image further through simple prompt adjustments or by applying different 
                        style filters before proceeding to <strong>AI video</strong> creation.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Is imagetovideo-ai's text to image feature better for realistic or artistic styles?</h4>
                      <p className="text-sm text-muted-foreground">
                        imagetovideo-ai excels at both. Our advanced models are versatile, allowing you to specify 'photorealistic' for highly detailed, 
                        lifelike outputs, or explicitly request styles like 'oil painting' or 'low-poly 3D' to achieve specific artistic effects. 
                        The power of the <strong>text to image</strong> output lies in the detail of your prompt.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
