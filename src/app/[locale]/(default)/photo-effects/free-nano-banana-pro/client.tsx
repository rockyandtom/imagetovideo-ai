"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";

interface UploadedImage {
  file: File;
  preview: string;
  id: number; // 0, 1, 2, 3 corresponding to slots
}

interface EditResult {
  imageUrl: string;
  taskId: string;
}

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 Square" },
  { value: "2:3", label: "2:3 Portrait" },
  { value: "3:2", label: "3:2 Landscape" },
  { value: "3:4", label: "3:4 Portrait" },
  { value: "4:3", label: "4:3 Landscape" },
  { value: "4:5", label: "4:5 Portrait" },
  { value: "5:4", label: "5:4 Landscape" },
  { value: "9:16", label: "9:16 Mobile" },
  { value: "16:9", label: "16:9 Desktop" },
  { value: "21:9", label: "21:9 Cinematic" },
  { value: "auto", label: "Auto" },
];

export default function FreeNanoBananaProClient() {
  // 4 slots for images
  const [images, setImages] = useState<(UploadedImage | null)[]>([null, null, null, null]);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("4:3");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<EditResult | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection for a specific slot
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeSlot === null) return;
    
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newImages = [...images];
        newImages[activeSlot] = {
          file,
          preview: ev.target?.result as string,
          id: activeSlot
        };
        setImages(newImages);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    fileInputRef.current?.click();
  };

  const removeImage = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages[slotIndex] = null;
    setImages(newImages);
  };

  const handleGenerate = async () => {
    // Check if at least one image is uploaded
    const uploadedImagesCount = images.filter(img => img !== null).length;
    if (uploadedImagesCount === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsProcessing(true);
    setResultImage(null);
    setProgress(0);
    setEstimatedTime("Initializing...");

    try {
      // Upload images to RunningHub
      const uploadedFileIds = await Promise.all(
        images.map(async (img) => {
          if (!img) return null;
          return await uploadImageToRunningHub(img.file);
        })
      );

      // Call our API
      const response = await fetch('/api/runninghub/free-nano-banana-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: uploadedFileIds, // Array containing fileIds or nulls
          prompt,
          aspectRatio
        })
      });

      const result = await response.json();
      
      if (result.success && result.taskId) {
        setTaskId(result.taskId);
        pollTaskStatus(result.taskId);
      } else {
        throw new Error(result.error || 'Generation failed');
      }

    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : "Generation failed, please try again");
      setIsProcessing(false);
      setTaskId(null);
    }
  };

  const uploadImageToRunningHub = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/runninghub-upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to upload image');
    const result = await response.json();
    if (!result.success || !result.fileId) throw new Error('No file ID received');
    
    return result.fileId;
  };

  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 120;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch('/api/runninghub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            taskId: taskId
          })
        });

        const result = await response.json();

        if (result.success) {
          if (result.data.status === 'completed' && result.data.imageUrl) {
            setResultImage({
              imageUrl: result.data.imageUrl,
              taskId: taskId
            });
            setIsProcessing(false);
            setTaskId(null);
            return;
          } else if (result.data.status === 'running') {
            attempts++;
            // Fake progress
            const progressPercent = Math.min(95, Math.round((attempts / 60) * 100));
            setProgress(progressPercent);
            setEstimatedTime("Processing...");
            
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 3000);
            } else {
              throw new Error('Timeout');
            }
          } else {
            throw new Error(result.data.message || 'Unexpected status');
          }
        } else {
          throw new Error(result.error || 'Status check failed');
        }
      } catch (error) {
        console.error('Status check error:', error);
        if (attempts < maxAttempts) setTimeout(checkStatus, 5000);
      }
    };

    checkStatus();
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileSelect} 
      />

      <div className="flex flex-col lg:flex-row gap-8 justify-center">
        {/* Left Column: Workspace - 50% width */}
        <div className="w-full lg:w-1/2 flex-shrink-0 space-y-6">
          {/* Image Upload Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index}
                className={cn(
                  "aspect-square relative border-2 border-dashed rounded-lg transition-colors cursor-pointer flex flex-col items-center justify-center p-2",
                  images[index] ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
                onClick={() => triggerUpload(index)}
              >
                {images[index] ? (
                  <>
                    <img 
                      src={images[index]!.preview} 
                      alt={`Input ${index + 1}`} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div 
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-red-500 transition-colors"
                      onClick={(e) => removeImage(index, e)}
                    >
                      <Icon name="RiCloseLine" className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                      Image {index + 1}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Icon name="RiImageAddLine" className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground block leading-tight">Upload Image {index + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                placeholder="Describe your desired result..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-24 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select ratio" />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map(ratio => (
                    <SelectItem key={ratio.value} value={ratio.value}>{ratio.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full text-base h-12" 
              size="lg" 
              onClick={handleGenerate}
              disabled={isProcessing || images.every(img => img === null)}
            >
              {isProcessing ? (
                <>
                  <Icon name="RiLoader4Line" className="w-5 h-5 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Icon name="RiMagicLine" className="w-5 h-5 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Preview - 50% width */}
        <div className="w-full lg:w-1/2 min-w-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-6">
              <CardTitle className="text-xl">Generated Result</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center min-h-[500px] bg-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/10 m-6 mt-0 relative">
              {resultImage ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                  <img 
                    src={resultImage.imageUrl} 
                    alt="Generated Result" 
                    className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                  />
                  <div className="mt-6 flex gap-4">
                    <Button
                      onClick={() => window.open(resultImage.imageUrl, '_blank')}
                      variant="outline"
                      size="lg"
                    >
                      <Icon name="RiFullscreenLine" className="w-5 h-5 mr-2" />
                      View Full
                    </Button>
                    <Button
                      size="lg"
                      onClick={async () => {
                        if (isDownloading) return;
                        setIsDownloading(true);
                        try {
                          const response = await fetch(resultImage.imageUrl);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `nano-banana-pro-${Date.now()}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (e) {
                          console.error(e);
                          alert("Download failed");
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                    >
                      {isDownloading ? (
                        <Icon name="RiLoader4Line" className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Icon name="RiDownloadLine" className="w-5 h-5 mr-2" />
                      )}
                      Download
                    </Button>
                  </div>
                </div>
              ) : isProcessing ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <h3 className="text-xl font-medium">Generating Image...</h3>
                    <p className="text-muted-foreground mt-2">{estimatedTime} ({progress}%)</p>
                  </div>
                  <div className="w-72 h-2.5 bg-muted rounded-full overflow-hidden mx-auto">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Icon name="RiImageLine" className="w-20 h-20 mx-auto mb-4 opacity-20" />
                  <p className="text-xl font-medium">Preview Area</p>
                  <p className="text-sm mt-2 max-w-xs mx-auto">Upload images on the left and click Generate to see the magic happen here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
