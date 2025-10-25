"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UpscaleSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export default function ImageUpscalerClient() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState<UpscaleSettings>({
    top: 0,
    bottom: 0,
    left: 304,
    right: 304,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  // 处理文件选择（统一处理上传和拖拽）
  const handleFileSelection = (file: File) => {
    if (file.type.startsWith("image/")) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResultUrl(""); // 清除之前的结果
    } else {
      toast.error("Please select a valid image file");
    }
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  // 上传图片到服务器并获取文件名
  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/runninghub-upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Upload failed");
    }
    
    return data.fileId; // 使用正确的字段名
  };

  // 检查任务状态
  const checkTaskStatus = async (taskId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/runninghub/status/${taskId}`);
      if (!response.ok) {
        throw new Error("Failed to check task status");
      }
      
      const data = await response.json();
      
      // 检查是否任务完成并有结果
      if (data.status === "completed" && data.videoUrl) {
        return data.videoUrl; // 对于图片放大，结果也在videoUrl字段中
      } else if (data.status === "failed" || data.error) {
        throw new Error(data.error || "Task failed");
      }
      
      return null; // 任务还在进行中
    } catch (error) {
      console.error("Error checking task status:", error);
      throw error;
    }
  };

  // 调用AI处理API
  const processImage = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // 上传图片
      toast.info("Uploading image...");
      setProgress(20);
      const imageId = await uploadImageToServer(selectedImage);

      // 调用处理API
      toast.info("Starting image upscaling...");
      setProgress(40);
      
      const response = await fetch("/api/runninghub/image-upscaler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: imageId,
          settings: settings
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process image");
      }

      const result = await response.json();
      
      if (!result.success || !result.taskId) {
        throw new Error("No task ID received");
      }

      // 轮询检查任务状态
      toast.info("Processing image with AI...");
      setProgress(60);
      
      const taskId = result.taskId;
      let resultUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 30; // 最多等待5分钟 (30 * 10秒)
      
      while (attempts < maxAttempts && !resultUrl) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
        
        try {
          resultUrl = await checkTaskStatus(taskId);
          attempts++;
          
          // 更新进度
          const progressValue = Math.min(60 + (attempts / maxAttempts) * 35, 95);
          setProgress(progressValue);
          
        } catch (error) {
          console.error("Status check error:", error);
          attempts++;
          
          if (attempts >= maxAttempts) {
            throw new Error("Task status check failed");
          }
        }
      }

      if (!resultUrl) {
        throw new Error("Task timeout - please try again");
      }

      // 完成进度
      setProgress(100);
      setResultUrl(resultUrl);
      toast.success("Image upscaled successfully!");

    } catch (error) {
      console.error("Error processing image:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // 下载处理后的图片
  const downloadResult = async () => {
    if (!resultUrl || isDownloading) return;
    
    setIsDownloading(true);
    try {
      console.log('开始下载图片:', resultUrl);
      
      // 使用fetch获取图片数据
      const response = await fetch(resultUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
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
      
      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const baseName = selectedImage?.name ? selectedImage.name.replace(/\.[^/.]+$/, '') : 'image';
      const filename = `upscaled-${baseName}-${timestamp}.${fileExtension}`;
      
      // 创建对象URL
      const url = window.URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('图片下载成功');
      toast.success('Image download started!');
      
    } catch (error) {
      console.error('下载图片失败:', error);
      toast.error('Failed to download image. Please try again.');
      
      // 如果fetch失败，回退到直接链接方式（虽然可能打开新页面）
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = `upscaled_${selectedImage?.name || "image.png"}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  // 调整设置的快捷按钮
  const presetButtons = [
    { label: "2x Upscale", settings: { top: 0, bottom: 0, left: 304, right: 304 } },
    { label: "3x Upscale", settings: { top: 152, bottom: 152, left: 456, right: 456 } },
    { label: "4x Upscale", settings: { top: 304, bottom: 304, left: 608, right: 608 } },
    { label: "Custom", settings: { top: 100, bottom: 100, left: 200, right: 200 } },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section with Workspace */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful AI Image Upscaler: Transform Your Photos with High-Quality Enhancements
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enhance your images with our powerful AI Image Upscaler. Free and fast, imagetovideo-ai helps you upscale images without losing quality.
            </p>
          </div>

          {/* Workspace */}
          <Card className="max-w-4xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">AI Image Upscaler Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:border-blue-500"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  <ImageIcon className={`mx-auto h-12 w-12 ${isDragOver ? "text-blue-500" : "text-gray-400"}`} />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragOver ? "Drop your image here" : "Upload your image"}
                    </p>
                    <p className="text-gray-500">Drag and drop or click to select</p>
                    <p className="text-sm text-gray-400 mt-2">Supports JPG, PNG, WebP formats</p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isProcessing}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                </div>
              </div>

              {/* Upscale Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {presetButtons.map((preset, index) => (
                  <Button
                    key={index}
                    variant={JSON.stringify(settings) === JSON.stringify(preset.settings) ? "default" : "outline"}
                    onClick={() => setSettings(preset.settings)}
                    className="h-12"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Custom Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Top</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, top: Math.max(0, prev.top - 50) }))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center text-sm">{settings.top}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, top: prev.top + 50 }))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bottom</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, bottom: Math.max(0, prev.bottom - 50) }))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center text-sm">{settings.bottom}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, bottom: prev.bottom + 50 }))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Left</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, left: Math.max(0, prev.left - 50) }))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center text-sm">{settings.left}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, left: prev.left + 50 }))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Right</label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, right: Math.max(0, prev.right - 50) }))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center text-sm">{settings.right}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSettings(prev => ({ ...prev, right: prev.right + 50 }))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Preview and Results */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Original Image Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Original Image</h3>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                        <p>No image selected</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upscaled Result */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Upscaled Result</h3>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {resultUrl ? (
                      <img
                        src={resultUrl}
                        alt="Upscaled"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 mb-2" />
                        <p>Processed image will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={processImage}
                  disabled={!selectedImage || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Upscale Image"
                  )}
                </Button>

                {resultUrl && (
                  <Button
                    onClick={downloadResult}
                    disabled={isDownloading}
                    variant="outline"
                    className="px-8 py-3 text-lg"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Result
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* What is an AI Image Upscaler */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">What is an AI Image Upscaler and How Does It Work?</h2>
            <div className="prose prose-lg text-gray-700">
              <p>
                In the digital age, high-quality images are crucial for everything from marketing to personal projects. An <strong>AI image upscaler</strong> is a revolutionary tool that uses advanced artificial intelligence to increase the resolution of a photo without compromising its quality. Unlike traditional methods that simply stretch pixels, our AI models analyze the image content to intelligently add new pixels, preserving intricate details and clarity.
              </p>
              <p>
                The <strong>imagetovideo-ai</strong> platform, known for its powerful AI video and image tools, leverages cutting-edge algorithms trained on vast datasets of images. This enables our <strong>image upscaler</strong> to recognize patterns, textures, and lines, reconstructing the image with a level of detail that was previously impossible. This process is not just about making a picture bigger; it's about making it better, sharper, and more vibrant.
              </p>
            </div>
          </div>

          {/* Why Choose imagetovideo-ai */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose imagetovideo-ai for Your Image Upscaler Needs?</h2>
            <div className="prose prose-lg text-gray-700">
              <p>
                When it comes to enhancing your images, quality, speed, and ease of use are paramount. The <strong>imagetovideo-ai</strong> platform stands out as the premier <strong>image upscaler</strong> solution for several reasons. Firstly, our service is built on state-of-the-art AI technology. We've invested heavily in training our models to handle a wide range of image types, from portraits and landscapes to product photos and digital art.
              </p>
              <p>
                Secondly, our platform is incredibly user-friendly. You don't need to be a tech expert or a professional designer to achieve stunning results. Our intuitive interface allows you to upload your image, select your desired upscaling factor, and let the AI do the rest. The process is quick and seamless, saving you valuable time.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Unlock the Power of High Resolution: How Our Image Upscaler Benefits You</h2>
            <div className="prose prose-lg text-gray-700">
              <p>
                High-resolution images are a non-negotiable requirement for many modern applications. A low-resolution photo can appear pixelated and unprofessional, especially on large screens or in print. Our <strong>image upscaler</strong> addresses this issue head-on, providing a solution that can dramatically improve your visual content.
              </p>
              <p>
                For e-commerce businesses, a high-quality product image can directly impact sales. Our <strong>image upscaler</strong> ensures that every detail of your product is crisp and clear, building trust with your customers. For social media managers and content creators, visually stunning posts are key to engagement.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Features of Our AI Image Upscaler: Quality, Speed, and Versatility</h2>
            <div className="prose prose-lg text-gray-700">
              <p>
                Our <strong>AI image upscaler</strong> is packed with features designed to deliver the best possible results. The core of our technology is a deep learning model that excels at recognizing and recreating details. This allows us to offer multiple upscaling factors, so you can choose the right resolution for your needs.
              </p>
              <p>
                We also offer features like noise reduction and sharpening, which work in tandem with the upscaling process to produce a clean, professional-looking image. The platform supports a wide range of image formats, ensuring that you can use our <strong>image upscaler</strong> with virtually any file you have.
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">FAQ: Your Questions About Our Image Upscaler Answered</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What is an AI image upscaler?</h3>
                <p className="text-gray-700">
                  An <strong>AI image upscaler</strong> is a tool that uses artificial intelligence to increase the resolution of a digital image. Unlike traditional methods that stretch pixels and cause blurriness, an AI upscaler intelligently adds new pixels to enhance detail, clarity, and overall quality.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">How is imagetovideo-ai's image upscaler different from others?</h3>
                <p className="text-gray-700">
                  Our <strong>image upscaler</strong> is powered by advanced deep learning models trained on vast datasets, allowing it to produce superior results. It's fast, easy to use, and seamlessly integrated into the <strong>imagetovideo-ai</strong> platform, offering a comprehensive suite of AI tools.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Is the imagetovideo-ai image upscaler free to use?</h3>
                <p className="text-gray-700">
                  Yes, our <strong>image upscaler</strong> is available for free with certain limitations. We offer various subscription plans for users who need more features, higher volume, or access to our full suite of AI tools.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What file formats does the image upscaler support?</h3>
                <p className="text-gray-700">
                  Our <strong>image upscaler</strong> supports a wide range of popular image formats, including JPG, PNG, and more. We aim to provide a versatile tool that works with most common file types.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">What is the maximum upscaling factor?</h3>
                <p className="text-gray-700">
                  Our <strong>image upscaler</strong> allows you to increase the resolution of your image by up to 4x. We are continuously improving our technology to offer even higher upscaling factors while maintaining quality.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Is my data and privacy safe when using the image upscaler?</h3>
                <p className="text-gray-700">
                  Yes. We take your privacy very seriously. All images uploaded to our <strong>image upscaler</strong> are processed securely and are not stored on our servers longer than necessary to complete the task.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
