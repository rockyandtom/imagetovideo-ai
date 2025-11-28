import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
// Using the API key provided in the prompt
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';
const WEBAPP_ID = '1992050980250513410';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const body = await request.json();
    const { images, prompt, aspectRatio } = body;
    
    // images should be an array of 4 strings (file IDs or URLs)
    // The user prompt says "4 image upload boxes", so we expect up to 4 images.
    // The API example shows 4 image nodes: 3, 7, 8, 10.
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing images parameter' 
      }, { status: 400 });
    }

    console.log(`[${requestId}] ===== Free Nano Banana Pro API Request Started =====`);
    console.log(`[${requestId}] Input images:`, images);
    console.log(`[${requestId}] Prompt:`, prompt);
    console.log(`[${requestId}] Aspect Ratio:`, aspectRatio);

    // Map images to specific node IDs as per the curl command example
    // The example has nodeIds: 3, 7, 8, 10 for images.
    const imageNodeIds = ["3", "7", "8", "10"];
    const nodeInfoList = [];

    // Add image nodes
    images.forEach((imgId, index) => {
      if (index < imageNodeIds.length && imgId) {
        nodeInfoList.push({
          nodeId: imageNodeIds[index],
          fieldName: "image",
          fieldValue: imgId,
          description: "image"
        });
      }
    });

    // Add prompt node
    if (prompt) {
      nodeInfoList.push({
        nodeId: "2",
        fieldName: "prompt",
        fieldValue: prompt,
        description: "prompt"
      });
    }

    // Add aspect ratio node
    // Default to 4:3 if not provided, matching the curl example
    const ratio = aspectRatio || "4:3";
    nodeInfoList.push({
      nodeId: "2",
      fieldName: "aspectRatio",
      fieldData: "[\"auto\", \"1:1\", \"2:3\", \"3:2\", \"3:4\", \"4:3\", \"4:5\", \"5:4\", \"9:16\", \"16:9\", \"21:9\"]",
      fieldValue: ratio,
      description: "aspectRatio"
    });

    const requestPayload = {
      webappId: WEBAPP_ID,
      apiKey: API_KEY,
      instanceType: "plus",
      nodeInfoList: nodeInfoList
    };

    console.log(`[${requestId}] Sending to RunningHub:`, {
      url: `${API_BASE_URL}/task/openapi/ai-app/run`,
      webappId: requestPayload.webappId,
      nodeInfoList: requestPayload.nodeInfoList
    });

    // Call RunningHub API
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
        error: `Generation failed: ${runningHubResponse.status}`, 
        details: errorText 
      }, { status: runningHubResponse.status });
    }

    const result = await runningHubResponse.json();
    console.log(`[${requestId}] RunningHub response:`, JSON.stringify(result, null, 2));

    if (result.code !== 0) {
      console.error(`[${requestId}] RunningHub returned error:`, result);
      return NextResponse.json({ 
        success: false,
        error: result.msg || 'Generation failed',
        code: result.code 
      }, { status: 400 });
    }

    if (!result.data || !result.data.taskId) {
      console.error(`[${requestId}] No taskId in response:`, result);
      return NextResponse.json({ 
        success: false,
        error: 'No task ID received from RunningHub' 
      }, { status: 500 });
    }

    console.log(`[${requestId}] ===== Free Nano Banana Pro API Request Completed =====`);
    
    return NextResponse.json({
      success: true,
      taskId: result.data.taskId,
      message: 'Task created successfully'
    });

  } catch (error) {
    console.error(`[${requestId}] API error:`, error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}




