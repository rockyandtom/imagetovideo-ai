# ImageToVideoAI - Text to Image & Image to Video Generator

Ship Any AI SaaS Startups in hours. Now featuring advanced Text to Image generation capabilities.

![preview](preview.png)

## 🆕 Latest Updates

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
