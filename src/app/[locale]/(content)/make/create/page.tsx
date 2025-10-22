"use client";
import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

// RunningHub API配置
const API_BASE_URL = 'https://www.runninghub.cn';
const API_KEY = 'fb88fac46b0349c1986c9cbb4f14d44e'; // 你的API Key
const WEBAPP_ID = '1941035905484537857'; // 你的WebApp ID
const NODE_ID_IMAGE = '20'; // 图片节点ID
const NODE_ID_TEXT = '21'; // 文本节点ID

export default function CreateVideoPage() {
  // 首帧/尾帧图片
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [startFile, setStartFile] = useState<File | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [testResult, setTestResult] = useState<string>("");
  const [lastTaskId, setLastTaskId] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [retryInfo, setRetryInfo] = useState<{imageId?: string, desc?: string} | null>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // 测试RunningHub连接
  async function testConnection() {
    try {
      setTestResult('测试中...');
      const response = await fetch('/api/runninghub/test');
      const result = await response.json();
      
      if (result.success) {
        setTestResult('✅ 连接正常');
      } else {
        setTestResult(`❌ 连接失败: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ 测试失败: ${error}`);
    }
  }

  // 分析任务失败原因
  async function analyzeTaskFailure() {
    if (!lastTaskId) {
      setAnalysisResult({ error: '没有可分析的任务ID' });
      return;
    }

    try {
      setAnalysisResult({ loading: true });
      const response = await fetch('/api/runninghub/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: lastTaskId })
      });
      
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult({ error: `分析失败: ${error}` });
    }
  }

  // 上传图片到RunningHub
  async function uploadImage(file: File): Promise<string> {
    try {
      console.log('开始上传图片:', file.name, file.size);
      setDebugInfo('开始上传图片...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      // 使用后端代理API
      const response = await fetch('/api/runninghub/upload', {
        method: 'POST',
        body: formData
      });
      
      console.log('上传响应状态:', response.status);
      setDebugInfo(`上传响应状态: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('上传失败:', response.status, errorText);
        throw new Error(`图片上传失败: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('上传响应:', result);
      setDebugInfo(`上传响应: ${JSON.stringify(result)}`);
      
      if (result.code !== 0) {
        throw new Error(result.msg || '图片上传失败');
      }
      
      const fileId = result.data.fileName;
      console.log('获取到文件ID:', fileId);
      setDebugInfo(`获取到文件ID: ${fileId}`);
      
      return fileId; // 保持完整的文件ID，包括 api/ 前缀
    } catch (error) {
      console.error('上传图片时出错:', error);
      setDebugInfo(`上传错误: ${error}`);
      throw error;
    }
  }

  // 发起AI任务（带重试机制）
  async function runAITask(imageId: string, desc: string, retryCount = 0): Promise<{taskId: string, clientId: string}> {
    const maxRetries = 3;
    const retryDelay = 5000; // 5秒
    
    try {
      console.log(`开始发起AI任务 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, { imageId, desc });
      setDebugInfo(`开始发起AI任务 (尝试 ${retryCount + 1}/${maxRetries + 1})...`);
      
      // 使用后端代理API，只传递image和text参数
      const response = await fetch('/api/runninghub/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId, desc })
      });
      
      console.log('AI任务响应状态:', response.status);
      setDebugInfo(`AI任务响应状态: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI任务创建失败:', response.status, errorText);
        throw new Error(`AI任务创建失败: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('AI任务响应:', result);
      setDebugInfo(`AI任务响应: ${JSON.stringify(result)}`);
      
      // 检查是否是队列满的错误
      if (result.error === 'TASK_QUEUE_MAXED' || (result.msg && result.msg.includes('TASK_QUEUE_MAXED'))) {
        if (retryCount < maxRetries) {
          console.log(`队列已满，${retryDelay/1000}秒后重试...`);
          setDebugInfo(`队列已满，${retryDelay/1000}秒后重试 (${retryCount + 1}/${maxRetries})...`);
          setError(`服务器繁忙，${retryDelay/1000}秒后自动重试 (${retryCount + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return runAITask(imageId, desc, retryCount + 1);
        } else {
          throw new Error('服务器任务队列持续繁忙，请稍后手动重试');
        }
      }
      
      if (result.code !== 0 || !result.data) {
        const errorMsg = result.userMessage || result.msg || 'AI任务创建失败';
        console.error('AI任务创建失败:', errorMsg);
        setDebugInfo(`AI任务创建失败: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      console.log('任务创建成功:', result.data);
      setDebugInfo(`任务创建成功: ${JSON.stringify(result.data)}`);
      
      return {
        taskId: result.data.taskId,
        clientId: result.data.clientId
      };
    } catch (error) {
      console.error('发起AI任务时出错:', error);
      setDebugInfo(`AI任务错误: ${error}`);
      
      // 如果是网络错误且还有重试次数，则重试
      if (retryCount < maxRetries && (error instanceof Error && error.message.includes('fetch'))) {
        console.log(`网络错误，${retryDelay/1000}秒后重试...`);
        setDebugInfo(`网络错误，${retryDelay/1000}秒后重试 (${retryCount + 1}/${maxRetries})...`);
        setError(`网络错误，${retryDelay/1000}秒后自动重试 (${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return runAITask(imageId, desc, retryCount + 1);
      }
      
      throw error;
    }
  }

  // 轮询任务状态
  async function pollTaskStatus(taskId: string): Promise<'COMPLETED' | 'FAILED'> {
    let status = 'RUNNING';
    let tries = 0;
    setProgress(10);
    
    console.log('开始轮询任务状态:', taskId);
    setDebugInfo(`开始轮询任务状态: ${taskId}`);
    
    while (status === 'RUNNING' && tries < 60) {
      await new Promise(res => setTimeout(res, 3000));
      tries++;
      
      try {
        // 使用后端代理API
        const response = await fetch('/api/runninghub/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ taskId })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('任务状态查询失败:', response.status, errorText);
          throw new Error(`任务状态查询失败: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`轮询结果 (${tries}/60):`, result);
        setDebugInfo(`轮询结果 (${tries}/60): ${JSON.stringify(result)}`);
        
        if (result.code !== 0) {
          const errorMsg = result.msg || '任务状态查询失败';
          console.error('任务状态查询失败:', errorMsg);
          setDebugInfo(`任务状态查询失败: ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        const taskStatus = result.data;
        console.log(`任务状态 (${tries}/60):`, taskStatus);
        setDebugInfo(`任务状态 (${tries}/60): ${taskStatus}`);
        
        if (taskStatus === 'SUCCESS' || taskStatus === 'COMPLETED') {
          setProgress(100);
          console.log('任务完成');
          setDebugInfo('任务完成');
          return 'COMPLETED';
        } else if (taskStatus === 'FAILED' || taskStatus === 'ERROR') {
          setProgress(0);
          console.log('任务失败');
          setDebugInfo('任务失败');
          return 'FAILED';
        } else if (taskStatus === 'RUNNING' || taskStatus === 'PENDING') {
          setProgress(30 + tries * 1.5);
          console.log(`任务运行中 (${tries}/60)`);
          setDebugInfo(`任务运行中 (${tries}/60)`);
        } else {
          console.log(`未知状态: ${taskStatus}`);
          setDebugInfo(`未知状态: ${taskStatus}`);
        }
      } catch (error) {
        console.error(`轮询过程中出错 (${tries}/60):`, error);
        setDebugInfo(`轮询错误 (${tries}/60): ${error}`);
      }
    }
    
    console.log('任务超时');
    setDebugInfo('任务超时');
    throw new Error('任务超时');
  }

  // 获取任务结果
  async function getTaskResult(taskId: string): Promise<string | null> {
    try {
      console.log('开始获取任务结果:', taskId);
      setDebugInfo('开始获取任务结果...');
      
      // 使用后端代理API
      const response = await fetch('/api/runninghub/outputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      });
      
      console.log('获取结果响应状态:', response.status);
      setDebugInfo(`获取结果响应状态: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('获取结果失败:', response.status, errorText);
        throw new Error(`获取结果失败: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('获取结果响应:', result);
      setDebugInfo(`获取结果响应: ${JSON.stringify(result)}`);
      
      if (result.code !== 0) {
        throw new Error(result.msg || '获取结果失败');
      }
      
      if (result.data && Array.isArray(result.data)) {
        // 查找视频文件
        const video = result.data.find((item: any) => 
          item.fileUrl && (
            item.fileType?.toLowerCase().includes('mp4') || 
            item.fileUrl.endsWith('.mp4')
          )
        );
        
        if (video) {
          console.log('找到视频文件:', video.fileUrl);
          setDebugInfo(`找到视频文件: ${video.fileUrl}`);
          return video.fileUrl;
        } else {
          console.log('未找到视频文件，所有文件:', result.data);
          setDebugInfo(`未找到视频文件，所有文件: ${JSON.stringify(result.data)}`);
        }
      }
      
      return null;
    } catch (error) {
      console.error('获取任务结果时出错:', error);
      setDebugInfo(`获取结果错误: ${error}`);
      throw error;
    }
  }

  // 上传图片
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'start') {
        setStartFrame(url);
        setStartFile(file);
      } else setEndFrame(url);
    }
  };

  // 创作按钮点击
  const handleCreate = async () => {
    setLoading(true);
    setError("");
    setResultVideo(null);
    setProgress(0);
    setDebugInfo(""); // 清空调试信息
    try {
      if (!startFile) throw new Error('请上传首帧图片');
      if (!desc.trim()) throw new Error('请输入描述');
      
      console.log('开始创作流程:', { 
        fileName: startFile.name, 
        fileSize: startFile.size, 
        desc: desc.trim(),
      });
      
      // 1. 上传图片
      const fileId = await uploadImage(startFile);
      // 保存重试信息
      setRetryInfo({ imageId: fileId, desc: desc.trim() });
      // 2. 发起AI任务 - 只传递image和text参数
      const { taskId } = await runAITask(fileId, desc.trim());
      setLastTaskId(taskId); // 保存任务ID
      // 3. 轮询任务状态
      const status = await pollTaskStatus(taskId);
      if (status === 'COMPLETED') {
        // 4. 获取结果
        const videoUrl = await getTaskResult(taskId);
        if (videoUrl) {
          setResultVideo(videoUrl);
        } else {
          setError('未获取到视频结果');
        }
      } else {
        setError('AI生成失败');
      }
    } catch (err: any) {
      setError(err.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="w-full min-h-[100vh] flex justify-center items-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] text-foreground p-6 overflow-x-hidden transition-colors duration-300">
      {/* 左侧三大功能区 */}
      <div className="w-[360px] min-w-[280px] max-w-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 flex flex-col gap-10 mr-12 items-center justify-center card-hover-effect transition-colors duration-300">
        {/* 1. 首帧/尾帧卡片区 */}
        <div className="flex items-center justify-center gap-6 w-full mb-2">
          {/* 首帧卡片 */}
          <div
            className="flex-1 bg-white/10 rounded-2xl shadow-lg flex flex-col items-center justify-center h-36 cursor-pointer border-2 border-transparent hover:border-blue-400 transition group relative card-hover-effect"
            onClick={() => startInputRef.current?.click()}
          >
            {startFrame ? (
              <>
                <img src={startFrame} alt="首帧" className="w-16 h-16 object-cover rounded-xl mb-1 shadow" />
                {/* 删除按钮 */}
                <button
                  type="button"
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white text-lg z-20 shadow"
                  onClick={e => { e.stopPropagation(); setStartFrame(null); setStartFile(null); }}
                  tabIndex={-1}
                  aria-label="删除首帧"
                >
                  ×
                </button>
              </>
            ) : (
              <span className="text-3xl text-gray-400 group-hover:text-blue-400">+</span>
            )}
            <div className="text-xs text-gray-400 mt-2">首帧</div>
            <Input
              ref={startInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleUpload(e, 'start')}
            />
          </div>
          {/* 中间切换符号 */}
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shadow border border-white/20 text-xl text-gray-400 z-10 font-bold">
            ⇄
          </div>
          {/* 尾帧卡片 */}
          <div
            className="flex-1 bg-white/10 rounded-2xl shadow-lg flex flex-col items-center justify-center h-36 cursor-pointer border-2 border-transparent hover:border-blue-400 transition group relative card-hover-effect"
            onClick={() => endInputRef.current?.click()}
          >
            {endFrame ? (
              <>
                <img src={endFrame} alt="尾帧" className="w-16 h-16 object-cover rounded-xl mb-1 shadow" />
                {/* 删除按钮 */}
                <button
                  type="button"
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white text-lg z-20 shadow"
                  onClick={e => { e.stopPropagation(); setEndFrame(null); }}
                  tabIndex={-1}
                  aria-label="删除尾帧"
                >
                  ×
                </button>
              </>
            ) : (
              <span className="text-3xl text-gray-400 group-hover:text-blue-400">+</span>
            )}
            <div className="text-xs text-gray-400 mt-2">尾帧（可选）</div>
            <Input
              ref={endInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleUpload(e, 'end')}
            />
          </div>
        </div>
        {/* 2. 描述输入区 */}
        <textarea
          className="w-full rounded-xl bg-white/10 border border-white/20 p-3 text-base text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow placeholder:text-white/50"
          rows={3}
          placeholder="请输入描述，如：怪兽抬头嘴巴喷火"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          disabled={loading}
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
            pointerEvents: loading ? 'none' : 'auto',
            opacity: loading ? 0.6 : 1
          }}
        />
        {/* 3. 创作按钮 */}
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl py-4 text-lg font-bold shadow-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 btn-hover-effect disabled:opacity-60"
          onClick={handleCreate}
          disabled={loading || !startFrame || !desc.trim()}
        >
          {loading ? `生成中...${progress ? `(${progress}%)` : ''}` : "创 作"}
        </button>
        
        {/* 调试模式切换 */}
        <button
          className="w-full bg-yellow-600 text-white rounded-xl py-2 text-sm font-semibold shadow hover:bg-yellow-700 transition-all duration-300"
          onClick={() => setDebugMode(!debugMode)}
        >
          {debugMode ? '关闭调试' : '开启调试'}
        </button>
        
        {/* 调试信息面板 */}
        {debugMode && (
          <div className="w-full p-3 bg-black/30 rounded-lg text-xs text-white">
            <div className="mb-2"><strong>调试状态:</strong></div>
            <div>loading: {loading.toString()}</div>
            <div>desc: "{desc}"</div>
            <div>desc.length: {desc.length}</div>
            <div>startFrame: {startFrame ? '已上传' : '未上传'}</div>
            <div>按钮禁用: {(loading || !startFrame || !desc.trim()).toString()}</div>
            <div className="mt-2">
              <button 
                className="bg-blue-500 px-2 py-1 rounded text-xs mr-2"
                onClick={() => setDesc('测试文本')}
              >
                设置测试文本
              </button>
              <button 
                className="bg-red-500 px-2 py-1 rounded text-xs mr-2"
                onClick={() => setDesc('')}
              >
                清空文本
              </button>
              <button 
                className="bg-green-500 px-2 py-1 rounded text-xs"
                onClick={() => {
                  const textarea = document.querySelector('textarea');
                  if (textarea) {
                    textarea.focus();
                    console.log('Textarea focused:', textarea);
                  }
                }}
              >
                强制聚焦
              </button>
            </div>
          </div>
        )}

        {/* 测试连接按钮 */}
        <button
          className="w-full bg-gray-600 text-white rounded-xl py-2 text-sm font-semibold shadow hover:bg-gray-700 transition-all duration-300"
          onClick={testConnection}
          disabled={loading}
        >
          测试RunningHub连接
        </button>
        {testResult && <div className="text-sm mt-2">{testResult}</div>}
        
        {/* 手动重试按钮 */}
        {retryInfo && error && !loading && (
          <button
            className="w-full bg-green-600 text-white rounded-xl py-2 text-sm font-semibold shadow hover:bg-green-700 transition-all duration-300"
            onClick={async () => {
              if (retryInfo.imageId && retryInfo.desc) {
                setLoading(true);
                setError("");
                setProgress(0);
                try {
                  const { taskId } = await runAITask(retryInfo.imageId, retryInfo.desc);
                  setLastTaskId(taskId);
                  const status = await pollTaskStatus(taskId);
                  if (status === 'COMPLETED') {
                    const videoUrl = await getTaskResult(taskId);
                    if (videoUrl) {
                      setResultVideo(videoUrl);
                      setRetryInfo(null); // 成功后清除重试信息
                    } else {
                      setError('未获取到视频结果');
                    }
                  } else {
                    setError('AI生成失败');
                  }
                } catch (err: any) {
                  setError(err.message || '重试失败');
                } finally {
                  setLoading(false);
                }
              }
            }}
          >
            🔄 手动重试
          </button>
        )}

        {/* 分析任务失败按钮 */}
        {lastTaskId && (
          <button
            className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-semibold shadow hover:bg-blue-700 transition-all duration-300"
            onClick={analyzeTaskFailure}
            disabled={loading}
          >
            分析任务失败原因
          </button>
        )}
        
        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        {debugInfo && (
          <div className="text-gray-300 text-sm mt-2 p-3 bg-black/20 rounded-lg max-h-32 overflow-y-auto">
            <div className="font-semibold mb-1">调试信息:</div>
            <div className="text-xs break-all">{debugInfo}</div>
          </div>
        )}
        
        {/* 分析结果 */}
        {analysisResult && (
          <div className="text-gray-300 text-sm mt-2 p-3 bg-black/20 rounded-lg max-h-48 overflow-y-auto">
            <div className="font-semibold mb-1">分析结果:</div>
            {analysisResult.loading ? (
              <div className="text-xs">分析中...</div>
            ) : analysisResult.error ? (
              <div className="text-red-400 text-xs">{analysisResult.error}</div>
            ) : analysisResult.success && analysisResult.analysis ? (
              <div className="text-xs">
                <div className="mb-2">
                  <strong>可能原因:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {analysisResult.analysis.possibleCauses?.map((cause: string, index: number) => (
                      <li key={index}>{cause}</li>
                    ))}
                  </ul>
                </div>
                {analysisResult.analysis.recommendations?.length > 0 && (
                  <div className="mb-2">
                    <strong>建议:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {analysisResult.analysis.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-xs opacity-75">
                  任务ID: {analysisResult.analysis.taskId}
                </div>
              </div>
            ) : (
              <div className="text-xs">无分析结果</div>
            )}
          </div>
        )}
      </div>
      {/* 右侧效果展示区 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-10 min-h-[500px] card-hover-effect transition-colors duration-300">
          {resultVideo ? (
            <video src={resultVideo} controls className="w-full max-w-[600px] max-h-[400px] rounded-2xl bg-black shadow-lg" />
          ) : (
            <div className="text-gray-400 text-lg">暂无视频预览</div>
          )}
          <div className="mt-10 flex gap-8 w-full justify-center">
            <button className="bg-white/10 hover:bg-blue-500/20 text-blue-400 border border-blue-400 rounded-xl px-8 py-3 text-lg font-semibold shadow btn-hover-effect transition-all duration-200" disabled={!resultVideo}>下载</button>
            <button className="bg-white/10 hover:bg-purple-500/20 text-purple-400 border border-purple-400 rounded-xl px-8 py-3 text-lg font-semibold shadow btn-hover-effect transition-all duration-200" disabled={!resultVideo}>复制链接</button>
            <button className="bg-white/10 hover:bg-blue-500/20 text-blue-400 border border-blue-400 rounded-xl px-8 py-3 text-lg font-semibold shadow btn-hover-effect transition-all duration-200" disabled={!resultVideo}>分享</button>
          </div>
        </div>
      </div>
    </div>
  );
} 