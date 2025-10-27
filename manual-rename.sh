#!/bin/bash

cd "public/imgs/showcases"

# 重命名剩余的3个文件
mv "compressed_未命名项目-图层 1 (1).webp" "content-evolution-text-to-video-advantages.webp"
mv "compressed_未命名项目-图层 1 (3).webp" "text-to-video-platform-key-features-overview.webp"  
mv "compressed_未命名项目-图层 1 (4).webp" "simplified-text-to-video-workflow-process.webp"

echo "✅ 手动重命名完成！"
ls -la *text-to-video* *content-evolution* *workflow*

