'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';

import { setProjectPageBackground } from '@/app/lib/projectTransition';

export function PageBackgroundController() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (pathname.startsWith('/projects/')) {
      setProjectPageBackground(true);
      return;
    }

    if (
      !document.body.classList.contains('body--project-transition') &&
      !document.documentElement.classList.contains('body--project-transition')
    ) {
      setProjectPageBackground(false);
    }
  }, [pathname]);

  return null;
}
