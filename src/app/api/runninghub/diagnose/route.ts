import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  message?: string;
  error?: string;
  response?: any;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting API diagnosis...');

    const diagnosis: {
      timestamp: string;
      apiKey: string;
      tests: TestResult[];
      summary?: any;
    } = {
      timestamp: new Date().toISOString(),
      apiKey: API_KEY,
      tests: []
    };

    // 1. 测试基本连接
    try {
      const testResponse = await fetch(`${API_BASE_URL}/task/openapi/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Host': 'www.runninghub.cn'
        },
        body: JSON.stringify({ 
          apiKey: API_KEY, 
          taskId: 'test-connection' 
        })
      });

      diagnosis.tests.push({
        name: 'Basic Connection Test',
        success: testResponse.ok,
        status: testResponse.status,
        message: testResponse.ok ? 'API connection successful' : 'API connection failed'
      });
    } catch (error: any) {
      diagnosis.tests.push({
        name: 'Basic Connection Test',
        success: false,
        error: error.message
      });
    }

    // 2. 测试WebApp访问权限
    const webappIds = [
      1941035905484537857, // 您提供的正确ID
    ];

    for (const webappId of webappIds) {
      try {
        const data = {
          webappId: webappId,
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
              fieldValue: "monster raising head and breathing fire"
            }
          ]
        };

        console.log(`Testing WebApp ID: ${webappId}`);

        const response = await fetch(`${API_BASE_URL}/task/openapi/ai-app/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Host': 'www.runninghub.cn'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        
        diagnosis.tests.push({
          name: `WebApp ID ${webappId} Test`,
          success: response.ok && result.code === 0,
          status: response.status,
          response: result,
          message: result.msg || 'Unknown error'
        });
      } catch (error: any) {
        diagnosis.tests.push({
          name: `WebApp ID ${webappId} Test`,
          success: false,
          error: error.message
        });
      }
    }

    // 3. Analyze results
    const successfulTests = diagnosis.tests.filter(test => test.success);
    const failedTests = diagnosis.tests.filter(test => !test.success);

    diagnosis.summary = {
      totalTests: diagnosis.tests.length,
      successfulTests: successfulTests.length,
      failedTests: failedTests.length,
      possibleIssues: []
    };

    // Analyze possible issues
    if (failedTests.length > 0) {
      failedTests.forEach(test => {
        if (test.response && test.response.msg) {
          if (test.response.msg.includes('webapp not exists')) {
            diagnosis.summary.possibleIssues.push('WebApp does not exist or API Key lacks access permission');
          } else if (test.response.msg.includes('api key')) {
            diagnosis.summary.possibleIssues.push('API Key is invalid or expired');
          } else if (test.response.msg.includes('permission')) {
            diagnosis.summary.possibleIssues.push('Insufficient permissions');
          } else {
            diagnosis.summary.possibleIssues.push(`Other error: ${test.response.msg}`);
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      diagnosis
    });
  } catch (error) {
    console.error('Diagnosis error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 