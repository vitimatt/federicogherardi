import type { ProjectListItem } from '@/app/components/ProjectList';

export const SITE_PROJECTS_QUERY = `*[_type == "project"] | order(orderRank asc) {
  _id,
  title,
  "slug": slug.current,
  category,
  client,
  "imageCount": count(images),
  "firstImage": images[0]{
    "url": asset->url,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height
  },
  "images": images[]{
    "url": asset->url,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height
  }
}`;

const FAKE_TITLES = [
  'Untitled',
  'Spring Campaign',
  'A Study in Light and Shadow Across the Urban Landscape',
  'No. 7',
  'Portrait Series for the New Collection Launch',
  'Blue Hour',
  'Editorial Commission: Fashion Week Documentation and Behind-the-Scenes Coverage',
  'Still Life',
  'Corporate Identity Refresh and Brand Guidelines for International Markets',
  'Archive',
];

const FAKE_CLIENTS = [
  'Studio',
  'Maison Laurent',
  'Independent',
  'Atelier North & Partners International Creative Group',
  'Self',
  'Bureau of Visual Arts and Contemporary Design Practice',
  'Archive',
  'Client Name Here',
  'The Museum of Applied Arts, Design, and Cultural Heritage Foundation',
  '—',
];

const FAKE_PROJECT_COUNT = 35;

export const FAKE_SITE_PROJECTS: ProjectListItem[] = Array.from(
  { length: FAKE_PROJECT_COUNT },
  (_, index) => ({
    _id: `fake-${index + 1}`,
    title: FAKE_TITLES[index % FAKE_TITLES.length],
    category: 'Editorial',
    client: FAKE_CLIENTS[(index + 3) % FAKE_CLIENTS.length],
    imageCount: (index % 9) + 3,
  }),
);

export function mergeSiteProjects(projects: ProjectListItem[]) {
  return [...projects, ...FAKE_SITE_PROJECTS];
}
