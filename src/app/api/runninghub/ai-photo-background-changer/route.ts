import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';
const WEBAPP_ID = '1961726574104088577';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[${requestId}] ===== AI Photo Background Changer API Request Started =====`);
  
  try {
    const { image1Id, image2Id } = await request.json();
    console.log(`[${requestId}] Request payload:`, { image1Id, image2Id });

    // 验证输入参数
    if (!image1Id || typeof image1Id !== 'string') {
      console.log(`[${requestId}] Validation failed: Invalid image1Id`);
      return NextResponse.json(
        { error: "First image ID is required" },
        { status: 400 }
      );
    }

    if (!image2Id || typeof image2Id !== 'string') {
      console.log(`[${requestId}] Validation failed: Invalid image2Id`);
      return NextResponse.json(
        { error: "Second image ID is required" },
        { status: 400 }
      );
    }

    const requestPayload = {
      webappId: WEBAPP_ID,
      apiKey: API_KEY,
      instanceType: "plus",
      nodeInfoList: [
        {
          nodeId: "1",
          fieldName: "image",
          fieldValue: image1Id,
          description: "image"
        },
        {
          nodeId: "54",
          fieldName: "image",
          fieldValue: image2Id,
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
        error: `Background changer failed: ${runningHubResponse.status}`, 
        details: errorText 
      }, { status: runningHubResponse.status });
    }

    const result = await runningHubResponse.json();
    console.log(`[${requestId}] RunningHub response:`, JSON.stringify(result, null, 2));

    // 检查RunningHub响应
    if (result.code !== 0) {
      console.error(`[${requestId}] RunningHub returned error:`, result);
      return NextResponse.json({ 
        error: result.msg || 'Background changer failed',
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

    console.log(`[${requestId}] ===== AI Photo Background Changer API Request Completed =====`);
    
    return NextResponse.json({
      success: true,
      taskId: result.data.taskId,
      message: 'Background changer task created successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] AI Photo Background Changer API error:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}



