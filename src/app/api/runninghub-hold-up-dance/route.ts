import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      );
    }

    // 调用RunningHub API生成Hold Up Dance视频
    const response = await fetch('https://www.runninghub.cn/task/openapi/ai-app/run', {
      method: 'POST',
      headers: {
        'Host': 'www.runninghub.cn',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webappId: "1958505283771330562",
        apiKey: "fb88fac46b0349c1986c9cbb4f14d44e",
        instanceType: "plus",
        nodeInfoList: [
          {
            nodeId: "58",
            fieldName: "image",
            fieldValue: imageData,
            description: "image"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunningHub API error:', errorText);
      return NextResponse.json(
        { success: false, error: `RunningHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('RunningHub API response:', result);

    // 检查API响应格式
    if (result.code === 0 && result.data?.taskId) {
      return NextResponse.json({
        success: true,
        data: {
          taskId: result.data.taskId,
          message: 'Hold Up Dance generation started successfully'
        }
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.msg || result.message || 'Failed to start Hold Up Dance generation' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Hold Up Dance API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
