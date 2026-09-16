import type { Metadata } from 'next';

import { FontReadyProvider } from '@/app/components/FontReadyProvider';
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
