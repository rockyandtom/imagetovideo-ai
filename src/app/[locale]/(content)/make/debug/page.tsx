"use client";
import React, { useState } from "react";

export default function DebugPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await testFn();
      setTestResults((prev: any) => ({ ...prev, [testName]: { success: true, data: result } }));
    } catch (error: any) {
      setTestResults((prev: any) => ({ ...prev, [testName]: { success: false, error: error.message } }));
    } finally {
      setLoading(false);
    }
  };

  const testConnection = () => runTest('connection', async () => {
    const response = await fetch('/api/runninghub/test');
    return await response.json();
  });

  const testUpload = async () => {
    // 创建一个测试文件
    const testFile = new File(['test'], 'test.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', testFile);
    
    const response = await fetch('/api/runninghub/upload', {
      method: 'POST',
      body: formData
    });
    return await response.json();
  };

  const testRun = async () => {
    const response = await fetch('/api/runninghub/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageId: 'api/test-image.png', 
        desc: '测试描述' 
      })
    });
    return await response.json();
  };

  const testCurlFormat = async () => {
    const response = await fetch('/api/runninghub/test-curl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageId: 'd3f5990bc7b641818ba6fd992dc99290d660f1de4525157724150ab6798595a6.png', 
        desc: '怪兽抬头嘴巴喷火' 
      })
    });
    return await response.json();
  };

  const testCurlExact = async () => {
    const response = await fetch('/api/runninghub/test-curl-exact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await response.json();
  };

  const testCurlVerify = async () => {
    const response = await fetch('/api/runninghub/test-curl-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await response.json();
  };

  const testSimple = async () => {
    const response = await fetch('/api/runninghub/test-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await response.json();
  };

  const testWebAppIds = async () => {
    const response = await fetch('/api/runninghub/test-webapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await response.json();
  };

  const verifyWebApp = async () => {
    const response = await fetch('/api/runninghub/verify-webapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await response.json();
  };

  const runDiagnosis = async () => {
    const response = await fetch('/api/runninghub/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await response.json();
  };

  const testStatus = async () => {
    if (!taskId) {
      throw new Error('请输入任务ID');
    }
    const response = await fetch('/api/runninghub/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId })
    });
    return await response.json();
  };

  const testOutputs = async () => {
    if (!taskId) {
      throw new Error('请输入任务ID');
    }
    const response = await fetch('/api/runninghub/outputs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId })
    });
    return await response.json();
  };

  const analyzeTask = async () => {
    if (!taskId) {
      setAnalysisResult({ error: '请输入任务ID' });
      return;
    }

    try {
      setAnalysisResult({ loading: true });
      const response = await fetch('/api/runninghub/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult({ error: `分析失败: ${error}` });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">RunningHub API 调试页面</h1>
        
        <div className="grid gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API 测试</h2>
            
            <div className="space-y-4">
              <button
                onClick={testConnection}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
              >
                测试连接
              </button>
              
              <button
                onClick={() => runTest('upload', testUpload)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
              >
                测试上传
              </button>
              
              <button
                onClick={() => runTest('run', testRun)}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
              >
                测试任务创建
              </button>
              
              <button
                onClick={() => runTest('curl', testCurlFormat)}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
              >
                测试Curl格式
              </button>
              
              <button
                onClick={() => runTest('curl-exact', testCurlExact)}
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
              >
                测试Curl精确
              </button>
              
              <button
                onClick={() => runTest('curl-verify', testCurlVerify)}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
              >
                验证Curl命令
              </button>
              
              <button
                onClick={() => runTest('simple', testSimple)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
              >
                简化测试
              </button>
              
              <button
                onClick={() => runTest('webapp', testWebAppIds)}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
              >
                测试WebApp ID
              </button>
              
              <button
                onClick={() => runTest('verify-webapp', verifyWebApp)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 ml-4 text-white"
              >
                验证WebApp ID
              </button>
              
              <button
                onClick={() => runTest('diagnosis', runDiagnosis)}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
              >
                完整诊断
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">任务分析</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="输入任务ID"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
                <button
                  onClick={() => runTest('status', testStatus)}
                  disabled={loading || !taskId}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded disabled:opacity-50"
                >
                  查询状态
                </button>
                <button
                  onClick={() => runTest('outputs', testOutputs)}
                  disabled={loading || !taskId}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded disabled:opacity-50"
                >
                  获取结果
                </button>
              </div>
              
              <button
                onClick={analyzeTask}
                disabled={loading || !taskId}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 text-white"
              >
                分析任务失败原因
              </button>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">测试结果</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>

          {analysisResult && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">分析结果</h2>
              {analysisResult.loading ? (
                <div className="text-green-400">分析中...</div>
              ) : analysisResult.error ? (
                <div className="text-red-400">{analysisResult.error}</div>
              ) : analysisResult.success && analysisResult.analysis ? (
                <div className="space-y-4">
                  <div>
                    <strong className="text-yellow-400">可能原因:</strong>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      {analysisResult.analysis.possibleCauses?.map((cause: string, index: number) => (
                        <li key={index} className="text-gray-300">{cause}</li>
                      ))}
                    </ul>
                  </div>
                  {analysisResult.analysis.recommendations?.length > 0 && (
                    <div>
                      <strong className="text-green-400">建议:</strong>
                      <ul className="list-disc list-inside mt-2 text-sm">
                        {analysisResult.analysis.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-gray-300">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    任务ID: {analysisResult.analysis.taskId}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">无分析结果</div>
              )}
            </div>
          )}

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">配置信息</h2>
            <div className="space-y-2 text-sm">
              <div>API Base URL: https://www.runninghub.cn</div>
              <div>API Key: fb88fac46b0349c1986c9cbb4f14d44e</div>
              <div>WebApp ID: 1941035905484537857</div>
              <div>Image Node ID: 20</div>
              <div>Text Node ID: 21</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 