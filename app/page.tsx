import { HomeExperience } from '@/app/components/HomeExperience';
import type { ProjectListItem } from '@/app/components/ProjectList';
import { mergeSiteProjects, SITE_PROJECTS_QUERY } from '@/app/lib/siteProjects';
import { SITE_INFORMATION_QUERY } from '@/app/lib/siteInformation';
import { client } from '@/sanity/lib/client';

type OpeningImage = {
  url: string;
  width: number;
  height: number;
};

type Information = {
  openingImage?: OpeningImage | null;
} | null;

type Project = ProjectListItem;

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [projects, information] = await Promise.all([
    client.fetch<Project[]>(SITE_PROJECTS_QUERY, {}, { cache: 'no-store' }),
    client.fetch<Information>(SITE_INFORMATION_QUERY, {}, { cache: 'no-store' }),
  ]);
  const allProjects = mergeSiteProjects(projects);

  return (
    <HomeExperience openingImage={information?.openingImage} projects={allProjects} />
  );
}
