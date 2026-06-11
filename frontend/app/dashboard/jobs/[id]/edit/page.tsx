'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Navbar from '@/components/Navbar';
import {
  JobBasicsStep,
  JobCreateStep,
  JobFieldChangeHandler,
  JobFormData,
  JobFormNavigation,
  JobFormWizard,
  JobLookupData,
  JobPayPublishStep,
  JobRoleLocationStep,
} from '@/components/dashboardjobs';
import { useAuth } from '@/contexts/AuthContext';
import { jobAPI } from '@/lib/job';
import { locationAPI } from '@/lib/location';
import { spaAPI } from '@/lib/spa';

const initialFormData: JobFormData = {
  title: '',
  description: '',
  requirements: '',
  responsibilities: '',
  benefits: '',
  job_timing: '',
  key_skills: '',
  job_opening_count: '1',
  Industry_type: 'Beauty and Spa',
  Employee_type: 'Full Time',
  required_gender: 'Female',
  job_type_id: '',
  job_category_id: '',
  salary_min: '',
  salary_max: '',
  salary_currency: 'INR',
  experience_years_min: '',
  experience_years_max: '',
  spa_id: '',
  country_id: '',
  state_id: '',
  city_id: '',
  area_id: '',
  postalCode: '',
  hr_contact_name: '',
  hr_contact_email: '',
  hr_contact_phone: '',
  is_active: true,
  is_featured: false,
  expires_at: '',
  meta_title: '',
  meta_description: '',
};

const canManageJobs = (role?: string) =>
  role === 'admin' || role === 'manager' || role === 'recruiter';

