import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PortableText } from 'next-sanity';

import { client } from '@/sanity/lib/client';

type Post = {
  _id: string;
  title: string;
  slug: string;
  body?: unknown;
};

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  body
}`;

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await client.fetch<Post | null>(POST_QUERY, {
    slug: params.slug,
  });

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
      <Link href="/" className="mb-8 text-sm font-medium text-blue-600 hover:underline">
        ← Back to home
      </Link>
      <article>
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        {Array.isArray(post.body) && post.body.length > 0 ? (
          <div className="prose prose-gray mt-8 max-w-none">
            <PortableText value={post.body} />
          </div>
        ) : null}
      </article>
    </main>
  );
}
