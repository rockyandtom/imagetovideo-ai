import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';
const WEBAPP_ID = '1957750464492269570';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[${requestId}] ===== Image Upscaler API Request Started =====`);
  
  try {
    const { imageId, settings } = await request.json();
    console.log(`[${requestId}] Request payload:`, { imageId, settings });

    // 验证输入参数
    if (!imageId || typeof imageId !== 'string') {
      console.log(`[${requestId}] Validation failed: Invalid imageId`);
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    if (!settings || typeof settings !== 'object') {
      console.log(`[${requestId}] Validation failed: Invalid settings`);
      return NextResponse.json(
        { error: "Settings are required" },
        { status: 400 }
      );
    }

    const { top = 0, bottom = 0, left = 304, right = 304 } = settings;

    const requestPayload = {
      webappId: WEBAPP_ID,
      apiKey: API_KEY,
      nodeInfoList: [
        {
          nodeId: "44",
          fieldName: "bottom",
          fieldValue: bottom.toString(),
          description: "bottom"
        },
        {
          nodeId: "44",
          fieldName: "left",
          fieldValue: left.toString(),
          description: "left"
        },
        {
          nodeId: "44",
          fieldName: "right",
          fieldValue: right.toString(),
          description: "right"
        },
        {
          nodeId: "44",
          fieldName: "top",
          fieldValue: top.toString(),
          description: "top"
        },
        {
          nodeId: "17",
          fieldName: "image",
          fieldValue: imageId,
          description: "image"
        }
      ]
    };

    console.log(`[${requestId}] Sending to RunningHub:`, {
      url: `${API_BASE_URL}/task/openapi/ai-app/run`,
      webappId: requestPayload.webappId,
      nodeInfoList: requestPayload.nodeInfoList
    });

    // 调用RunningHub API
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
        error: `Image upscaling failed: ${runningHubResponse.status}`, 
        details: errorText 
      }, { status: runningHubResponse.status });
    }

    const result = await runningHubResponse.json();
    console.log(`[${requestId}] RunningHub response:`, JSON.stringify(result, null, 2));

    // 检查RunningHub响应
    if (result.code !== 0) {
      console.error(`[${requestId}] RunningHub returned error:`, result);
      return NextResponse.json({ 
        error: result.msg || 'Image upscaling failed',
        code: result.code 
      }, { status: 400 });
    }

    // 检查是否有taskId
    if (!result.data || !result.data.taskId) {
      console.error(`[${requestId}] No taskId in response:`, result);
      return NextResponse.json({ 
        error: 'No task ID received from RunningHub' 
      }, { status: 500 });
    }

    console.log(`[${requestId}] ===== Image Upscaler API Request Completed =====`);
    
    return NextResponse.json({
      success: true,
      taskId: result.data.taskId,
      message: 'Image upscaling task created successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] Image upscaler API error:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

