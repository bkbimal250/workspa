'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MessageForm from '@/components/MessageForm';
import { useAuth } from '@/contexts/AuthContext';
import { jobAPI, Job } from '@/lib/job';
import { spaAPI, Spa } from '@/lib/spa';
import { applicationAPI } from '@/lib/application';
import axios from 'axios';
import Link from 'next/link';
import { showToast, showErrorToast } from '@/lib/toast';
import CategoryLocationSearch from './CategoryLocationSearch';
import RoleLandingPage from '@/components/RoleLandingPage';
import { getRoleLandingPage } from '@/lib/content/seo-pages';
import {
  JobHeader,
  JobDetailsCard,
  JobActions,
  JobDescription,
  JobResponsibilities,
  JobRequirements,
  JobDetailsAndSkills,
  CompanyInfo,
  RelatedJobsList,
  PopularJobsList,
  JobWithRelations,
  formatSalary,
  parseSkills,
  parseResponsibilities,
  getLogoUrl,
} from '@/components/job-detail';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState<JobWithRelations | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [popularJobs, setPopularJobs] = useState<Job[]>([]);
  const [applicationCount, setApplicationCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);

  const slug = params?.['job-slug'] as string;

  // Handle SEO Search Route Detection
  if (slug?.includes('-jobs-in-')) {
    return <CategoryLocationSearch slug={slug} />;
  }

  if (slug && getRoleLandingPage(slug)) {
    return <RoleLandingPage slug={slug} />;
  }

  useEffect(() => {
    if (slug) {
      fetchJob();
      fetchPopularJobs();
    }
  }, [slug]);

  useEffect(() => {
    if (job) {
      trackView();
      fetchRelatedJobs();
      fetchApplicationCount();
    }
  }, [job]);

  // Show popup after 10 seconds when job is loaded
  useEffect(() => {
    if (job && !loading) {
      const timer = setTimeout(() => {
        setShowMessagePopup(true);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [job, loading]);

  const fetchJob = async () => {
    try {
      if (!slug) return;
      const data = await jobAPI.getJobBySlug(slug);
      setJob(data as JobWithRelations);

      // Fetch SPA details if not included in response
      if (data.spa_id && (!data.spa || !(data.spa as any).rating)) {
        try {
          const spaData = await spaAPI.getSpaById(data.spa_id);
          setJob(prev => prev ? { ...prev, spa: { ...prev.spa, ...spaData } as any } : null);
        } catch (err) {
          console.error('Error fetching SPA details:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedJobs = async () => {
    try {
      if (!job) return;
      const jobs = await jobAPI.getRelatedJobs(job.id, 5);
      setRelatedJobs(jobs);
    } catch (error) {
      console.error('Error fetching related jobs:', error);
    }
  };

  const fetchPopularJobs = async () => {
    try {
      const jobs = await jobAPI.getPopularJobs(5);
      setPopularJobs(jobs);
    } catch (error) {
      console.error('Error fetching popular jobs:', error);
    }
  };

  const fetchApplicationCount = async () => {
    try {
      if (!job?.id) return;
      try {
        const response = await axios.get(`${API_URL}/api/applications/`, {
          params: { job_id: job.id, limit: 1000 }
        });
        setApplicationCount(response.data?.length || 0);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
          setApplicationCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching application count:', error);
    }
  };

  const trackView = async () => {
    try {
      if (job?.id) {
        await axios.post(`${API_URL}/api/jobs/${job.id}/track-view`);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleDirectApply = async () => {
    if (!job || !user) return;

    setApplying(true);
    try {
      await axios.post(`${API_URL}/api/jobs/${job.id}/track-apply-click`).catch(() => { });
      await applicationAPI.directApply(job.id);
      showToast.success('Application submitted successfully!');
      setTimeout(() => {
        router.push('/dashboard/applications');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to submit application. Please try again.';
      showErrorToast(err, errorMessage);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <Link href="/jobs" className="text-brand-600 hover:underline">
            Browse all jobs
          </Link>
        </div>
      </div>
    );
  }

  const skills = parseSkills(job.key_skills);
  const responsibilities = parseResponsibilities(job.responsibilities);
  const logoUrl = getLogoUrl(job.spa?.logo_image);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
  const jobUrl = `${siteUrl}/jobs/${job.slug}`;

  const locationParts = [
    job.area?.name,
    job.city?.name,
    job.state?.name,
  ].filter(Boolean);
  const locationStr = locationParts.join(', ') || 'Location not specified';
  const salaryStr = formatSalary(job);

  // Generate breadcrumb schema
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
        name: job.title,
        item: jobUrl,
      },
    ],
  };

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

    // Map common variations
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

  // Generate FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How do I apply for ${job.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can apply for the ${job.title} position directly on Workspa.in by clicking the Apply button and submitting your details.`
        }
      },
      {
        "@type": "Question",
        name: `Is this ${job.title} job full-time or part-time?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `This job is a ${normalizeEmploymentType(job.Employee_type || "FULL_TIME").replace("_", " ").toLowerCase()} position.`
        }
      },
      {
        "@type": "Question",
        name: `Where is this job located?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `This job is located in ${locationStr}.`
        }
      },
      ...(salaryStr !== 'Not Disclosed'
        ? [{
          "@type": "Question",
          name: `What is the salary for this job?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `The salary for this position is ${salaryStr}.`
          }
        }]
        : [])
    ]
  };

  // Generate structured data (JSON-LD) for SEO - Updated to match Google standards
  const jobSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${siteUrl}/jobs/${job.slug}`,

    title: String(job.title),

    description: String(job.description).replace(/<[^>]*>?/gm, ''),

    identifier: {
      "@type": "PropertyValue",
      name: job.spa?.name || "SPA",
      value: String(job.id),
    },

    datePosted: new Date(job.created_at).toISOString(),

    validThrough: job.expires_at
      ? new Date(job.expires_at).toISOString()
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),

    employmentType: normalizeEmploymentType(job.Employee_type || "FULL_TIME"),

    hiringOrganization: {
      "@type": "Organization",
      name: job.spa?.name || "SPA",
      ...(logoUrl ? { logo: logoUrl } : {}),
      ...(job.spa?.slug
        ? { sameAs: `${siteUrl}/besttopspas/${job.spa.slug}` }
        : {}),
    },

    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city?.name || "Unknown",
        addressRegion: job.state?.name || "Unknown",
        addressCountry: "IN",
        ...(job.spa?.address && { streetAddress: job.spa.address }),
        ...(job.postalCode && { postalCode: job.postalCode }),
      },
    },

    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },

    ...(job.salary_min && {
      estimatedSalary: {
        "@type": "MonetaryAmount",
        currency: job.salary_currency || "INR",
        value: {
          "@type": "QuantitativeValue",
          minValue: Number(job.salary_min),
          ...(job.salary_max && { maxValue: Number(job.salary_max) }),
          unitText: "YEAR",
        },
      },
    }),

    ...(job.salary_min && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: job.salary_currency || "INR",
        value: {
          "@type": "QuantitativeValue",
          value: Number(job.salary_min),
          unitText: "YEAR",
        },
      },
    }),

    ...(job.experience_years_min && {
      experienceRequirements: {
        "@type": "OccupationalExperienceRequirements",
        monthsOfExperience: job.experience_years_min * 12,
      },
    }),

    ...(job.key_skills && {
      skills: job.key_skills
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean),
    }),
  };



  return (
    <div className="min-h-screen bg-surface-light">
      <Navbar />

      {/* Message Form Popup */}
      {showMessagePopup && job && (
        <MessageForm
          jobId={job.id}
          jobTitle={job.title}
          isPopup={true}
          onClose={() => setShowMessagePopup(false)}
          onSuccess={() => {
            setShowMessagePopup(false);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Left Panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Job Header */}
            <JobHeader job={job} />

            {/* Job Header Card - Contains Details and Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <JobDetailsCard job={job} applicationCount={applicationCount} />
              <div className="px-6 pb-6">
                <JobActions
                  job={job}
                  user={user}
                  applying={applying}
                  onApply={handleDirectApply}
                />
              </div>
            </div>

            {/* Job Description */}
            {job.description && <JobDescription description={job.description} />}

            {/* Responsibilities */}
            <JobResponsibilities responsibilities={responsibilities} />

            {/* Requirements */}
            {job.requirements && <JobRequirements requirements={job.requirements} />}

            {/* Job Details & Skills Combined */}
            <JobDetailsAndSkills
              jobCategory={job.job_category}
              industryType={job.Industry_type}
              jobType={job.job_type}
              employeeType={job.Employee_type}
              requiredGender={job.required_gender}
              benefits={job.benefits}
              jobTiming={job.job_timing}
              skills={skills}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Popular Jobs */}
            <PopularJobsList jobs={popularJobs} currentJobId={job.id} />

            {/* Similar Jobs */}
            <RelatedJobsList jobs={relatedJobs} currentJobId={job.id} />

            {/* Company Info */}
            <CompanyInfo job={job} />

            {/* Employer CTA */}
            <div className="bg-gradient-to-br from-brand-50 to-gold-50 rounded-xl border-2 border-brand-200 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-2">Post a Job in 2 Minutes</h3>
              <p className="text-sm text-gray-700 mb-4">
                Looking to hire? Post your job opening and reach thousands of qualified candidates.
              </p>
              <Link
                href="/login?redirect=/dashboard/jobs/create"
                className="block w-full text-center px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm"
              >
                Post a Job
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
