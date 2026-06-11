'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import JobCard from '@/components/JobCard';
import { jobAPI, Job } from '@/lib/job';
import { parseLocationSlugSmart } from '@/lib/location-utils';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CityClient({ params }: { params: { city: string } }) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [jobCount, setJobCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [cityName, setCityName] = useState<string>('');
    const [categories, setCategories] = useState<Array<{ name: string; slug: string; count: number }>>([]);

    useEffect(() => {
        if (params.city) {
            fetchCityData();
            fetchJobs();
            fetchJobCount();
            fetchCategories();
        }
    }, [params.city]);

    const fetchCityData = async () => {
        try {
            const parsed = await parseLocationSlugSmart(params.city);
            setCityName(parsed.city || params.city.replace(/-/g, ' '));
        } catch (err) {
            setCityName(params.city.replace(/-/g, ' '));
        }
    };

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const parsed = await parseLocationSlugSmart(params.city);
            const params_query: any = { limit: 20 };
            if (parsed.cityId) params_query.city_id = parsed.cityId;

            const data = await jobAPI.getAllJobs(params_query);
            setJobs(data.filter((job: Job) => job.is_active));
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobCount = async () => {
        try {
            const parsed = await parseLocationSlugSmart(params.city);
            const params_query: any = {};
            if (parsed.cityId) params_query.city_id = parsed.cityId;

            const response = await axios.get(`${API_URL}/api/jobs/count`, { params: params_query });
            setJobCount(response.data.count || 0);
        } catch (error) {
            console.error('Error fetching job count:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/jobs/counts-by-location`);
            const cityData = response.data.find((item: any) => item.city_slug === params.city);

            if (cityData) {
                setCategories([
                    { name: 'Therapist', slug: 'therapist', count: cityData.job_count },
                    { name: 'receptionist', slug: 'receptionist', count: cityData.job_count },
                    { name: 'Spa Manager', slug: 'spa-manager', count: cityData.job_count },
                ]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
    const pageUrl = `${siteUrl}/cities/${params.city}`;

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

    const collectionPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Work Spa in ${cityName}`,
        description: `Find ${jobCount}+ Work Spa in ${cityName}. Browse spa therapist, female spa therapist, male therapist, and spa manager positions.`,
        url: pageUrl,
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: jobCount,
            itemListElement: jobs.slice(0, 10).map((job, index) => {
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
                                addressLocality: job.city?.name || cityName,
                                ...(job.state?.name && { addressRegion: job.state.name }),
                                ...(job.postalCode && { postalCode: job.postalCode }),
                                addressCountry: job.country?.name || 'IN',
                            },
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
                    },
                };
            }),
        },
    };

    const faqSchema = {
        "@context": "https://Schema.org",
        "@type": "FAQPage",
        mainEntity: [
            {
                "@type": "Question",
                name: `How can I find spa jobs in ${cityName}?`,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: `You can browse the latest spa jobs in ${cityName} on Workspa.in. We offer positions for therapists, receptionists, and managers.`
                }
            },
            {
                "@type": "Question",
                name: `Are there high paying spa jobs in ${cityName}?`,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: `Yes, many spas in ${cityName} offer competitive salaries. Check our listings for the latest high-paying opportunities.`
                }
            }
        ]
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
                name: `Jobs in ${cityName}`,
                item: pageUrl,
            },
        ],
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
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

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Work Spa in {cityName}
                    </h1>
                    <p className="text-xl sm:text-2xl text-blue-100">
                        {jobCount > 0 ? `${jobCount}+ jobs available` : 'Apply jobs for first call'}
                    </p>
                </div>
            </div>

            {/* Category Links */}
            {categories.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-wrap gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.slug}
                                href={`/jobs/${category.slug}-jobs-in-${params.city}`}
                                className="bg-white border border-gray-200 rounded-lg px-6 py-3 hover:shadow-md transition-shadow"
                            >
                                <div className="font-semibold text-gray-900">{category.name} Jobs</div>
                                <div className="text-sm text-gray-600">{category.count}+ jobs</div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Spa jobs in {cityName}</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Workspa lists active spa therapist, receptionist, beautician, housekeeping, and spa manager jobs in {cityName}.
                            Use this city page to compare openings by area, salary, timing, experience, and direct contact options before applying.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Popular searches</h3>
                        <div className="space-y-2">
                            <Link href={`/jobs/spa-therapist-jobs-in-${params.city}`} className="block text-brand-700 hover:text-brand-800 font-medium">
                                Spa therapist jobs in {cityName}
                            </Link>
                            <Link href={`/jobs/receptionist-jobs-in-${params.city}`} className="block text-brand-700 hover:text-brand-800 font-medium">
                                Receptionist jobs in {cityName}
                            </Link>
                            <Link href={`/jobs/spa-manager-jobs-in-${params.city}`} className="block text-brand-700 hover:text-brand-800 font-medium">
                                Spa manager jobs in {cityName}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

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
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                        <p className="text-gray-600">Try adjusting your search criteria</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <JobCard
                                key={job.id}
                                id={job.id}
                                title={job.title}
                                slug={job.slug}
                                spaName={job.spa?.name}
                                spaAddress={job.spa?.address}
                                location={[job.area?.name, job.city?.name].filter(Boolean).join(', ') || 'Location not specified'}
                                salaryMin={job.salary_min}
                                salaryMax={job.salary_max}
                                salaryCurrency={job.salary_currency}
                                experienceMin={job.experience_years_min}
                                experienceMax={job.experience_years_max}
                                jobType={typeof job.job_type === 'string' ? job.job_type : job.job_type?.name}
                                jobCategory={typeof job.job_category === 'string' ? job.job_category : job.job_category?.name}
                                logoImage={job.spa?.logo_image}
                                created_at={job.created_at}
                                description={job.description}
                                hr_contact_phone={job.hr_contact_phone}
                                required_gender={job.required_gender}
                                job_timing={job.job_timing}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
