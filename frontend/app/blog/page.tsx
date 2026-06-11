import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { blogPosts, blogTopics } from '@/lib/content/blog';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';

export const metadata: Metadata = {
  title: 'Spa Jobs Career Blog | Workspa',
  description:
    'Career guides, salary insights, interview tips, and city guides for spa therapist, receptionist, beautician, housekeeping, and spa manager jobs.',
  alternates: { canonical: `${siteUrl}/blog` },
  openGraph: {
    title: 'Spa Jobs Career Blog | Workspa',
    description:
      'Career guides and salary insights for spa jobs in India.',
    url: `${siteUrl}/blog`,
    type: 'website',
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Spa Jobs Career Blog
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Practical guides for spa professionals looking for better jobs, salaries, interviews, and career growth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-4">
            {blogPosts.map((post) => (
              <article key={post.slug} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="text-sm text-brand-700 font-semibold mb-2">{post.category}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-brand-700">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4">{post.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span>{post.author}</span>
                  <span>{new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>{post.readTime}</span>
                </div>
              </article>
            ))}
          </section>

          <aside className="bg-white border border-gray-200 rounded-lg p-5 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Planned Blog Topics</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {blogTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}
