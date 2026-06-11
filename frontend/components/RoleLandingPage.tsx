'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { getRoleLandingPage, locationLandingPages, roleLandingPages } from '@/lib/content/seo-pages';

export default function RoleLandingPage({ slug }: { slug: string }) {
  const page = getRoleLandingPage(slug);
  if (!page) return null;

  const jobsHref = `/jobs?job_category=${encodeURIComponent(page.query)}`;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How can I apply for ${page.title.toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Open the latest ${page.title.toLowerCase()} on Workspa, review the job details, and use Quick Apply, Call, or WhatsApp where available.`,
        },
      },
      {
        '@type': 'Question',
        name: `Are ${page.title.toLowerCase()} available near me?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use city and area filters on Workspa to find nearby spa jobs in Mumbai, Navi Mumbai, Thane, and surrounding areas.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main>
        <section className="bg-brand-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-white/80 font-semibold mb-3">Workspa Jobs</p>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">{page.title}</h1>
            <p className="max-w-3xl text-white/90 text-lg">{page.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={jobsHref} className="bg-gold-500 hover:bg-gold-600 text-white px-5 py-3 rounded-md font-semibold">
                View Latest Jobs
              </Link>
              <Link href="/spa-jobs-near-me" className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-md font-semibold">
                Jobs Near Me
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What to expect</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Workspa lists verified openings from spa centers and wellness businesses. You can compare location,
                salary, timing, experience, gender preference, and contact options before applying.
              </p>
              <p>
                For better shortlisting, keep your phone number active and apply to jobs matching your city, experience,
                and preferred working hours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-7">
              <section className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Common responsibilities</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {page.duties.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Useful skills</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {page.skills.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <aside className="bg-white border border-gray-200 rounded-lg p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Explore More</h2>
            <div className="space-y-2">
              {roleLandingPages.filter((item) => item.slug !== slug).map((item) => (
                <Link key={item.slug} href={`/jobs/${item.slug}`} className="block text-brand-700 hover:text-brand-800 font-medium">
                  {item.title}
                </Link>
              ))}
              {locationLandingPages.map((item) => (
                <Link key={item.href} href={item.href} className="block text-brand-700 hover:text-brand-800 font-medium">
                  {item.label}
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
