import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';

export async function POST(request: NextRequest) {
  try {
    console.log('开始验证WebApp ID...');
    
    // 您提供的正确WebApp ID
    const correctWebAppId = 1941035905484537857;
    
    const testData = {
      webappId: correctWebAppId,
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

    console.log('测试WebApp ID:', correctWebAppId);
    console.log('请求数据:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${API_BASE_URL}/task/openapi/ai-app/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.runninghub.cn'
      },
      body: JSON.stringify(testData)
    });

    console.log('API响应状态:', response.status);

    const result = await response.json();
    console.log('API响应:', JSON.stringify(result, null, 2));

    // 分析结果
    const analysis: {
      webappId: number;
      apiKey: string;
      success: boolean;
      status: number;
      response: any;
      diagnosis: {
        webappExists: boolean;
        apiKeyValid: boolean;
        permissionOk: boolean;
        errorType: any;
      };
      recommendations?: string[];
    } = {
      webappId: correctWebAppId,
      apiKey: API_KEY,
      success: response.ok && result.code === 0,
      status: response.status,
      response: result,
      diagnosis: {
        webappExists: result.code === 0,
        apiKeyValid: result.code !== 401 && result.code !== 403,
        permissionOk: result.code !== 403,
        errorType: result.msg || '未知错误'
      }
    };

    // 提供建议
    if (result.code === 1 && result.msg === 'webapp not exists') {
      analysis.recommendations = [
        'WebApp ID不存在或无法访问',
        '请登录RunningHub平台检查：',
        '1. 确认WebApp ID是否正确',
        '2. 确认API Key是否有权限访问该WebApp',
        '3. 确认WebApp是否已发布或公开',
        '4. 检查API Key是否属于正确的账户'
      ];
    } else if (result.code === 0) {
      analysis.recommendations = [
        'WebApp ID验证成功！',
        '可以正常使用该WebApp进行AI任务'
      ];
    } else {
      analysis.recommendations = [
        `API返回错误: ${result.msg}`,
        '请检查API Key和WebApp配置'
      ];
    }

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('WebApp验证出错:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 