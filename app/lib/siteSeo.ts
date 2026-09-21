import type { Metadata } from 'next';

export const SITE_NAME = 'Federico Gherardi';

export const DEFAULT_SITE_DESCRIPTION =
  'Photography portfolio by Federico Gherardi — editorial, fashion, and commercial work.';

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

  if (explicit) {
    return new URL(explicit);
  }

  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, '');

  if (vercelUrl) {
    return new URL(`https://${vercelUrl}`);
  }

  return new URL('http://localhost:3000');
}

export function buildRootMetadata(description = DEFAULT_SITE_DESCRIPTION): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: siteUrl,
    title: {
      default: SITE_NAME,
      template: `%s — ${SITE_NAME}`,
    },
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en',
      url: siteUrl,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildProjectMetadata(project: {
  title: string;
  client: string;
  category: string;
  slug: string;
  imageUrl?: string | null;
}): Metadata {
  const title = `${project.title} — ${project.client}`;
  const description = `${project.category} photography project for ${project.client}.`;
  const path = `/projects/${project.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: path,
      ...(project.imageUrl
        ? {
            images: [
              {
                url: project.imageUrl,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: project.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(project.imageUrl ? { images: [project.imageUrl] } : {}),
    },
  };
}
