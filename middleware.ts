import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// This middleware runs on every request to ensure authentication
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;
  
  // Skip middleware for public assets and login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/login') ||
    pathname.includes('.') // Static files like favicon.ico
  ) {
    return res;
  }

  // Create a Supabase client configured for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.delete({ name, ...options });
        },
      },
    }
  );
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  // If not authenticated and trying to access a protected route, redirect to login
  if (!session && !pathname.startsWith('/api/')) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // For API routes that require authentication
  if (!session && pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|login).*)'],
}; 