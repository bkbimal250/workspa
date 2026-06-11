import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { blogPosts, getBlogPost } from '@/lib/content/blog';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return {};

  const url = `${siteUrl}/blog/${post.slug}`;
  return {
    title: `${post.title} | Workspa`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default function BlogDetailPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const url = `${siteUrl}/blog/${post.slug}`;
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: 'Workspa' },
    mainEntityOfPage: url,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/blog" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          Blog
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 mb-4">{post.title}</h1>
        <p className="text-lg text-gray-600 mb-5">{post.description}</p>
        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-8">
          <span>{post.author}</span>
          <span>{new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>{post.readTime}</span>
        </div>

        <article className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-7">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{section.heading}</h2>
              <p className="text-gray-700 leading-relaxed">{section.body}</p>
            </section>
          ))}

          <section className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Related job pages</h2>
            <div className="flex flex-wrap gap-2">
              {post.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-md bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
