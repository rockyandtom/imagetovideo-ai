# ImageToVideoAI - Text to Image & Image to Video Generator

Ship Any AI SaaS Startups in hours. Now featuring advanced Text to Image generation capabilities.

![preview](preview.png)

## 🆕 Latest Updates

### Hold Up Dance 功能完整实现 (2025-10-30)
- ✅ 创建完整的Hold Up Dance页面 (`/video-effects/hold-up-dance`)
- ✅ 实现专业的工作区界面，包含图片上传和AI视频生成功能
- ✅ 集成RunningHub API (webappId: 1958505283771330562) 进行Hold Up Dance视频生成
- ✅ 支持拖拽上传和点击上传，支持JPG、PNG、GIF格式（最大10MB）
- ✅ 实现实时进度条和任务状态跟踪（3-15分钟处理时间）
- ✅ 基于Hold Up Dance JSON内容创建完整的SEO优化页面内容
- ✅ 包含详细的技术说明、自定义选项和FAQ部分
- ✅ 实现响应式设计，支持移动端和桌面端
- ✅ 添加专门的API端点 `/api/runninghub-hold-up-dance`
- ✅ 集成现有的文件上传和任务状态检查系统
- ✅ 优化用户体验，包含加载状态和错误处理
- ✅ 实现一键下载生成的Hold Up Dance视频
- ✅ 在Video Effects目录页添加Hold Up Dance功能卡片（粉色到玫瑰色渐变，HOT标签）
- ✅ 在导航栏Video Effects下拉菜单中添加"Hold Up Dance"子链接
- ✅ 在页脚Video Effects区域添加"Hold Up Dance"子链接
- ✅ 支持中英文双语界面，完善导航结构
- ✅ 使用Hold Up Dance主题的粉色到玫瑰色渐变设计
- ✅ 添加结构化数据和完整的元数据优化
- ✅ 集成图片到视频转换的AI工作流，支持Hold Up Dance动作生成
- ✅ 实现完整的内容管理，包含技术介绍、自定义说明和应用场景
- ✅ 添加专业的工作区界面，左侧图片上传，右侧视频预览（参考Ghibli页面设计）
- ✅ 实现完整的视频下载和分享功能，支持多种下载方式和错误处理
- ✅ 修复API响应格式问题（code: 200 → code: 0），确保与RunningHub API兼容
- ✅ 优化用户界面，使用粉色到玫瑰色渐变主题，与Hold Up Dance风格匹配
- ✅ 项目构建测试通过，无语法错误或linting问题

### Video Effects 页面和导航系统实现 (2025-10-30)
- ✅ 在导航栏Photo Effects后添加"Video Effects"主菜单项（横向铺开，无子菜单）
- ✅ 创建Video Effects主页面 (`/video-effects`)
- ✅ 添加完整的中英文多语言翻译支持（英文：Video Effects，中文：视频特效）
- ✅ 在页脚添加Video Effects链接（横向铺开布局，位于Support前）
- ✅ 设计专业的渐变色彩方案（紫色到蓝色主题）
- ✅ 实现6个主要功能模块：视频滤镜、动画效果、特殊效果、音频增强、颜色校正、稳定化处理
- ✅ 每个功能模块包含独特的图标、渐变色和悬停效果
- ✅ 添加"Why Choose Our Video Effects?"特色说明区域
- ✅ 实现响应式设计，支持移动端和桌面端
- ✅ 添加SEO优化的元数据，包括OpenGraph和Twitter卡片
- ✅ 创建功能预览卡片和专业的CTA按钮
- ✅ 集成现有的导航组件和页面布局系统
- ✅ 参照Image Editor页面设计模板，保持UI一致性
- ✅ 确保所有主标题在导航栏和页脚中横向对齐
- ✅ 项目构建测试通过，无语法错误或linting问题

### Ghibli AI Generator 功能完整实现 (2025-10-29)
- ✅ 创建完整的Ghibli AI Generator页面 (`/photo-effects/ghibli-ai-generator`)
- ✅ 实现专业的工作区界面，包含图片上传、AI转换和下载功能
- ✅ 集成RunningHub API (webappId: 1958799927906365441) 进行吉卜力风格转换
- ✅ 支持拖拽上传和点击上传，支持JPG、PNG、GIF格式
- ✅ 实现实时进度条和任务状态跟踪（3-10分钟处理时间）
- ✅ 基于JSON内容创建完整的SEO优化页面内容
- ✅ 包含详细的使用技巧、FAQ部分和功能说明
- ✅ 实现响应式设计，支持移动端和桌面端
- ✅ 添加专门的API端点 `/api/ghibli-generator`
- ✅ 集成现有的文件上传和任务状态检查系统
- ✅ 优化用户体验，包含加载状态和错误处理
- ✅ 实现一键下载生成的吉卜力风格艺术作品
- ✅ 在Photo Effects目录页添加Ghibli AI Generator功能卡片
- ✅ 在导航栏Photo Effects下拉菜单中添加"Ghibli AI Generator"子链接
- ✅ 在页脚Photo Effects区域添加"Ghibli AI Generator"子链接
- ✅ 支持中英文双语界面，完善导航结构
- ✅ 使用吉卜力主题的绿色到蓝色渐变设计
- ✅ 添加结构化数据和完整的元数据优化
- ✅ 修复页面服务端组件错误和空href属性问题
- ✅ 修复RunningHub上传API的apiKey传递问题（需通过FormData传递）
- ✅ 修复Ghibli Generator状态查询API的认证问题（添加apiKey参数）
- ✅ 改进前端错误处理和调试信息，增强结果数据解析的健壮性
- ✅ 重构Ghibli Generator使用现有的/api/runninghub API而不是自定义API
- ✅ 统一API调用方式，确保与其他功能保持一致
- ✅ 修复图片下载功能，解决跨域下载问题
- ✅ 创建下载代理API (/api/download-proxy) 处理外部图片下载
- ✅ 添加多层下载策略：直接下载 → 代理下载 → 新窗口打开
- ✅ 添加下载状态指示和错误处理机制

