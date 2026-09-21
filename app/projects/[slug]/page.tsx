import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProjectPageExperience } from '@/app/components/ProjectPageExperience';
import type { ProjectListItem } from '@/app/components/ProjectList';
import { buildProjectMetadata } from '@/app/lib/siteSeo';
import { SITE_PROJECTS_QUERY } from '@/app/lib/siteProjects';
import { client } from '@/sanity/lib/client';

type ProjectImage = {
  url: string;
  width: number;
  height: number;
};

type Project = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  client: string;
  images: ProjectImage[];
};

const PROJECT_QUERY = `*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  category,
  client,
  "images": images[]{
    "url": asset->url,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height
  }
}`;

export const dynamic = 'force-dynamic';

type ProjectPageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = await client.fetch<Project | null>(
    PROJECT_QUERY,
    { slug: params.slug },
    { cache: 'no-store' },
  );

  if (!project) {
    return {
      title: 'Project not found',
    };
  }

  return buildProjectMetadata({
    title: project.title,
    client: project.client,
    category: project.category,
    slug: project.slug,
    imageUrl: project.images[0]?.url ?? null,
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const [project, projects] = await Promise.all([
    client.fetch<Project | null>(PROJECT_QUERY, { slug: params.slug }, { cache: 'no-store' }),
    client.fetch<ProjectListItem[]>(SITE_PROJECTS_QUERY, {}, { cache: 'no-store' }),
  ]);

  if (!project) {
    notFound();
  }

  return <ProjectPageExperience project={project} projects={projects} />;
}
