import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';

export async function POST(request: NextRequest) {
  try {
    // 完全按照用户提供的curl命令格式
    const curlData = {
      webappId: 1941035905484537857,
      apiKey: "fb88fac46b0349c1986c9cbb4f14d44e",
      nodeInfoList: [
        {
          nodeId: "20",
          fieldName: "image",
          fieldValue: "d3f5990bc7b641818ba6fd992dc99290d660f1de4525157724150ab6798595a6.png"
        },
        {
          nodeId: "21",
          fieldName: "text",
          fieldValue: "怪兽抬头嘴巴喷火"
        }
      ]
    };

    console.log('验证curl命令格式:', JSON.stringify(curlData, null, 2));

    const response = await fetch(`${API_BASE_URL}/task/openapi/ai-app/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.cn'
      },
      body: JSON.stringify(curlData)
    });

    console.log('验证测试响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('验证测试失败:', response.status, errorText);
      return NextResponse.json({ 
        success: false,
        error: `verification failed: ${response.status}`, 
        details: errorText 
      });
    }

    const result = await response.json();
    console.log('验证测试响应:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      data: result,
      curlCommand: `curl --location --request POST 'https://www.runninghub.cn/task/openapi/ai-app/run' \\
--header 'Host: www.runninghub.cn' \\
--header 'Content-Type: application/json' \\
--data-raw '${JSON.stringify(curlData, null, 2)}'`
    });
  } catch (error) {
    console.error('验证测试出错:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 