### Photo Effects 页面和导航系统实现 (2025-10-29)
- ✅ 在导航栏Image Editor后添加"Photo Effects"主菜单项（横向铺开，无子菜单）
- ✅ 创建Photo Effects主页面 (`/photo-effects`)
- ✅ 添加完整的中英文多语言翻译支持
- ✅ 在页脚添加Photo Effects链接（横向铺开布局）
- ✅ 设计专业的渐变色彩方案（紫色到粉色主题）
- ✅ 实现响应式设计，支持移动端和桌面端
- ✅ 添加SEO优化的元数据，包括OpenGraph和Twitter卡片
- ✅ 创建功能预览卡片和"Coming Soon"提示区域
- ✅ 集成现有的导航组件和页面布局系统
- ✅ 修正导航结构，删除不必要的子页面和子菜单

### AI Image Upscaler 功能完整实现 (2025-10-25)
- ✅ 创建完整的Image Upscaler页面 (`/image-editor/image-upscaler`)
- ✅ 实现专业的工作区界面，包含图片上传、预览和下载功能
- ✅ 集成RunningHub API (webappId: 1957750464492269570) 进行图片放大处理
- ✅ 支持拖拽上传和点击上传两种方式
- ✅ 提供4种预设放大倍数：2x, 3x, 4x 和自定义设置
- ✅ 实现自定义尺寸调整控件（top, bottom, left, right）
- ✅ 添加实时进度条和任务状态跟踪
- ✅ 基于JSON内容创建完整的SEO优化页面内容
- ✅ 包含详细的FAQ部分和功能说明
- ✅ 实现响应式设计，支持移动端和桌面端
- ✅ 添加专门的API端点 `/api/runninghub/image-upscaler`
- ✅ 集成现有的文件上传和任务状态检查系统
- ✅ 优化用户体验，包含加载状态和错误处理
- ✅ 支持JPG, PNG, WebP等主流图片格式
- ✅ 实现一键下载处理后的高清图片
- ✅ 在导航栏Image Editor下拉菜单中添加"AI Image Upscaler"链接
- ✅ 在页脚Image Editor区域添加"AI Image Upscaler"子链接
- ✅ 完善导航结构，提供完整的用户访问路径

### Image Editor 页面和导航栏更新 (2025-10-24)
- ✅ 在导航栏Support标题前添加"Image Editor"链接
- ✅ 创建新的Image Editor内页 (`/image-editor`)
- ✅ 复用首页的导航栏和页脚结构
- ✅ 修改页脚布局，将主标题横向一字排开
- ✅ 除Support外的其他主标题全部做成可点击链接
- ✅ 在页脚添加Image Editor锚文本链接
- ✅ 实现响应式设计，支持移动端和桌面端
- ✅ 添加AI功能预览卡片（AI Enhancement, Background Removal, Smart Filters）
- ✅ 设计"Coming Soon"提示区域，为未来功能做准备
- ✅ 完善SEO元数据，包括OpenGraph和Twitter卡片
- ✅ 修复国际化配置，确保页面正常渲染
- ✅ 清理Next.js构建缓存，解决Internal Server Error问题

### NextAuth.js 配置修复 (2025-10-23)
- ✅ 修复 NextAuth.js MissingSecret 错误
- ✅ 在 auth/config.ts 中添加必需的 secret 配置
- ✅ 添加 fallback secret 用于开发环境
- ✅ 更新 README 文档，添加环境变量配置说明
- ✅ 提供完整的 OAuth 配置示例

