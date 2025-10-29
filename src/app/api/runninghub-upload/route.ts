import { NextRequest, NextResponse } from 'next/server'

// RunningHub 上传配置
const RUNNINGHUB_CONFIG = {
    baseUrl: 'https://www.runninghub.cn',
    apiKey: 'fb88fac46b0349c1986c9cbb4f14d44e'
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            )
        }

        console.log('Uploading file to RunningHub:', file.name, file.size, file.type)

        // 创建新的FormData发送给RunningHub
        const runningHubFormData = new FormData()
        runningHubFormData.append('file', file)
        runningHubFormData.append('apiKey', RUNNINGHUB_CONFIG.apiKey) // API Key 需要通过 FormData 传递

        // 上传到RunningHub
        const uploadUrl = `${RUNNINGHUB_CONFIG.baseUrl}/task/openapi/upload`

        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: runningHubFormData
        })

        console.log('RunningHub upload response status:', response.status)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('RunningHub upload failed:', errorText)
            throw new Error(`RunningHub upload failed with status ${response.status}`)
        }

        const result = await response.json()
        console.log('RunningHub upload response:', result)

        // 检查RunningHub响应
        if (result.code !== 0) {
            throw new Error(result.msg || 'RunningHub upload failed')
        }

        if (!result.data || !result.data.fileName) {
            throw new Error('No fileName returned from RunningHub')
        }

        // 返回RunningHub的文件ID
        return NextResponse.json({
            success: true,
            fileId: result.data.fileName, // 保持完整的文件ID，如：api/xxx.png
            originalName: file.name,
            fileType: result.data.fileType
        })

    } catch (error) {
        console.error('RunningHub upload API error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to upload to RunningHub',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}