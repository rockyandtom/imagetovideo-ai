import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();
    
    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    console.log('代理查询任务状态:', taskId);

    const response = await fetch(`${API_BASE_URL}/task/openapi/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.cn'
      },
      body: JSON.stringify({ apiKey: API_KEY, taskId })
    });

    console.log('RunningHub状态查询响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunningHub状态查询失败:', response.status, errorText);
      return NextResponse.json({ 
        error: `Status query failed: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('RunningHub状态查询响应:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('代理状态查询出错:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 