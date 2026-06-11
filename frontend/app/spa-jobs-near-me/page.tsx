import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';

export const metadata: Metadata = {
  title: 'Spa Jobs Near Me | Workspa',
  description:
    'Find spa therapist, receptionist, beautician, housekeeping, and spa manager jobs near you. Browse verified spa jobs and apply quickly.',
  alternates: { canonical: `${siteUrl}/spa-jobs-near-me` },
};

export default function SpaJobsNearMePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Spa Jobs Near Me</h1>
          <p className="text-gray-700 text-lg max-w-3xl mb-6">
            Search verified spa jobs by city, area, role, salary, and experience. Workspa helps candidates apply quickly to nearby spa centers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-md font-semibold">
              Browse Jobs
            </Link>
            <Link href="/spa-near-me" className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-5 py-3 rounded-md font-semibold">
              Find Spas Near Me
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
