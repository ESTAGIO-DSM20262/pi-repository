import { type NextRequest, NextResponse } from 'next/server'
import { shouldRejectCrossOriginRequest } from '@/libs/request-origin'

export function proxy(request: NextRequest) {
  const rejected = shouldRejectCrossOriginRequest({
    method: request.method,
    pathname: request.nextUrl.pathname,
    origin: request.headers.get('origin'),
    host: request.headers.get('host'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    configuredOrigin: process.env.BETTER_AUTH_URL,
  })

  if (rejected) {
    return NextResponse.json(
      { error: 'Requisição bloqueada: origem não autorizada.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
