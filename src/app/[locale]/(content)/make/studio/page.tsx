"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

export default function VideoStudioPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [videoDuration, setVideoDuration] = useState(3);
  const [videoQuality, setVideoQuality] = useState("hd");

  const effects = [
    { id: "flow", name: "自然流动", icon: "RiWaterLine", description: "模拟自然水流效果" },
    { id: "zoom", name: "镜头推进", icon: "RiZoomInLine", description: "动态镜头推进效果" },
    { id: "rotate", name: "旋转效果", icon: "RiRotateLockLine", description: "360度旋转动画" },
    { id: "wave", name: "波浪动画", icon: "RiWaveLine", description: "波浪式动态效果" },
    { id: "particle", name: "粒子效果", icon: "RiSparklingLine", description: "粒子系统动画" },
    { id: "light", name: "光效", icon: "RiSunLine", description: "动态光影效果" },
    { id: "morph", name: "变形效果", icon: "RiShapeLine", description: "形状变形动画" },
    { id: "glitch", name: "故障效果", icon: "RiErrorWarningLine", description: "数字故障风格" },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEffectToggle = (effectId: string) => {
    setSelectedEffects(prev => 
      prev.includes(effectId) 
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  };

  const handleGenerate = () => {
    if (!selectedImage) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    // 模拟生成进度
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      

      <div className="container py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* 左侧控制面板 */}
          <div className="xl:col-span-1 space-y-6">
            {/* 上传区域 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiUploadLine" className="h-5 w-5" />
                  上传图片
                </CardTitle>
                <CardDescription>
                  支持 JPG、PNG、WEBP 格式，建议尺寸 1920x1080
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Icon name="RiImageAddLine" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        点击上传或拖拽图片到此处
                      </p>
                      <p className="text-xs text-muted-foreground">
                        最大文件大小 10MB
                      </p>
                    </label>
                  </div>
                  
                  {selectedImage && (
                    <div className="relative">
                      <img
                        src={selectedImage}
                        alt="预览"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setSelectedImage(null)}
                      >
                        <Icon name="RiCloseLine" className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 视频设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiSettings4Line" className="h-5 w-5" />
                  视频设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 视频时长 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">视频时长</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[videoDuration]}
                      onValueChange={(value) => setVideoDuration(value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-8">{videoDuration}s</span>
                  </div>
                </div>

                {/* 视频质量 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">视频质量</Label>
                  <Select value={videoQuality} onValueChange={setVideoQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sd">标清 (480p)</SelectItem>
                      <SelectItem value="hd">高清 (720p)</SelectItem>
                      <SelectItem value="fhd">全高清 (1080p)</SelectItem>
                      <SelectItem value="4k">4K (2160p)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 帧率 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">帧率</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 FPS</SelectItem>
                      <SelectItem value="30">30 FPS</SelectItem>
                      <SelectItem value="60">60 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 动画效果 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiMagicLine" className="h-5 w-5" />
                  动画效果
                </CardTitle>
                <CardDescription>
                  选择要应用的动画效果，可多选
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {effects.map((effect) => (
                    <Button
                      key={effect.id}
                      variant={selectedEffects.includes(effect.id) ? "default" : "outline"}
                      size="sm"
                      className="h-auto p-3 flex-col gap-1"
                      onClick={() => handleEffectToggle(effect.id)}
                    >
                      <Icon name={effect.icon} className="h-4 w-4" />
                      <span className="text-xs">{effect.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 高级设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiToolsLine" className="h-5 w-5" />
                  高级设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">智能优化</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">背景模糊</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">保持原始比例</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">增强细节</Label>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 中间预览区域 */}
          <div className="xl:col-span-2 space-y-6">
            {/* 预览区域 */}
            <Card className="min-h-[500px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="RiEyeLine" className="h-5 w-5" />
                    实时预览
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Icon name="RiRefreshLine" className="h-4 w-4" />
                      刷新
                    </Button>
                    <Button variant="outline" size="sm">
                      <Icon name="RiFullscreenLine" className="h-4 w-4" />
                      全屏
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25 overflow-hidden">
                  {selectedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={selectedImage}
                        alt="预览"
                        className="w-full h-full object-cover"
                      />
                      {/* 效果预览覆盖层 */}
                      {selectedEffects.length > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse" />
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Icon name="RiImageLine" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">上传图片后开始预览</p>
                      <Button size="sm" variant="outline">
                        <Icon name="RiUploadLine" className="h-4 w-4 mr-2" />
                        选择图片
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 生成控制 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiPlayCircleLine" className="h-5 w-5" />
                  生成控制
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    className="flex-1" 
                    size="lg"
                    onClick={handleGenerate}
                    disabled={!selectedImage || isGenerating}
                  >
                    <Icon name="RiPlayFill" className="h-5 w-5 mr-2" />
                    {isGenerating ? "生成中..." : "开始生成"}
                  </Button>
                  <Button variant="outline" size="lg" disabled={!isGenerating}>
                    <Icon name="RiStopLine" className="h-5 w-5 mr-2" />
                    停止
                  </Button>
                </div>
                
                {/* 生成进度 */}
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>生成进度</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="RiInformationLine" className="h-4 w-4" />
                      正在处理中，请稍候...
                    </div>
                  </div>
                )}

                {!isGenerating && selectedImage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="RiInformationLine" className="h-4 w-4" />
                    准备就绪，点击开始生成按钮开始处理
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 效果预览 */}
            {selectedEffects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="RiPaletteLine" className="h-5 w-5" />
                    已选效果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedEffects.map((effectId) => {
                      const effect = effects.find(e => e.id === effectId);
                      return (
                        <Badge key={effectId} variant="secondary" className="flex items-center gap-1">
                          <Icon name={effect?.icon || "RiSparklingLine"} className="h-3 w-3" />
                          {effect?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧面板 */}
          <div className="xl:col-span-1 space-y-6">
            {/* 项目信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiFileListLine" className="h-5 w-5" />
                  项目信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">项目名称</Label>
                  <input
                    type="text"
                    placeholder="输入项目名称"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">描述</Label>
                  <textarea
                    placeholder="项目描述（可选）"
                    className="w-full px-3 py-2 border rounded-md text-sm h-20 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>创建时间</span>
                  <span className="text-muted-foreground">刚刚</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>文件大小</span>
                  <span className="text-muted-foreground">0 MB</span>
                </div>
              </CardContent>
            </Card>

            {/* 历史记录 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiHistoryLine" className="h-5 w-5" />
                  最近项目
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "风景动画", time: "2分钟前", status: "completed", thumbnail: "/imgs/showcases/1.png" },
                    { name: "人物肖像", time: "5分钟前", status: "processing", thumbnail: "/imgs/showcases/2.png" },
                    { name: "产品展示", time: "10分钟前", status: "completed", thumbnail: "/imgs/showcases/3.png" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="w-12 h-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.status === "completed" && (
                          <Badge variant="secondary" className="text-xs">
                            完成
                          </Badge>
                        )}
                        {item.status === "processing" && (
                          <Badge variant="default" className="text-xs">
                            处理中
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Icon name="RiDownloadLine" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="RiFlashlightLine" className="h-5 w-5" />
                  快速操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Icon name="RiSaveLine" className="h-4 w-4 mr-2" />
                    保存项目
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Icon name="RiShareLine" className="h-4 w-4 mr-2" />
                    分享项目
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Icon name="RiDownloadLine" className="h-4 w-4 mr-2" />
                    导出视频
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Icon name="RiDeleteBinLine" className="h-4 w-4 mr-2" />
                    删除项目
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部功能区 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiLightbulbLine" className="h-5 w-5" />
                使用技巧
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-start gap-3">
                  <Icon name="RiCheckLine" className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">高质量图片</p>
                    <p className="text-xs text-muted-foreground">使用高分辨率图片获得最佳效果</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="RiCheckLine" className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">合适的比例</p>
                    <p className="text-xs text-muted-foreground">16:9 比例最适合视频生成</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="RiCheckLine" className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">清晰主体</p>
                    <p className="text-xs text-muted-foreground">确保图片主体清晰，背景简洁</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="RiCheckLine" className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">效果组合</p>
                    <p className="text-xs text-muted-foreground">可以组合多种效果创造独特动画</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 