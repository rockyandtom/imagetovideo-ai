"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

interface UploadedImage {
  file: File;
  preview: string;
}

interface EditResult {
  imageUrl: string;
  taskId: string;
}

export default function QwenImageEditClient() {
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedImage, setEditedImage] = useState<EditResult | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 开始编辑
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isProcessing && originalImage && editPrompt) {
        e.preventDefault();
        handleImageEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, originalImage, editPrompt]);

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage({
          file,
          preview: e.target?.result as string
        });
        // 重置编辑结果
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
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

  const handleImageEdit = async () => {
    if (!originalImage || !editPrompt) {
      alert("Please upload an image and enter edit prompt");
      return;
    }

    setIsProcessing(true);
    setEditedImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");
    
    try {
      // 上传图片并获取文件名
      const imageData = await uploadImageToRunningHub(originalImage.file);
      
      // 调用RunningHub API开始图片编辑
      const response = await fetch('/api/runninghub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'qwen-image-edit',
          webappId: "1958091611945185282",
          apiKey: "fb88fac46b0349c1986c9cbb4f14d44e",
          nodeInfoList: [
            {
              nodeId: "71",
              fieldName: "image",
              fieldValue: imageData,
              description: "image"
            },
            {
              nodeId: "73", 
              fieldName: "prompt",
              fieldValue: editPrompt,
              description: "prompt"
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
        throw new Error(result.error || 'Image editing failed');
      }
      
    } catch (error) {
      console.error('Image edit error:', error);
      const errorMessage = error instanceof Error ? error.message : "Image editing failed, please try again";
      alert(errorMessage);
      setIsProcessing(false);
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
            
            setEditedImage({
              imageUrl: result.data.imageUrl,
              taskId: taskId
            });
            setIsProcessing(false);
            setTaskId(null);
            return;
          } else if (result.data.status === 'running') {
            attempts++;
            
            // 计算进度 (基于时间估算)
            const elapsedMinutes = (attempts * 5) / 60; // 已经过的分钟数
            let progressPercent = 0;
            let timeEstimate = "";
            
            if (elapsedMinutes < 2) {
              progressPercent = Math.min(30, elapsedMinutes * 15); // First 2 minutes to 30%
              timeEstimate = "Analyzing image...";
            } else if (elapsedMinutes < 4) {
              progressPercent = 30 + Math.min(40, (elapsedMinutes - 2) * 20); // 2-4 minutes to 70%
              timeEstimate = "Applying editing effects...";
            } else if (elapsedMinutes < 6) {
              progressPercent = 70 + Math.min(20, (elapsedMinutes - 4) * 10); // 4-6 minutes to 90%
              timeEstimate = "Optimizing output...";
            } else {
              progressPercent = Math.min(95, 90 + (elapsedMinutes - 6) * 2.5); // After 6 minutes to 95%
              timeEstimate = "Almost done...";
            }
            
            setProgress(Math.round(progressPercent));
            setEstimatedTime(timeEstimate);
            
            console.log(`Task still running, attempt ${attempts}/${maxAttempts}, progress: ${progressPercent.toFixed(1)}%, message: ${result.data.message}`);
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 5000); // 5秒后再次检查
            } else {
              throw new Error('Task timeout - Image editing took longer than expected (10 minutes). Please try again.');
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
        const errorMessage = error instanceof Error ? error.message : "Failed to check image editing status";
        
        // Auto retry if network error and retry count is less than 3
        if (attempts < 3 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
          console.log(`Network error, retrying in 10 seconds... (attempt ${attempts + 1}/3)`);
          setTimeout(checkStatus, 10000);
          return;
        }
        
        alert(errorMessage);
        setIsProcessing(false);
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
        throw new Error(`上传图片到RunningHub失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('RunningHub upload result:', result);
      
      if (!result.success || !result.fileId) {
        throw new Error('RunningHub upload did not return file ID');
      }
      
      return result.fileId; // Return RunningHub file ID, format like: api/xxx.png
    } catch (error) {
      console.error('RunningHub upload error:', error);
      throw error;
    }
  };

  const ImageUploadArea = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        Upload Original Image
        <span className="text-red-500">*</span>
      </h3>
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          "focus-within:border-primary focus-within:bg-primary/5",
          originalImage ? "border-primary bg-primary/10" : "border-muted-foreground/25"
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
        
        {originalImage ? (
          <div className="space-y-3">
            <img
              src={originalImage.preview}
              alt="Original Image"
              className="max-h-48 mx-auto rounded-md object-cover"
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{originalImage.file.name}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setOriginalImage(null);
                  setEditedImage(null);
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
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Qwen Image Edit",
              "description": "Transform your imagination with Qwen Image Edit - powerful AI tools for image editing and video creation",
              "url": "https://imagetovideo-ai.net/image-editor/qwen-image-edit",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "AI-powered image editing",
                "Qwen Image Edit technology",
                "ComfyUI integration",
                "Free to use",
                "No registration required"
              ],
              "creator": {
                "@type": "Organization",
                "name": "ImageToVideoAI",
                "url": "https://imagetovideo-ai.net"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Qwen Image Edit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Qwen Image Edit is a cutting-edge AI-powered tool offered by ImageToVideo-AI that allows you to edit, modify, and generate images with incredible precision and creativity for video conversion."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is the Qwen Image Edit platform really free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our Qwen Image Edit platform is completely free to use. We believe in democratizing access to powerful AI tools, and we are committed to providing our core services without any cost or hidden fees."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What kind of edits can I perform with Qwen Image Edit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Qwen Image Edit can handle a wide range of tasks, including but not limited to: removing objects, changing backgrounds, applying stylistic effects, generating new content within an image, and much more for video pre-production."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do I need to download any software to use Qwen Image Edit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No, our Qwen Image Edit platform is entirely web-based. You can access all the tools directly from your browser without needing to download or install any software."
                  }
                }
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://imagetovideo-ai.net"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Image Editor",
                  "item": "https://imagetovideo-ai.net/image-editor"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Qwen Image Edit",
                  "item": "https://imagetovideo-ai.net/image-editor/qwen-image-edit"
                }
              ]
            }
          ])
        }}
      />
      
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
                Free AI Image Editor - 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Qwen Image Edit Tool
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Transform your images with advanced <strong>AI editing powered by Qwen technology</strong>! 
                Our <strong>free AI image editor</strong> offers intelligent editing capabilities, background removal, 
                object manipulation, and style transfer. No registration required, professional results in minutes.
              </p>
            </div>

            {/* Main Workspace */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiEditLine" className="w-5 h-5 text-primary" />
                  Qwen Image Edit Workspace
                </CardTitle>
                <CardDescription>
                  Upload your image and describe the editing effects you want. Qwen Image Edit will use advanced AI technology to process your image editing.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Image Upload and Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Upload Area */}
                  <div>
                    <ImageUploadArea />
                  </div>
                  
                  {/* Preview Area */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Edit Result Preview</h3>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
                      {editedImage ? (
                        <div className="space-y-3 w-full">
                          <img
                            src={editedImage.imageUrl}
                            alt="Edited Image"
                            className="max-h-48 mx-auto rounded-md object-cover"
                          />
                          <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">Edit Completed</p>
                            <div className="flex gap-2 justify-center">
                              <Button
                                onClick={async () => {
                                  if (isDownloading) return;
                                  
                                  setIsDownloading(true);
                                  try {
                                    // Fetch the image as blob to force download
                                    const response = await fetch(editedImage.imageUrl);
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
                                    link.download = `qwen-edited-image-${Date.now()}.${fileExtension}`;
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
                                }}
                                size="sm"
                                variant="default"
                                disabled={isDownloading}
                              >
                                {isDownloading ? (
                                  <>
                                    <Icon name="RiLoader4Line" className="w-4 h-4 mr-1 animate-spin" />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Icon name="RiDownloadLine" className="w-4 h-4 mr-1" />
                                    Download
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Icon name="RiImageLine" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Edited image will be displayed here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Prompt */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    Edit Prompt
                    <span className="text-red-500">*</span>
                  </h3>
                  <Textarea
                    placeholder="Describe the editing effects you want, e.g.: change model's clothes to blue sweater, change background to beach scene, add sunlight effects, etc..."
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  
                  {/* Quick Prompt Suggestions */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Quick Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Change clothing color",
                        "Change background scene", 
                        "Add lighting effects",
                        "Remove background objects",
                        "Adjust skin tone",
                        "Add decorative elements"
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            if (editPrompt) {
                              setEditPrompt(editPrompt + ", " + suggestion);
                            } else {
                              setEditPrompt(suggestion);
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
                        <li>• Describe the desired editing effects in detail</li>
                        <li>• Specify colors, materials, styles and other details</li>
                        <li>• You can describe multiple editing requirements simultaneously</li>
                        <li>• Using specific adjectives will get better results</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleImageEdit}
                    disabled={!originalImage || !editPrompt || isProcessing}
                    className="px-8 py-3 text-base font-medium"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Icon name="RiLoader4Line" className="w-4 h-4 animate-spin mr-2" />
                        {taskId ? 'Processing...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Icon name="RiMagicLine" className="w-4 h-4 mr-2" />
                        Start Editing
                        <span className="ml-2 text-xs opacity-60">
                          (Ctrl+Enter)
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Task Status */}
                {taskId && isProcessing && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                      <Icon name="RiInformationLine" className="w-4 h-4" />
                      <span className="text-sm font-medium">Task ID: {taskId}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Image Editing in Progress
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
                          Using Qwen Image Edit Technology
                        </span>
                        <span className="text-blue-500 dark:text-blue-400 font-medium">
                          {estimatedTime}
                        </span>
                      </div>
                      
                      <div className="bg-blue-100 dark:bg-blue-800/30 rounded-md p-3 mt-3">
                        <div className="flex items-start gap-2">
                          <Icon name="RiTimeLine" className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            <p className="font-medium mb-1">Expected Processing Time:</p>
                            <p>• Typical: 2-5 minutes</p>
                            <p>• Complex edits: up to 10 minutes</p>
                            <p className="mt-2 font-medium">Please keep the page open and be patient. The image will appear automatically when editing is complete.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Icon name="RiBrainLine" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-foreground">Core Technology</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Built on the latest AI and machine learning advancements, the Qwen Image Edit model is meticulously trained to understand context and intent with remarkable precision.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Icon name="RiSettingsLine" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-foreground">ComfyUI Integration</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Deep integration with ComfyUI, providing advanced users and developers with a powerful modular Stable Diffusion graphical interface for complex image compositing and precise control.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Icon name="RiGiftLine" className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-foreground">Completely Free</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We are committed to providing truly free service without compromising quality or features. Everyone should have access to the best AI image editing tools.
                </p>
              </Card>
            </div>

            <Separator />

            {/* Content Sections based on JSON */}
            <div className="space-y-12">
              {/* Core Technology Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">The Core Technology Behind Qwen Image Edit</h2>
                  <p className="text-muted-foreground">Powerful image editing capabilities driven by core technology</p>
                </div>
                <Card className="p-8">
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    At the heart of <strong>ImageToVideo-AI</strong> lies a robust <strong>Qwen Image Edit</strong> model, meticulously trained for a wide array of creative applications. 
                    This model is built on the latest advancements in AI and machine learning, allowing it to understand context and intent with remarkable precision. 
                    Unlike generic tools, our <strong>Qwen Image Edit</strong> system has been fine-tuned to handle everything from subtle color corrections to dramatic stylistic changes, 
                    all while maintaining the integrity of the image for video conversion. This makes it the perfect companion tool for our <a href="/image-to-video" className="text-primary hover:underline">Image to Video AI</a> generator. 
                    Whether you are trying to give your photo a cinematic feel or a vibrant comic book look before animating it, the <strong>Qwen Image Edit</strong> engine can deliver.
                  </p>
                  
                  {/* 展示案例 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-foreground">Original Photo</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                        <img
                          src="/imgs/showcases/qwen-image-edit-core-technology-original-photo-example-1.webp"
                          alt="Original photo before Qwen Image Edit core technology processing - demonstrating AI editing capabilities"
                          className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-foreground">Qwen Edit Result</h4>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🔧 AI Edited
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                        <img
                          src="/imgs/showcases/qwen-image-edit-core-technology-result-image-example-1.webp"
                          alt="Qwen Image Edit core technology result showcasing advanced AI editing and enhancement capabilities"
                          className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ComfyUI Integration Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Integrating ComfyUI for Advanced Qwen Image Edit</h2>
                  <p className="text-muted-foreground">Deep ComfyUI integration for advanced users</p>
                </div>
                <Card className="p-8">
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    For advanced users and developers, we offer deep integration with <strong>ComfyUI</strong>, a powerful and modular Stable Diffusion graphical interface. 
                    This synergy allows you to harness the full potential of our <strong>Qwen Image Edit</strong> capabilities within a highly customizable workflow. 
                    By connecting our <strong>Qwen Image Edit</strong> model to <strong>ComfyUI</strong>, 
                    you can create complex node graphs for tasks such as intricate image compositing, advanced inpainting, and precise control over generative outputs. 
                    This opens up a new realm of possibilities, allowing you to automate repetitive tasks, build custom pipelines, 
                    and achieve levels of detail and control that are simply not possible with traditional editing software.
                  </p>
                  
                  {/* 展示案例 2 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-foreground">Original Photo</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                        <img
                          src="/imgs/showcases/qwen-image-edit-comfyui-integration-original-photo-example-2.webp"
                          alt="Original photo before ComfyUI integration processing - demonstrating advanced Qwen Image Edit workflow"
                          className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-foreground">Qwen Edit Result</h4>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            ⚙️ ComfyUI
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                        <img
                          src="/imgs/showcases/qwen-image-edit-comfyui-integration-result-image-example-2.webp"
                          alt="Qwen Image Edit ComfyUI integration result showcasing advanced workflow and node-based editing capabilities"
                          className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* AI Image Generation Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">The Fusion of Qwen Image Edit and AI Image Generation</h2>
                  <p className="text-muted-foreground">Perfect fusion of Qwen Image Edit and AI image generation</p>
                </div>
                <Card className="p-8">
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    Our platform's commitment to providing free access to powerful AI tools is central to our mission. With <strong>ImageToVideo-AI</strong>, 
                    you can tap into the immense power of <strong>AI image generation</strong> to create and modify images for your video projects without any cost. 
                    The <strong>Qwen Image Edit</strong> functionality is not just about making minor tweaks; it's about empowering you to generate entirely new visual content. 
                    Imagine a tool that can take a simple sketch and turn it into a photorealistic background for a video, or one that can transform a photograph into a series of stylized frames for an animated sequence. 
                    This is the power of <strong>Qwen Image Edit</strong>. The <strong>AI image generation</strong> process is incredibly fast and intuitive, 
                    allowing you to see the results of your edits in real-time.
                  </p>
                  
                  {/* 展示案例 3 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-foreground">Original Photo</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                        <img
                          src="/imgs/showcases/qwen-image-edit-ai-generation-fusion-original-photo-example-3.webp"
                          alt="Original photo before AI image generation fusion processing - demonstrating Qwen Image Edit creative capabilities"
                          className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-foreground">Qwen Edit Result</h4>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🎨 AI Fusion
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                        <img
                          src="/imgs/showcases/qwen-image-edit-ai-generation-fusion-result-image-example-3.webp"
                          alt="Qwen Image Edit AI generation fusion result showcasing creative image generation and enhancement capabilities"
                          className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* GGUF Future Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">The Future of AI Image Creation with Qwen Image Edit GGUF</h2>
                  <p className="text-muted-foreground">Future prospects of Qwen Image Edit GGUF models</p>
                </div>
                <Card className="p-8">
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    The future of AI image generation is at the forefront of our development, and we are excited to be exploring the potential of <strong>Qwen Image Edit GGUF</strong> models. 
                    <strong>GGUF</strong> (GPT-Generated Unified Format) is a new format for storing and loading large language models, 
                    and its application to image generation models like <strong>Qwen Image Edit</strong> promises to revolutionize local AI processing. 
                    By optimizing our <strong>Qwen Image Edit GGUF</strong> models, we can enable users to run powerful editing and generation tasks directly on their own hardware, 
                    even on devices with limited VRAM. This not only enhances privacy and security but also provides unparalleled speed and control.
                  </p>
                  
                  {/* 展示案例 4 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-start">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-foreground">Original Photo</h4>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                        <img
                          src="/imgs/showcases/qwen-image-edit-future-gguf-original-photo-example-4.webp"
                          alt="Original photo before Qwen Image Edit GGUF processing - demonstrating future AI image creation capabilities"
                          className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-foreground">Qwen Edit Result</h4>
                        <div className="ml-auto">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🚀 GGUF Future
                          </span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl shadow-lg group max-h-96">
                        <img
                          src="/imgs/showcases/qwen-image-edit-future-gguf-result-image-example-4.webp"
                          alt="Qwen Image Edit GGUF future result showcasing next-generation AI image creation and local processing capabilities"
                          className="w-full h-auto max-h-96 object-contain transition-all duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Separator />

            {/* SEO Content Area */}
            <div className="space-y-8">
              {/* AI Image Editor Comparison */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Qwen Image Edit vs Traditional Photo Editors: Why AI is the Future
                </h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Comprehensive AI Image Editor Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-lg text-primary mb-2">Qwen Image Edit</h3>
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <ul className="text-sm space-y-2 text-left">
                              <li>✅ <strong>Completely Free</strong> to use</li>
                              <li>✅ <strong>AI-Powered</strong> intelligent editing</li>
                              <li>✅ <strong>Text Commands</strong> for editing</li>
                              <li>✅ <strong>No Registration</strong> required</li>
                              <li>✅ <strong>Professional Results</strong> in minutes</li>
                              <li>✅ <strong>Background Removal</strong> AI</li>
                              <li>✅ <strong>Style Transfer</strong> capabilities</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-lg text-muted-foreground mb-2">Adobe Photoshop</h3>
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <ul className="text-sm space-y-2 text-left">
                              <li>❌ <strong>$20.99/month</strong> subscription</li>
                              <li>⚠️ Steep learning curve</li>
                              <li>⚠️ Manual tool manipulation</li>
                              <li>❌ Requires software installation</li>
                              <li>⚠️ Time-intensive editing</li>
                              <li>⚠️ Complex background removal</li>
                              <li>⚠️ Limited AI features</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-lg text-muted-foreground mb-2">Canva</h3>
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <ul className="text-sm space-y-2 text-left">
                              <li>❌ <strong>$12.99/month</strong> for Pro</li>
                              <li>⚠️ Limited editing capabilities</li>
                              <li>⚠️ Template-based approach</li>
                              <li>⚠️ Basic AI features only</li>
                              <li>⚠️ Watermarked free version</li>
                              <li>⚠️ Simple background removal</li>
                              <li>❌ No advanced AI editing</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">
                        Why Qwen Image Edit is the Best Free AI Image Editor?
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Qwen Image Edit democratizes professional image editing by combining the power of advanced AI with 
                        an intuitive text-based interface. No more complex tools or expensive subscriptions—just describe 
                        what you want, and our <strong>AI image editor</strong> delivers professional results instantly.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Use Cases */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  AI Image Editing Use Cases: Transform Your Creative Workflow
                </h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Applications for AI Image Editing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold text-primary mb-2">E-commerce & Product Photography</h4>
                          <p className="text-sm text-muted-foreground">
                            Remove backgrounds, enhance product colors, and create professional product shots with 
                            <strong>AI background removal</strong> and intelligent enhancement features.
                          </p>
                        </div>
                        
                        <div className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold text-primary mb-2">Social Media Content</h4>
                          <p className="text-sm text-muted-foreground">
                            Create eye-catching social media posts with style transfer, object manipulation, 
                            and artistic effects powered by our <strong>free AI image editor</strong>. 
                            Perfect for Instagram and TikTok creators who need to refine visuals before using our <a href="/sora-2-ai-video-generator" className="text-primary hover:underline">Sora 2 Video Generator</a>.
                          </p>
                        </div>
                        
                        <div className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold text-primary mb-2">Marketing & Advertising</h4>
                          <p className="text-sm text-muted-foreground">
                            Transform marketing materials with intelligent editing, brand color application, 
                            and professional enhancement techniques.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold text-primary mb-2">Creative Design Projects</h4>
                          <p className="text-sm text-muted-foreground">
                            Explore artistic possibilities with AI-powered style transfer, creative effects, 
                            and intelligent composition adjustments.
                          </p>
                        </div>
                        
                        <div className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold text-primary mb-2">Photography Enhancement</h4>
                          <p className="text-sm text-muted-foreground">
                            Enhance portraits, landscapes, and artistic photography with intelligent color correction, 
                            lighting adjustments, and professional finishing touches.
                          </p>
                        </div>
                        
                        <div className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold text-primary mb-2">Content Creation</h4>
                          <p className="text-sm text-muted-foreground">
                            Create compelling visual content for blogs, websites, and digital platforms with 
                            AI-powered editing and enhancement capabilities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            <Separator className="my-8" />

            {/* FAQ Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Frequently Asked Questions About AI Image Editing</h2>
                <p className="text-muted-foreground">Learn more about Qwen Image Edit and how it can transform your creative workflow</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">What is Qwen Image Edit?</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>Qwen Image Edit</strong> is a cutting-edge AI-powered tool offered by <strong>ImageToVideo-AI</strong> that allows you to edit, modify, and generate images with incredible precision and creativity for video conversion.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Is the Qwen Image Edit platform really free?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, our <strong>Qwen Image Edit</strong> platform is completely free to use. We believe in democratizing access to powerful AI tools, and we are committed to providing our core services without any cost or hidden fees.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">What kind of edits can I perform with Qwen Image Edit?</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>Qwen Image Edit</strong> can handle a wide range of tasks, including but not limited to: removing objects, changing backgrounds, applying stylistic effects, generating new content within an image, and much more for video pre-production.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Do I need to download any software to use Qwen Image Edit?</h3>
                  <p className="text-sm text-muted-foreground">
                    No, our <strong>Qwen Image Edit</strong> platform is entirely web-based. You can access all the tools directly from your browser without needing to download or install any software. This makes it convenient and accessible from any device.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">What is the difference between Qwen Image Edit and other AI tools?</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>Qwen Image Edit</strong> stands out due to its advanced model, user-friendly interface, and our commitment to being a completely free service. We offer a level of quality and control that is often found only in expensive, premium software.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Is my data and privacy protected when using Qwen Image Edit?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, we prioritize user privacy. We do not store your uploaded images or personal data. The editing process is handled securely, and for local processing options like <strong>Qwen Image Edit GGUF</strong>, your data never even leaves your machine.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">Can I use Qwen Image Edit for commercial projects?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, you can use images created and edited with <strong>Qwen Image Edit</strong> for commercial purposes. There are no restrictions on the use of the final output, giving you the freedom to create and monetize your work.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">How often is the Qwen Image Edit model updated?</h3>
                  <p className="text-sm text-muted-foreground">
                    We continuously update our <strong>Qwen Image Edit</strong> model and add new features to the platform. Our team is dedicated to staying at the cutting edge of AI technology to provide you with the best possible tools and performance for video creation.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
