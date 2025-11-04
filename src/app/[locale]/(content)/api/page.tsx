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
  const title = "API Interface - Developer-Friendly Video Generation API";
  const description = "Provides RESTful API interface supporting image-to-video, batch processing and more, with complete SDK and documentation.";

  return {
    title: title,
    description: description,
    alternates: {
      canonical: `https://imagetovideo-ai.net/${locale}/api`,
    },
  };
}

export default function ApiPage() {
  const apiEndpoints = [
    {
      method: "POST",
      path: "/api/v1/video/create",
      description: "创建视频",
      parameters: ["image_url", "duration", "effects", "quality"],
      response: "video_url"
    },
    {
      method: "GET",
      path: "/api/v1/video/status/{id}",
      description: "获取视频状态",
      parameters: ["video_id"],
      response: "status, progress, video_url"
    },
    {
      method: "POST",
      path: "/api/v1/video/batch",
      description: "批量创建视频",
      parameters: ["images", "settings"],
      response: "batch_id, tasks"
    },
    {
      method: "GET",
      path: "/api/v1/effects",
      description: "获取可用特效",
      parameters: [],
      response: "effects_list"
    }
  ];

  const sdks = [
    {
      name: "JavaScript/Node.js",
      icon: "RiJavascriptLine",
      description: "适用于Web和Node.js环境",
      features: ["TypeScript支持", "Promise API", "错误处理"],
      url: "#"
    },
    {
      name: "Python",
      icon: "RiPythonLine",
      description: "Python官方SDK",
      features: ["异步支持", "类型提示", "文档完善"],
      url: "#"
    },
    {
      name: "PHP",
      icon: "RiPhpLine",
      description: "PHP官方SDK",
      features: ["Composer支持", "PSR标准", "简单易用"],
      url: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      

      <div className="container py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">API接口</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            提供RESTful API接口，支持图片转视频、批量处理等功能，包含完整的SDK和文档
          </p>
        </div>

        {/* API概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiApiLine" className="h-5 w-5" />
                RESTful API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                基于REST架构的API接口，支持JSON格式的数据交换
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiShieldCheckLine" className="h-5 w-5" />
                安全认证
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                支持API Key认证，确保接口调用安全可靠
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="RiSpeedLine" className="h-5 w-5" />
                高性能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                优化的API性能，支持高并发请求处理
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API端点 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">API端点</h2>
          <div className="space-y-4">
            {apiEndpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={endpoint.method === "POST" ? "default" : "secondary"}
                      className="font-mono"
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">参数</h4>
                        <div className="space-y-1">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="text-xs text-muted-foreground">
                              • {param}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">响应</h4>
                        <div className="text-xs text-muted-foreground">
                          {endpoint.response}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SDK支持 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">SDK支持</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sdks.map((sdk, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                      <Icon name={sdk.icon} className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{sdk.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {sdk.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {sdk.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2 text-sm">
                          <Icon name="RiCheckLine" className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      <Icon name="RiDownloadLine" className="h-4 w-4 mr-2" />
                      下载SDK
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 快速开始 */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">快速开始</CardTitle>
              <CardDescription>
                获取API Key并开始集成我们的视频生成服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h3 className="font-medium mb-2">注册账户</h3>
                    <p className="text-sm text-muted-foreground">
                      创建账户并获取API Key
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h3 className="font-medium mb-2">下载SDK</h3>
                    <p className="text-sm text-muted-foreground">
                      选择适合的SDK并安装
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h3 className="font-medium mb-2">开始集成</h3>
                    <p className="text-sm text-muted-foreground">
                      按照文档集成API
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg">
                    <Icon name="RiKeyLine" className="h-5 w-5 mr-2" />
                    获取API Key
                  </Button>
                  <Button size="lg" variant="outline">
                    <Icon name="RiBookLine" className="h-5 w-5 mr-2" />
                    查看文档
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 定价信息 */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">API定价</CardTitle>
              <CardDescription>
                灵活的定价方案，按使用量计费
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">免费</div>
                  <div className="text-sm text-muted-foreground mb-4">每月100次调用</div>
                  <Button variant="outline" size="sm">开始使用</Button>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">专业版</div>
                  <div className="text-sm text-muted-foreground mb-4">每月10,000次调用</div>
                  <Button size="sm">选择方案</Button>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">企业版</div>
                  <div className="text-sm text-muted-foreground mb-4">无限调用</div>
                  <Button variant="outline" size="sm">联系销售</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 