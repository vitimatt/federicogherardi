import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/app/lib/siteSeo';
import { client } from '@/sanity/lib/client';

const PROJECT_SLUGS_QUERY = `*[_type == "project" && defined(slug.current)]{
  "slug": slug.current,
  _updatedAt
}`;

type ProjectSlugRecord = {
  slug: string;
  _updatedAt?: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const projects = await client.fetch<ProjectSlugRecord[]>(
    PROJECT_SLUGS_QUERY,
    {},
    { cache: 'no-store' },
  );

  const projectEntries: MetadataRoute.Sitemap = projects
    .filter((project) => project.slug)
    .map((project) => ({
      url: new URL(`/projects/${project.slug}`, siteUrl).toString(),
      lastModified: project._updatedAt ? new Date(project._updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

  return [
    {
      url: siteUrl.toString(),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...projectEntries,
  ];
}
