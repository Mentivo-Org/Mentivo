import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check if production mode is enabled via environment variable
  const isProductionMode = process.env.PRODUCTION_MODE === 'true';

  if (isProductionMode) {
    const { pathname } = request.nextUrl;

    // Allow static assets, API routes, and the maintenance page itself
    // to prevent infinite loops and broken assets
    const isStaticAsset = 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname.startsWith('/logo.svg') ||
      pathname.includes('.'); // Usually files have extensions

    const isMaintenancePage = pathname.startsWith('/maintenance');
    const isPrivacyPage = pathname.endsWith('/privacy');
    const isAboutPage = pathname.startsWith('/about');
    const isSupportPage = pathname.startsWith('/support');

    if (!isStaticAsset && !isMaintenancePage && !isPrivacyPage && !isAboutPage && !isSupportPage) {
      // Rewrite the request to the maintenance page
      // This keeps the URL in the browser address bar but serves the maintenance content
      return NextResponse.rewrite(new URL('/maintenance', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure the middleware runs on all relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - logo.svg (logo file)
     */
    '/((?!api|_next/static|_next/image|logo.svg).*)',
  ],
};
