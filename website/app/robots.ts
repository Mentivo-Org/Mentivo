import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/login',
        '/signup',
        '/referral/',
        '/verify-otp',
        '/setup-password',
        '/add-credits',
      ],
    },
    sitemap: 'https://mentivo.in/sitemap.xml',
  };
}
