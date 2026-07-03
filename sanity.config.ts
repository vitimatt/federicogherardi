'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { dataset, projectId } from './sanity/env';
import { schemaTypes } from './sanity/schemaTypes';
import { structure } from './sanity/structure';

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
  },
});
