import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";
import Icon from "@/components/icon";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "Effects Library - Animation & Visual Effects";
  const description = "Explore 100+ professional animation and visual effects. Make your videos more vivid and engaging with our effects library.";

  return {
    title: title,
    description: description,
    alternates: {
      canonical: `https://imagetovideo-ai.net/${locale}/effects`,
    },
  };
}

export default function EffectsPage() {
  const effectCategories = [
    {
      name: "基础动画",
      description: "简单易用的基础动画效果",
      effects: [
        { name: "自然流动", icon: "RiWaterLine", description: "模拟自然水流效果", difficulty: "简单" },
        { name: "镜头推进", icon: "RiZoomInLine", description: "动态镜头推进效果", difficulty: "简单" },
        { name: "旋转效果", icon: "RiRotateLockLine", description: "360度旋转动画", difficulty: "简单" },
        { name: "波浪动画", icon: "RiWaveLine", description: "波浪式动态效果", difficulty: "中等" },
      ]
    },
    {
      name: "高级特效",
      description: "专业的视觉特效和动画",
      effects: [
        { name: "粒子效果", icon: "RiSparklingLine", description: "粒子系统动画", difficulty: "高级" },
        { name: "光效", icon: "RiSunLine", description: "动态光影效果", difficulty: "高级" },
        { name: "变形效果", icon: "RiShapeLine", description: "形状变形动画", difficulty: "高级" },
        { name: "故障效果", icon: "RiErrorWarningLine", description: "数字故障风格", difficulty: "高级" },
      ]
    },
    {
      name: "创意效果",
      description: "独特的创意动画效果",
      effects: [
        { name: "像素化", icon: "RiGridLine", description: "像素艺术风格", difficulty: "中等" },
        { name: "油画效果", icon: "RiPaintBrushLine", description: "油画风格动画", difficulty: "高级" },
        { name: "素描效果", icon: "RiPencilLine", description: "素描风格动画", difficulty: "中等" },
        { name: "水彩效果", icon: "RiWaterLine", description: "水彩画风格", difficulty: "高级" },
      ]
    },
    {
      name: "动态效果",
      description: "充满活力的动态动画",
      effects: [
        { name: "爆炸效果", icon: "RiFireLine", description: "爆炸式动画", difficulty: "高级" },
        { name: "烟雾效果", icon: "RiCloudLine", description: "烟雾弥漫效果", difficulty: "高级" },
        { name: "闪电效果", icon: "RiFlashLine", description: "闪电动画效果", difficulty: "高级" },
        { name: "火焰效果", icon: "RiFireLine", description: "火焰燃烧效果", difficulty: "高级" },
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "简单":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "中等":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "高级":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      

      <div className="container py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">特效库</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            探索我们丰富的动画效果库，包含100+种专业特效，让您的视频更加生动有趣
          </p>
        </div>

        {/* 特效分类展示 */}
        <div className="space-y-12">
          {effectCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.effects.map((effect, effectIndex) => (
                  <Card key={effectIndex} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                          <Icon name={effect.icon} className="h-6 w-6 text-white" />
                        </div>
                        <Badge className={`text-xs ${getDifficultyColor(effect.difficulty)}`}>
                          {effect.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mb-2">{effect.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {effect.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 预览区域 */}
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                          <div className="text-center">
                            <Icon name={effect.icon} className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">效果预览</p>
                          </div>
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Icon name="RiEyeLine" className="h-4 w-4 mr-1" />
                            预览
                          </Button>
                          <Button size="sm" className="flex-1">
                            <Icon name="RiAddLine" className="h-4 w-4 mr-1" />
                            应用
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 使用统计 */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">特效使用统计</CardTitle>
              <CardDescription className="text-center">
                了解最受欢迎的特效效果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">100+</div>
                  <div className="text-sm text-muted-foreground">可用特效</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">50K+</div>
                  <div className="text-sm text-muted-foreground">特效应用次数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">4.9</div>
                  <div className="text-sm text-muted-foreground">用户评分</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快速开始 */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">开始使用特效</CardTitle>
              <CardDescription>
                选择您喜欢的特效，开始创建精彩的视频
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/make/create">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Icon name="RiAddLine" className="h-5 w-5 mr-2" />
                    创建视频
                  </Button>
                </Link>
                <Link href="/make/studio">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Icon name="RiPaletteLine" className="h-5 w-5 mr-2" />
                    视频工作室
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 