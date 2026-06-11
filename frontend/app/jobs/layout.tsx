import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

// Default metadata for jobs listing page
// This can be overridden by child routes with generateMetadata
export const metadata: Metadata = generatePageMetadata(
  'Browse All Work Spa',
  'Browse thousands of Work Spa across India. Filter by location, salary, experience, and job type. Find therapist, receptionist, and spa manager positions.',
  {
    keywords: ['browse Work Spa', 'all Work Spa', 'spa job listings', 'spa job search'],
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in'}/jobs`,
  }
);

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

