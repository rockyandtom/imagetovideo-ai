import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';
const WEBAPP_ID = '1941035905484537857';

export async function POST(request: NextRequest) {
  try {
    const { imageId, desc } = await request.json();
    
    if (!imageId || !desc) {
      return NextResponse.json({ error: 'Missing imageId or desc' }, { status: 400 });
    }

    console.log('代理创建AI任务:', { imageId, desc });

    // 严格按照curl命令格式
    const data = {
      webappId: "1941035905484537857", // 使用字符串避免JavaScript数字精度问题
      apiKey: "fb88fac46b0349c1986c9cbb4f14d44e",
      nodeInfoList: [
        {
          nodeId: "20",
          fieldName: "image",
          fieldValue: imageId
        },
        {
          nodeId: "21",
          fieldName: "text",
          fieldValue: desc
        }
      ]
    };

    console.log('AI任务请求数据:', JSON.stringify(data, null, 2));

    const response = await fetch(`${API_BASE_URL}/task/openapi/ai-app/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.cn'
      },
      body: JSON.stringify(data)
    });

    console.log('RunningHub AI任务响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunningHub AI任务创建失败:', response.status, errorText);
      return NextResponse.json({ 
        error: `AI task creation failed: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('RunningHub AI任务响应:', JSON.stringify(result, null, 2));

    // 检查特殊错误情况
    if (result.code !== 0) {
      const errorMsg = result.msg || result.message || 'Unknown error';
      
      // 特殊处理队列满的情况
      if (errorMsg.includes('TASK_QUEUE_MAXED') || errorMsg.includes('queue') || errorMsg.includes('maxed')) {
        return NextResponse.json({
          code: result.code,
          msg: errorMsg,
          error: 'TASK_QUEUE_MAXED',
          userMessage: '服务器任务队列已满，请稍后重试',
          retryable: true,
          data: null
        });
      }
      
      // 其他错误
      return NextResponse.json({
        code: result.code,
        msg: errorMsg,
        error: errorMsg,
        userMessage: `任务创建失败: ${errorMsg}`,
        retryable: false,
        data: null
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('代理AI任务创建出错:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 