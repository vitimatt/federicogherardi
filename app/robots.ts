import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/app/lib/siteSeo';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio', '/studio/'],
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  };
}
