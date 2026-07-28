import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/forgot-password']

const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('dnshe_access_token')?.value

  const isPublic = publicPaths.some((path) => pathname.startsWith(path))
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path))
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/dashboard/admin')

  if (!token) {
    if (isDashboard) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isAdminRoute) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const roles: string[] = payload.roles || []
      if (!roles.includes('admin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