### Text to Video Feature Added (2025-01-22)
- ✅ Added Text to Video page (`/text-to-video`)
- ✅ Integrated RunningHub text-to-video API (webappId: 1980924375140581377)
- ✅ Support for 5 video aspect ratios (1:1, 3:4, 4:3, 9:16, 16:9)
- ✅ Real-time progress tracking and status display
- ✅ Video preview and download functionality
- ✅ Added Text to Video link to navigation bar in second position
- ✅ Complete page structure based on texttovideo.json content
- ✅ UI design style referencing Image-to-Video page
- ✅ Keyboard shortcut support (Ctrl+Enter to generate)
- ✅ Smart text input suggestions and usage tips
- ✅ Comprehensive FAQ section and feature showcase
- ✅ Professional workflow instructions and user guidance
- ✅ Full English localization for global users
- ✅ English error messages and API responses
- ✅ Fixed RunningHub API response handling (code: 0 = success)
- ✅ Updated to Next.js 15 async params requirements
- ✅ Robust error handling for different response formats
- ✅ Fixed empty href attribute warnings in React components
- ✅ Cleaned up temporary files and completed integration
- ✅ Enhanced comprehensive logging system for debugging
- ✅ Fixed SUCCESS status video URL retrieval using outputs API
- ✅ Resolved frontend not responding to completed tasks
- ✅ Implemented proper RunningHub workflow: status → outputs
- ✅ Added queue full error handling with user-friendly messages
- ✅ Verified complete end-to-end text-to-video generation workflow
- ✅ Successfully generated and validated multiple test videos

### Privacy Policy Page Enhancement (2024-10-22)
- ✅ 完全重构隐私政策页面布局和设计
- ✅ 使用与首页一致的品牌标题"Image To Video AI"
- ✅ 添加现代化的头部导航栏，包含返回按钮和品牌Logo
- ✅ 实现完整的页脚信息，与首页格式保持一致
- ✅ 全英文版本，符合网站整体语言风格
- ✅ 优化内容结构，增加11个详细章节
- ✅ 添加视觉元素：渐变背景、图标、彩色卡片
- ✅ 实现响应式设计，支持移动端和桌面端
- ✅ 增加数据保护表格和权利说明
- ✅ 符合GDPR、CCPA等国际隐私法规要求
- ✅ 使用正确的联系邮箱：support@imgtovideoai.com
- ✅ 添加深色模式支持
- ✅ 去掉不必要的生效日期信息
- ✅ 优化布局：左侧目录导航 + 右侧主要内容，充分利用屏幕宽度
- ✅ 添加粘性目录导航，提升用户体验

### Text to Image Feature Added (2025-01-22)
- ✅ 新增Text to Image页面 (`/text-to-image`)
- ✅ 集成RunningHub文生图API (webappId: 1980827034278608897)
- ✅ 支持23种图片比例选择 (1:1到32:9)
- ✅ 实时进度跟踪和状态显示
- ✅ 图片预览和下载功能
- ✅ 导航栏新增Text to Image链接
- ✅ 基于texttovideo.json内容的完整页面结构
- ✅ 参考Image-to-Video页面的UI设计风格
- ✅ 支持键盘快捷键 (Ctrl+Enter生成)
- ✅ 智能提示词建议功能

## Quick Start

1. Clone the repository

```bash
git clone https://github.com/shipanyai/shipany-template-one.git
```

2. Install dependencies

```bash
pnpm install
```

3. Run the development server

```bash
pnpm dev
```

## Customize

- Set your environment variables

```bash
cp .env.example .env.local
```

**重要：NextAuth.js 配置**

为了修复认证错误，需要在 `.env.local` 文件中添加以下必需配置：

```bash
# NextAuth.js 必需配置
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# 可选：OAuth 提供商配置
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
AUTH_GITHUB_ID=your-github-client-id  
AUTH_GITHUB_SECRET=your-github-client-secret
```

**注意：** 如果不配置 `NEXTAUTH_SECRET`，会出现 "MissingSecret" 错误导致认证功能无法使用。

- Set your theme in `src/app/theme.css`

[tweakcn](https://tweakcn.com/editor/theme)

- Set your landing page content in `src/i18n/pages/landing`

- Set your i18n messages in `src/i18n/messages`

## Deploy

- Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fshipanyai%2Fshipany-template-one&project-name=my-shipany-project&repository-name=my-shipany-project&redirect-url=https%3A%2F%2Fshipany.ai&demo-title=ShipAny&demo-description=Ship%20Any%20AI%20Startup%20in%20hours%2C%20not%20days&demo-url=https%3A%2F%2Fshipany.ai&demo-image=https%3A%2F%2Fpbs.twimg.com%2Fmedia%2FGgGSW3La8AAGJgU%3Fformat%3Djpg%26name%3Dlarge)

- Deploy to Cloudflare

for new project, clone with branch "cloudflare"

```shell
git clone -b cloudflare https://github.com/shipanyai/shipany-template-one.git
```

for exist project, checkout to branch "cloudflare"

```shell
git checkout cloudflare
```

1. Customize your environment variables

```bash
cp .env.example .env.production
cp wrangler.toml.example wrangler.toml
```

edit your environment variables in `.env.production`

and put all the environment variables under `[vars]` in `wrangler.toml`

2. Deploy

```bash
npm run cf:deploy
```

## Community

- [ShipAny](https://shipany.ai)
- [Documentation](https://docs.shipany.ai)

## License

- [ShipAny AI SaaS Boilerplate License Agreement](LICENSE)
