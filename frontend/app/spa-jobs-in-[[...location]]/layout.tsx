import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { location: string[] | string };
}): Promise<Metadata> {
  // Handle catch-all route: location is an array
  const locationArray = Array.isArray(params.location) ? params.location : [params.location];
  const locationSlug = locationArray.join('-');

  // Format location name from slug
  const locationName = locationSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const title = `Work Spa in ${locationName} | Find Work Spa`;
  const description = `Find Work Spa in ${locationName}. Browse therapist, receptionist, and spa manager positions. Apply directly without login.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
  const pageUrl = `${siteUrl}/spa-jobs-in-${locationSlug}`;

  return generatePageMetadata(title, description, {
    keywords: [
      `Work Spa ${locationName}`,
      `Work Spa in ${locationName}`,
      `${locationName} Work Spa`,
      'spa therapist jobs',
      'massage therapist jobs',
    ],
    url: pageUrl,
  });
}

export default function LocationJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

