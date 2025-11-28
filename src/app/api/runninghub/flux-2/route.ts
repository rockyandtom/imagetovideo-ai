import { NextRequest, NextResponse } from 'next/server';

// Flux 2 API 配置
const FLUX2_CONFIG = {
  baseUrl: 'https://www.runninghub.cn/task/openapi',
  webappId: '1994277165005029378',
  apiKey: 'fb88fac46b0349c1986c9cbb4f14d44e',
  instanceType: 'plus',
  nodes: {
    text: "31",      // 文字描述节点ID
    aspectRatio: "44"  // 图片比例节点ID
  },
  headers: {
    'Host': 'www.runninghub.cn',
    'Content-Type': 'application/json',
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    const body = await request.json();
    console.log(`[${requestId}] Flux 2 API 接收到请求:`, body);

    const { prompt, aspectRatio, action } = body;

    // 处理不同的操作类型
    if (action === 'status') {
      return await handleStatusCheck(body.taskId, requestId);
    } else if (action === 'generate') {
      return await handleGenerate(prompt, aspectRatio, requestId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "generate" or "status"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Flux 2 API 错误:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 处理图片生成请求
async function handleGenerate(prompt: string, aspectRatio: string, requestId: string) {
  if (!prompt || !aspectRatio) {
    return NextResponse.json(
      { success: false, error: 'Prompt and aspect ratio are required' },
      { status: 400 }
    );
  }

  console.log(`[${requestId}] 开始 Flux 2 图片生成:`, {
    prompt,
    aspectRatio
  });

  try {
    // 构建节点信息列表
    const nodeInfoList = [
      {
        nodeId: FLUX2_CONFIG.nodes.text,
        fieldName: "text",
        fieldValue: prompt,
        description: "text"
      },
      {
        nodeId: FLUX2_CONFIG.nodes.aspectRatio,
        fieldName: "aspect_ratio",
        fieldData: "[[\"custom\", \"1:1 square 1024x1024\", \"3:4 portrait 896x1152\", \"5:8 portrait 832x1216\", \"9:16 portrait 768x1344\", \"9:21 portrait 640x1536\", \"4:3 landscape 1152x896\", \"3:2 landscape 1216x832\", \"16:9 landscape 1344x768\", \"21:9 landscape 1536x640\"]]",
        fieldValue: aspectRatio,
        description: "aspect_ratio"
      }
    ];

    const requestBody = {
      webappId: FLUX2_CONFIG.webappId,
      apiKey: FLUX2_CONFIG.apiKey,
      instanceType: FLUX2_CONFIG.instanceType,
      nodeInfoList: nodeInfoList
    };

    console.log(`[${requestId}] 发送到 RunningHub 的请求:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${FLUX2_CONFIG.baseUrl}/ai-app/run`, {
      method: 'POST',
      headers: FLUX2_CONFIG.headers,
      body: JSON.stringify(requestBody)
    });

    console.log(`[${requestId}] RunningHub 响应状态:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] RunningHub API 错误响应:`, errorText);
      throw new Error(`RunningHub API failed with HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[${requestId}] RunningHub 响应数据:`, data);

    if (data.code === 0 && data.data && data.data.taskId) {
      return NextResponse.json({
        success: true,
        data: {
          taskId: data.data.taskId,
          status: 'started',
          message: 'Flux 2 image generation task started'
        }
      });
    } else {
      // 处理特定的错误代码
      let errorMessage = data.msg || 'Failed to start Flux 2 image generation task';
      let statusCode = 500;
      
      if (data.code === 421 || data.msg === 'TASK_QUEUE_MAXED') {
        errorMessage = 'Task queue is full. Please try again in a few moments. The server is currently processing many requests.';
        statusCode = 503; // Service Unavailable
      } else if (data.code) {
        // 其他错误代码
        errorMessage = `Service error (${data.code}): ${data.msg || 'Unknown error'}`;
      }
      
      console.error(`[${requestId}] RunningHub 返回错误:`, {
        code: data.code,
        msg: data.msg,
        errorMessage
      });
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: data.code,
        details: data.msg
      }, { status: statusCode });
    }

  } catch (error) {
    console.error(`[${requestId}] Flux 2 生成错误:`, error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 处理任务状态查询
async function handleStatusCheck(taskId: string, requestId: string) {
  if (!taskId) {
    return NextResponse.json(
      { success: false, error: 'Task ID is required' },
      { status: 400 }
    );
  }

  console.log(`[${requestId}] 检查 Flux 2 任务状态: ${taskId}`);

  try {
    // 查询任务状态
    const statusResponse = await fetch(`${FLUX2_CONFIG.baseUrl}/status`, {
      method: 'POST',
      headers: FLUX2_CONFIG.headers,
      body: JSON.stringify({
        apiKey: FLUX2_CONFIG.apiKey,
        taskId: taskId
      })
    });

    if (!statusResponse.ok) {
      throw new Error(`Status query failed with HTTP ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log(`[${requestId}] 任务状态响应:`, statusData);

    if (statusData.code === 0 && statusData.data) {
      const status = statusData.data;

      if (status === 'SUCCESS' || status === 'COMPLETED') {
        console.log(`[${requestId}] 任务完成，获取结果...`);

        // 获取任务结果
        const outputResponse = await fetch(`${FLUX2_CONFIG.baseUrl}/outputs`, {
          method: 'POST',
          headers: FLUX2_CONFIG.headers,
          body: JSON.stringify({
            apiKey: FLUX2_CONFIG.apiKey,
            taskId: taskId
          })
        });

        if (outputResponse.ok) {
          const outputData = await outputResponse.json();
          console.log(`[${requestId}] 任务结果响应:`, outputData);

          if (outputData.code === 0 && outputData.data && Array.isArray(outputData.data)) {
            // 查找图片文件
            const imageItem = outputData.data.find((item: any) =>
              item.fileUrl && (
                !item.fileType ||
                item.fileType.toLowerCase().includes('png') ||
                item.fileType.toLowerCase().includes('jpg') ||
                item.fileType.toLowerCase().includes('jpeg') ||
                item.fileType.toLowerCase().includes('gif') ||
                item.fileType.toLowerCase().includes('webp') ||
                item.fileType.toLowerCase().includes('image')
              )
            );

            if (imageItem && imageItem.fileUrl) {
              return NextResponse.json({
                success: true,
                data: {
                  taskId,
                  status: 'completed',
                  imageUrl: imageItem.fileUrl,
                  fileType: imageItem.fileType || 'image/png'
                }
              });
            } else {
              // 如果没有找到图片，返回第一个文件
              const firstFile = outputData.data[0];
              if (firstFile && firstFile.fileUrl) {
                return NextResponse.json({
                  success: true,
                  data: {
                    taskId,
                    status: 'completed',
                    imageUrl: firstFile.fileUrl,
                    fileType: firstFile.fileType || 'image/png'
                  }
                });
              } else {
                return NextResponse.json({
                  success: false,
                  error: 'Task completed but no valid image found in results'
                }, { status: 500 });
              }
            }
          } else {
            return NextResponse.json({
              success: false,
              error: 'Failed to get task results'
            }, { status: 500 });
          }
        } else {
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch task results'
          }, { status: 500 });
        }

      } else if (status === 'FAILED' || status === 'ERROR') {
        return NextResponse.json({
          success: false,
          error: 'Flux 2 image generation task failed'
        }, { status: 500 });
      } else if (status === 'RUNNING' || status === 'PENDING' || status === 'QUEUED') {
        return NextResponse.json({
          success: true,
          data: {
            taskId,
            status: 'running',
            message: `Flux 2 image generation in progress, status: ${status}`
          }
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            taskId,
            status: 'running', // 将未知状态也当作运行中处理
            message: `Task processing, status: ${status}`
          }
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: `Status query failed: ${statusData.msg || 'Unknown error'}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error(`[${requestId}] 状态检查错误:`, error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check task status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

