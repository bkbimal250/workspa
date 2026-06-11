import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
const siteName = 'Workspa - Work Spa Portal';

/**
 * Default SEO metadata for pages
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Work Spa Near Me - Find Work Spa in Your City | Work Spa Portal',
    template: '%s | Work Spa Portal',
  },
  description: 'Find the best Work Spa near you. Apply directly to spas without login. Browse thousands of Work Spa by location, salary, and experience. Search for therapist, receptionist, and spa manager positions.',
  keywords: [
    // Core Spa Job Keywords (India)
    'Work Spa',
    'Work Spa in india',
    'spa job vacancy',
    'spa job near me',
    'spa therapist jobs',
    'massage therapist jobs',
    'wellness jobs india',
    'luxury Work Spa',
    'female therapist jobs',
    'male therapist jobs',
    'spa hiring today',
    'spa careers',
    'spa employment',
    'spa hiring',

    // Therapist-Related Keywords
    'spa therapist job in india',
    'massage therapist job vacancy',
    'body massage therapist jobs',
    'female spa therapist jobs',
    'male massage therapist jobs',
    'b2b massage therapist jobs',
    'thai massage therapist jobs',
    'deep tissue massage jobs',
    'four hand massage therapist',
    'spa therapist job near me',

    // Receptionist / Front Office Keywords
    'spa receptionist jobs',
    'front desk executive spa',
    'spa front office jobs',
    'receptionist jobs in spa',
    'female receptionist Work Spa',
    'spa desk job vacancy',

    // Spa Manager / Supervisor Keywords
    'spa manager jobs',
    'spa supervisor jobs',
    'wellness center manager',
    'spa operations manager',
    'luxury spa manager jobs',
    'spa manager job vacancy india',

    // Housekeeping / Support Staff Keywords
    'spa housekeeping jobs',
    'spa attendant jobs',
    'spa helper jobs',
    'spa cleaning staff vacancy',
    'wellness center housekeeping jobs',

    // Beauty / Wellness Specialist Keywords
    'beauty therapist jobs',
    'beauty Work Spa',
    'skin therapist jobs',
    'facial therapist jobs',
    'cosmetologist jobs in spa',
    'aesthetic therapist jobs',
    'salon and Work Spa',

    // Sales / Business / Support Keywords
    'spa sales executive jobs',
    'spa marketing executive',
    'spa telecaller jobs',
    'spa membership sales jobs',
    'wellness sales jobs',

    // Location-Based Keywords (Major Cities)
    'Work Spa Mumbai',
    'Work Spa Delhi',
    'Work Spa Bangalore',
    'Work Spa Pune',
    'Work Spa Hyderabad',
    'Work Spa Chennai',
    'Work Spa Goa',
    'Work Spa Navi Mumbai',

    // Near Me & High-Conversion Keywords
    'Work Spa near me',
    'massage therapist jobs near me',
    'spa vacancy near me',
    'spa job opening today',
    'immediate spa hiring',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: siteName,
    title: 'Work Spa Near Me - Find Work Spa in Your City',
    description: 'Find the best Work Spa near you. Apply directly to spas without login. Browse thousands of Work Spa by location, salary, and experience.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Work Spa Portal - Find Your Dream Spa Job',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Work Spa Near Me - Find Work Spa in Your City',
    description: 'Find the best Work Spa near you. Apply directly to spas without login.',
    images: [`${siteUrl}/og-image.jpg`],
    creator: '@spajobs',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Job Portal',
};

/**
 * Generate metadata for a page
 */
export function generatePageMetadata(
  title: string,
  description: string,
  options?: {
    keywords?: string[];
    url?: string;
    image?: string;
    noindex?: boolean;
  }
): Metadata {
  const pageUrl = options?.url || siteUrl;
  const pageImage = options?.image || `${siteUrl}/og-image.jpg`;
  const allKeywords = options?.keywords
    ? [...defaultMetadata.keywords as string[], ...options.keywords]
    : defaultMetadata.keywords;

  return {
    ...defaultMetadata,
    title: `${title} | ${siteName}`,
    description,
    keywords: allKeywords,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: `${title} | ${siteName}`,
      description,
      url: pageUrl,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: `${title} | ${siteName}`,
      description,
      images: [pageImage],
    },
    robots: options?.noindex
      ? { index: false, follow: false }
      : defaultMetadata.robots,
    alternates: {
      canonical: pageUrl,
    },
  };
}

/**
 * Generate metadata for job listing pages
 */
export function generateJobListingMetadata(
  location?: string,
  category?: string,
  count?: number
): Metadata {
  const locationText = location ? ` in ${location}` : '';
  const categoryText = category ? ` ${category}` : '';
  const countText = count ? `${count}+ ` : '';

  const title = `${categoryText}Work Spa${locationText} | Find Work Spa${locationText}`;
  const description = `Find ${countText}${categoryText.toLowerCase()} Work Spa${locationText.toLowerCase()}. Browse therapist, receptionist, and spa manager positions. Apply directly without login.`;

  return generatePageMetadata(title, description, {
    keywords: location
      ? [`Work Spa ${location}`, `Work Spa in ${location}`, `${location} Work Spa`]
      : undefined,
  });
}

/**
 * Generate metadata for job detail pages
 */
export function generateJobDetailMetadata(
  jobTitle: string,
  spaName: string,
  location: string,
  salary?: string
): Metadata {
  const title = `${jobTitle} at ${spaName} - ${location}`;
  const description = `Apply for ${jobTitle} position at ${spaName} in ${location}. ${salary ? `Salary: ${salary}. ` : ''}View job details, requirements, and apply directly.`;

  return generatePageMetadata(title, description, {
    keywords: [
      jobTitle.toLowerCase(),
      `${jobTitle} jobs`,
      `Work Spa ${location}`,
      `${spaName} careers`,
    ],
  });
}

/**
 * Generate metadata for SPA detail pages
 */
export function generateSpaDetailMetadata(
  spaName: string,
  location: string,
  jobCount?: number
): Metadata {
  const title = `${spaName} - SPA Profile | ${location}`;
  const description = `View ${spaName} profile in ${location}. ${jobCount ? `Find ${jobCount}+ job openings. ` : ''}See spa details, photos, contact information, and available positions.`;

  return generatePageMetadata(title, description, {
    keywords: [
      spaName.toLowerCase(),
      `${spaName} spa`,
      `spa ${location}`,
      `Work Spa ${location}`,
    ],
  });
}
