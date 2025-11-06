"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Icon from "@/components/icon";
import Markdown from "@/components/markdown";

// 比例选项配置
const ASPECT_RATIO_OPTIONS = [
  { value: "portrait", label: "Portrait", description: "Vertical version" },
  { value: "landscape", label: "Landscape", description: "Horizontal version" },
  { value: "portrait-hd", label: "Portrait HD", description: "Vertical HD" },
  { value: "landscape-hd", label: "Landscape HD", description: "Horizontal HD" },
];

export default function Sora2VideoGeneratorClient() {
  const [textPrompt, setTextPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("portrait");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 生成视频
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && textPrompt) {
        e.preventDefault();
        generateVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, textPrompt]);

  const generateVideo = async () => {
    const sessionId = Math.random().toString(36).substr(2, 9);
    console.log(`[${sessionId}] ===== Sora2 Video Generation Started =====`);
    console.log(`[${sessionId}] Input:`, { 
      prompt: textPrompt.substring(0, 100) + (textPrompt.length > 100 ? '...' : ''), 
      aspectRatio,
      promptLength: textPrompt.length 
    });

    if (!textPrompt.trim()) {
      console.log(`[${sessionId}] Validation failed: Empty prompt`);
      alert("Please enter a text prompt");
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      console.log(`[${sessionId}] Sending request to /api/runninghub/sora2-video`);
      // 调用 API 路由生成视频
      const response = await fetch('/api/runninghub/sora2-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textPrompt.trim(),
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
      
      // 开始轮询任务状态
      console.log(`[${sessionId}] Starting status polling...`);
      pollTaskStatus(data.taskId, sessionId);
      
    } catch (error) {
      console.error(`[${sessionId}] Video generation failed:`, error);
      alert(error instanceof Error ? error.message : 'Video generation failed, please try again later');
      setIsGenerating(false);
      setTaskId(null);
      setProgress(0);
      setEstimatedTime("");
    }
  };

  // 轮询任务状态 - 使用统一的 API 路由，前端动态计算进度
  const pollTaskStatus = async (taskId: string, sessionId?: string) => {
    const maxAttempts = 360; // 最多轮询12分钟 (360 * 2秒 = 720秒 = 12分钟)
    let attempts = 0;
    let retryCount = 0;
    const maxRetries = 5; // 最多重试5次
    const logPrefix = sessionId ? `[${sessionId}]` : '[POLL]';
    
    console.log(`${logPrefix} Starting status polling for task: ${taskId}`);
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`${logPrefix} Polling attempt ${attempts}/${maxAttempts}`);
        
        // 创建超时控制器
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
        
        let response;
        try {
          response = await fetch(`/api/runninghub/status/${taskId}`, {
            signal: controller.signal
          });
        } finally {
          clearTimeout(timeoutId);
        }
        
        console.log(`${logPrefix} Status API response status:`, response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to get task status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`${logPrefix} Status API response:`, data);
        
        // 重置重试计数（成功响应）
        retryCount = 0;
        
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
        
        // If task is still in progress, calculate progress dynamically and continue polling
        if (data.status === 'processing' || data.status === 'pending') {
          // 动态计算进度 (基于轮询次数，2秒间隔)
          const elapsedSeconds = attempts * 2; // 已经过的秒数
          let progressPercent = 0;
          let timeEstimate = "";
          
          // 根据已过时间动态计算进度，适配更长的生成时间（最长12分钟）
          const elapsedMinutes = elapsedSeconds / 60;
          
          if (elapsedMinutes < 2) {
            // 前2分钟：0-30%
            progressPercent = Math.min(30, (elapsedMinutes / 2) * 30);
            timeEstimate = "Initializing and processing...";
          } else if (elapsedMinutes < 5) {
            // 2-5分钟：30-60%
            progressPercent = 30 + Math.min(30, ((elapsedMinutes - 2) / 3) * 30);
            timeEstimate = "Generating video frames...";
          } else if (elapsedMinutes < 8) {
            // 5-8分钟：60-85%
            progressPercent = 60 + Math.min(25, ((elapsedMinutes - 5) / 3) * 25);
            timeEstimate = "Rendering and optimizing...";
          } else if (elapsedMinutes < 11) {
            // 8-11分钟：85-95%
            progressPercent = 85 + Math.min(10, ((elapsedMinutes - 8) / 3) * 10);
            timeEstimate = "Final processing...";
          } else {
            // 11分钟后：95-98%
            progressPercent = Math.min(98, 95 + ((elapsedMinutes - 11) / 1) * 3);
            timeEstimate = "Almost done...";
          }
          
          setProgress(Math.round(progressPercent));
          setEstimatedTime(timeEstimate);
          
          console.log(`${logPrefix} Task still ${data.status}, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%, elapsed: ${elapsedSeconds}s`);
          
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else {
            console.error(`${logPrefix} Polling timeout after ${maxAttempts} attempts`);
            throw new Error('Generation timeout, please try again later');
          }
        }
        
      } catch (error) {
        console.error(`${logPrefix} Task status polling failed:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get task status';
        
        // 检查是否是网络错误（fetch失败、连接关闭等）
        const isNetworkError = 
          errorMessage.includes('fetch') || 
          errorMessage.includes('network') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('ERR_CONNECTION_CLOSED') ||
          errorMessage.includes('timeout') ||
          error instanceof TypeError;
        
        // 如果是网络错误且重试次数未超过限制，则自动重试
        if (isNetworkError && retryCount < maxRetries) {
          retryCount++;
          const retryDelay = Math.min(5000 * retryCount, 20000); // 递增延迟，最多20秒
          console.log(`${logPrefix} Network error detected, retrying in ${retryDelay/1000}s... (retry ${retryCount}/${maxRetries})`);
          setEstimatedTime(`Connection error, retrying... (${retryCount}/${maxRetries})`);
          setTimeout(poll, retryDelay);
          return;
        }
        
        // 如果重试次数已满或不是网络错误，则显示错误
        toast.error(errorMessage);
        setIsGenerating(false);
        setTaskId(null);
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
      link.download = `sora2-video-${Date.now()}.mp4`;
      link.style.display = 'none';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('视频下载已开始');
    } catch (error) {
      console.error('下载视频失败:', error);
      alert('Failed to download video. Please try again.');
      
      // 如果fetch失败，尝试直接链接下载（不设置target，避免新窗口）
      const link = document.createElement('a');
      link.href = generatedVideo;
      link.download = `sora2-video-${Date.now()}.mp4`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 页面内容数据
  const pageContent = {
    h1Title: "Unleashing the Cinematic Power of the Sora 2 AI Video Generator",
    sections: [
      {
        type: "Introduction",
        content: "The world of digital media is constantly evolving, and at the forefront of this revolution is **AI-powered video generation**. While the original Sora model set an unparalleled benchmark for realism and scene complexity, the anticipation for the **Sora 2 AI Video Generator** is palpable. This next iteration promises to be more than just an upgrade; it's expected to be a fundamental shift in how creators, marketers, and filmmakers approach content production. The **Sora 2 AI Video Generator** represents a leap toward photorealistic, physically-simulated digital worlds, generated purely from text prompts.\n\nAt **imagetovideo-ai**, we are committed to democratizing this cutting-edge technology. Our platform already empowers users with seamless **AI image generation** and the foundational tools for converting imagination into motion. This deep dive explores the transformative capabilities projected for the **Sora 2 AI Video Generator**, and how our current and future tools align with this revolutionary vision. We anticipate a future where a single, detailed text description will yield a high-definition, complex narrative video, complete with intricate character interactions, dynamic camera movements, and perfect physical consistency. The ability to control every aspect of a scene—from lighting to texture—will make the **Sora 2 AI Video Generator** an indispensable tool. Get ready to experience creativity without limits."
      },
      {
        type: "H2_Subtitle",
        title: "Redefining Realism: Key Features of the Anticipated Sora 2 AI Video Generator",
        content: "What makes the **Sora 2 AI Video Generator** so highly anticipated? It's the expected breakthroughs in realism and control. The current generation of AI video tools, while impressive, often struggles with scene consistency, complex physics, and the generation of fine details like hand gestures or reflections. The **Sora 2 AI Video Generator** is projected to solve these challenges. We expect to see enhanced capabilities in several key areas:\n\n* **Perfect Scene Consistency:** Maintaining object permanence and seamless continuity across long video clips, a significant hurdle for previous models.\n* **Advanced Physical Simulation:** Accurately modeling real-world physics, including gravity, fluid dynamics, and rigid-body collisions, making the output from the **Sora 2 AI Video Generator** indistinguishable from real footage.\n* **Multi-Agent Interaction:** The ability to generate complex scenes with multiple characters interacting realistically with each other and their environment, following a detailed narrative script.\n* **Cinematic Camera Control:** Users will likely gain granular control over virtual camera parameters, such as depth of field, focal length, tracking shots, and even dolly zooms, turning the **Sora 2 AI Video Generator** into a virtual film studio.\n\nThis level of sophistication will dramatically reduce the time and cost associated with high-end video production. Furthermore, the integration with existing services, including sophisticated **AI image generation** tools like those offered by **imagetovideo-ai**, will create a powerful, unified workflow. Creators will be able to generate hyper-realistic assets and then bring them to life using the video engine of the **Sora 2 AI Video Generator**."
      },
      {
        type: "H2_Subtitle",
        title: "From Static Image to Dynamic Scene: Bridging AI Image Generation with the Sora 2 AI Video Generator",
        content: "Our platform, **imagetovideo-ai**, specializes in the foundational building blocks of AI creativity, including advanced **AI image generation**. This capability is directly complementary to the projected functionality of the **Sora 2 AI Video Generator**. Imagine generating a highly stylized, photorealistic landscape using our **AI image generation** tool, and then instantly feeding that image into a powerful system like the **Sora 2 AI Video Generator** to animate it. This isn't just a simple pan or zoom; it's about transforming a static 2D image into a complex 3D environment that the AI can explore and narrate.\n\nThe potential use cases are immense:\n\n1.  **Style Transfer and Animation:** Take a unique art style from a generated image and apply it consistently across a long-form video, all powered by the robust framework of the **Sora 2 AI Video Generator**.\n2.  **Character Rigging from a Single Prompt:** Generate a character's initial appearance with **AI image generation** and then have the **Sora 2 AI Video Generator** animate them with a full range of emotional and physical actions.\n3.  **Extending the Frame (Outpainting in Motion):** Use a generated image as a starting point, and instruct the **Sora 2 AI Video Generator** to dynamically extend the scene's boundaries in a physically consistent and cinematic way.\n\nThis seamless handoff from the precision of **AI image generation** to the expansive motion of the **Sora 2 AI Video Generator** will establish a new paradigm for digital content creation. **imagetovideo-ai** is actively developing features that will ensure maximum compatibility and workflow efficiency when the next generation of models, such as the **Sora 2 AI Video Generator**, becomes available."
      },
      {
        type: "H2_Subtitle",
        title: "Revolutionizing Industries with the Sora 2 AI Video Generator's Capabilities",
        content: "The impact of the **Sora 2 AI Video Generator** will be felt across numerous industries, moving far beyond simple novelty videos. Its ability to generate high-fidelity, customizable video content on demand fundamentally changes the economics and logistics of production. The following sectors stand to benefit the most from the capabilities of the **Sora 2 AI Video Generator**:\n\n* **Film and Entertainment:** Pre-visualization (pre-vis) and storyboarding will be instant. Filmmakers can generate complex, minute-long scenes from a single script line, accelerating the pre-production phase. The **Sora 2 AI Video Generator** can also be used for creating highly realistic digital sets and complex visual effects that would traditionally cost millions.\n* **Marketing and Advertising:** Campaigns can be personalized and A/B tested at scale. A marketer can generate hundreds of unique video ads tailored to specific demographics or platforms within hours, simply by modifying the text prompt of the **Sora 2 AI Video Generator**.\n* **Gaming and Virtual Reality (VR):** The **Sora 2 AI Video Generator** can generate dynamic, non-player character (NPC) scenarios and highly detailed environmental textures, significantly enhancing the realism and immersion of virtual worlds.\n* **Education and Training:** Create complex, animated simulations for scientific concepts, medical training, or machinery operation without the need for expensive animation teams. The clarity and precision expected from the **Sora 2 AI Video Generator** make it an ideal tool for complex visualizations.\n\n**imagetovideo-ai**'s existing focus on accessible **AI image generation** and initial video tools positions our users perfectly to adopt and leverage the full potential of systems like the **Sora 2 AI Video Generator** the moment they are released. Our mission is to make this technology an everyday reality for every creator."
      },
      {
        type: "H2_Subtitle",
        title: "How the Sora 2 AI Video Generator Enhances Workflow Efficiency",
        content: "Time is a creator's most valuable asset. Traditional video production is notoriously time-consuming, involving scripting, shooting, editing, and post-production. The **Sora 2 AI Video Generator** is poised to collapse this entire pipeline into a single, intuitive text prompt. This dramatic reduction in overhead is the true power of the **Sora 2 AI Video Generator**.\n\nConsider a typical animation project: a 60-second animated explainer video can take weeks or even months to produce. With the **Sora 2 AI Video Generator**, this can be reduced to a matter of minutes or hours, allowing for rapid iteration and creative experimentation. Creators can test dozens of concepts and visual styles before committing to a final production. This agility is revolutionary.\n\nFurthermore, the system's expected compatibility with open-source and proprietary platforms means that output from the **Sora 2 AI Video Generator** will easily integrate into existing editing suites (e.g., Adobe Premiere, DaVinci Resolve). The ability to generate high-quality intermediate assets, such as specific backgrounds or character models, further streamlines the process. **imagetovideo-ai** already provides a simplified interface for advanced **AI image generation**, setting the stage for a similarly user-friendly experience when working with the sophisticated capabilities of the **Sora 2 AI Video Generator**."
      },
      {
        type: "H2_Subtitle",
        title: "Technical Deep Dive: The Model Behind the Sora 2 AI Video Generator",
        content: "While specific details remain proprietary, the **Sora 2 AI Video Generator** is likely built upon a sophisticated diffusion transformer architecture. This architecture allows the model to understand and generate not just static images, but also the dynamic, temporal relationship between frames. The key to the breakthrough in the **Sora 2 AI Video Generator** is its understanding of space and time as a unified concept, enabling it to maintain long-range coherence—a critical feature for realistic video generation.\n\nThe training data for the **Sora 2 AI Video Generator** is undoubtedly massive, encompassing a vast library of videos that have been meticulously curated and labeled. This allows the AI to learn the intrinsic 'physics' of the real world—how light reflects, how cloth folds, and how objects collide. This deep semantic understanding is what differentiates the **Sora 2 AI Video Generator** from simpler, frame-by-frame generators.\n\nFuture iterations, including the anticipated **Sora 2 AI Video Generator**, are expected to feature enhanced conditioning mechanisms, allowing for: (1) **Style Prompts:** Generating videos in the distinct style of an input image (a direct link to **imagetovideo-ai**'s **AI image generation** focus); (2) **Seed Control:** Generating highly reproducible results from the same prompt; and (3) **Temporal Editing:** Allowing users to modify specific segments of a generated video without affecting the rest of the clip. This continuous improvement in model architecture is what makes the **Sora 2 AI Video Generator** a beacon for the future of synthetic media."
      },
      {
        type: "H2_Subtitle",
        title: "Ethical Considerations and Responsible Use of the Sora 2 AI Video Generator",
        content: "With great power comes great responsibility. The hyper-realism promised by the **Sora 2 AI Video Generator** necessitates a strong focus on ethical guidelines and responsible deployment. The potential for misuse, particularly in generating deepfakes or misinformation, is a serious concern that must be proactively addressed.\n\nLeading platforms, including **imagetovideo-ai**, are committed to implementing robust safety measures:\n\n* **Content Filtering:** Implementing strict filters to prevent the generation of harmful, illegal, or non-consensual content by the **Sora 2 AI Video Generator**.\n* **Watermarking and Provenance:** Utilizing cryptographic watermarks or metadata to clearly label content generated by the **Sora 2 AI Video Generator** as synthetic, ensuring transparency.\n* **User Verification:** Employing identity verification processes for advanced capabilities to prevent malicious use.\n\nIt is imperative that the development and rollout of the **Sora 2 AI Video Generator** are guided by a commitment to ethical AI principles. Our goal at **imagetovideo-ai** is to ensure that the amazing creative freedom offered by both our **AI image generation** tools and advanced video systems like the **Sora 2 AI Video Generator** is used to enrich, not detract from, the digital landscape. We prioritize education on media literacy alongside technological advancement."
      },
      {
        type: "H2_Subtitle",
        title: "Future Prospects: Integrating imagetovideo-ai with the Sora 2 AI Video Generator Ecosystem",
        content: "**imagetovideo-ai** is strategically positioned to be a key player in the ecosystem surrounding the **Sora 2 AI Video Generator**. Our current focus on providing high-quality, user-friendly **AI image generation** tools is the perfect gateway for users to step into the world of AI video.\n\nWe envision a future integration path where users can:\n\n1.  **Generate Assets:** Use **imagetovideo-ai** to generate custom characters, environments, and textures with precise control.\n2.  **Animate and Extend:** Seamlessly upload these assets to a service powered by the **Sora 2 AI Video Generator** for animation, scene extension, and full video production.\n3.  **Refine and Edit:** Bring the final video output back into our platform for further post-processing, stylistic adjustments, or integrating with other multimedia elements.\n\nThe synergy between powerful **AI image generation** and the advanced temporal understanding of the **Sora 2 AI Video Generator** will create an unparalleled content creation experience. **imagetovideo-ai** will continue to innovate and adapt, ensuring our users always have access to the most advanced tools to realize their creative visions with the help of the **Sora 2 AI Video Generator**."
      },
      {
        type: "FAQ",
        items: [
          {
            question: "What is the Sora 2 AI Video Generator?",
            answer: "The **Sora 2 AI Video Generator** is the anticipated next-generation AI model, likely from OpenAI, designed to generate highly realistic, complex, and coherent videos directly from text prompts. It is expected to significantly improve upon the original Sora model's capabilities in terms of realism, duration, and physical consistency."
          },
          {
            question: "How does the Sora 2 AI Video Generator differ from existing AI video tools?",
            answer: "The **Sora 2 AI Video Generator** is expected to offer better long-range scene coherence, more accurate modeling of real-world physics, and greater control over camera movement and character interaction. Most existing tools struggle with these advanced temporal and physical simulation features."
          },
          {
            question: "Can I use my existing AI image generation outputs with the Sora 2 AI Video Generator?",
            answer: "Yes, absolutely. Systems like the **Sora 2 AI Video Generator** are designed to work with visual inputs. Users can leverage **imagetovideo-ai**'s high-fidelity **AI image generation** to create starting frames, textures, or style references which the **Sora 2 AI Video Generator** can then bring to life and animate."
          },
          {
            question: "What kind of prompts will the Sora 2 AI Video Generator require?",
            answer: "To maximize the output quality of the **Sora 2 AI Video Generator**, detailed, descriptive prompts that specify the scene, characters, actions, camera angles (e.g., 'a wide-angle drone shot'), and desired mood will be most effective. The more detail, the better the AI can simulate the scene."
          },
          {
            question: "What is imagetovideo-ai's role in the Sora 2 AI Video Generator ecosystem?",
            answer: "**imagetovideo-ai** focuses on providing the best in **AI image generation** and foundational video tools. We are preparing our platform for seamless integration with advanced models like the **Sora 2 AI Video Generator**, acting as a comprehensive creative hub for both static asset creation and dynamic video production."
          },
          {
            question: "Will the Sora 2 AI Video Generator be accessible to the average user?",
            answer: "While initial access may be limited to researchers or professional studios, the trend in AI is toward democratization. Platforms like **imagetovideo-ai** strive to make complex AI tools, including eventual integration with the **Sora 2 AI Video Generator**, accessible through user-friendly interfaces for all creators."
          },
          {
            question: "What technical advancements are expected in the Sora 2 AI Video Generator?",
            answer: "Key technical advancements expected in the **Sora 2 AI Video Generator** include a more robust diffusion transformer model, enhanced understanding of 3D space and temporal coherence, and a richer, higher-resolution output format with better frame stability and detail."
          },
          {
            question: "How will the Sora 2 AI Video Generator address ethical concerns like deepfakes?",
            answer: "Reputable developers of the **Sora 2 AI Video Generator** will implement strict ethical guardrails, including content moderation, clear digital watermarking to identify AI-generated content, and policies against generating harmful or non-consensual imagery or video."
          }
        ]
      }
    ]
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
            "name": "Sora 2 AI Video Generator",
            "description": "Transform your text prompts into cinematic videos with the Sora 2 AI Video Generator. Advanced AI-powered text to video generation.",
            "url": "https://imagetovideo-ai.net/text-to-video/sora-2-ai-video-generator",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered text to video generation",
              "Multiple aspect ratio options",
              "Professional video generation",
              "Free to use"
            ],
            "creator": {
              "@type": "Organization",
              "name": "imagetovideo-ai"
            }
          })
        }}
      />
      
      <div className="min-h-screen bg-background">
        <div className="px-16 sm:px-20 lg:px-24 xl:px-32 py-8">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {pageContent.h1Title}
            </h1>
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
                  <Textarea
                    placeholder="Example: A cat wearing sunglasses walking on a sunny beach, camera following from behind, cinematic style, golden hour lighting..."
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    className="min-h-[120px] resize-none"
                    maxLength={1000}
                    disabled={isGenerating}
                  />
                  <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                    <span>Supports English descriptions, recommended 50-500 characters</span>
                    <span>{textPrompt.length}/1000</span>
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
                      <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isGenerating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select video aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIO_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-muted-foreground text-sm">({option.description})</span>
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
                    disabled={isGenerating || !textPrompt.trim()}
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
                      {taskId && (
                        <p className="text-xs text-muted-foreground text-center">
                          Task ID: {taskId}
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
                      ? 'aspect-video min-h-[280px] max-h-[320px] w-full'
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

          {/* How to Use Section */}
          <Card className="mt-16 shadow-lg">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">How to Use the Sora 2 AI Video Generator</h2>
              <p className="text-muted-foreground mb-6">
                A comprehensive guide to writing effective prompts for AI video generation
              </p>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground">
                  Creating high-quality prompts is like crafting an "executable visual script" for AI. It's not just about stacking words—it's about guiding the model to generate exactly what you envision. Below is a step-by-step tutorial to master prompt writing.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">1. Understand the Core Elements of a Prompt</h3>
                <p className="text-muted-foreground mb-4">
                  A robust prompt isn't just text; it's a set of directives. Key parameters include:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>Prompt Text</strong>: The descriptive core that defines the scene, subject, and style.</li>
                  <li><strong>Aspect Ratio</strong>: The width-to-height ratio of the output (e.g., Portrait for vertical, Landscape for horizontal).</li>
                  <li><strong>Duration</strong>: How long the generated video should be. Shorter durations tend to be more stable.</li>
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">2. Master the "7-Step Grammar" Structure</h3>
                <p className="text-muted-foreground mb-4">
                  This framework ensures clarity and control over the AI's output. Break down your vision into seven components:
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3 text-left font-semibold">Component</th>
                        <th className="border border-border p-3 text-left font-semibold">Definition & Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-3 font-medium">Scene</td>
                        <td className="border border-border p-3 text-muted-foreground">The setting or environment. <em>Example: A bustling Tokyo street at night.</em></td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-medium">Subject</td>
                        <td className="border border-border p-3 text-muted-foreground">The main focus (person, object, creature). <em>Example: A young street artist.</em></td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-medium">Action</td>
                        <td className="border border-border p-3 text-muted-foreground">What the subject does. <em>Example: Spray-painting a mural on a brick wall.</em></td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-medium">Camera</td>
                        <td className="border border-border p-3 text-muted-foreground">How the shot is framed/moved (e.g., close-up, tracking shot). <em>Example: A handheld camera following the artist's movements.</em></td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-medium">Mood</td>
                        <td className="border border-border p-3 text-muted-foreground">The emotional tone. <em>Example: Edgy, rebellious, and vibrant.</em></td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-medium">Lighting</td>
                        <td className="border border-border p-3 text-muted-foreground">The type of light (e.g., neon, soft sunlight). <em>Example: Neon signs casting pink and blue hues.</em></td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-medium">Style</td>
                        <td className="border border-border p-3 text-muted-foreground">Artistic genre or medium (e.g., cyberpunk, watercolor). <em>Example: Graffiti art style with bold lines and high contrast.</em></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-xl font-semibold mt-8 mb-4">3. Step-by-Step Prompt Creation Process</h3>
                
                <h4 className="text-lg font-semibold mt-6 mb-3">Step 1: Define Your Core Concept</h4>
                <p className="text-muted-foreground mb-2">
                  Start with a clear idea. Ask: <em>"What story or video do I want to create?"</em>
                </p>
                <p className="text-muted-foreground mb-4">
                  Example concept: <em>"A cyberpunk detective investigating a crime in a rain-soaked city."</em>
                </p>

                <h4 className="text-lg font-semibold mt-6 mb-3">Step 2: Break Down the 7-Step Grammar</h4>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li><strong>Scene</strong>: A rain-soaked cyberpunk city with towering neon-lit skyscrapers.</li>
                  <li><strong>Subject</strong>: A grizzled detective in a trench coat and cybernetic eye implant.</li>
                  <li><strong>Action</strong>: Examining a glowing hologram clue while rain drips from his hat.</li>
                  <li><strong>Camera</strong>: A low-angle tracking shot moving slowly around the detective.</li>
                  <li><strong>Mood</strong>: Suspenseful, gritty, and futuristic.</li>
                  <li><strong>Lighting</strong>: Neon signs reflecting off wet pavement, creating moody shadows.</li>
                  <li><strong>Style</strong>: Neo-noir cyberpunk, like <em>Blade Runner</em>.</li>
                </ul>

                <h4 className="text-lg font-semibold mt-6 mb-3">Step 3: Combine Elements into a Cohesive Prompt</h4>
                <div className="bg-muted rounded-lg p-4 my-4">
                  <p className="text-sm italic text-muted-foreground">
                    "A rain-soaked cyberpunk city with towering neon-lit skyscrapers. A grizzled detective in a trench coat and cybernetic eye implant is examining a glowing hologram clue while rain drips from his hat. Shot with a low-angle tracking camera moving slowly around him. Mood: suspenseful, gritty, futuristic. Lighting: neon signs reflecting off wet pavement, casting moody shadows. Style: neo-noir cyberpunk, reminiscent of Blade Runner."
                  </p>
                </div>

                <h4 className="text-lg font-semibold mt-6 mb-3">Step 4: Refine and Iterate</h4>
                <p className="text-muted-foreground">
                  Test the prompt, then tweak elements (e.g., change "neon signs" to "flickering streetlights" or adjust camera angles) to refine the result.
                </p>

                <h3 className="text-xl font-semibold mt-8 mb-4">4. Avoid Common Pitfalls</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <strong>Vague Language</strong>: Instead of "a beautiful flower," specify <em>"a vibrant red rose with dewdrops, close-up, soft morning light, impressionist painting style."</em>
                  </li>
                  <li>
                    <strong>Overloading Details</strong>: Too many conflicting directives (e.g., "cyberpunk Renaissance painting with anime characters") confuse the AI. Prioritize 2–3 key elements.
                  </li>
                  <li>
                    <strong>Ignoring Style Consistency</strong>: If you want a "watercolor landscape," ensure all elements (lighting, camera, mood) align with that style.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold mt-8 mb-4">5. Practice with Examples</h3>
                
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Example 1: Fantasy Dragon</h4>
                    <p className="text-sm italic text-muted-foreground">
                      "A misty mountain peak at sunrise. A majestic silver dragon with iridescent scales. Soaring through the clouds, breathing a stream of gold fire. Camera: wide-angle shot from below, emphasizing the dragon's size. Mood: epic, mythical. Lighting: warm sunrise light illuminating the dragon's wings. Style: fantasy concept art, highly detailed."
                    </p>
                  </div>

                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Example 2: Retro Sci-Fi Spaceship</h4>
                    <p className="text-sm italic text-muted-foreground">
                      "A retro-futuristic spaceport on Mars, with 1950s-style architecture and pink alien plants. A sleek silver spaceship with fins and a glass cockpit. Taking off with a burst of blue plasma thrusters. Camera: static shot from a distance, showing the spaceship rising above the port. Mood: nostalgic, adventurous. Lighting: pastel pink Martian sunset. Style: retro sci-fi illustration, like The Jetsons meets Star Trek."
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Pro Tip:</strong> By treating prompts as "visual scripts" and leveraging the 7-step structure, you'll transform vague ideas into precise, compelling AI-generated videos. Happy prompting!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Sections */}
          <div className="mt-16 space-y-8">
            {pageContent.sections.map((section, index) => {
              // 为前4个H2_Subtitle section分配视频
              const showcaseVideos = [
                "/imgs/showcases/sora-2-ai-video-generator-showcase-example-1.mp4",
                "/imgs/showcases/sora-2-ai-video-generator-showcase-example-2.mp4",
                "/imgs/showcases/sora-2-ai-video-generator-showcase-example-3.mp4",
                "/imgs/showcases/sora-2-ai-video-generator-showcase-example-4.mp4"
              ];
              
              // 计算H2_Subtitle的索引（跳过Introduction）
              let h2Index = -1;
              if (section.type === "H2_Subtitle") {
                h2Index = pageContent.sections.slice(0, index).filter(s => s.type === "H2_Subtitle").length;
              }
              
              const hasVideo = section.type === "H2_Subtitle" && h2Index < showcaseVideos.length;
              
              return (
                <Card key={index} className="shadow-lg">
                  <CardContent className="pt-6">
                    {section.type === "Introduction" && (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-foreground">Introduction: The Future of AI Video Generation</h2>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <Markdown content={section.content || ""} />
                        </div>
                      </div>
                    )}
                    {section.type === "H2_Subtitle" && (
                      <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                        {hasVideo ? (
                          <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 items-center">
                            <div className={h2Index % 2 === 0 
                              ? "order-2 lg:order-1 prose prose-slate dark:prose-invert max-w-none"
                              : "order-2 lg:order-2 prose prose-slate dark:prose-invert max-w-none"
                            }>
                              <Markdown content={section.content || ""} />
                            </div>
                            <div className={h2Index % 2 === 0 
                              ? "order-1 lg:order-2"
                              : "order-1 lg:order-1"
                            }>
                              <div className="relative overflow-hidden rounded-xl shadow-lg w-full">
                                <video
                                  src={showcaseVideos[h2Index]}
                                  className="w-full h-auto object-cover"
                                  controls
                                  playsInline
                                  preload="metadata"
                                >
                                  Your browser does not support video playback
                                </video>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-slate dark:prose-invert max-w-none">
                            <Markdown content={section.content || ""} />
                          </div>
                        )}
                      </div>
                    )}
                    {section.type === "FAQ" && (
                      <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-foreground">FAQ: Common Questions About the Sora 2 AI Video Generator</h2>
                        <div className="space-y-4">
                          {section.items?.map((item, itemIndex) => (
                            <div key={itemIndex} className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                              <Markdown content={item.answer || ""} />
                            </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

