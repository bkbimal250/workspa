'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import JobCard from '@/components/JobCard';
import JobFilters from '@/components/JobFilters';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { jobAPI, Job } from '@/lib/job';
import { analyticsAPI } from '@/lib/analytics';
import { useLocation } from '@/hooks/useLocation';

interface FilterState {
  jobTypeId?: number;
  jobCategoryId?: number;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  areaId?: number;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  isFeatured?: boolean;
}

function JobsPageContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'salary'>('recent');
  const [filters, setFilters] = useState<FilterState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [jobCategories, setJobCategories] = useState<any[]>([]);

  const searchQuery = searchParams.get('q') || '';
  const locationQuery = searchParams.get('location') || '';
  const jobCategoryParam = searchParams.get('job_category') || '';
  const experienceMinParam = searchParams.get('experience_years_min');
  const experienceMaxParam = searchParams.get('experience_years_max');

  const { location: userLocation, loading: locationLoading } = useLocation(true); // Auto-detect location
  const [useNearMe, setUseNearMe] = useState(false);
  const [detectedLocationName, setDetectedLocationName] = useState<string>('');

  // Get the effective location (URL param > detected location)
  const effectiveLocation = useMemo(() => {
    if (locationQuery) return locationQuery;
    if (detectedLocationName) return detectedLocationName;
    if (userLocation?.city) {
      const loc = [userLocation.city, userLocation.state].filter(Boolean).join(', ');
      return loc;
    }
    return '';
  }, [locationQuery, detectedLocationName, userLocation]);

  // Update detected location name when user location is available
  useEffect(() => {
    if (userLocation?.city && !locationQuery) {
      const loc = [userLocation.city, userLocation.state].filter(Boolean).join(', ');
      setDetectedLocationName(loc);
    }
  }, [userLocation, locationQuery]);

  // Initialize filters from URL params
  useEffect(() => {
    if (experienceMinParam || experienceMaxParam) {
      setFilters(prev => ({
        ...prev,
        experienceMin: experienceMinParam ? parseInt(experienceMinParam) : undefined,
        experienceMax: experienceMaxParam ? parseInt(experienceMaxParam) : undefined,
      }));
    }
  }, [experienceMinParam, experienceMaxParam]);

  // Fetch job types and categories for ID to name conversion
  useEffect(() => {
    const fetchTypesAndCategories = async () => {
      try {
        const [types, categories] = await Promise.all([
          jobAPI.getJobTypes(0, 1000),
          jobAPI.getJobCategories(0, 1000),
        ]);
        setJobTypes(types || []);
        setJobCategories(categories || []);
      } catch (error) {
        console.error('Error fetching job types and categories:', error);
        setJobTypes([]);
        setJobCategories([]);
      }
    };
    fetchTypesAndCategories();
  }, []);


  useEffect(() => {
    // Fetch jobs - if filters use jobTypeId or jobCategoryId, we need the arrays loaded
    // But we can still fetch if arrays aren't loaded yet (they'll be empty filters)
    fetchJobs();
  }, [searchParams, sortBy, filters, useNearMe, userLocation, jobCategoryParam, jobTypes, jobCategories, currentPage]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_by: sortBy,
      };

      if (searchQuery) {
        params.q = searchQuery;
      }

      if (locationQuery) {
        params.location = locationQuery;
      }

      // Add location-based search if near me is enabled
      if (useNearMe && userLocation?.latitude && userLocation?.longitude) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
        params.radius_km = 10; // 10km radius
      }

      // Apply filters - convert IDs to names for backend API
      // Job Type filter
      if (filters.jobTypeId && jobTypes.length > 0) {
        const jobType = jobTypes.find(t => t.id === filters.jobTypeId);
        if (jobType) {
          params.job_type = jobType.name;
        }
      }
      // Job Category filter - URL param takes precedence, then filter
      if (jobCategoryParam) {
        // Try to find matching category for normalization (slug to name)
        const matchingCategory = jobCategories.find(c =>
          c.slug === jobCategoryParam ||
          c.name.toLowerCase() === jobCategoryParam.replace(/-/g, ' ').toLowerCase()
        );
        params.job_category = matchingCategory ? matchingCategory.name : jobCategoryParam;
      } else if (filters.jobCategoryId && jobCategories.length > 0) {
        const jobCategory = jobCategories.find(c => c.id === filters.jobCategoryId);
        if (jobCategory) {
          params.job_category = jobCategory.name;
        }
      }
      if (filters.countryId) params.country_id = filters.countryId;
      if (filters.stateId) params.state_id = filters.stateId;
      if (filters.cityId) params.city_id = filters.cityId;
      if (filters.areaId) params.area_id = filters.areaId;
      if (filters.salaryMin) params.salary_min = filters.salaryMin;
      if (filters.salaryMax) params.salary_max = filters.salaryMax;
      if (filters.experienceMin) params.experience_years_min = filters.experienceMin;
      if (filters.experienceMax) params.experience_years_max = filters.experienceMax;
      if (filters.isFeatured !== undefined) params.is_featured = filters.isFeatured;

      // Fetch jobs and count in parallel
      const [jobsData, countData] = await Promise.all([
        jobAPI.getAllJobs(params),
        jobAPI.getJobCount({
          country_id: filters.countryId,
          state_id: filters.stateId,
          city_id: filters.cityId,
          area_id: filters.areaId,
          job_type: filters.jobTypeId ? jobTypes.find(t => t.id === filters.jobTypeId)?.name : undefined,
          job_category: jobCategoryParam || (filters.jobCategoryId ? jobCategories.find(c => c.id === filters.jobCategoryId)?.name : undefined),
          q: searchQuery || undefined,
          location: locationQuery || undefined,
          salary_min: filters.salaryMin,
          salary_max: filters.salaryMax,
          experience_years_min: filters.experienceMin,
          experience_years_max: filters.experienceMax,
        }),
      ]);

      if (searchQuery) {
        // Track job search
        analyticsAPI.trackEvent('job_search', {
          search_query: searchQuery,
          city: userLocation?.city,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        }).catch(() => { }); // Silently fail - analytics should not break the app
      }

      setJobs(jobsData);
      setTotalJobs(countData.count);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Fallback: use jobs length if count API fails
      setTotalJobs(jobs.length);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: 'recent' | 'popular' | 'salary') => {
    setSortBy(newSort);
  };

  const sortedJobs = useMemo(() => {
    return jobs;
  }, [jobs]);

  // Paginate sorted jobs
  const paginatedJobs = useMemo(() => {
    return sortedJobs;
  }, [sortedJobs]);

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, filters, searchQuery, locationQuery]);

  // Check if a job is newly posted (within last 7 days)
  const isNewJob = (createdAt?: string): boolean => {
    if (!createdAt) return false;
    const jobDate = new Date(createdAt);
    const daysAgo = (Date.now() - jobDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';

  // Generate dynamic metadata based on search query, location, and job count
  const metadataTitle = useMemo(() => {
    const parts: string[] = [];

    if (searchQuery) {
      // Capitalize first letter of each word
      const queryFormatted = searchQuery.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      parts.push(`${queryFormatted} Jobs`);
    } else {
      parts.push('Work Spa');
    }

    if (effectiveLocation) {
      parts.push(`in ${effectiveLocation}`);
    }

    if (totalJobs > 0 && !loading) {
      parts.push(`- ${totalJobs} Jobs Available`);
    }

    return parts.join(' ');
  }, [searchQuery, effectiveLocation, totalJobs, loading]);

  const metadataDescription = useMemo(() => {
    const parts: string[] = [];

    if (searchQuery && effectiveLocation) {
      parts.push(`Find ${totalJobs > 0 ? totalJobs : ''} ${searchQuery.toLowerCase()} jobs in ${effectiveLocation}.`);
    } else if (searchQuery) {
      parts.push(`Find ${totalJobs > 0 ? totalJobs : ''} ${searchQuery.toLowerCase()} jobs across India.`);
    } else if (effectiveLocation) {
      parts.push(`Find ${totalJobs > 0 ? totalJobs : ''} Work Spa in ${effectiveLocation}.`);
    } else {
      parts.push(`Find ${totalJobs > 0 ? totalJobs : ''} Work Spa across India.`);
    }

    // Add job examples from current results (top 3-4 jobs with salary info)
    if (jobs.length > 0 && !loading) {
      const jobExamples = jobs
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
        parts.push(jobExamples.join('; '));
      }
    }

    parts.push('Browse therapist, receptionist, and spa manager positions. Apply directly without login.');

    return parts.join(' ');
  }, [searchQuery, effectiveLocation, totalJobs, jobs, loading]);

  // Build canonical URL with current params
  const canonicalUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (locationQuery) params.append('location', locationQuery);
    const queryString = params.toString();
    return `${siteUrl}/jobs${queryString ? `?${queryString}` : ''}`;
  }, [searchQuery, locationQuery, siteUrl]);

  // Helper function to normalize employment type to Google's expected values
  const normalizeEmploymentType = (type: string): string => {
    const normalized = type?.toUpperCase().trim() || 'FULL_TIME';
    const validTypes = [
      'FULL_TIME',
      'PART_TIME',
      'CONTRACTOR',
      'TEMPORARY',
      'INTERN',
      'VOLUNTEER',
      'PER_DIEM',
      'OTHER',
    ];

    const typeMap: Record<string, string> = {
      'FULL TIME': 'FULL_TIME',
      'PART TIME': 'PART_TIME',
      'FULLTIME': 'FULL_TIME',
      'PARTTIME': 'PART_TIME',
      'FULL-TIME': 'FULL_TIME',
      'PART-TIME': 'PART_TIME',
    };

    const mapped = typeMap[normalized] || normalized;
    return validTypes.includes(mapped) ? mapped : 'FULL_TIME';
  };

  // Generate structured data for job listings page - Updated to match Google standards
  const jobsListSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: metadataTitle,
    description: metadataDescription,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalJobs,
      itemListElement: jobs.slice(0, 10).map((job, index) => ({
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
          validThrough: job.expires_at || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          employmentType: normalizeEmploymentType((job as any).Employee_type || 'FULL_TIME'),
          hiringOrganization: {
            '@type': 'Organization',
            name: job.spa?.name || 'SPA',
            ...(job.spa?.logo_image && {
              logo: `${process.env.NEXT_PUBLIC_API_URL}${job.spa.logo_image.startsWith('/') ? job.spa.logo_image : `/${job.spa.logo_image}`}`
            }),
            ...(job.spa?.slug && { sameAs: `${siteUrl}/besttopspas/${job.spa.slug}` }),
          },
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              ...(job.spa?.address && { streetAddress: job.spa.address }),
              addressLocality: job.city?.name || '',
              addressRegion: job.state?.name || '',
              postalCode: job.postalCode || '',
              addressCountry: job.country?.name || 'IN',
            },
          },
          ...(job.salary_min && {
            baseSalary: {
              '@type': 'MonetaryAmount',
              currency: job.salary_currency || 'INR',
              value: {
                '@type': 'QuantitativeValue',
                value: job.salary_min,
                unitText: 'YEAR',
              },
            },
          }),
        },
      })),
    },
  }), [metadataTitle, metadataDescription, canonicalUrl, totalJobs, jobs]);

  const breadcrumbSchema = useMemo(() => ({
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
    ],
  }), [siteUrl]);

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I find the best spa jobs on Workspa.in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can explore a wide range of opportunities including Therapist, receptionist, and Spa Manager roles on Workspa.in. Use our filters to sort by location, category, and salary to find the perfect match for your skills.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need a login to apply for jobs on Workspa.in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, Workspa.in allows you to view and apply for many jobs directly without requiring a login, making the application process quick and seamless.'
        }
      }
    ]
  }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobsListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Navbar />

      {/* Hero Section - Naukri Style */}
      <div className="bg-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            {searchQuery ? (
              effectiveLocation ? (
                `${searchQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Jobs in ${effectiveLocation}`
              ) : (
                `${searchQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Jobs`
              )
            ) : effectiveLocation ? (
              `Work Spa in ${effectiveLocation}`
            ) : (
              'Find Your Dream SPA Job'
            )}
          </h1>
          <p className="text-white/90 text-base sm:text-lg">
            {totalJobs > 0 ? `${totalJobs} jobs available` : 'Discover thousands of opportunities'}
            {effectiveLocation && !locationQuery && (
              <span className="ml-2 text-white/70 text-sm">📍 {effectiveLocation}</span>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4 z-30">
              <JobFilters
                onFilterChange={handleFilterChange}
                initialFilters={filters}
              />
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {/* Sort and View Options - Naukri Style */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sticky top-20 z-40">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {loading ? 'Loading...' : `${totalJobs} Jobs Found`}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as 'recent' | 'popular' | 'salary')}
                    className="input-field text-xs sm:text-sm border-gray-300 focus:border-brand-500 focus:ring-brand-500 flex-1 sm:flex-none"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="salary">Highest Salary</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Listings */}
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">Try adjusting your filters or search criteria to find more jobs</p>
                <button
                  onClick={() => {
                    setFilters({});
                    handleFilterChange({});
                  }}
                  className="btn-primary text-sm sm:text-base px-6 py-2.5"
                >
                  Clear All Filters
                </button>
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
                      job_timing={job.job_timing}
                      isNew={isNewJob(job.created_at)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalJobs > itemsPerPage && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalJobs}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          </div>
        </div>
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  );
}
