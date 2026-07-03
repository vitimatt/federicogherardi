# Next.js + Sanity CMS (Netlify-ready)

A single Next.js 14 application with an embedded Sanity Studio at `/studio`. The frontend runs at `/` locally and in production.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Sanity CMS** (embedded Studio at `/studio`)
- **Netlify** (`@netlify/plugin-nextjs`)

## Prerequisites

- Node.js 20+
- npm 7+

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Environment variables are already set in `.env.local`:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SANITY_PROJECT_ID` | `iyvkkgxs` |
   | `NEXT_PUBLIC_SANITY_DATASET` | `production` |
   | `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-01-01` |

3. Start the dev server (frontend + Studio together):

   ```bash
   npm run dev
   ```

4. Open:

   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Sanity Studio:** [http://localhost:3000/studio](http://localhost:3000/studio)

No separate Studio folder or second dev server is required.

### Sanity CORS (required once)

Before Studio can authenticate locally, add your dev URL in the [Sanity project settings](https://www.sanity.io/manage/project/iyvkkgxs/api):

1. Go to **API → CORS origins**
2. Add `http://localhost:3000` with **Allow credentials** enabled
3. After deploying, add your Netlify URL (e.g. `https://your-site.netlify.app`) the same way

## Content model

The project includes a `post` document type with:

- `title` (string)
- `slug` (slug, generated from title)
- `body` (rich text / Portable Text)

Create posts in Studio at `/studio`, then view them on the homepage and at `/posts/[slug]`.

## Deploy to Netlify

### Option A: Netlify UI

1. Push this project to a Git repository (GitHub, GitLab, or Bitbucket).
2. In [Netlify](https://app.netlify.com), click **Add new site → Import an existing project**.
3. Select your repository.
4. Build settings are read from `netlify.toml` automatically:
   - **Build command:** `npm run build`
   - **Plugin:** `@netlify/plugin-nextjs`
5. Add these **environment variables** in **Site configuration → Environment variables**:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SANITY_PROJECT_ID` | `iyvkkgxs` |
   | `NEXT_PUBLIC_SANITY_DATASET` | `production` |
   | `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-01-01` |

6. Deploy. After the build finishes:
   - Frontend: `https://your-site.netlify.app/`
   - Studio: `https://your-site.netlify.app/studio`

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set NEXT_PUBLIC_SANITY_PROJECT_ID iyvkkgxs
netlify env:set NEXT_PUBLIC_SANITY_DATASET production
netlify env:set NEXT_PUBLIC_SANITY_API_VERSION 2024-01-01
netlify deploy --build --prod
```

Remember to add your Netlify production URL to Sanity CORS origins (see above).

## Project structure

```
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage (/)
│   ├── posts/[slug]/page.tsx   # Single post pages
│   └── studio/[[...index]]/    # Embedded Sanity Studio (/studio)
├── sanity/
│   ├── env.ts                  # Sanity env helpers
│   ├── lib/client.ts           # Sanity client for data fetching
│   └── schemaTypes/            # Content schemas (post)
├── sanity.config.ts            # Studio configuration
├── sanity.cli.ts               # Sanity CLI configuration
├── netlify.toml                # Netlify build & plugin config
└── next.config.mjs             # Next.js config (styled-components, transpile)
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server (frontend + Studio) |
| `npm run build` | Production build |
| `npm run start` | Start production server locally |
| `npm run lint` | Run ESLint |

## Notes

- There is **no redirect** from `/` to `/studio`; they are separate routes.
- Studio is mounted via the App Router catch-all route at `app/studio/[[...index]]/page.tsx`.
- `sanity.config.ts` uses `basePath: '/studio'` to match the route.
