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

export default function FaceSwapOnlineFreeClient() {
  const [targetImage, setTargetImage] = useState<UploadedImage | null>(null);
  const [replaceImage, setReplaceImage] = useState<UploadedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const targetImageRef = useRef<HTMLInputElement>(null);
  const replaceImageRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键支持：Ctrl/Cmd + Enter 生成
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating && targetImage && replaceImage) {
        e.preventDefault();
        generateFaceSwap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, targetImage, replaceImage]);

  const handleImageUpload = (file: File, setImage: (image: UploadedImage) => void) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage({
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
      
      return result.fileId;
    } catch (error) {
      console.error('RunningHub upload error:', error);
      throw error;
    }
  };

  // 生成 Face Swap
  const generateFaceSwap = async () => {
    if (!targetImage || !replaceImage) {
      toast.error("Please upload both target and replace images");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 上传两张图片并获取文件ID
      const [targetImageId, replaceImageId] = await Promise.all([
        uploadImageToRunningHub(targetImage.file),
        uploadImageToRunningHub(replaceImage.file)
      ]);
      
      console.log('Images uploaded, targetImageId:', targetImageId, 'replaceImageId:', replaceImageId);
      
      // 调用 Face Swap API 开始生成
      const response = await fetch('/api/runninghub/face-swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetImage: targetImageId,
          replaceImage: replaceImageId
        })
      });

      const result = await response.json();
      console.log('Face Swap API Response:', result);
      
      if (result.success && result.taskId) {
        setTaskId(result.taskId);
        toast.success('Face swap generation started!');
        // 开始轮询任务状态
        pollTaskStatus(result.taskId);
      } else {
        console.error('API Error:', result);
        throw new Error(result.error || 'Failed to start face swap generation');
      }
      
    } catch (error) {
      console.error('Face swap generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate face swap, please try again";
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
        const response = await fetch('/api/runninghub/face-swap/status', {
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
            toast.success('Face swap generated successfully!');
            return;
          } else if (result.status === 'running' || result.status === 'pending') {
            attempts++;
            
            // 计算进度 (基于时间估算)
            const elapsedSeconds = attempts * 5; // 已经过的秒数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedSeconds < 30) {
              progressPercent = Math.min(30, (elapsedSeconds / 30) * 30); // 前30秒到30%
              timeEstimate = "Processing images...";
            } else if (elapsedSeconds < 120) {
              progressPercent = 30 + Math.min(40, ((elapsedSeconds - 30) / 90) * 40); // 30-120秒到70%
              timeEstimate = "Analyzing faces...";
            } else if (elapsedSeconds < 300) {
              progressPercent = 70 + Math.min(25, ((elapsedSeconds - 120) / 180) * 25); // 120-300秒到95%
              timeEstimate = "Generating face swap...";
            } else {
              progressPercent = Math.min(98, 95 + ((elapsedSeconds - 300) / 600) * 3); // 300秒后到98%
              timeEstimate = "Finalizing...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`Task still running, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('Task timeout - Face swap generation took longer than expected. Please try again.');
            }
          } else {
            console.error('Unexpected status:', result.status, 'Message:', result.message);
            throw new Error(result.message || `Unexpected status: ${result.status}`);
          }
        } else {
          throw new Error(result.error || 'Status check failed');
        }
      } catch (error) {
        console.error('Status check error:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to check face swap generation status";
        
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
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      console.log('开始下载图片:', imageUrl);
      
      // 使用 fetch 获取图片数据并转换为 blob，强制下载
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('图片blob创建成功, 大小:', blob.size, '类型:', blob.type);
      
      // 确定文件扩展名
      let fileExtension = 'png';
      if (blob.type.includes('jpeg') || blob.type.includes('jpg')) {
        fileExtension = 'jpg';
      } else if (blob.type.includes('webp')) {
        fileExtension = 'webp';
      } else if (blob.type.includes('gif')) {
        fileExtension = 'gif';
      }
      
      // 创建对象URL
      const url = window.URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = `face-swap-${Date.now()}.${fileExtension}`;
      link.style.display = 'none';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('下载完成');
      toast.success('图片下载成功！');
    } catch (error) {
      console.error('下载错误:', error);
      toast.error('下载失败，请重试');
    } finally {
      setIsDownloading(false);
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
            "name": "Face Swap Online Free - imagetovideo-ai",
            "description": "Free AI-powered face swap tool that seamlessly blends faces onto any image with photorealistic results",
            "url": "https://imagetovideoai.com/photo-effects/face-swap-online-free",
            "applicationCategory": "MultimediaApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "AI-powered face swapping",
              "Photorealistic results",
              "Free to use",
              "No watermark",
              "High-resolution output"
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
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Master the Art of Transformation: Your Ultimate Face Swap Online Free Solution
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Welcome to <strong>imagetovideo-ai</strong>, where the future of digital content creation meets unparalleled accessibility. 
                Experience the best <strong>face swap online free</strong> with our cutting-edge AI technology. 
                Seamlessly blend faces onto any image with photorealistic results. Our easy-to-use tool is 100% free and fast.
              </p>
            </div>

            {/* Workspace Section - First Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiSwapLine" className="w-5 h-5 text-primary" />
                  Face Swap Online Free Generator
                </CardTitle>
                <CardDescription>
                  Upload your target and replace images, and our AI will create a photorealistic face swap in seconds.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Image Upload and Preview Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upload Area - Left Side, Vertical */}
                  <div className="space-y-6">
                    <UploadArea
                      image={targetImage}
                      setImage={setTargetImage}
                      title="Target Image"
                      inputRef={targetImageRef}
                      required
                    />
                    
                    <UploadArea
                      image={replaceImage}
                      setImage={setReplaceImage}
                      title="Replace Image (Source Face)"
                      inputRef={replaceImageRef}
                      required
                    />
                  </div>
                  
                  {/* Preview Area - Right Side */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Face Swap Preview
                    </h3>
                    <div className="relative border-2 border-dashed rounded-lg p-6 transition-colors border-muted-foreground/25 min-h-[400px] flex items-center justify-center">
                      {generatedImage ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={generatedImage}
                            alt="Generated Face Swap"
                            className="max-h-64 mx-auto rounded-md object-contain"
                          />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">Your face swap is ready!</p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <Button
                                onClick={() => downloadImage(generatedImage)}
                                disabled={isGenerating || isDownloading}
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                                      title: 'My Face Swap Result',
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
                              Generated face swap will be displayed here
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Upload both images and click generate to see the result
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
                    onClick={generateFaceSwap}
                    disabled={!targetImage || !replaceImage || isGenerating}
                    className="px-8 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin mr-2" />
                        {taskId ? 'Creating Face Swap...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="RiSwapLine" className="w-4 h-4 mr-2" />
                        Generate Face Swap
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
                          Face Swap Generation in Progress
                        </span>
                        <span className="text-xs text-blue-500 dark:text-blue-400 ml-auto">
                          {progress}%
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-blue-100 dark:bg-blue-800/30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-600 dark:text-blue-400">
                          Processing face swap...
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
                            <p className="mt-2 font-medium">Please keep this page open. Your face swap will appear automatically when ready.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Content Sections */}
            <div className="space-y-8">
              {/* How to Use Section */}
              <Card>
                <CardHeader>
                  <CardTitle>How to Achieve Flawless Results with Our Face Swap Online Free Tool</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    Our commitment at <strong>imagetovideo-ai</strong> is to simplify complex AI processes. 
                    The <strong>Face Swap Online Free</strong> feature is built around a straightforward, 
                    three-step workflow that ensures ease of use without compromising on the quality of the final output.
                  </p>
                  <h3>Step 1: Upload Your Source Images</h3>
                  <p>
                    The process begins with two crucial images. First, upload the <strong>Target Image</strong>—this is the picture 
                    onto which the new face will be placed. Second, upload the <strong>Replace Image</strong>—this is the picture 
                    containing the face you want to use. Ensure this face is clearly visible, well-lit, and facing the camera for the best results.
                  </p>
                  <h3>Step 2: Initiate the Swap</h3>
                  <p>
                    Once both images are uploaded to the <strong>Face Swap Online Free</strong> interface, click the 'Generate Swap' button. 
                    This action triggers our proprietary deep-learning algorithm, which performs the intensive work of analyzing 
                    facial geometry, lighting, and texture to create a perfect match.
                  </p>
                  <h3>Step 3: Review and Download Your Face Swap</h3>
                  <p>
                    In a matter of seconds, the result from your <strong>Face Swap Online Free</strong> request will appear. 
                    Review the image carefully. Notice how the skin tone, shadow direction, and emotional expression are preserved. 
                    Once satisfied, you can download your high-resolution, watermark-free image instantly.
                  </p>
                  
                  {/* 展示案例 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Target Image</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-flawless-results-target-image-example-1.webp"
                          alt="Face swap online free target image example - original photo demonstrating high-quality input for best face swap results"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Replace Image</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-flawless-results-replace-image-source-face.webp"
                          alt="Face swap online free replace image source face - high-quality face image ready for seamless face swapping"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Face Swap Result</h4>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✨ AI Generated
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-flawless-results-generated-face-swap-example-1.webp"
                          alt="Face swap online free flawless results - photorealistic AI-generated face swap demonstrating perfect skin tone and lighting matching"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technology Section */}
              <Card>
                <CardHeader>
                  <CardTitle>The Technology Behind the Seamless Face Swap Online Free Experience</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    What distinguishes the <strong>imagetovideo-ai Face Swap Online Free</strong> from basic photo editing apps 
                    is the sophistication of its underlying technology. We don't just 'cut and paste'; we use advanced AI to 
                    synthesize and reconstruct a new face, making the swap virtually undetectable.
                  </p>
                  <h3>Deep-Learning Neural Networks</h3>
                  <p>
                    Our <strong>Face Swap Online Free</strong> engine relies on a specialized neural network model trained on 
                    millions of diverse facial images. This extensive training allows the AI to understand complex factors 
                    like head orientation, gaze direction, and subtle muscular movements that form expressions.
                  </p>
                  <ul>
                    <li><strong>Face Landmark Detection:</strong> Accurately mapping key points (eyes, nose, mouth corners) on both the source and target faces.</li>
                    <li><strong>Facial Geometry Mapping:</strong> Adjusting the three-dimensional structure of the source face to perfectly fit the pose and perspective of the target face.</li>
                    <li><strong>Color and Texture Harmonization:</strong> The AI analyzes the lighting and skin texture of the target image and flawlessly adjusts the swapped face to match, ensuring a natural blend.</li>
                  </ul>
                  
                  {/* 展示案例 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Target Image</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-technology-target-image-example-2.webp"
                          alt="Face swap online free technology target image - demonstrating advanced AI neural network processing capabilities"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Replace Image</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-flawless-results-replace-image-source-face.webp"
                          alt="Face swap online free replace image source face - high-quality face image ready for seamless face swapping"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Face Swap Result</h4>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✨ AI Generated
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-technology-generated-face-swap-example-2.webp"
                          alt="Face swap online free technology result - showcasing deep-learning neural network face landmark detection and geometry mapping"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Creative Possibilities Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Unlocking Creative Possibilities with Our Face Swap Online Free Generator</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <ul>
                    <li><strong>Personalized Memes & Humor:</strong> Create highly shareable, humorous content by swapping your face onto famous movie characters, historical figures, or funny stock images.</li>
                    <li><strong>Cosplay and Costume Visualization:</strong> Use the <strong>Face Swap Online Free</strong> to instantly visualize how you would look in different outfits or makeup styles.</li>
                    <li><strong>Artistic Exploration:</strong> For digital artists, quickly test different facial expressions or models on an existing art piece.</li>
                    <li><strong>Gift Personalization:</strong> Create unique, personalized gifts by swapping the recipient's face onto a cherished image or artwork.</li>
                    <li><strong>Character Development:</strong> Writers and game developers can use the <strong>Face Swap Online Free</strong> feature to rapidly generate concept art for their characters.</li>
                  </ul>
                  
                  {/* 展示案例 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Target Image</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-creative-possibilities-target-image-example-3.webp"
                          alt="Face swap online free creative possibilities target image - showcasing personalized memes and humor applications"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Replace Image</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-flawless-results-replace-image-source-face.webp"
                          alt="Face swap online free replace image source face - high-quality face image ready for seamless face swapping"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Face Swap Result</h4>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✨ AI Generated
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-creative-possibilities-generated-face-swap-example-3.webp"
                          alt="Face swap online free creative possibilities result - demonstrating cosplay visualization and artistic exploration applications"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety and Ethics Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Maintaining Safety and Ethics with the Face Swap Online Free Tool</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    While the <strong>Face Swap Online Free</strong> technology is incredibly powerful, 
                    <strong>imagetovideo-ai</strong> is deeply committed to ensuring its responsible and ethical use.
                  </p>
                  <h3>User Consent and Privacy Policy</h3>
                  <p>
                    We strongly require all users of the <strong>Face Swap Online Free</strong> tool to upload images only 
                    when they have full consent from all individuals pictured. All uploaded images and generated content are 
                    handled with strict privacy protocols and are not stored permanently after the generation process is complete.
                  </p>
                  <h3>Content Moderation and Filtering</h3>
                  <p>
                    Our system incorporates advanced content filtering mechanisms to prevent the generation of explicit, 
                    discriminatory, or malicious content. The AI within the <strong>Face Swap Online Free</strong> tool is trained 
                    to identify and block attempts to create harmful or illegal deepfakes.
                  </p>
                  
                  {/* 展示案例 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Target Image</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-safety-ethics-target-image-example-4.webp"
                          alt="Face swap online free safety and ethics target image - demonstrating responsible use with user consent and privacy protection"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Replace Image</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-flawless-results-replace-image-source-face.webp"
                          alt="Face swap online free replace image source face - high-quality face image ready for seamless face swapping"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h4 className="text-base font-semibold text-foreground">Face Swap Result</h4>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✨ AI Generated
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group bg-muted/30 p-2">
                        <img
                          src="/imgs/showcases/face-swap-online-free-safety-ethics-generated-face-swap-example-4.webp"
                          alt="Face swap online free safety and ethics result - ethical face swap with content moderation and privacy protection"
                          className="w-full h-auto max-h-[320px] object-contain transition-all duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Optimization Tips Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimizing Your Images for the Best Face Swap Online Free Results</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <ul>
                    <li><strong>High Resolution is Key:</strong> Always use source and target images with the highest possible resolution.</li>
                    <li><strong>Consistent Lighting:</strong> For the most realistic blend, the lighting on the source face should ideally match the lighting on the target face.</li>
                    <li><strong>Clear, Unobstructed Faces:</strong> Avoid images where faces are partially obscured by hands, hair, hats, or harsh shadows.</li>
                    <li><strong>Similar Head Angles:</strong> Using a source face with a head angle similar to the target face will often yield a more seamless result.</li>
                    <li><strong>Expression Matters:</strong> The <strong>Face Swap Online Free</strong> can retain the target image's expression while swapping the face.</li>
                  </ul>
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <Card>
                <CardHeader>
                  <CardTitle>FAQ: Common Questions About the Face Swap Online Free Tool</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Is the Face Swap Online Free tool truly unlimited?</h3>
                    <p className="text-muted-foreground">
                      The core <strong>Face Swap Online Free</strong> functionality is permanently available at <strong>imagetovideo-ai</strong>. 
                      We provide generous daily usage limits for high-resolution output.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">What image formats are supported by the Face Swap Online Free generator?</h3>
                    <p className="text-muted-foreground">
                      The <strong>Face Swap Online Free</strong> tool currently supports common image formats, including JPEG, PNG, and WebP. 
                      We recommend using high-quality PNGs for the best color fidelity.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Can I use the Face Swap Online Free tool on mobile devices?</h3>
                    <p className="text-muted-foreground">
                      Yes, the <strong>Face Swap Online Free</strong> website at <strong>imagetovideo-ai</strong> is fully optimized 
                      for mobile browsers. You can upload images, perform the swap, and download the results seamlessly on any modern smartphone or tablet.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Will the generated image from the Face Swap Online Free have a watermark?</h3>
                    <p className="text-muted-foreground">
                      No, one of the key benefits of using the <strong>imagetovideo-ai Face Swap Online Free</strong> is that your 
                      final high-resolution swapped image is delivered completely without a watermark.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">What is the largest file size the Face Swap Online Free can handle?</h3>
                    <p className="text-muted-foreground">
                      The <strong>Face Swap Online Free</strong> tool is optimized to handle source and target images up to 10MB in size.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Are my original images kept after I use the Face Swap Online Free tool?</h3>
                    <p className="text-muted-foreground">
                      No. For your privacy, the images uploaded to the <strong>Face Swap Online Free</strong> generator are used strictly 
                      for the duration of the generation process. They are deleted shortly thereafter and are not stored on our servers.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Conclusion */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-lg text-muted-foreground">
                    The <strong>Face Swap Online Free</strong> tool from <strong>imagetovideo-ai</strong> is more than just a novelty; 
                    it is a powerful, professional-grade AI solution for creative personalization. By combining cutting-edge deep-learning 
                    technology with a commitment to user accessibility and ethical standards, we have created the ultimate platform for 
                    instant, high-quality face swapping. Start creating viral content, personalized art, and hilarious memes today with 
                    the best <strong>Face Swap Online Free</strong> tool available on the web.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

