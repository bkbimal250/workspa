'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import JobCard from '@/components/JobCard';
import { jobAPI, Job } from '@/lib/job';
import { locationAPI } from '@/lib/location';
import { parseLocationSlug, formatLocationName, findLocationIds, parseLocationSlugSmart } from '@/lib/location-utils';
import SEOHead from '@/components/SEOHead';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LocationJobsPage() {
  const params = useParams();
  // Handle catch-all route: location is an array
  const locationArray = params?.location as string[] | string | undefined;
  const locationSlug = Array.isArray(locationArray)
    ? locationArray.join('-')
    : (locationArray || '');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobCount, setJobCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [locationNames, setLocationNames] = useState<{
    area?: string;
    city?: string;
    state?: string;
  }>({});
  const [locationIds, setLocationIds] = useState<{
    areaId?: number;
    cityId?: number;
    stateId?: number;
  }>({});

  useEffect(() => {
    if (locationSlug) {
      fetchLocationData();
    }
  }, [locationSlug]);

  useEffect(() => {
    if (locationIds.areaId || locationIds.cityId || locationIds.stateId) {
      setCurrentPage(1); // Reset to first page when location changes
      fetchJobs();
      fetchJobCount();
    }
  }, [locationIds]);

  const fetchLocationData = async () => {
    try {
      // Use smart parsing to match against actual location data
      const parsed = await parseLocationSlugSmart(locationSlug);

      // Set location IDs if found
      if (parsed.areaId || parsed.cityId || parsed.stateId) {
        setLocationIds({
          areaId: parsed.areaId,
          cityId: parsed.cityId,
          stateId: parsed.stateId,
        });
      } else {
        // Fallback: try to find IDs from names
        const ids = await findLocationIds(parsed.area, parsed.city, parsed.state);
        setLocationIds(ids);
      }

      // Set location names
      if (parsed.area || parsed.city || parsed.state) {
        setLocationNames({
          area: parsed.area,
          city: parsed.city,
          state: parsed.state,
        });
      } else {
        // Fallback to simple parsing
        const simpleParsed = parseLocationSlug(locationSlug);
        setLocationNames(simpleParsed);
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      // Fallback to simple parsing
      const parsed = parseLocationSlug(locationSlug);
      setLocationNames(parsed);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params_query: any = {
        limit: 50,
      };

      if (locationIds.areaId) {
        params_query.area_id = locationIds.areaId;
      } else if (locationIds.cityId) {
        params_query.city_id = locationIds.cityId;
      } else if (locationIds.stateId) {
        params_query.state_id = locationIds.stateId;
      }

      const data = await jobAPI.getAllJobs(params_query);
      setJobs(data.filter((job: Job) => job.is_active));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobCount = async () => {
    try {
      const params_query: any = {};

      if (locationIds.areaId) {
        params_query.area_id = locationIds.areaId;
      } else if (locationIds.cityId) {
        params_query.city_id = locationIds.cityId;
      } else if (locationIds.stateId) {
        params_query.state_id = locationIds.stateId;
      }

      const response = await axios.get(`${API_URL}/api/jobs/count`, { params: params_query });
      setJobCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching job count:', error);
    }
  };

  // Generate location display name
  const locationDisplayName = useMemo(() => {
    const parts: string[] = [];
    if (locationNames.area) parts.push(locationNames.area);
    if (locationNames.city) parts.push(locationNames.city);
    if (locationNames.state && !locationNames.city) parts.push(locationNames.state);
    return parts.join(', ') || formatLocationName(locationSlug);
  }, [locationNames, locationSlug]);

  // Paginate jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return jobs.slice(startIndex, endIndex);
  }, [jobs, currentPage, itemsPerPage]);

  // Generate enhanced meta description with job examples
  const enhancedDescription = useMemo(() => {
    const baseDescription = `Find ${jobCount > 0 ? jobCount : ''} Work Spa in ${locationDisplayName}.`;

    if (paginatedJobs.length > 0 && !loading) {
      const jobExamples = paginatedJobs
        .filter(job => job.title && (job.salary_min || job.salary_max))
        .slice(0, 4)
        .map(job => {
          const jobTitle = job.title || 'Spa Job';
          let salaryText = '';

          if (job.salary_min && job.salary_max) {
            const minK = Math.round(job.salary_min / 1000);
            const maxK = Math.round(job.salary_max / 1000);
            salaryText = ` · ₹${minK}k - ₹${maxK}k`;
          } else if (job.salary_min) {
            const minK = Math.round(job.salary_min / 1000);
            salaryText = ` · ₹${minK}k+`;
          }

          return `${jobTitle}${salaryText}`;
        });

      if (jobExamples.length > 0) {
        return `${baseDescription} ${jobExamples.join('; ')}. Browse therapist, masseuse, and spa manager positions. Apply directly without login.`;
      }
    }

    return `${baseDescription} Browse therapist, masseuse, and spa manager positions. Apply directly without login.`;
  }, [locationDisplayName, jobCount, paginatedJobs, loading]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
  const pageUrl = `${siteUrl}/spa-jobs-in-${locationSlug}`;

  // Helper function to normalize employment type
  const normalizeEmploymentType = (type: string): string => {
    const normalized = type?.toUpperCase().trim() || 'FULL_TIME';
    const validTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER', 'PER_DIEM', 'OTHER'];
    const typeMap: Record<string, string> = {
      'FULL TIME': 'FULL_TIME', 'PART TIME': 'PART_TIME', 'FULLTIME': 'FULL_TIME', 'PARTTIME': 'PART_TIME',
      'FULL-TIME': 'FULL_TIME', 'PART-TIME': 'PART_TIME',
    };
    const mapped = typeMap[normalized] || normalized;
    return validTypes.includes(mapped) ? mapped : 'FULL_TIME';
  };

  // Structured data for SEO
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Work Spa in ${locationDisplayName}`,
    description: enhancedDescription,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: jobCount,
      itemListElement: paginatedJobs.slice(0, 10).map((job, index) => {
        const logoUrl = job.spa?.logo_image
          ? `${API_URL}${job.spa.logo_image.startsWith('/') ? job.spa.logo_image : `/${job.spa.logo_image}`}`
          : undefined;

        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'JobPosting',
            title: job.title,
            description: job.description?.substring(0, 200) || '',
            identifier: {
              '@type': 'PropertyValue',
              name: job.spa?.name || 'SPA',
              value: job.id.toString(),
            },
            datePosted: job.created_at,
            validThrough: (job as any).expires_at || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            employmentType: normalizeEmploymentType((job as any).Employee_type || 'FULL_TIME'),
            hiringOrganization: {
              '@type': 'Organization',
              name: job.spa?.name || 'SPA',
              ...(logoUrl && { logo: logoUrl }),
              ...(job.spa?.slug && { sameAs: `${siteUrl}/besttopspas/${job.spa.slug}` }),
            },
            jobLocation: {
              '@type': 'Place',
              address: {
                '@type': 'PostalAddress',
                ...(job.spa?.address && { streetAddress: job.spa.address }),
                addressLocality: job.city?.name || locationDisplayName,
                ...(job.state?.name && { addressRegion: job.state.name }),
                ...(job.postalCode && { postalCode: job.postalCode }),
                addressCountry: job.country?.name || 'IN',
              },
            },
          },
        };
      }),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Jobs',
        item: `${siteUrl}/jobs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Jobs in ${locationDisplayName}`,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Metadata */}
      <SEOHead
        title={`Work Spa in ${locationDisplayName} - ${jobCount > 0 ? `${jobCount} Jobs Available` : 'Find Work Spa'}`}
        description={enhancedDescription}
        keywords={[
          `Work Spa ${locationDisplayName}`,
          `Work Spa in ${locationDisplayName}`,
          `${locationDisplayName} Work Spa`,
          'spa therapist jobs',
          'massage therapist jobs',
          'spa manager jobs',
        ]}
        url={pageUrl}
      />

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Work Spa in {locationDisplayName}
          </h1>
          <p className="text-xl sm:text-2xl text-brand-100">
            {jobCount > 0 ? `${jobCount}+ jobs available` : 'Find your dream spa job'}
          </p>
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found in {locationDisplayName}</h3>
            <p className="text-gray-600 mb-4">Try searching in nearby locations or browse all jobs</p>
            <Link href="/jobs" className="inline-block text-brand-600 hover:text-brand-700 font-medium">
              Browse all jobs →
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  id={job.id}
                  title={job.title}
                  spaName={job.spa?.name}
                  spaAddress={job.spa?.address}
                  location={
                    (() => {
                      const locationParts = [];
                      if (job.area?.name) locationParts.push(job.area.name);
                      if (job.city?.name) locationParts.push(job.city.name);
                      return locationParts.length > 0 ? locationParts.join(', ') : 'Location not specified';
                    })()
                  }
                  salaryMin={job.salary_min}
                  salaryMax={job.salary_max}
                  salaryCurrency={job.salary_currency}
                  experienceMin={job.experience_years_min}
                  experienceMax={job.experience_years_max}
                  jobOpeningCount={job.job_opening_count}
                  jobType={typeof job.job_type === 'string' ? job.job_type : job.job_type?.name}
                  jobCategory={typeof job.job_category === 'string' ? job.job_category : job.job_category?.name}
                  slug={job.slug}
                  isFeatured={job.is_featured}
                  viewCount={job.view_count}
                  created_at={job.created_at}
                  description={job.description}
                  logoImage={job.spa?.logo_image}
                  postedBy={job.created_by_user ? {
                    id: job.created_by_user.id,
                    name: job.created_by_user.name,
                    profile_photo: job.created_by_user.profile_photo,
                  } : undefined}
                  hr_contact_phone={job.hr_contact_phone}
                  required_gender={job.required_gender}
                />
              ))}
            </div>

            {/* Pagination */}
            {jobs.length > itemsPerPage && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalItems={jobs.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

