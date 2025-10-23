import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const { taskId } = await params;
    
    if (!taskId) {
      console.log(`[${requestId}] Status query failed: Missing taskId`);
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    console.log(`[${requestId}] ===== Status Query Started for TaskId: ${taskId} =====`);

    const response = await fetch(`${API_BASE_URL}/task/openapi/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.cn'
      },
      body: JSON.stringify({ apiKey: API_KEY, taskId })
    });

    console.log('RunningHub status query response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunningHub status query failed:', response.status, errorText);
      return NextResponse.json({ 
        error: `Status query failed: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log(`[${requestId}] RunningHub status query response:`, JSON.stringify(result, null, 2));

    // Process response data, unified format
    let processedResult = {
      status: 'pending',
      progress: 0,
      estimatedTime: '',
      videoUrl: null,
      error: null
    };

    if (result.code === 0) {
      const data = result.data;
      
      // Handle case where data is a string (like 'FAILED')
      let taskStatus: string;
      if (typeof data === 'string') {
        taskStatus = data;
      } else if (typeof data === 'object' && data !== null) {
        taskStatus = data.taskStatus || data.status || 'UNKNOWN';
      } else {
        taskStatus = 'UNKNOWN';
      }

      console.log(`[${requestId}] Processing task status: ${taskStatus}, data type: ${typeof data}`);
      
      if (taskStatus === 'SUCCESS' || taskStatus === 'COMPLETED') {
        processedResult.status = 'completed';
        processedResult.progress = 100;
        processedResult.estimatedTime = 'Completed';
        
        console.log(`[${requestId}] Task completed successfully, fetching outputs...`);
        
        try {
          // 获取任务结果 - 调用outputs API
          const outputResponse = await fetch(`${API_BASE_URL}/task/openapi/outputs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Host': 'www.runninghub.cn'
            },
            body: JSON.stringify({
              apiKey: API_KEY,
              taskId: taskId
            })
          });

          console.log(`[${requestId}] Outputs API response status:`, outputResponse.status);

          if (outputResponse.ok) {
            const outputData = await outputResponse.json();
            console.log(`[${requestId}] Outputs API response:`, JSON.stringify(outputData, null, 2));

            if (outputData.code === 0 && outputData.data && Array.isArray(outputData.data)) {
              // 查找视频文件
              const videoItem = outputData.data.find((item: any) =>
                item.fileUrl && (
                  !item.fileType ||
                  item.fileType.toLowerCase().includes('mp4') ||
                  item.fileType.toLowerCase().includes('mov') ||
                  item.fileType.toLowerCase().includes('avi') ||
                  item.fileType.toLowerCase().includes('video')
                )
              );

              if (videoItem && videoItem.fileUrl) {
                processedResult.videoUrl = videoItem.fileUrl;
                console.log(`[${requestId}] Found video URL: ${videoItem.fileUrl}`);
              } else {
                // 如果没有找到视频，返回第一个文件
                const firstFile = outputData.data[0];
                if (firstFile && firstFile.fileUrl) {
                  processedResult.videoUrl = firstFile.fileUrl;
                  console.log(`[${requestId}] Using first file as video URL: ${firstFile.fileUrl}`);
                } else {
                  console.log(`[${requestId}] No valid files found in outputs:`, outputData.data);
                }
              }
            } else {
              console.log(`[${requestId}] Invalid outputs response:`, outputData);
            }
          } else {
            console.error(`[${requestId}] Failed to fetch outputs:`, outputResponse.status);
          }
        } catch (outputError) {
          console.error(`[${requestId}] Error fetching outputs:`, outputError);
        }
      } else if (taskStatus === 'FAILED' || taskStatus === 'ERROR') {
        processedResult.status = 'failed';
        processedResult.error = (typeof data === 'object' && data.message) || 'Generation failed';
      } else if (taskStatus === 'RUNNING' || taskStatus === 'PROCESSING') {
        processedResult.status = 'processing';
        processedResult.progress = (typeof data === 'object' && data.progress) || 60;
        processedResult.estimatedTime = 'Generating video...';
      } else if (taskStatus === 'QUEUED') {
        processedResult.status = 'processing';
        processedResult.progress = 20;
        processedResult.estimatedTime = 'Task queued, waiting to start...';
      } else {
        // Default to processing status
        processedResult.status = 'processing';
        processedResult.progress = 30;
        processedResult.estimatedTime = 'Processing...';
      }
    } else {
      processedResult.status = 'failed';
      processedResult.error = result.msg || 'Query failed';
    }

    console.log(`[${requestId}] Returning processed result:`, processedResult);
    console.log(`[${requestId}] ===== Status Query Completed =====`);
    
    return NextResponse.json(processedResult);
  } catch (error) {
    console.error('Status query error:', error);
    return NextResponse.json({ 
      status: 'failed',
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
