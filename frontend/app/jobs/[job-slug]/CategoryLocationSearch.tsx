'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import JobCard from '@/components/JobCard';
import { jobAPI, Job } from '@/lib/job';
import { formatLocationName, findLocationIds, parseLocationSlugSmart } from '@/lib/location-utils';
import SEOHead from '@/components/SEOHead';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface CategoryLocationSearchProps {
    slug: string;
}

export default function CategoryLocationSearch({ slug }: CategoryLocationSearchProps) {
    // Extract category and location from slug: [category]-jobs-in-[location]
    const match = slug.match(/(.+)-jobs-in-(.+)/);
    const categorySlug = match ? match[1] : '';
    const locationSlug = match ? match[2] : '';

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
    const [categoryName, setCategoryName] = useState<string>('');
    const [locationIds, setLocationIds] = useState<{
        areaId?: number;
        cityId?: number;
        stateId?: number;
    }>({});

    useEffect(() => {
        if (categorySlug && locationSlug) {
            fetchInitialData();
        }
    }, [categorySlug, locationSlug]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch category data to get correct name for filtering
            let actualCategoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            try {
                const categories = await jobAPI.getJobCategories(0, 500);
                const matchingCategory = categories.find(c =>
                    c.slug === categorySlug ||
                    c.name.toLowerCase() === categorySlug.replace(/-/g, ' ')
                );
                if (matchingCategory) {
                    actualCategoryName = matchingCategory.name;
                }
            } catch (catErr) {
                console.error('Error matching category:', catErr);
            }
            setCategoryName(actualCategoryName);

            // 2. Fetch location data and IDs
            const parsed = await parseLocationSlugSmart(locationSlug);
            const ids = {
                areaId: parsed.areaId,
                cityId: parsed.cityId,
                stateId: parsed.stateId,
            };

            if (!ids.areaId && !ids.cityId && !ids.stateId) {
                const foundIds = await findLocationIds(parsed.area, parsed.city, parsed.state);
                ids.areaId = foundIds.areaId;
                ids.cityId = foundIds.cityId;
                ids.stateId = foundIds.stateId;
            }

            setLocationIds(ids);
            setLocationNames({
                area: parsed.area,
                city: parsed.city,
                state: parsed.state,
            });

            // 3. Robust Job Fetching
            await fetchAndFilterJobs(actualCategoryName, ids, parsed);

        } catch (error) {
            console.error('Error fetching initial data:', error);
            setLoading(false);
        }
    };

    const fetchAndFilterJobs = async (catName: string, locIds: any, parsedLoc: any) => {
        setLoading(true);
        try {
            const baseParams: any = {
                limit: 1000,
                is_active: true,
            };

            let data: Job[] = [];

            // Stage 1: Try with Category Name AND Location IDs
            console.log('Fetching Stage 1:', catName, locIds);
            const stage1Params = { ...baseParams, job_category: catName };
            if (locIds.areaId) stage1Params.area_id = locIds.areaId;
            else if (locIds.cityId) stage1Params.city_id = locIds.cityId;
            else if (locIds.stateId) stage1Params.state_id = locIds.stateId;

            data = await jobAPI.getAllJobs(stage1Params);

            // Stage 2: If 0 jobs, try Category Name WITHOUT location IDs (will filter on client)
            if (data.length === 0) {
                console.log('Fetching Stage 2 (Broad):', catName);
                data = await jobAPI.getAllJobs({ ...baseParams, job_category: catName });
            }

            // Stage 3: If still 0, try with Slug instead of Name
            if (data.length === 0) {
                console.log('Fetching Stage 3 (Slug):', categorySlug);
                data = await jobAPI.getAllJobs({ ...baseParams, job_category: categorySlug });
            }

            // Stage 4: If still 0, try Category as search query
            if (data.length === 0) {
                console.log('Fetching Stage 4 (Search Query):', catName);
                data = await jobAPI.getAllJobs({ ...baseParams, q: catName });
            }

            // Client-side filtering (Robust fallback)
            const catLower = catName.toLowerCase();
            const slugLower = categorySlug.toLowerCase();
            const cityLower = (parsedLoc.city || '').toLowerCase();
            const areaLower = (parsedLoc.area || '').toLowerCase();

            let filtered = data.filter((job: Job) => {
                if (!job.is_active) return false;

                const jobCatName = (typeof job.job_category === 'string' ? job.job_category : job.job_category?.name || '').toLowerCase();
                const jobTitle = job.title.toLowerCase();
                const jobCity = (job.city?.name || '').toLowerCase();
                const jobArea = (job.area?.name || '').toLowerCase();
                const jobState = (job.state?.name || '').toLowerCase();

                // Category match
                const matchesCategory = jobCatName.includes(catLower) ||
                    jobCatName.includes(slugLower) ||
                    jobTitle.includes(catLower) ||
                    jobTitle.includes(slugLower);

                // Location match (only if location was parsed)
                const matchesLocation = (!cityLower && !areaLower) ? true :
                    (jobCity.includes(cityLower) || jobArea.includes(areaLower) || jobState.includes(cityLower) ||
                        cityLower.includes(jobCity) || areaLower.includes(jobArea));

                return matchesCategory && matchesLocation;
            });

            console.log(`Found ${filtered.length} jobs after filtering`);
            setJobs(filtered);
            setJobCount(filtered.length);
        } catch (error) {
            console.error('Error in fetchAndFilterJobs:', error);
            setJobs([]);
            setJobCount(0);
        } finally {
            setLoading(false);
        }
    };

    const locationDisplayName = useMemo(() => {
        const parts: string[] = [];
        if (locationNames.area) parts.push(locationNames.area);
        if (locationNames.city) parts.push(locationNames.city);
        if (locationNames.state && !locationNames.city) parts.push(locationNames.state);
        return parts.join(', ') || formatLocationName(locationSlug);
    }, [locationNames, locationSlug]);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workspa.in';
    const pageUrl = `${siteUrl}/jobs/${slug}`;
    const description = `Find ${jobCount > 0 ? jobCount : ''} ${categoryName} jobs in ${locationDisplayName}. Browse therapist, receptionist, and spa manager positions. Apply directly without login.`;

    const paginatedJobs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return jobs.slice(startIndex, startIndex + itemsPerPage);
    }, [jobs, currentPage]);

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead title={`${categoryName} Jobs in ${locationDisplayName} - Workspa.in`} description={description} url={pageUrl} />

            <Navbar />
            <div className="bg-brand-800 text-white py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{categoryName} Jobs in {locationDisplayName}</h1>
                    <p className="text-xl sm:text-2xl text-white/90">{jobCount > 0 ? `${jobCount} jobs available` : 'Find your dream spa job'}</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
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
                    <div className="bg-white rounded-lg p-12 text-center border shadow-sm">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold mb-2">No {categoryName} jobs found in {locationDisplayName}</h3>
                        <p className="text-gray-600 mb-6">Try browsing all jobs to find more opportunities</p>
                        <Link href="/jobs" className="btn-primary px-6 py-2 inline-block">Browse all jobs →</Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {paginatedJobs.map(job => (
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
                        {jobs.length > itemsPerPage && (
                            <div className="mt-8">
                                <Pagination currentPage={currentPage} totalItems={jobs.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
