// RunningHub API 测试脚本
const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e';
const WEBAPP_ID = "1941035905484537857"; // 使用字符串避免数字精度问题

// 测试数据
const testData = {
  webappId: WEBAPP_ID,
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

async function testRunningHubAPI() {
  console.log('🚀 开始测试 RunningHub API...');
  console.log('📝 请求数据:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/task/openapi/ai-app/run`, {
      method: 'POST',
      headers: {
        'Host': 'www.runninghub.cn',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 响应状态:', response.status);
    console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 原始响应:', responseText);
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ JSON 响应:', JSON.stringify(result, null, 2));
      
      if (result.code === 0) {
        console.log('🎉 API 调用成功!');
        console.log('📋 任务信息:', {
          taskId: result.data?.taskId,
          clientId: result.data?.clientId
        });
      } else {
        console.log('❌ API 返回错误:', result.msg || result.message);
      }
    } catch (parseError) {
      console.log('❌ JSON 解析失败:', parseError.message);
    }
    
  } catch (error) {
    console.error('💥 请求失败:', error.message);
  }
}

// 验证 curl 命令格式
function validateCurlCommand() {
  console.log('\n🔍 验证 curl 命令格式...');
  
  const curlCommand = `curl --location --request POST 'https://www.runninghub.cn/task/openapi/ai-app/run' \\
--header 'Host: www.runninghub.cn' \\
--header 'Content-Type: application/json' \\
--data-raw '${JSON.stringify(testData)}'`;
  
  console.log('📋 等效的 curl 命令:');
  console.log(curlCommand);
  
  // 检查数据格式
  console.log('\n🔧 数据格式检查:');
  console.log('✓ webappId 类型:', typeof testData.webappId, '(应为 number)');
  console.log('✓ apiKey 类型:', typeof testData.apiKey, '(应为 string)');
  console.log('✓ nodeInfoList 长度:', testData.nodeInfoList.length, '(应为 2)');
  
  testData.nodeInfoList.forEach((node, index) => {
    console.log(`✓ 节点 ${index + 1}:`, {
      nodeId: node.nodeId,
      fieldName: node.fieldName,
      fieldValue: node.fieldValue.substring(0, 50) + '...'
    });
  });
}

// 运行测试
async function main() {
  validateCurlCommand();
  await testRunningHubAPI();
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
  main().catch(console.error);
}

// 导出供浏览器使用
if (typeof window !== 'undefined') {
  window.testRunningHubAPI = testRunningHubAPI;
  window.validateCurlCommand = validateCurlCommand;
}