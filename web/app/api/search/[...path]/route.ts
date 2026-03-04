import { NextRequest, NextResponse } from 'next/server';

const SEARCH_API_BASE = process.env.SEARCH_API_BASE_URL ?? 'http://127.0.0.1:5020/api';

async function proxy(request: NextRequest, params: { path?: string[] }) {
  const path = (params.path ?? []).join('/');
  const targetUrl = new URL(`${SEARCH_API_BASE}/${path}`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.text();

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: 'no-store'
  });

  const responseText = await upstream.text();
  return new NextResponse(responseText, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json'
    }
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, await context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, await context.params);
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
