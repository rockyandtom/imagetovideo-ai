import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';
const WEBAPP_ID = '1960913221911810050';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing image parameter' 
      }, { status: 400 });
    }

    console.log(`[${requestId}] ===== Nano Banana API Request Started =====`);
    console.log(`[${requestId}] Input image:`, image);

    // 构建请求负载，根据用户提供的 API 格式
    const requestPayload = {
      webappId: WEBAPP_ID,
      apiKey: API_KEY,
      instanceType: "plus",
      nodeInfoList: [
        {
          nodeId: "5",
          fieldName: "image",
          fieldValue: image, // 上传后的文件ID
          description: "image"
        }
      ]
    };

    console.log(`[${requestId}] Sending to RunningHub:`, {
      url: `${API_BASE_URL}/task/openapi/ai-app/run`,
      webappId: requestPayload.webappId,
      nodeInfoList: requestPayload.nodeInfoList
    });

    // 调用 RunningHub API
    const runningHubResponse = await fetch(`${API_BASE_URL}/task/openapi/ai-app/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.cn'
      },
      body: JSON.stringify(requestPayload)
    });

    console.log(`[${requestId}] RunningHub response status:`, runningHubResponse.status);

    if (!runningHubResponse.ok) {
      const errorText = await runningHubResponse.text();
      console.error(`[${requestId}] RunningHub API error:`, runningHubResponse.status, errorText);
      return NextResponse.json({ 
        success: false,
        error: `Nano Banana generation failed: ${runningHubResponse.status}`, 
        details: errorText 
      }, { status: runningHubResponse.status });
    }

    const result = await runningHubResponse.json();
    console.log(`[${requestId}] RunningHub response:`, JSON.stringify(result, null, 2));

    // 检查 RunningHub 响应
    if (result.code !== 0) {
      console.error(`[${requestId}] RunningHub returned error:`, result);
      return NextResponse.json({ 
        success: false,
        error: result.msg || 'Nano Banana generation failed',
        code: result.code 
      }, { status: 400 });
    }

    // 检查是否有 taskId
    if (!result.data || !result.data.taskId) {
      console.error(`[${requestId}] No taskId in response:`, result);
      return NextResponse.json({ 
        success: false,
        error: 'No task ID received from RunningHub' 
      }, { status: 500 });
    }

    console.log(`[${requestId}] ===== Nano Banana API Request Completed =====`);
    
    return NextResponse.json({
      success: true,
      taskId: result.data.taskId,
      message: 'Nano Banana generation task created successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] Nano Banana API error:`, error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

