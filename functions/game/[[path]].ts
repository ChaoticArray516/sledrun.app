interface GameAssetContext {
  request: Request;
  env: {
    SLEDRUN_ASSETS?: R2Bucket;
    ASSETS: { fetch: (request: Request) => Promise<Response> };
  };
}

const contentTypes: Record<string, string> = {
  js: 'text/javascript; charset=utf-8',
  wasm: 'application/wasm',
  glb: 'model/gltf-binary',
  png: 'image/png',
  json: 'application/json; charset=utf-8',
  ktx2: 'image/ktx2',
};

function contentTypeFor(key: string): string | undefined {
  const extension = key.split('.').pop()?.toLowerCase();
  return extension ? contentTypes[extension] : undefined;
}

function withAssetHeaders(response: Response, key: string): Response {
  const headers = new Headers(response.headers);
  const contentType = contentTypeFor(key);
  if (contentType) headers.set('Content-Type', contentType);
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function onRequest(context: GameAssetContext): Promise<Response> {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const pathname = new URL(context.request.url).pathname;
  const key = decodeURIComponent(pathname.replace(/^\/game\//, ''));
  if (!/^v[12]\//.test(key) || key.includes('..')) return new Response('Not found', { status: 404 });

  const object = await context.env.SLEDRUN_ASSETS?.get(key);
  if (object) {
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    const contentType = contentTypeFor(key);
    if (contentType) headers.set('Content-Type', contentType);
    headers.set('ETag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(object.body, { status: 200, headers });
  }
  const fallback = await context.env.ASSETS.fetch(context.request);
  return withAssetHeaders(fallback, key);
}
