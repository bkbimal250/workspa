'use client';

import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import Features from './Features/page';
import ProcessPage from './Process/Page';
import SEOHead from '@/components/SEOHead';
import { jobAPI } from '@/lib/job';
import { StatsSection } from '@/components/StatsSection';
import Areasjobs from '@/components/Areasjobs';
import Featuresjobs from '@/components/Featuresjobs';
import Popularjobs from '@/components/Popularjobs';
import JobCategories from '@/components/JobCategories';

export default function HomePage() {
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [popularJobs, setPopularJobs] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [quickLinkCategories, setQuickLinkCategories] = useState<any[]>([]);

  useEffect(() => {
    // Fetch featured jobs
    const fetchFeaturedJobs = async () => {
      try {
        setLoadingFeatured(true);
        const data = await jobAPI.getAllJobs({ is_featured: true, limit: 6 });
        setFeaturedJobs(data || []);
      } catch (error) {
        console.error('Error fetching featured jobs:', error);
        setFeaturedJobs([]);
      } finally {
        setLoadingFeatured(false);
      }
    };

    // Fetch popular jobs
    const fetchPopularJobs = async () => {
      try {
        setLoadingPopular(true);
        const data = await jobAPI.getPopularJobs(6);
        setPopularJobs(data || []);
      } catch (error) {
        console.error('Error fetching popular jobs:', error);
        setPopularJobs([]);
      } finally {
        setLoadingPopular(false);
      }
    };

    fetchFeaturedJobs();
    fetchPopularJobs();
    fetchQuickLinkCategories();
  }, []);

  // Fetch categories for quick links
  const fetchQuickLinkCategories = async () => {
    try {
      const categories = await jobAPI.getJobCategories();
      // Filter for the specific categories we want to show
      const targetCategoryNames = ['Spa Therapist', 'Spa Receptionist', 'Spa Manager', 'Beautician'];
      const filtered = categories.filter(cat =>
        targetCategoryNames.some(name =>
          cat.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(cat.name.toLowerCase())
        )
      );
      setQuickLinkCategories(filtered);
    } catch (error) {
      console.error('Error fetching categories for quick links:', error);
      // Fallback to default categories if API fails
      setQuickLinkCategories([
        { name: 'Spa Therapist', slug: 'spa-therapist' },
        { name: 'Spa Receptionist', slug: 'spa-receptionist' },
        { name: 'Spa Manager', slug: 'spa-manager' },
        { name: 'Beautician', slug: 'beautician' },
      ]);
    }
  };

  // Generate structured data for homepage
  const homepageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Work Spa Portal',
    description: 'Find the best Work Spa near you. Apply directly to spas without login.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in'}/jobs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // LocalBusiness schema for Mumbai Metropolitan Region
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Work Spa Portal - Mumbai & Navi Mumbai',
    description: 'Leading platform for spa jobs in Mumbai, Navi Mumbai, Thane, Vashi, Bandra, Panvel, Airoli, Sanpada, Kharghar, Belapur, Mulund, Dadar, Kurla and surrounding areas.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in',
    areaServed: [
      {
        '@type': 'City',
        name: 'Mumbai',
      },
      {
        '@type': 'City',
        name: 'Navi Mumbai',
      },
      {
        '@type': 'City',
        name: 'Thane',
      },
      {
        '@type': 'Place',
        name: 'Vashi',
      },
      {
        '@type': 'Place',
        name: 'Bandra',
      },
      {
        '@type': 'Place',
        name: 'Panvel',
      },
      {
        '@type': 'Place',
        name: 'Airoli',
      },
      {
        '@type': 'Place',
        name: 'Sanpada',
      },
      {
        '@type': 'Place',
        name: 'Kharghar',
      },
      {
        '@type': 'Place',
        name: 'Belapur',
      },
      {
        '@type': 'Place',
        name: 'Mulund',
      },
      {
        '@type': 'Place',
        name: 'Dadar',
      },
      {
        '@type': 'Place',
        name: 'Kurla',
      },
    ],
    serviceType: 'Job Portal',
    offers: {
      '@type': 'Offer',
      description: 'Free job listings for spa professionals in Mumbai Metropolitan Region',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Workspa - Work Spa India',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in'}/logo.png`,
    description: 'India\'s leading platform for spa job opportunities',
    sameAs: [
      // Add social media links here when available
    ],
  };

  // Generate enhanced meta description with job examples
  const enhancedDescription = useMemo(() => {
    const baseDescription = "Find the best Work Spa near you. Apply directly to spas without login. Browse thousands of Work Spa by location, salary, and experience.";

    // Get jobs for examples (combine featured and popular, take first 3-4 unique ones)
    const allJobs = [...featuredJobs, ...popularJobs];
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => [job.id, job])).values()
    ).slice(0, 4);

    if (uniqueJobs.length > 0 && !loadingFeatured && !loadingPopular) {
      const jobExamples = uniqueJobs.map(job => {
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
      }).join('; ');

      return `${baseDescription} ${jobExamples}. Search for therapist, receptionist, and spa manager positions.`;
    }

    return `${baseDescription} Search for therapist, receptionist, and spa manager positions.`;
  }, [featuredJobs, popularJobs, loadingFeatured, loadingPopular]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Metadata */}
      <SEOHead
        title="Spa Jobs in Mumbai & Navi Mumbai - Therapist Jobs in Bandra, Thane, Vashi, Panvel"
        description="Find spa therapist jobs in Mumbai, Navi Mumbai, Thane, Vashi, Bandra, Panvel, Airoli, Sanpada, Kharghar, Belapur, Mulund, Dadar, Kurla. Apply directly to verified spas without login. 1000+ active spa jobs across Mumbai Metropolitan Region."
        keywords={[
          'spa jobs in mumbai',
          'spa therapist jobs in mumbai',
          'spa jobs in navi mumbai',
          'spa jobs in thane',
          'spa jobs in vashi',
          'spa jobs in bandra',
          'spa jobs in panvel',
          'spa jobs in airoli',
          'spa jobs in sanpada',
          'spa jobs in kharghar',
          'spa jobs in belapur',
          'spa jobs in mulund',
          'spa jobs in dadar',
          'spa jobs in kurla',
          'massage therapist jobs in mumbai',
          'massage therapist jobs in navi mumbai',
          'massage therapist jobs in thane',
          'massage therapist jobs in bandra',
          'spa manager jobs in mumbai',
          'spa manager jobs in navi mumbai',
          'spa manager jobs in thane',
          'beauty therapist jobs in mumbai',
          'beauty therapist jobs in navi mumbai',
          'wellness jobs in mumbai',
          'wellness jobs in navi mumbai',
          'therapist jobs in mumbai',
          'therapist jobs in navi mumbai',
          'therapist jobs in thane',
          'therapist jobs in vashi',
          'therapist jobs in bandra',
          'therapist jobs in malad',
          'therapist jobs in borivali',
          'therapist jobs in kandivali',
          'therapist jobs in mira road',
          'therapist jobs in mira road',
          'female therapist jobs in mumbai',
          'female therapist jobs in navi mumbai',
          'female therapist jobs in thane',
          'female therapist jobs in vashi',
          'female therapist jobs in bandra',
          'female receptionist jobs in mumbai',
          'female receptionist jobs in navi mumbai',
          'female receptionist jobs in thane',
          'female receptionist jobs in vashi',
          'female receptionist jobs in bandra',
          'spa jobs hiring in thane',
          'work spa mumbai',
          'work spa navi mumbai',
          'work spa thane',
          'work spa bandra',
          'work spa vashi',
          'work spa panvel',
        ]}
      />
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Navbar />

      {/* Hero Section with Search */}
      <div className="bg-brand-800 text-white relative overflow-hidden">
        {/* Decorative background elements - fixed dimensions to prevent CLS */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" style={{ aspectRatio: '1/1' }}></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" style={{ aspectRatio: '1/1' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 relative z-10">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight px-2">
              Find Spa Jobs in Mumbai & Navi Mumbai
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 px-4">
              Verified spa jobs in Mumbai, Navi Mumbai, Thane, Vashi, Bandra, Panvel, Airoli, Sanpada, Kharghar, Belapur, Mulund, Dadar, Kurla & more
            </p>
          </div>

          {/* Search Bar - removed hover scale to prevent CLS */}
          <div className="max-w-5xl mx-auto mb-6 sm:mb-8">
            <SearchBar />
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8 sm:mt-10 text-xs sm:text-sm md:text-base px-4">
            {quickLinkCategories.length > 0 ? (
              quickLinkCategories.map((category) => (
                <Link
                  key={category.id || category.name}
                  href={`/jobs?job_category=${encodeURIComponent(category.name)}`}
                  className="text-white/80 hover:text-white underline transition-colors font-medium px-2 py-1"
                >
                  {category.name} Jobs
                </Link>
              ))
            ) : (
              <>
                <Link href="/jobs?job_category=Spa Therapist" className="text-white/80 hover:text-white underline transition-colors font-medium px-2 py-1">
                  Spa Therapist Jobs
                </Link>
                <Link href="/jobs?job_category=Spa Receptionist" className="text-white/80 hover:text-white underline transition-colors font-medium px-2 py-1">
                  Spa Receptionist Jobs
                </Link>
                <Link href="/jobs?job_category=Spa Manager" className="text-white/80 hover:text-white underline transition-colors font-medium px-2 py-1">
                  Spa Manager Jobs
                </Link>
                <Link href="/jobs?job_category=Beautician" className="text-white/80 hover:text-white underline transition-colors font-medium px-2 py-1">
                  Beautician Jobs
                </Link>
              </>
            )}
          </div>

        </div>
      </div>

      <StatsSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Featured Jobs Section */}
        <Featuresjobs featuredJobs={featuredJobs} loadingFeatured={loadingFeatured} />

        {/* Popular Jobs Section */}
        <Popularjobs popularJobs={popularJobs} loadingPopular={loadingPopular} />

        <JobCategories />


        {/* Features Section */}

        <Features />

        <ProcessPage />

        <Areasjobs />

      </div>



    </div>
  );
}

