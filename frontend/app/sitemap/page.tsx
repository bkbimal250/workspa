import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { blogPosts } from '@/lib/content/blog';
import { locationLandingPages, roleLandingPages } from '@/lib/content/seo-pages';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';

export const metadata: Metadata = {
  title: 'Sitemap | Workspa',
  description: 'Browse important Workspa pages including jobs, spa centers, career guides, city pages, and policy pages.',
  alternates: { canonical: `${siteUrl}/sitemap` },
};

const corePages = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'All Jobs' },
  { href: '/spa-near-me', label: 'Spa Near Me' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/blog', label: 'Blog' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Sitemap</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <SitemapGroup title="Main Pages" links={corePages} />
          <SitemapGroup title="Job Roles" links={roleLandingPages.map((page) => ({ href: `/jobs/${page.slug}`, label: page.title }))} />
          <SitemapGroup title="Locations" links={locationLandingPages} />
          <SitemapGroup title="Blog" links={blogPosts.map((post) => ({ href: `/blog/${post.slug}`, label: post.title }))} />
        </div>
      </main>
    </div>
  );
}

function SitemapGroup({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-brand-700 hover:text-brand-800 text-sm font-medium">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
