import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';

export const metadata: Metadata = {
  title: 'Spa Centers in Mumbai | Workspa',
  description:
    'Explore spa centers in Mumbai and find related spa therapist, receptionist, beautician, and manager job openings.',
  alternates: { canonical: `${siteUrl}/spa-centers-in-mumbai` },
};

export default function SpaCentersMumbaiPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Spa Centers in Mumbai',
    description: 'Spa centers and spa jobs in Mumbai listed on Workspa.',
    url: `${siteUrl}/spa-centers-in-mumbai`,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Spa Centers in Mumbai</h1>
          <p className="text-gray-700 text-lg max-w-3xl mb-6">
            Discover spa centers across Mumbai and nearby areas. Candidates can use these listings to find active job openings and apply directly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/spa-near-me" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-md font-semibold">
              View Spa Centers
            </Link>
            <Link href="/spa-jobs-in-mumbai" className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-5 py-3 rounded-md font-semibold">
              Jobs in Mumbai
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
