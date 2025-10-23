import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`[${requestId}] ===== Text2Video API Request Started =====`);
  
  try {
    const { text, aspectRatio } = await request.json();
    console.log(`[${requestId}] Request payload:`, { 
      text: text?.substring(0, 100) + (text?.length > 100 ? '...' : ''), 
      aspectRatio,
      textLength: text?.length 
    });

    // Validate input parameters
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log(`[${requestId}] Validation failed: Empty text`);
      return NextResponse.json(
        { error: "Text description cannot be empty" },
        { status: 400 }
      );
    }

    if (!aspectRatio || !['1', '2', '3', '4', '5'].includes(aspectRatio)) {
      console.log(`[${requestId}] Validation failed: Invalid aspect ratio:`, aspectRatio);
      return NextResponse.json(
        { error: "Invalid video aspect ratio parameter" },
        { status: 400 }
      );
    }

    const requestPayload = {
      webappId: "1980924375140581377",
      apiKey: "fb88fac46b0349c1986c9cbb4f14d44e",
      nodeInfoList: [
        {
          nodeId: "90",
          fieldName: "text",
          fieldValue: text.trim(),
          description: "text"
        },
        {
          nodeId: "144",
          fieldName: "select",
          fieldValue: aspectRatio,
          description: "select"
        }
      ]
    };

    console.log(`[${requestId}] Sending to RunningHub:`, {
      url: 'https://www.runninghub.cn/task/openapi/ai-app/run',
      webappId: requestPayload.webappId,
      nodeInfoList: requestPayload.nodeInfoList
    });

    // 调用RunningHub API
    const runningHubResponse = await fetch('https://www.runninghub.cn/task/openapi/ai-app/run', {
      method: 'POST',
      headers: {
        'Host': 'www.runninghub.cn',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    console.log(`[${requestId}] RunningHub response status:`, runningHubResponse.status);

    if (!runningHubResponse.ok) {
      const errorText = await runningHubResponse.text();
      console.error('RunningHub API error:', errorText);
      return NextResponse.json(
        { error: "Failed to call AI service, please try again later" },
        { status: 500 }
      );
    }

    const result = await runningHubResponse.json();
    console.log(`[${requestId}] RunningHub API response:`, JSON.stringify(result, null, 2));
    
    // Check return result - RunningHub uses code: 0 for success
    if (result.code !== 0) {
      console.error(`[${requestId}] RunningHub API returned error:`, result);
      
      // Handle specific error codes
      let errorMessage = result.msg || "Task creation failed";
      if (result.code === 421 && result.msg === "TASK_QUEUE_MAXED") {
        errorMessage = "The current queue is full. Please try again later.";
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    if (!result.data?.taskId) {
      console.error(`[${requestId}] RunningHub API returned no taskId:`, result);
      return NextResponse.json(
        { error: "Task creation failed - no task ID received" },
        { status: 500 }
      );
    }

    console.log(`[${requestId}] Task created successfully. TaskId: ${result.data.taskId}`);
    console.log(`[${requestId}] ===== Text2Video API Request Completed =====`);

    return NextResponse.json({
      success: true,
      taskId: result.data.taskId,
      message: "Task created, generating video..."
    });

  } catch (error) {
    console.error('Text to video API error:', error);
    return NextResponse.json(
      { error: "Internal server error, please try again later" },
      { status: 500 }
    );
  }
}
