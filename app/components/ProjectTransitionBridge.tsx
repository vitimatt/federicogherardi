'use client';

import { useEffect, useMemo, useState } from 'react';

import { ProjectTransitionHero } from '@/app/components/ProjectTransitionHero';
import {
  PROJECT_TRANSITION_END_EVENT,
  PROJECT_TRANSITION_START_EVENT,
  readProjectTransitionPayload,
} from '@/app/lib/projectTransition';

export function ProjectTransitionBridge() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const sync = () => setVersion((current) => current + 1);

    window.addEventListener(PROJECT_TRANSITION_START_EVENT, sync);
    window.addEventListener(PROJECT_TRANSITION_END_EVENT, sync);

    return () => {
      window.removeEventListener(PROJECT_TRANSITION_START_EVENT, sync);
      window.removeEventListener(PROJECT_TRANSITION_END_EVENT, sync);
    };
  }, []);

  const payload = useMemo(() => {
    void version;
    return readProjectTransitionPayload();
  }, [version]);

  if (!payload) {
    return null;
  }

  return <ProjectTransitionHero layout={payload.layout} />;
}
