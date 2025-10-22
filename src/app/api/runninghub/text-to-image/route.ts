import { NextRequest, NextResponse } from 'next/server'

// RunningHub 文生图API 配置
const TEXT_TO_IMAGE_CONFIG = {
    baseUrl: 'https://www.runninghub.cn/task/openapi',
    webappId: '1980827034278608897',
    apiKey: 'fb88fac46b0349c1986c9cbb4f14d44e',
    nodes: {
        prompt: "56",      // 文字描述节点ID
        aspectRatio: "52"  // 图片比例节点ID
    },
    headers: {
        'Host': 'www.runninghub.cn',
        'Content-Type': 'application/json',
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('文生图API接收到请求:', body)

        const { prompt, aspectRatio, action } = body

        // 处理不同的操作类型
        if (action === 'status') {
            return await handleStatusCheck(body.taskId)
        } else if (action === 'generate') {
            return await handleGenerate(prompt, aspectRatio)
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "generate" or "status"' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('文生图API错误:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// 处理图片生成请求
async function handleGenerate(prompt: string, aspectRatio: string) {
    if (!prompt || !aspectRatio) {
        return NextResponse.json(
            { error: 'Prompt and aspect ratio are required' },
            { status: 400 }
        )
    }

    console.log('开始文生图生成:', {
        prompt,
        aspectRatio
    })

    try {
        // 构建节点信息列表
        const nodeInfoList = [
            {
                nodeId: TEXT_TO_IMAGE_CONFIG.nodes.prompt,
                fieldName: "prompt",
                fieldValue: prompt,
                description: "prompt"
            },
            {
                nodeId: TEXT_TO_IMAGE_CONFIG.nodes.aspectRatio,
                fieldName: "aspect_ratio",
                fieldValue: aspectRatio,
                description: "aspect_ratio"
            }
        ];

        const requestBody = {
            webappId: TEXT_TO_IMAGE_CONFIG.webappId,
            apiKey: TEXT_TO_IMAGE_CONFIG.apiKey,
            nodeInfoList: nodeInfoList
        };

        console.log('发送到RunningHub的请求:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${TEXT_TO_IMAGE_CONFIG.baseUrl}/ai-app/run`, {
            method: 'POST',
            headers: TEXT_TO_IMAGE_CONFIG.headers,
            body: JSON.stringify(requestBody)
        })

        console.log('RunningHub响应状态:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('RunningHub API错误响应:', errorText);
            throw new Error(`RunningHub API failed with HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json()
        console.log('RunningHub响应数据:', data)

        if (data.code === 0 && data.data && data.data.taskId) {
            return NextResponse.json({
                success: true,
                data: {
                    taskId: data.data.taskId,
                    status: 'started',
                    message: 'Text to image generation task started'
                }
            })
        } else {
            return NextResponse.json({
                success: false,
                error: data.msg || 'Failed to start text to image generation task'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('文生图生成错误:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to generate image',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// 处理任务状态查询
async function handleStatusCheck(taskId: string) {
    if (!taskId) {
        return NextResponse.json(
            { error: 'Task ID is required' },
            { status: 400 }
        )
    }

    console.log(`检查文生图任务状态: ${taskId}`)

    try {
        // 查询任务状态
        const statusResponse = await fetch(`${TEXT_TO_IMAGE_CONFIG.baseUrl}/status`, {
            method: 'POST',
            headers: TEXT_TO_IMAGE_CONFIG.headers,
            body: JSON.stringify({
                apiKey: TEXT_TO_IMAGE_CONFIG.apiKey,
                taskId: taskId
            })
        })

        if (!statusResponse.ok) {
            throw new Error(`Status query failed with HTTP ${statusResponse.status}`)
        }

        const statusData = await statusResponse.json()
        console.log('任务状态响应:', statusData)

        if (statusData.code === 0 && statusData.data) {
            const status = statusData.data

            if (status === 'SUCCESS' || status === 'COMPLETED') {
                console.log('任务完成，获取结果...')

                // 获取任务结果
                const outputResponse = await fetch(`${TEXT_TO_IMAGE_CONFIG.baseUrl}/outputs`, {
                    method: 'POST',
                    headers: TEXT_TO_IMAGE_CONFIG.headers,
                    body: JSON.stringify({
                        apiKey: TEXT_TO_IMAGE_CONFIG.apiKey,
                        taskId: taskId
                    })
                })

                if (outputResponse.ok) {
                    const outputData = await outputResponse.json()
                    console.log('任务结果响应:', outputData)

                    if (outputData.code === 0 && outputData.data && Array.isArray(outputData.data)) {
                        // 查找图片文件
                        const imageItem = outputData.data.find((item: any) =>
                            item.fileUrl && (
                                !item.fileType ||
                                item.fileType.toLowerCase().includes('png') ||
                                item.fileType.toLowerCase().includes('jpg') ||
                                item.fileType.toLowerCase().includes('jpeg') ||
                                item.fileType.toLowerCase().includes('gif') ||
                                item.fileType.toLowerCase().includes('webp') ||
                                item.fileType.toLowerCase().includes('image')
                            )
                        )

                        if (imageItem && imageItem.fileUrl) {
                            return NextResponse.json({
                                success: true,
                                data: {
                                    taskId,
                                    status: 'completed',
                                    imageUrl: imageItem.fileUrl,
                                    fileType: imageItem.fileType || 'image/png'
                                }
                            })
                        } else {
                            // 如果没有找到图片，返回第一个文件
                            const firstFile = outputData.data[0]
                            if (firstFile && firstFile.fileUrl) {
                                return NextResponse.json({
                                    success: true,
                                    data: {
                                        taskId,
                                        status: 'completed',
                                        imageUrl: firstFile.fileUrl,
                                        fileType: firstFile.fileType || 'image/png'
                                    }
                                })
                            } else {
                                return NextResponse.json({
                                    success: false,
                                    error: 'Task completed but no valid image found in results'
                                }, { status: 500 })
                            }
                        }
                    } else {
                        return NextResponse.json({
                            success: false,
                            error: 'Failed to get task results'
                        }, { status: 500 })
                    }
                } else {
                    return NextResponse.json({
                        success: false,
                        error: 'Failed to fetch task results'
                    }, { status: 500 })
                }

            } else if (status === 'FAILED' || status === 'ERROR') {
                return NextResponse.json({
                    success: false,
                    error: 'Text to image generation task failed'
                }, { status: 500 })
            } else if (status === 'RUNNING' || status === 'PENDING' || status === 'QUEUED') {
                return NextResponse.json({
                    success: true,
                    data: {
                        taskId,
                        status: 'running',
                        message: `Text to image generation in progress, status: ${status}`
                    }
                })
            } else {
                return NextResponse.json({
                    success: true,
                    data: {
                        taskId,
                        status: 'running', // 将未知状态也当作运行中处理
                        message: `Task processing, status: ${status}`
                    }
                })
            }
        } else {
            return NextResponse.json({
                success: false,
                error: `Status query failed: ${statusData.msg || 'Unknown error'}`
            }, { status: 500 })
        }

    } catch (error) {
        console.error('状态检查错误:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to check task status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
