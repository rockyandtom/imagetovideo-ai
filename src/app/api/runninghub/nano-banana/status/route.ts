import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();
    
    if (!taskId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing taskId parameter' 
      }, { status: 400 });
    }

    console.log('Checking Nano Banana task status:', taskId);

    // 查询任务状态
    const statusResponse = await fetch(`${API_BASE_URL}/task/openapi/ai-app/status?apiKey=${API_KEY}&taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Host': 'www.runninghub.cn'
      }
    });

    console.log('Nano Banana status response status:', statusResponse.status);

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Nano Banana status check failed:', statusResponse.status, errorText);
      return NextResponse.json({ 
        success: false,
        error: `Status check failed: ${statusResponse.status}`, 
        details: errorText 
      }, { status: statusResponse.status });
    }

    const result = await statusResponse.json();
    console.log('Nano Banana status response:', JSON.stringify(result, null, 2));

    // 检查 RunningHub 响应
    if (result.code !== 0) {
      console.error('RunningHub returned error:', result);
      return NextResponse.json({ 
        success: false,
        error: result.msg || 'Status check failed',
        code: result.code 
      }, { status: 400 });
    }

    // 解析任务状态
    const status = result.data?.status || 'unknown';
    let imageUrl = null;
    let message = result.data?.message || 'Processing...';

    // 如果任务完成，尝试获取图片 URL
    if (status === 'completed' && result.data?.output) {
      // RunningHub 返回的输出可能有多种格式，需要根据实际返回结构解析
      // 通常输出可能在 result.data.output 或 result.data.result 中
      if (result.data.output) {
        // 如果是数组，取第一个元素
        if (Array.isArray(result.data.output) && result.data.output.length > 0) {
          imageUrl = result.data.output[0];
        } else if (typeof result.data.output === 'string') {
          imageUrl = result.data.output;
        }
      }
      
      // 如果还没有找到 URL，尝试其他可能的字段
      if (!imageUrl && result.data.result) {
        if (Array.isArray(result.data.result) && result.data.result.length > 0) {
          imageUrl = result.data.result[0];
        } else if (typeof result.data.result === 'string') {
          imageUrl = result.data.result;
        }
      }

      // 如果找到了 URL，确保它是完整的 URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `https://www.runninghub.cn${imageUrl}`;
      }
    }

    return NextResponse.json({
      success: true,
      status: status,
      imageUrl: imageUrl,
      message: message,
      data: result.data
    });

  } catch (error) {
    console.error('Nano Banana status check error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

