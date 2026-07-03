import type { Metadata } from 'next';

import { PageBackgroundController } from '@/app/components/PageBackgroundController';
import { ProjectTransitionBridge } from '@/app/components/ProjectTransitionBridge';

import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js + Sanity CMS',
  description: 'A Next.js site powered by Sanity CMS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PageBackgroundController />
        <ProjectTransitionBridge />
        {children}
      </body>
    </html>
  );
}
