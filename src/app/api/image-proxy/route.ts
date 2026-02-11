import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const IMAGE_PROXY_TIMEOUT_MS = 10000; // 10 秒超时，避免慢图拖死

// OrionTV 兼容接口：代理图片解决 HTTPS 下 HTTP 图与防盗链
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_PROXY_TIMEOUT_MS);

  try {
    const isDouban =
      imageUrl.includes('doubanio.com') || imageUrl.includes('douban.com');
    // 豆瓣必须带豆瓣 Referer；其他站带图片所在域名的 Origin，减少 403 防盗链
    let referer: string | undefined;
    if (isDouban) {
      referer = 'https://movie.douban.com/';
    } else {
      try {
        const u = new URL(imageUrl);
        referer = `${u.protocol}//${u.host}/`;
      } catch {
        referer = undefined;
      }
    }
    const imageResponse = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        ...(referer ? { Referer: referer } : {}),
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: imageResponse.statusText },
        { status: imageResponse.status },
      );
    }

    const contentType = imageResponse.headers.get('content-type');

    if (!imageResponse.body) {
      return NextResponse.json(
        { error: 'Image response has no body' },
        { status: 500 },
      );
    }

    // 创建响应头
    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // 设置缓存头（可选）
    headers.set('Cache-Control', 'public, max-age=15720000, s-maxage=15720000'); // 缓存半年
    headers.set('CDN-Cache-Control', 'public, s-maxage=15720000');
    headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=15720000');
    headers.set('Netlify-Vary', 'query');

    // 直接返回图片流
    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: isAbort ? 'Image fetch timeout' : 'Error fetching image' },
      { status: isAbort ? 504 : 500 },
    );
  }
}
