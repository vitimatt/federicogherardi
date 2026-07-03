import { HomeExperience } from '@/app/components/HomeExperience';
import type { SiteInformation } from '@/app/components/SiteInfo';
import type { ProjectListItem } from '@/app/components/ProjectList';
import { mergeSiteProjects, SITE_PROJECTS_QUERY } from '@/app/lib/siteProjects';
import { client } from '@/sanity/lib/client';

type OpeningImage = {
  url: string;
  width: number;
  height: number;
};

type Information = {
  openingImage?: OpeningImage | null;
  instagram?: string | null;
  email?: string | null;
  phone?: string | null;
  about?: string | null;
  clientList?: string[] | null;
} | null;

type Project = ProjectListItem;

const INFORMATION_QUERY = `*[_type == "information"][0]{
  openingImage{
    "url": asset->url,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height
  },
  instagram,
  email,
  phone,
  about,
  clientList
}`;

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [projects, information] = await Promise.all([
    client.fetch<Project[]>(SITE_PROJECTS_QUERY, {}, { cache: 'no-store' }),
    client.fetch<Information>(INFORMATION_QUERY, {}, { cache: 'no-store' }),
  ]);
  const allProjects = mergeSiteProjects(projects);

  const siteInformation: SiteInformation = {
    instagram: information?.instagram,
    email: information?.email,
    phone: information?.phone,
    about: information?.about,
    clientList: information?.clientList,
  };

  return (
    <HomeExperience
      openingImage={information?.openingImage}
      projects={allProjects}
      information={siteInformation}
    />
  );
}
