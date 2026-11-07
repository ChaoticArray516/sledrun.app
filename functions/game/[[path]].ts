interface GameAssetContext {
  request: Request;
  env: {
    SLEDRUN_ASSETS?: R2Bucket;
    ASSETS: { fetch: (request: Request) => Promise<Response> };
  };
}

export async function onRequest(context: GameAssetContext): Promise<Response> {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const pathname = new URL(context.request.url).pathname;
  const key = decodeURIComponent(pathname.replace(/^\/game\//, ''));
  if (!key.startsWith('v1/') || key.includes('..')) return new Response('Not found', { status: 404 });

  const object = await context.env.SLEDRUN_ASSETS?.get(key);
  if (object) {
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('ETag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(object.body, { status: 200, headers });
  }
  return context.env.ASSETS.fetch(context.request);
}
