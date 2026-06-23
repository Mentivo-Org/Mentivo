import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mentivo.in';
  
  const routes = [
    '',
    '/about',
    '/faq',
    '/disclaimer',
    '/privacy',
    '/terms',
    '/support',
    '/mentor',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
