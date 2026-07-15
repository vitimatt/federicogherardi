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

export type SiteInformationRecord = Omit<SiteInformation, 'clientList'> & {
  clientList?: string[] | string | null;
  openingImage?: {
    url: string;
    width: number;
    height: number;
  } | null;
};

function normalizeClientList(clientList: string[] | string | null | undefined) {
  if (!clientList) {
    return null;
  }

  const lines = Array.isArray(clientList)
    ? clientList
    : clientList.split('\n');

  const clients = lines.map((client) => client.trim()).filter(Boolean);

  return clients.length > 0 ? clients : null;
}

export function toSiteInformation(record: SiteInformationRecord | null): SiteInformation {
  return {
    instagram: record?.instagram,
    email: record?.email,
    phone: record?.phone,
    about: record?.about,
    clientList: normalizeClientList(record?.clientList),
  };
}

export function getSiteInfoInlineSectionCount(information?: SiteInformation | null) {
  if (!information) {
    return 1;
  }

  let count = 1;

  if (
    information.instagram?.trim() ||
    information.email?.trim() ||
    information.phone?.trim()
  ) {
    count += 1;
  }

  if (information.about?.trim()) {
    count += 1;
  }

  if (information.clientList?.some(Boolean)) {
    count += 1;
  }

  return count;
}
