import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'enhanced-image.png';

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log('Proxying download for:', imageUrl);

    // 获取图片数据
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (compatible; ImageToVideoAI/1.0)',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    console.log('Image fetched successfully, size:', imageBuffer.byteLength, 'type:', contentType);

    // 返回图片数据，设置下载头
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to download image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
