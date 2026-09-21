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
