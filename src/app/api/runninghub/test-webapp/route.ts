import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';

export async function POST(request: NextRequest) {
  try {
    const { webappId } = await request.json();
    
    // 测试不同的WebApp ID
    const testWebAppIds = [
      1941035905484537857, // 当前使用的ID
    ];

    const results = [];

    for (const testId of testWebAppIds) {
      try {
        const data = {
          webappId: testId,
          apiKey: API_KEY,
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

        console.log(`测试WebApp ID: ${testId}`);

        const response = await fetch(`${API_BASE_URL}/task/openapi/ai-app/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Host': 'www.runninghub.cn'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        
        results.push({
          webappId: testId,
          success: response.ok && result.code === 0,
          status: response.status,
          response: result
        });

        console.log(`WebApp ID ${testId} test result:`, result);
      } catch (error: any) {
        results.push({
          webappId: testId,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('WebApp ID测试出错:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 