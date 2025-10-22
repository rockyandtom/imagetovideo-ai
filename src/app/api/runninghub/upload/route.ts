import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('代理上传文件:', file.name, file.size);

    // 创建新的FormData
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/task/openapi/upload?apiKey=${API_KEY}`, {
      method: 'POST',
      body: uploadFormData
    });

    console.log('RunningHub上传响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunningHub上传失败:', response.status, errorText);
      return NextResponse.json({ 
        error: `Upload failed: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('RunningHub上传响应:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('代理上传出错:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 