export default function EditJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id ? parseInt(params.id as string) : null;

  const [currentStep, setCurrentStep] = useState<JobCreateStep>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [lookupData, setLookupData] = useState<JobLookupData>({
    spas: [],
    jobTypes: [],
    jobCategories: [],
    countries: [],
    states: [],
    cities: [],
    areas: [],
  });

  useEffect(() => {
    if (!user || !canManageJobs(user.role)) {
      router.push('/dashboard');
      return;
    }

    if (jobId) {
      fetchPageData();
    }
  }, [user, router, jobId]);

  const extractErrorMessage = (err: any): string => {
    if (!err) {
      return 'An unexpected error occurred';
    }

    if (typeof err === 'string') {
      return err;
    }

    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item: any) => {
          const field = item.loc && item.loc.length > 1 ? item.loc[item.loc.length - 1] : 'field';
          return `${field}: ${item.msg}`;
        })
        .join(', ');
    }

    if (typeof detail === 'string') {
      return detail;
    }

    return err.message || 'An unexpected error occurred. Please try again.';
  };

  const fetchPageData = async () => {
    if (!jobId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [job, countries, jobTypes, jobCategories] = await Promise.all([
        jobAPI.getJobById(jobId),
        locationAPI.getCountries(),
        jobAPI.getJobTypes(),
        jobAPI.getJobCategories(),
      ]);

      const [states, cities, areas, spas] = await Promise.all([
        job.country_id ? locationAPI.getStates(job.country_id) : Promise.resolve([]),
        job.state_id ? locationAPI.getCities(job.state_id) : Promise.resolve([]),
        job.city_id ? locationAPI.getAreas(job.city_id) : Promise.resolve([]),
        user?.role === 'recruiter'
          ? spaAPI.getMySpa().then((spa) => [spa])
          : spaAPI.getSpas(),
      ]);

      setLookupData({
        spas,
        jobTypes,
        jobCategories,
        countries,
        states,
        cities,
        areas,
      });

      setFormData({
        title: job.title || '',
        description: job.description || '',
        requirements: job.requirements || '',
        responsibilities: job.responsibilities || '',
        benefits: job.benefits || '',
        job_timing: job.job_timing || '',
        key_skills: job.key_skills || '',
        job_opening_count: job.job_opening_count?.toString() || '1',
        Industry_type: job.Industry_type || 'Beauty and Spa',
        Employee_type: job.Employee_type || 'Full Time',
        required_gender: job.required_gender || 'Female',
        job_type_id: job.job_type_id?.toString() || '',
        job_category_id: job.job_category_id?.toString() || '',
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        salary_currency: job.salary_currency || 'INR',
        experience_years_min: job.experience_years_min?.toString() || '',
        experience_years_max: job.experience_years_max?.toString() || '',
        spa_id: job.spa_id?.toString() || '',
        country_id: job.country_id?.toString() || '',
        state_id: job.state_id?.toString() || '',
        city_id: job.city_id?.toString() || '',
        area_id: job.area_id?.toString() || '',
        postalCode: job.postalCode || '',
        hr_contact_name: job.hr_contact_name || '',
        hr_contact_email: job.hr_contact_email || '',
        hr_contact_phone: job.hr_contact_phone || '',
        is_active: job.is_active ?? true,
        is_featured: job.is_featured ?? false,
        expires_at: job.expires_at ? new Date(job.expires_at).toISOString().slice(0, 16) : '',
        meta_title: '',
        meta_description: '',
      });
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange: JobFieldChangeHandler = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      });
    }
  };

  const handleCountryChange = (countryId: string) => {
    setFormData((prev) => ({ ...prev, state_id: '', city_id: '', area_id: '' }));
    setLookupData((prev) => ({ ...prev, states: [], cities: [], areas: [] }));

    if (countryId) {
      locationAPI
        .getStates(parseInt(countryId))
        .then((states) => setLookupData((prev) => ({ ...prev, states })))
        .catch(console.error);
    }
  };

  const handleStateChange = (stateId: string) => {
    setFormData((prev) => ({ ...prev, city_id: '', area_id: '' }));
    setLookupData((prev) => ({ ...prev, cities: [], areas: [] }));

    if (stateId) {
      locationAPI
        .getCities(parseInt(stateId))
        .then((cities) => setLookupData((prev) => ({ ...prev, cities })))
        .catch(console.error);
    }
  };

  const handleCityChange = (cityId: string) => {
    setFormData((prev) => ({ ...prev, area_id: '' }));
    setLookupData((prev) => ({ ...prev, areas: [] }));

    if (cityId) {
      locationAPI
        .getAreas(parseInt(cityId))
        .then((areas) => setLookupData((prev) => ({ ...prev, areas })))
        .catch(console.error);
    }
  };

  const validateStep = (step: JobCreateStep): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.spa_id) {
        errors.spa_id = 'Please select a SPA';
      }
      if (!formData.title.trim()) {
        errors.title = 'Job title is required';
      }
    }

    if (step === 2) {
      if (!formData.description.trim()) {
        errors.description = 'Job description is required';
      }
      if (!formData.country_id) {
        errors.country_id = 'Please select a country';
      }
      if (!formData.state_id) {
        errors.state_id = 'Please select a state';
      }
      if (!formData.city_id) {
        errors.city_id = 'Please select a city';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToStep = (step: JobCreateStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      goToStep(Math.min(currentStep + 1, 3) as JobCreateStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      goToStep((currentStep - 1) as JobCreateStep);
    }
  };

  const handleStepChange = (step: JobCreateStep) => {
    if (step <= currentStep) {
      goToStep(step);
      return;
    }

    if (step === 2 && validateStep(1)) {
      goToStep(2);
      return;
    }

    if (step === 3 && validateStep(1) && validateStep(2)) {
      goToStep(3);
    }
  };

  const buildUpdatePayload = () => {
    const updateData: Record<string, unknown> = {
      title: formData.title || undefined,
      description: formData.description || undefined,
      requirements: formData.requirements || undefined,
      responsibilities: formData.responsibilities || undefined,
      benefits: formData.benefits || undefined,
      job_timing: formData.job_timing || undefined,
      key_skills: formData.key_skills || undefined,
      job_opening_count: formData.job_opening_count ? parseInt(formData.job_opening_count) : undefined,
      Industry_type: formData.Industry_type || undefined,
      Employee_type: formData.Employee_type || undefined,
      required_gender: formData.required_gender || undefined,
      job_type_id: formData.job_type_id ? parseInt(formData.job_type_id) : undefined,
      job_category_id: formData.job_category_id ? parseInt(formData.job_category_id) : undefined,
      salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
      salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
      salary_currency: formData.salary_currency || undefined,
      experience_years_min: formData.experience_years_min
        ? parseInt(formData.experience_years_min)
        : undefined,
      experience_years_max: formData.experience_years_max
        ? parseInt(formData.experience_years_max)
        : undefined,
      spa_id: formData.spa_id ? parseInt(formData.spa_id) : undefined,
      country_id: formData.country_id ? parseInt(formData.country_id) : undefined,
      state_id: formData.state_id ? parseInt(formData.state_id) : undefined,
      city_id: formData.city_id ? parseInt(formData.city_id) : undefined,
      area_id: formData.area_id ? parseInt(formData.area_id) : undefined,
      postalCode: formData.postalCode || undefined,
      hr_contact_name: formData.hr_contact_name || undefined,
      hr_contact_email: formData.hr_contact_email || undefined,
      hr_contact_phone: formData.hr_contact_phone || undefined,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined,
      meta_title: formData.meta_title || undefined,
      meta_description: formData.meta_description || undefined,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return updateData;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!jobId) {
      return;
    }

    if (!validateStep(1)) {
      goToStep(1);
      return;
    }

    if (!validateStep(2)) {
      goToStep(2);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setFormErrors({});

    try {
      await jobAPI.updateJob(jobId, buildUpdatePayload());
      setSuccess('Job updated successfully!');

      setTimeout(() => {
        router.push(`/dashboard/jobs/${jobId}`);
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || !canManageJobs(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
              <p className="mt-2 text-gray-600">Step {currentStep} of 3</p>
            </div>
            <Link
              href={`/dashboard/jobs/${jobId}`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Back to View
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-700">
            <p className="break-words">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4 text-green-700">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <JobFormWizard currentStep={currentStep} onStepChange={handleStepChange}>
            {currentStep === 1 && (
              <JobBasicsStep
                errors={formErrors}
                formData={formData}
                jobCategories={lookupData.jobCategories}
                jobTypes={lookupData.jobTypes}
                onFieldChange={handleFieldChange}
                spas={lookupData.spas}
                userRole={user.role}
              />
            )}

            {currentStep === 2 && (
              <JobRoleLocationStep
                areas={lookupData.areas}
                cities={lookupData.cities}
                countries={lookupData.countries}
                errors={formErrors}
                formData={formData}
                onCountryChange={handleCountryChange}
                onCityChange={handleCityChange}
                onFieldChange={handleFieldChange}
                onStateChange={handleStateChange}
                states={lookupData.states}
              />
            )}

            {currentStep === 3 && (
              <JobPayPublishStep formData={formData} onFieldChange={handleFieldChange} />
            )}

            <JobFormNavigation
              currentStep={currentStep}
              onNext={handleNext}
              onPrevious={handlePrevious}
              submitting={submitting}
            />
          </JobFormWizard>
        </form>
      </div>
    </div>
  );
}
