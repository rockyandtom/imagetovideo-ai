import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';

// 查询 Face Swap 任务状态
export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();
    
    if (!taskId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing taskId parameter' 
      }, { status: 400 });
    }

    console.log('查询 Face Swap 任务状态:', taskId);

    // 查询任务状态 - 使用标准的 status API
    const statusResponse = await fetch(`${API_BASE_URL}/task/openapi/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.cn'
      },
      body: JSON.stringify({ apiKey: API_KEY, taskId })
    });

    console.log('RunningHub 状态查询响应状态:', statusResponse.status);

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('RunningHub 状态查询失败:', statusResponse.status, errorText);
      return NextResponse.json({ 
        success: false,
        error: `Status check failed: ${statusResponse.status}`, 
        details: errorText 
      }, { status: statusResponse.status });
    }

    const result = await statusResponse.json();
    console.log('RunningHub 状态查询结果:', JSON.stringify(result, null, 2));

    // 检查 RunningHub 响应
    if (result.code !== 0) {
      console.error('RunningHub 返回错误:', result);
      return NextResponse.json({ 
        success: false,
        error: result.msg || 'Status check failed',
        code: result.code 
      }, { status: 400 });
    }

    // 解析任务状态 - result.data 直接是状态字符串
    const status = result.data || 'unknown';
    let imageUrl = null;
    let message = 'Processing...';

    // 如果任务完成，获取结果文件
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      console.log('任务完成，获取结果...');
      
      // 调用 outputs API 获取实际文件
      const outputResponse = await fetch(`${API_BASE_URL}/task/openapi/outputs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Host': 'www.runninghub.cn'
        },
        body: JSON.stringify({ apiKey: API_KEY, taskId })
      });

      if (outputResponse.ok) {
        const outputData = await outputResponse.json();
        console.log('Face Swap output 响应:', JSON.stringify(outputData, null, 2));

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
            imageUrl = imageItem.fileUrl;
            message = 'Completed!';
          } else if (outputData.data.length > 0 && outputData.data[0].fileUrl) {
            // 如果没有找到图片，使用第一个文件
            imageUrl = outputData.data[0].fileUrl;
            message = 'Completed!';
          }
        }
      } else {
        console.error('获取 outputs 失败:', outputResponse.status);
      }
    } else if (status === 'RUNNING' || status === 'PENDING' || status === 'QUEUED') {
      message = `Task processing, status: ${status}`;
    } else if (status === 'FAILED' || status === 'ERROR') {
      return NextResponse.json({
        success: false,
        error: 'Face swap generation task failed'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: status === 'SUCCESS' || status === 'COMPLETED' ? 'completed' : 
              (status === 'FAILED' || status === 'ERROR' ? 'failed' : 'running'),
      imageUrl: imageUrl,
      message: message
    });

  } catch (error) {
    console.error('Face Swap 状态查询错误:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

