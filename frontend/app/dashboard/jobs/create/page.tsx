'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function CreateJobPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<JobCreateStep>(1);
  const [loading, setLoading] = useState(false);
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

    fetchData();
  }, [user, router]);

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [countries, jobTypes, jobCategories] = await Promise.all([
        locationAPI.getCountries(),
        jobAPI.getJobTypes(),
        jobAPI.getJobCategories(),
      ]);

      if (user?.role === 'recruiter') {
        try {
          const spa = await spaAPI.getMySpa();
          setLookupData((prev) => ({
            ...prev,
            countries,
            jobTypes,
            jobCategories,
            spas: [spa],
          }));
          setFormData((prev) => ({ ...prev, spa_id: spa.id.toString() }));
        } catch (spaError: any) {
          setLookupData((prev) => ({ ...prev, countries, jobTypes, jobCategories }));
          setError(
            spaError.response?.status === 404
              ? 'You need to create a business first before posting jobs.'
              : 'Failed to load your business. Please try again.'
          );
        }
      } else {
        const spas = await spaAPI.getSpas();
        setLookupData((prev) => ({ ...prev, countries, jobTypes, jobCategories, spas }));
      }
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

  const buildJobPayload = () => ({
    ...formData,
    spa_id: parseInt(formData.spa_id),
    job_type_id: formData.job_type_id ? parseInt(formData.job_type_id) : undefined,
    job_category_id: formData.job_category_id ? parseInt(formData.job_category_id) : undefined,
    country_id: parseInt(formData.country_id),
    state_id: parseInt(formData.state_id),
    city_id: parseInt(formData.city_id),
    area_id: formData.area_id ? parseInt(formData.area_id) : undefined,
    salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
    salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
    experience_years_min: formData.experience_years_min
      ? parseInt(formData.experience_years_min)
      : undefined,
    experience_years_max: formData.experience_years_max
      ? parseInt(formData.experience_years_max)
      : undefined,
    job_opening_count: formData.job_opening_count ? parseInt(formData.job_opening_count) : 1,
    Industry_type: formData.Industry_type || 'Beauty and Spa',
    Employee_type: formData.Employee_type || 'Full Time',
    required_gender: formData.required_gender || 'Female',
    requirements: formData.requirements || undefined,
    responsibilities: formData.responsibilities || undefined,
    benefits: formData.benefits || undefined,
    job_timing: formData.job_timing || undefined,
    key_skills: formData.key_skills || undefined,
    postalCode: formData.postalCode || undefined,
    hr_contact_name: formData.hr_contact_name || undefined,
    hr_contact_email: formData.hr_contact_email || undefined,
    hr_contact_phone: formData.hr_contact_phone || undefined,
    expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined,
    meta_title: formData.meta_title || undefined,
    meta_description: formData.meta_description || undefined,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
      await jobAPI.createJob(buildJobPayload());
      setSuccess('Job created successfully!');

      setTimeout(() => {
        router.push('/dashboard/jobs');
      }, 1500);
    } catch (err: any) {
      setError(extractErrorMessage(err));

      if (Array.isArray(err.response?.data?.detail)) {
        const validationErrors: Record<string, string> = {};

        err.response.data.detail.forEach((item: any) => {
          if (item.loc && item.loc.length > 0) {
            validationErrors[item.loc[item.loc.length - 1]] = item.msg;
          }
        });

        setFormErrors(validationErrors);

        if (validationErrors.spa_id || validationErrors.title) {
          goToStep(1);
        } else if (
          validationErrors.description ||
          validationErrors.country_id ||
          validationErrors.state_id ||
          validationErrors.city_id
        ) {
          goToStep(2);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || !canManageJobs(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Create New Job Posting</h1>
              <p className="mt-2 text-gray-600">Step {currentStep} of 3</p>
            </div>
            <Link
              href="/dashboard/jobs"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Back to Jobs
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
