import type { Metadata } from 'next';

import { PageBackgroundController } from '@/app/components/PageBackgroundController';
import { SiteInfoProvider } from '@/app/components/SiteInfoProvider';
import { toSiteInformation, SITE_INFORMATION_QUERY, type SiteInformationRecord } from '@/app/lib/siteInformation';
import { client } from '@/sanity/lib/client';

import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js + Sanity CMS',
  description: 'A Next.js site powered by Sanity CMS',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const information = await client.fetch<SiteInformationRecord | null>(
    SITE_INFORMATION_QUERY,
    {},
    { cache: 'no-store' },
  );

  return (
    <html lang="en">
      <body>
        <PageBackgroundController />
        <SiteInfoProvider information={toSiteInformation(information)}>
          {children}
        </SiteInfoProvider>
      </body>
    </html>
  );
}
