import type { SiteInformation } from '@/app/components/SiteInfo';

export const SITE_INFORMATION_QUERY = `*[_type == "information"][0]{
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

export type SiteInformationRecord = SiteInformation & {
  openingImage?: {
    url: string;
    width: number;
    height: number;
  } | null;
};

export function toSiteInformation(record: SiteInformationRecord | null): SiteInformation {
  return {
    instagram: record?.instagram,
    email: record?.email,
    phone: record?.phone,
    about: record?.about,
    clientList: record?.clientList,
  };
}
