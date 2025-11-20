import { NextRequest, NextResponse } from 'next/server'

// RunningHub API 配置
const RUNNINGHUB_CONFIG = {
    baseUrl: 'https://www.runninghub.cn/task/openapi',
    // 单图片应用配置
    singleImageApp: {
        webappId: '1953648181185839106',
        apiKey: 'fb88fac46b0349c1986c9cbb4f14d44e',
        nodes: {
            image: "118",
            prompt: "133"
        }
    },
    // 首尾帧应用配置
    firstLastFrameApp: {
        webappId: '1953712469422297090',
        apiKey: 'fb88fac46b0349c1986c9cbb4f14d44e',
        nodes: {
            prompt: "117",
            firstImage: "118",
            lastImage: "125"
        }
    },
    // Qwen Image Edit 应用配置
    qwenImageEditApp: {
        webappId: '1958091611945185282',
        apiKey: 'fb88fac46b0349c1986c9cbb4f14d44e',
        nodes: {
            image: "71",
            prompt: "73"
        }
    },
    // AI Image Enhancer 应用配置
    aiImageEnhancerApp: {
        webappId: '1958797744955613186',
        apiKey: 'fb88fac46b0349c1986c9cbb4f14d44e',
        nodes: {
            image: "2"
        }
    },
    headers: {
        'Host': 'www.runninghub.cn',
        'Content-Type': 'application/json',
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('RunningHub API received:', body)

        const { image, lastImage, prompt, action, webappId, apiKey, nodeInfoList } = body

        // 处理不同的操作类型
        if (action === 'status') {
            return await handleStatusCheck(body.taskId)
        } else if (action === 'generate') {
            return await handleGenerate(image, lastImage, prompt)
        } else if (action === 'qwen-image-edit') {
            return await handleQwenImageEdit(webappId, apiKey, nodeInfoList)
        } else if (action === 'kirkify-ai') {
            return await handleKirkifyAi(webappId, apiKey, nodeInfoList)
        } else if (action === 'enhance-image') {
            return await handleImageEnhancement(webappId, apiKey, nodeInfoList)
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Use "generate", "qwen-image-edit", "kirkify-ai", "enhance-image", or "status"' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('RunningHub API error:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// 处理视频生成请求
async function handleGenerate(image: string, lastImage: string | undefined, prompt: string) {
    if (!image || !prompt) {
        return NextResponse.json(
            { error: 'Image and prompt are required' },
            { status: 400 }
        )
    }

    // 根据是否有lastImage选择使用哪个应用
    const useFirstLastFrameApp = !!lastImage;
    const appConfig = useFirstLastFrameApp
        ? RUNNINGHUB_CONFIG.firstLastFrameApp
        : RUNNINGHUB_CONFIG.singleImageApp;

    console.log('Starting video generation:', {
        image,
        lastImage,
        prompt,
        appType: useFirstLastFrameApp ? 'firstLastFrame' : 'singleImage'
    })

    try {
        let nodeInfoList;

        if (useFirstLastFrameApp) {
            // 使用首尾帧应用
            const firstLastConfig = RUNNINGHUB_CONFIG.firstLastFrameApp;
            nodeInfoList = [
                {
                    nodeId: firstLastConfig.nodes.prompt,
                    fieldName: "prompt",
                    fieldValue: prompt,
                    description: "prompt"
                },
                {
                    nodeId: firstLastConfig.nodes.firstImage,
                    fieldName: "image",
                    fieldValue: image,
                    description: "image"
                },
                {
                    nodeId: firstLastConfig.nodes.lastImage,
                    fieldName: "image",
                    fieldValue: lastImage,
                    description: "image"
                }
            ];
        } else {
            // 使用单图片应用
            const singleConfig = RUNNINGHUB_CONFIG.singleImageApp;
            nodeInfoList = [
                {
                    nodeId: singleConfig.nodes.prompt,
                    fieldName: "prompt",
                    fieldValue: prompt,
                    description: "prompt"
                },
                {
                    nodeId: singleConfig.nodes.image,
                    fieldName: "image",
                    fieldValue: image,
                    description: "image"
                }
            ];
        }

        const requestBody = {
            webappId: appConfig.webappId,
            apiKey: appConfig.apiKey,
            nodeInfoList: nodeInfoList
        };

        console.log('Sending to RunningHub:', JSON.stringify(requestBody, null, 2));
        console.log('Image file ID being sent:', image);
        if (lastImage) {
            console.log('Last image file ID being sent:', lastImage);
        }

        const response = await fetch(`${RUNNINGHUB_CONFIG.baseUrl}/ai-app/run`, {
            method: 'POST',
            headers: RUNNINGHUB_CONFIG.headers,
            body: JSON.stringify(requestBody)
        })

        console.log('RunningHub response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('RunningHub API error response:', errorText);
            throw new Error(`RunningHub API failed with HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json()
        console.log('RunningHub response:', data)

        if (data.code === 0 && data.data && data.data.taskId) {
            return NextResponse.json({
                success: true,
                data: {
                    taskId: data.data.taskId,
                    status: 'started',
                    message: 'Video generation task started',
                    appType: useFirstLastFrameApp ? 'firstLastFrame' : 'singleImage'
                }
            })
        } else {
            return NextResponse.json({
                success: false,
                error: data.msg || 'Failed to start video generation task'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Generate video error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to generate video',
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

    console.log(`Checking task status: ${taskId}`)

    try {
        // 查询任务状态 - 使用单图片应用的API Key（两个应用共用状态查询）
        const statusResponse = await fetch(`${RUNNINGHUB_CONFIG.baseUrl}/status`, {
            method: 'POST',
            headers: RUNNINGHUB_CONFIG.headers,
            body: JSON.stringify({
                apiKey: RUNNINGHUB_CONFIG.singleImageApp.apiKey,
                taskId: taskId
            })
        })

        if (!statusResponse.ok) {
            throw new Error(`Status query failed with HTTP ${statusResponse.status}`)
        }

        const statusData = await statusResponse.json()
        console.log('Task status response:', statusData)

        if (statusData.code === 0 && statusData.data) {
            const status = statusData.data

            if (status === 'SUCCESS' || status === 'COMPLETED') {
                console.log('Task completed, getting results...')

                // 获取任务结果
                const outputResponse = await fetch(`${RUNNINGHUB_CONFIG.baseUrl}/outputs`, {
                    method: 'POST',
                    headers: RUNNINGHUB_CONFIG.headers,
                    body: JSON.stringify({
                        apiKey: RUNNINGHUB_CONFIG.singleImageApp.apiKey,
                        taskId: taskId
                    })
                })

                if (outputResponse.ok) {
                    const outputData = await outputResponse.json()
                    console.log('Task result response:', outputData)

                    if (outputData.code === 0 && outputData.data && Array.isArray(outputData.data)) {
                        // 查找视频文件
                        const videoItem = outputData.data.find((item: any) =>
                            item.fileUrl && (
                                !item.fileType ||
                                item.fileType.toLowerCase().includes('mp4') ||
                                item.fileType.toLowerCase().includes('mov') ||
                                item.fileType.toLowerCase().includes('avi') ||
                                item.fileType.toLowerCase().includes('video')
                            )
                        )

                        // 查找图片文件（用于Qwen Image Edit）
                        const imageItem = outputData.data.find((item: any) =>
                            item.fileUrl && (
                                item.fileType && (
                                    item.fileType.toLowerCase().includes('png') ||
                                    item.fileType.toLowerCase().includes('jpg') ||
                                    item.fileType.toLowerCase().includes('jpeg') ||
                                    item.fileType.toLowerCase().includes('gif') ||
                                    item.fileType.toLowerCase().includes('webp') ||
                                    item.fileType.toLowerCase().includes('image')
                                )
                            )
                        )

                        if (videoItem && videoItem.fileUrl) {
                            return NextResponse.json({
                                success: true,
                                data: {
                                    taskId,
                                    status: 'completed',
                                    videoUrl: videoItem.fileUrl,
                                    fileType: videoItem.fileType || 'video/mp4'
                                }
                            })
                        } else if (imageItem && imageItem.fileUrl) {
                            // 返回图片结果（用于Qwen Image Edit）
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
                            // 如果没有找到视频或图片，返回第一个文件
                            const firstFile = outputData.data[0]
                            if (firstFile && firstFile.fileUrl) {
                                // 根据文件类型判断是视频还是图片
                                const isImage = firstFile.fileType && (
                                    firstFile.fileType.toLowerCase().includes('png') ||
                                    firstFile.fileType.toLowerCase().includes('jpg') ||
                                    firstFile.fileType.toLowerCase().includes('jpeg') ||
                                    firstFile.fileType.toLowerCase().includes('gif') ||
                                    firstFile.fileType.toLowerCase().includes('webp') ||
                                    firstFile.fileType.toLowerCase().includes('image')
                                )
                                
                                return NextResponse.json({
                                    success: true,
                                    data: {
                                        taskId,
                                        status: 'completed',
                                        ...(isImage ? 
                                            { imageUrl: firstFile.fileUrl, fileType: firstFile.fileType || 'image/png' } :
                                            { videoUrl: firstFile.fileUrl, fileType: firstFile.fileType || 'video/mp4' }
                                        )
                                    }
                                })
                            } else {
                                return NextResponse.json({
                                    success: false,
                                    error: 'Task completed but no valid file found in results'
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
                    error: 'Video generation task failed'
                }, { status: 500 })
            } else if (status === 'RUNNING' || status === 'PENDING' || status === 'QUEUED') {
                return NextResponse.json({
                    success: true,
                    data: {
                        taskId,
                        status: 'running',
                        message: `Video generation in progress, status: ${status}`
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
        console.error('Status check error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to check task status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// 处理Qwen Image Edit请求
async function handleQwenImageEdit(webappId: string, apiKey: string, nodeInfoList: any[]) {
    if (!webappId || !apiKey || !nodeInfoList) {
        return NextResponse.json(
            { error: 'webappId, apiKey, and nodeInfoList are required for Qwen Image Edit' },
            { status: 400 }
        )
    }

    console.log('Starting Qwen Image Edit:', {
        webappId,
        nodeInfoList
    })

    try {
        const requestBody = {
            webappId,
            apiKey,
            nodeInfoList
        };

        console.log('Sending Qwen Image Edit request to RunningHub:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${RUNNINGHUB_CONFIG.baseUrl}/ai-app/run`, {
            method: 'POST',
            headers: RUNNINGHUB_CONFIG.headers,
            body: JSON.stringify(requestBody)
        })

        console.log('RunningHub Qwen Image Edit response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('RunningHub Qwen Image Edit API error response:', errorText);
            throw new Error(`RunningHub API failed with HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json()
        console.log('RunningHub Qwen Image Edit response:', data)

        if (data.code === 0 && data.data && data.data.taskId) {
            return NextResponse.json({
                success: true,
                data: {
                    taskId: data.data.taskId,
                    status: 'started',
                    message: 'Qwen Image Edit task started'
                }
            })
        } else {
            return NextResponse.json({
                success: false,
                error: data.msg || 'Failed to start Qwen Image Edit task'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Qwen Image Edit error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to process Qwen Image Edit',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// 处理Kirkify AI请求
async function handleKirkifyAi(webappId: string, apiKey: string, nodeInfoList: any[]) {
    if (!webappId || !apiKey || !nodeInfoList) {
        return NextResponse.json(
            { error: 'webappId, apiKey, and nodeInfoList are required for Kirkify AI' },
            { status: 400 }
        )
    }

    console.log('Starting Kirkify AI:', {
        webappId,
        nodeInfoList
    })

    try {
        const requestBody = {
            webappId,
            apiKey,
            nodeInfoList
        };

        console.log('Sending Kirkify AI request to RunningHub:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${RUNNINGHUB_CONFIG.baseUrl}/ai-app/run`, {
            method: 'POST',
            headers: RUNNINGHUB_CONFIG.headers,
            body: JSON.stringify(requestBody)
        })

        console.log('RunningHub Kirkify AI response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('RunningHub Kirkify AI API error response:', errorText);
            throw new Error(`RunningHub API failed with HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json()
        console.log('RunningHub Kirkify AI response:', data)

        if (data.code === 0 && data.data && data.data.taskId) {
            return NextResponse.json({
                success: true,
                data: {
                    taskId: data.data.taskId,
                    status: 'started',
                    message: 'Kirkify AI task started'
                }
            })
        } else {
            return NextResponse.json({
                success: false,
                error: data.msg || 'Failed to start Kirkify AI task'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Kirkify AI error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to process Kirkify AI',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// 处理图片增强请求
async function handleImageEnhancement(webappId: string, apiKey: string, nodeInfoList: any[]) {
    if (!webappId || !apiKey || !nodeInfoList) {
        return NextResponse.json(
            { error: 'webappId, apiKey, and nodeInfoList are required for Image Enhancement' },
            { status: 400 }
        )
    }

    console.log('Starting AI Image Enhancement:', {
        webappId,
        nodeInfoList
    })

    try {
        const requestBody = {
            webappId,
            apiKey,
            nodeInfoList
        };

        console.log('Sending AI Image Enhancement request to RunningHub:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${RUNNINGHUB_CONFIG.baseUrl}/ai-app/run`, {
            method: 'POST',
            headers: RUNNINGHUB_CONFIG.headers,
            body: JSON.stringify(requestBody)
        })

        console.log('RunningHub AI Image Enhancement response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('RunningHub AI Image Enhancement API error response:', errorText);
            throw new Error(`RunningHub API failed with HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json()
        console.log('RunningHub AI Image Enhancement response:', data)

        if (data.code === 0 && data.data && data.data.taskId) {
            return NextResponse.json({
                success: true,
                data: {
                    taskId: data.data.taskId,
                    status: 'started',
                    message: 'AI Image Enhancement task started'
                }
            })
        } else {
            return NextResponse.json({
                success: false,
                error: data.msg || 'Failed to start AI Image Enhancement task'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('AI Image Enhancement error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to process AI Image Enhancement',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
