import type { Metadata } from 'next';

import { FontReadyProvider } from '@/app/components/FontReadyProvider';
import { PageBackgroundController } from '@/app/components/PageBackgroundController';
import { SiteInfoProvider } from '@/app/components/SiteInfoProvider';
import { toSiteInformation, SITE_INFORMATION_QUERY, type SiteInformationRecord } from '@/app/lib/siteInformation';
import { buildRootMetadata, DEFAULT_SITE_DESCRIPTION } from '@/app/lib/siteSeo';
import { client } from '@/sanity/lib/client';

import './globals.css';

function siteDescriptionFromAbout(about?: string | null) {
  const trimmed = about?.replace(/\s+/g, ' ').trim();

  if (!trimmed) {
    return DEFAULT_SITE_DESCRIPTION;
  }

  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
}

export async function generateMetadata(): Promise<Metadata> {
  const information = await client.fetch<SiteInformationRecord | null>(
    SITE_INFORMATION_QUERY,
    {},
    { cache: 'no-store' },
  );

  return buildRootMetadata(siteDescriptionFromAbout(information?.about));
}

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
      <head>
        <link
          rel="preload"
          href="/fonts/primary/FG-Font.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/secondary/OCR-A.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <noscript>
          <style>{`html:not(.fonts-ready) :is(.text-primary, .text-secondary) { opacity: 1 !important; }`}</style>
        </noscript>
      </head>
      <body>
        <PageBackgroundController />
        <FontReadyProvider>
          <SiteInfoProvider information={toSiteInformation(information)}>
            {children}
          </SiteInfoProvider>
        </FontReadyProvider>
      </body>
    </html>
  );
}
