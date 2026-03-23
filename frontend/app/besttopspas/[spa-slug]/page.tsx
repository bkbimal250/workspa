'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { spaAPI, Spa } from '@/lib/spa';
import { jobAPI, Job } from '@/lib/job';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import SpaHeroBanner from './components/SpaHeroBanner';
import SpaHeader from './components/SpaHeader';
import SpaDescription from './components/SpaDescription';
import SpaGallery from './components/SpaGallery';
import SpaJobsList from './components/SpaJobsList';
import SpaContactCard from './components/SpaContactCard';
import SpaOperatingHours from './components/SpaOperatingHours';
import SpaLocationMap from './components/SpaLocationMap';
import { useSpaSEO, generateSpaMetadata } from './hooks/useSpaSEO';

export default function SpaDetailPage() {
  const params = useParams();
  const slug = params?.['spa-slug'] as string;

  const [spa, setSpa] = useState<Spa | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [metadata, setMetadata] = useState<any>(null);
  const [locationNames, setLocationNames] = useState<{
    country?: string;
    state?: string;
    city?: string;
    area?: string;
  }>({});

  useEffect(() => {
    if (slug) {
      fetchSpa();
    }
  }, [slug]);

  useEffect(() => {
    if (spa) {
      fetchJobs();
      fetchLocationNames();
    }
  }, [spa]);

  useEffect(() => {
    if (spa) {
      const generatedMetadata = generateSpaMetadata(spa, jobs, locationNames);
      setMetadata(generatedMetadata);
    }
  }, [spa, jobs, locationNames]);

  // Use SEO hook
  useSpaSEO(spa, jobs, locationNames, metadata);

  const fetchSpa = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await spaAPI.getSpaBySlug(slug);
      setSpa(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch SPA');
      console.error('Failed to fetch SPA:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!spa) return;
    try {
      const data = await jobAPI.getAllJobs({ spa_id: spa.id });
      // Filter for active jobs on the client side
      setJobs(data.filter((job) => job.is_active));
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const fetchLocationNames = async () => {
    if (!spa) return;
    try {
      const { locationAPI } = await import('@/lib/location');
      const [countries, states, cities, areas] = await Promise.all([
        locationAPI.getCountries(),
        spa.country_id ? locationAPI.getStates(spa.country_id) : Promise.resolve([]),
        spa.state_id ? locationAPI.getCities(spa.state_id) : Promise.resolve([]),
        spa.city_id ? locationAPI.getAreas(spa.city_id) : Promise.resolve([]),
      ]);

      const country = countries.find((c: { id: number; name: string }) => c.id === spa.country_id);
      const state = states.find((s: { id: number; name: string }) => s.id === spa.state_id);
      const city = cities.find((c: { id: number; name: string }) => c.id === spa.city_id);
      const area = areas.find((a: { id: number; name: string }) => a.id === spa.area_id);

      setLocationNames({
        country: country?.name,
        state: state?.name,
        city: city?.name,
        area: area?.name,
      });
    } catch (err) {
      console.error('Failed to fetch location names:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-5">
            <div className="h-80 bg-gray-200 rounded-xl"></div>
            <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !spa) {
    return (
      <div className="min-h-screen bg-surface-light">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">SPA Not Found</h1>
          <p className="text-gray-600 mb-6">The SPA you're looking for doesn't exist or has been removed.</p>
          <Link href="/spa-near-me" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-white font-semibold rounded-lg hover:bg-gold-600 transition-colors shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse All SPAs
          </Link>
        </div>
      </div>
    );
  }

  // These variables are safe to use here since we've checked spa is not null above
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.backend.workspa.in';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
  const allImages = spa.logo_image
    ? [spa.logo_image, ...(spa.spa_images || [])]
    : spa.spa_images || [];

  const locationStr = [locationNames.area, locationNames.city]
    .filter(Boolean)
    .join(', ');

  const handleGalleryImageClick = (galleryIndex: number) => {
    // galleryIndex is 0-based from gallery images (excluding first image)
    // We need to add 1 because gallery images start from index 1 (index 0 is in hero)
    setActiveImageIndex(galleryIndex + 1);
    // Scroll to top to show the hero banner
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate structured data (JSON-LD) for SEO - LocalBusiness schema
  const spaSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: spa.name,
    description: spa.description || `${spa.name} - Professional SPA Services`,
    url: spa.booking_url_website || `${SITE_URL}/besttopspas/${spa.slug}`,
    ...(spa.logo_image && {
      image: `${API_URL}${spa.logo_image.startsWith('/') ? spa.logo_image : `/${spa.logo_image}`}`,
    }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: spa.address || '',
      addressLocality: locationNames.city || '',
      addressRegion: locationNames.state || '',
      addressCountry: locationNames.country || 'IN',
      ...(spa.postalCode && { postalCode: spa.postalCode }),
    },
    ...(spa.latitude && spa.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: spa.latitude,
        longitude: spa.longitude,
      },
    }),
    ...(spa.phone && { telephone: spa.phone }),
    ...(spa.email && { email: spa.email }),
    ...(spa.opening_hours && spa.closing_hours && {
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: spa.opening_hours,
        closes: spa.closing_hours,
      },
    }),
    priceRange: '$$',
    ...((spa as any).is_verified && (spa as any).rating && (spa as any).reviews && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: (spa as any).rating,
        reviewCount: (spa as any).reviews,
      },
    }),
  };

  // Generate separate JobPosting schemas for each job (Google prefers separate schemas)
  const jobSchemas = jobs.map((job) => {
    const logoUrl = spa.logo_image
      ? `${API_URL}${spa.logo_image.startsWith('/') ? spa.logo_image : `/${spa.logo_image}`}`
      : undefined;

    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description || '',
      datePosted: job.created_at,
      validThrough: job.expires_at || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      employmentType: (job as any).Employee_type || 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: spa.name,
        ...(logoUrl && { logo: logoUrl }),
        ...(spa.slug && { sameAs: `${SITE_URL}/besttopspas/${spa.slug}` }),
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          streetAddress: spa.address || '',
          addressLocality: (job as any).city?.name || locationNames.city || '',
          addressRegion: (job as any).state?.name || locationNames.state || '',
          addressCountry: (job as any).country?.name || locationNames.country || 'IN',
          ...((job as any).postalCode && { postalCode: (job as any).postalCode }),
          ...(!(job as any).postalCode && spa.postalCode && { postalCode: spa.postalCode }),
        },
      },
      ...(job.salary_min && job.salary_max && {
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: job.salary_currency || 'INR',
          value: {
            '@type': 'QuantitativeValue',
            minValue: job.salary_min,
            maxValue: job.salary_max,
            unitText: 'MONTH',
          },
        },
      }),
      ...(job.experience_years_min && {
        experienceRequirements: {
          '@type': 'OccupationalExperienceRequirements',
          monthsOfExperience: job.experience_years_min * 12,
        },
      }),
      ...(job.key_skills && {
        skills: job.key_skills.split(',').map((s: string) => s.trim()).filter(Boolean),
      }),
    };
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'SPAs Near Me',
        item: `${SITE_URL}/spa-near-me`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: spa.name,
        item: `${SITE_URL}/besttopspas/${spa.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-surface-light">
      {/* Structured Data for SEO */}
      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(spaSchema) }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Job Posting Schemas - Separate schema for each job (Google best practice) */}
      {jobSchemas.map((jobSchema, index) => (
        <script
          key={`job-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
        />
      ))}

      <Navbar />

      <SpaHeroBanner
        spa={spa}
        allImages={allImages}
        locationStr={locationStr}
        apiUrl={API_URL}
        activeImageIndex={activeImageIndex}
        onImageIndexChange={setActiveImageIndex}
      />

      <SpaHeader
        spa={spa}
        allImages={allImages}
        locationNames={locationNames}
        apiUrl={API_URL}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            <SpaDescription description={spa.description || ''} />

            <SpaGallery
              spaName={spa.name}
              images={allImages.slice(1)}
              apiUrl={API_URL}
              onImageClick={handleGalleryImageClick}
            />

            <SpaJobsList
              jobs={jobs}
              spaName={spa.name}
              spaAddress={spa.address}
              locationStr={locationStr}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <SpaContactCard spa={spa} />
            <SpaOperatingHours spa={spa} />
            <SpaLocationMap spa={spa} />

            {/* Employer CTA */}
            <div className="bg-gradient-to-br from-brand-50 to-gold-50 rounded-xl border-2 border-brand-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Own this SPA?</h3>
              <p className="text-sm text-gray-700 mb-4">
                Claim your profile to manage jobs, update information, and get more visibility.
              </p>
              <Link
                href="/login?redirect=/dashboard/spas"
                className="block w-full text-center px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                Claim Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
