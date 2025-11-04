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
  const title = "AI Video Tools - Video Generation Toolkit";
  const description = "Explore powerful AI video generation toolkit. Includes image-to-video, video editing, and special effects creation tools.";

  return {
    title: title,
    description: description,
    alternates: {
      canonical: `https://imagetovideo-ai.net/${locale}/tools`,
    },
  };
}

export default function ToolsPage() {
  const tools = [
    {
      id: "create",
      name: "Image to Video",
      description: "Convert static images into vivid video animations",
      icon: "RiImageLine",
      features: ["Smart Animation", "Multiple Effects", "HD Output", "Batch Processing"],
      status: "available",
      url: "/make/create",
      color: "from-blue-500 to-purple-600",
      gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))",
    },
    {
      id: "studio",
      name: "Video Studio",
      description: "Professional video production and editing tools",
      icon: "RiPaletteLine",
      features: ["Real-time Preview", "Advanced Effects", "Project Management", "Team Collaboration"],
      status: "pro",
      url: "/make/studio",
      color: "from-purple-500 to-pink-600",
      gradient: "linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))",
    },
    {
      id: "batch",
      name: "Batch Processing",
      description: "Process multiple images simultaneously to improve efficiency",
      icon: "RiFolderLine",
      features: ["Batch Upload", "Queue Management", "Progress Tracking", "Batch Download"],
      status: "coming",
      url: "#",
      color: "from-green-500 to-teal-600",
      gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(20, 184, 166, 0.2))",
    },
    {
      id: "effects",
      name: "Effects Library",
      description: "Rich animation effects and visual effects",
      icon: "RiSparklingLine",
      features: ["100+ Effects", "Custom Parameters", "Effect Preview", "One-click Apply"],
      status: "available",
      url: "/effects",
      color: "from-blue-500 to-blue-600",
      gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))",
    },
    {
      id: "templates",
      name: "Template Center",
      description: "Preset templates for quick professional video creation",
      icon: "RiLayoutLine",
      features: ["Industry Templates", "Holiday Themes", "Brand Customization", "One-click Apply"],
      status: "coming",
      url: "#",
      color: "from-indigo-500 to-blue-600",
      gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(59, 130, 246, 0.2))",
    },
    {
      id: "api",
      name: "API接口",
      description: "开发者友好的API接口服务",
      icon: "RiCodeLine",
      features: ["RESTful API", "SDK支持", "文档完善", "技术支持"],
      status: "available",
      url: "/api",
      color: "from-gray-500 to-slate-600",
      gradient: "linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(71, 85, 105, 0.2))",
    },
  ];

  const categories = [
    {
      name: "基础工具",
      description: "入门级视频生成工具",
      tools: tools.filter(t => t.id === "create" || t.id === "effects"),
    },
    {
      name: "专业工具",
      description: "高级视频制作功能",
      tools: tools.filter(t => t.id === "studio" || t.id === "batch"),
    },
    {
      name: "扩展功能",
      description: "增强功能和开发工具",
      tools: tools.filter(t => t.id === "templates" || t.id === "api"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container py-12">
        {/* 页面标题 - 采用现代化设计 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
              ✨ AI视频工具集
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
            AI视频工具集
          </h1>
          <p className="text-lg text-slate-600 max-w-4xl mx-auto leading-relaxed">
            探索我们强大的AI视频生成工具集，从简单的图生视频到专业的视频制作，满足您的各种需求
          </p>
        </div>

        {/* 工具分类展示 - 优化布局和视觉效果 */}
        <div className="space-y-16">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="relative">
              {/* 分类标题 */}
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-2 text-slate-900">{category.name}</h2>
                <p className="text-slate-600 text-lg">{category.description}</p>
              </div>
              
              {/* 工具卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.tools.map((tool) => (
                  <Card 
                    key={tool.id}
                    className="group relative overflow-hidden modern-card card-hover-effect"
                  >
                    {/* 背景渐变装饰 */}
                    <div 
                      className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                      style={{ background: tool.gradient }}
                    />
                    
                    <CardHeader className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        {/* 图标容器 */}
                        <div 
                          className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
                        >
                          <Icon name={tool.icon} className="h-8 w-8 text-blue-600" />
                        </div>
                        
                        {/* 状态标签 */}
                        <div className="flex items-center gap-2">
                          {tool.status === "available" && (
                            <Badge className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-medium">
                              可用
                            </Badge>
                          )}
                          {tool.status === "pro" && (
                            <Badge className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full text-xs font-medium">
                              Pro
                            </Badge>
                          )}
                          {tool.status === "coming" && (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-medium">
                              即将推出
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <CardTitle className="text-2xl mb-3 text-slate-900 font-bold">
                        {tool.name}
                      </CardTitle>
                      <CardDescription className="text-slate-600 text-base leading-relaxed">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="relative z-10">
                      <div className="space-y-6">
                        {/* 功能列表 */}
                        <div className="space-y-3">
                          {tool.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                              <span className="text-slate-600 font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="pt-6">
                          {tool.status === "available" || tool.status === "pro" ? (
                            <Link href={tool.url}>
                              <Button 
                                className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                                  tool.status === "pro" 
                                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
                                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                }`}
                              >
                                <Icon name="RiArrowRightLine" className="h-5 w-5 mr-2" />
                                {tool.status === "pro" ? "立即使用" : "开始使用"}
                              </Button>
                            </Link>
                          ) : (
                            <Button 
                              className="w-full h-12 text-base font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                              disabled
                            >
                              <Icon name="RiTimeLine" className="h-5 w-5 mr-2" />
                              即将推出
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 功能对比 - 现代化表格设计 */}
        <div className="mt-20">
          <Card className="bg-white border border-blue-100 overflow-hidden">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-slate-900 mb-2">功能对比</CardTitle>
              <CardDescription className="text-slate-600 text-lg">
                了解不同工具的功能差异，选择最适合您的方案
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-left py-4 px-6 font-semibold text-slate-800 text-base">功能</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-800 text-base">图生视频</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-800 text-base">视频工作室</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-800 text-base">批量处理</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "图片上传", basic: "✓", pro: "✓", batch: "✓" },
                      { feature: "视频时长", basic: "1-10秒", pro: "1-60秒", batch: "1-30秒" },
                      { feature: "视频质量", basic: "最高1080p", pro: "最高4K", batch: "最高1080p" },
                      { feature: "动画效果", basic: "6种基础", pro: "50+种高级", batch: "6种基础" },
                      { feature: "实时预览", basic: "✗", pro: "✓", batch: "✗" },
                      { feature: "项目管理", basic: "✗", pro: "✓", batch: "✗" },
                      { feature: "批量处理", basic: "✗", pro: "✗", batch: "✓" },
                      { feature: "API访问", basic: "✗", pro: "✓", batch: "✗" },
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors duration-200">
                        <td className="py-4 px-6 font-medium text-slate-700">{row.feature}</td>
                        <td className="text-center py-4 px-6 text-slate-600">{row.basic}</td>
                        <td className="text-center py-4 px-6 text-slate-600">{row.pro}</td>
                        <td className="text-center py-4 px-6 text-slate-600">{row.batch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快速开始 - 现代化CTA设计 */}
        <div className="mt-20 text-center">
          <Card className="max-w-4xl mx-auto bg-white border border-blue-100 overflow-hidden">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">快速开始</CardTitle>
              <CardDescription className="text-slate-600 text-lg">
                选择您需要的工具，开始创建精彩的AI视频
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/make/create">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Icon name="RiAddLine" className="h-5 w-5 mr-2" />
                    开始创建视频
                  </Button>
                </Link>
                <Link href="/make/studio">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto h-12 text-base font-semibold border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Icon name="RiPaletteLine" className="h-5 w-5 mr-2" />
                    进入视频工作室
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