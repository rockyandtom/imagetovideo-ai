import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';
const WEBAPP_ID = '1917499707512524801';

// 启动 Face Swap 任务
export async function POST(request: NextRequest) {
  try {
    const { targetImage, replaceImage } = await request.json();
    
    if (!targetImage || !replaceImage) {
      return NextResponse.json({ error: 'Missing targetImage or replaceImage' }, { status: 400 });
    }

    console.log('启动 Face Swap 任务:', { targetImage, replaceImage });

    // 构建请求数据，严格按照用户提供的 curl 格式
    const data = {
      webappId: WEBAPP_ID,
      apiKey: API_KEY,
      nodeInfoList: [
        {
          nodeId: "22",
          fieldName: "image",
          fieldValue: targetImage,
          description: "放入目标图片"
        },
        {
          nodeId: "61",
          fieldName: "image",
          fieldValue: replaceImage,
          description: "放入替换图片"
        }
      ]
    };

    console.log('Face Swap 请求数据:', JSON.stringify(data, null, 2));

    const response = await fetch(`${API_BASE_URL}/task/openapi/ai-app/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.cn'
      },
      body: JSON.stringify(data)
    });

    console.log('RunningHub Face Swap 响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunningHub Face Swap 创建失败:', response.status, errorText);
      return NextResponse.json({ 
        error: `Face swap task creation failed: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('RunningHub Face Swap 响应:', JSON.stringify(result, null, 2));

    // 检查响应状态
    if (result.code !== 0) {
      return NextResponse.json({ 
        error: result.msg || 'Face swap task creation failed',
        code: result.code,
        details: result
      }, { status: 400 });
    }

    if (!result.data || !result.data.taskId) {
      return NextResponse.json({ 
        error: 'No taskId returned from RunningHub',
        details: result
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      taskId: result.data.taskId
    });
  } catch (error) {
    console.error('Face Swap API 错误:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

