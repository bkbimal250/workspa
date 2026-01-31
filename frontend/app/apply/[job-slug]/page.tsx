'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobAPI } from '@/lib/job';
import { applicationAPI } from '@/lib/application';
import { tokenManager } from '@/lib/auth';
import type { Job } from '@/lib/job';
import Link from 'next/link';
import { showToast, showErrorToast } from '@/lib/toast';

export default function ApplyPage({ params }: { params: { 'job-slug': string } }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);



  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    location: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    phone?: string;
  }>({});
  const PhoneValidator = (phone: string) => {
    const cleaned = phone.replace(/\s|-/g, '');
    return /^(\+?\d{1,3})?\d{10}$/.test(cleaned);
  };

  const EmailValidator = (email: string): boolean => {
    // OPTIONAL email
    if (!email || email.trim() === '') return true;

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  };


  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobData = await jobAPI.getJobBySlug(params['job-slug']);
        setJob(jobData);

        // Pre-fill form if user is logged in
        const token = tokenManager.getToken();
        if (token) {
          // Optionally fetch user profile to pre-fill
          // For now, we'll let the backend handle it
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Failed to load job details';
        setError(errorMsg);
        showErrorToast(err, 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params['job-slug']]);




  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type - PDF, DOC, DOCX, and Images
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
      ];

      // Also check by extension as a fallback (some browsers may not set MIME type correctly)
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp'];

      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
        const errorMsg = 'Please upload a PDF, DOC, DOCX, or image file (JPG, PNG, GIF, WEBP)';
        setError(errorMsg);
        showToast.error(errorMsg);
        return;
      }

      // Validate file size (10MB max to match backend)
      if (file.size > 10 * 1024 * 1024) {
        const errorMsg = 'File size must be less than 10MB';
        setError(errorMsg);
        showToast.error(errorMsg);
        return;
      }

      setCvFile(file);
      setCvFileName(file.name);
      setError(null);
    }
  };


  const formatSalary = (job: Job) => {
    if (!job.salary_min && !job.salary_max) return 'Not specified';
    const formatAmount = (amount: number) => {
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
      }
      return `₹${(amount / 1000).toFixed(0)}k`;
    };
    if (job.salary_min && job.salary_max) {
      return `${formatAmount(job.salary_min)} - ${formatAmount(job.salary_max)} Per Month`;
    }
    if (job.salary_min) return `${formatAmount(job.salary_min)}+ Per Month`;
    if (job.salary_max) return `Up to ${formatAmount(job.salary_max)} Per Month`;
    return 'Not specified';
  };

  const formatExperience = (job: Job) => {
    if (!job.experience_years_min && !job.experience_years_max) return 'Not specified';
    if (job.experience_years_min && job.experience_years_max) {
      return `${job.experience_years_min} - ${job.experience_years_max} years`;
    }
    if (job.experience_years_min) return `${job.experience_years_min}+ years`;
    if (job.experience_years_max) return `0 - ${job.experience_years_max} years`;
    return 'Not specified';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);



    // Validate required fields for anonymous users
    const token = tokenManager.getToken();
    if (!token) {
      if (!formData.name || !formData.phone) {
        const errorMsg = 'Name and Phone are required';
        setError(errorMsg);
        showToast.error(errorMsg);
        setSubmitting(false);
        return;
      }

      // Email is optional, but must be valid if entered
      if (!EmailValidator(formData.email)) {
        const errorMsg = 'Please enter a valid email address';
        setError(errorMsg);
        showToast.error(errorMsg);
        setSubmitting(false);
        return;
      }
    }


    if (!job) {
      const errorMsg = 'Job not found';
      setError(errorMsg);
      showToast.error(errorMsg);
      setSubmitting(false);
      return;
    }

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('job_id', job.id.toString());

      if (formData.name) formDataToSend.append('name', formData.name);
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (formData.experience) formDataToSend.append('experience', formData.experience);
      if (formData.location) formDataToSend.append('location', formData.location);
      if (cvFile) formDataToSend.append('cv_file', cvFile);

      await applicationAPI.createApplication(formDataToSend);

      setSuccess(true);
      showToast.success('Application submitted successfully!', 'You will be redirected to the job page shortly.');

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/jobs/${job.slug}`);
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to submit application. Please try again.';
      setError(errorMsg);
      showErrorToast(err, 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist.</p>
          <Link href="/jobs" className="text-brand-600 hover:text-brand-700 font-medium">
            Browse All Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface-light flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your application has been successfully submitted. The employer will review your profile and get back to you soon.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Redirecting to job page...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href={`/jobs/${job.slug}`} className="text-brand-600 hover:text-brand-700 text-sm font-medium inline-flex items-center gap-2 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Job Details
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Apply for this Job</h1>
          <p className="text-gray-600 text-sm sm:text-base">Fill in your details to apply for this position</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Job Summary Card - Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-md">
                  {job.spa?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">{job.title}</h2>
                <p className="text-sm text-gray-600 font-medium">{job.spa?.name || 'SPA'}</p>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Salary</p>
                    <p className="text-sm font-semibold text-gray-900">{formatSalary(job)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Experience</p>
                    <p className="text-sm font-semibold text-gray-900">{formatExperience(job)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {[job.city?.name, job.state?.name, job.country?.name].filter(Boolean).join(', ') || 'Not specified'}
                    </p>
                  </div>
                </div>

                {job.job_type && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                      {job.job_type.name}
                    </span>
                    {job.job_category && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-100 text-brand-800 border border-brand-300">
                        {job.job_category.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Application Form - Right Side */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-10">
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Form</h2>
                <p className="text-sm text-gray-600">Please fill in all required fields to complete your application</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Personal Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => {
                        if (formData.email && !EmailValidator(formData.email)) {
                          setFieldErrors(prev => ({
                            ...prev,
                            email: 'Please enter a valid email address',
                          }));
                        } else {
                          setFieldErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />

                    {fieldErrors.email && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                    )}


                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={() => {
                        if (formData.phone && !PhoneValidator(formData.phone)) {
                          setFieldErrors(prev => ({
                            ...prev,
                            phone: 'Please enter a valid 10-digit phone number',
                          }));
                        } else {
                          setFieldErrors(prev => ({ ...prev, phone: undefined }));
                        }
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />

                    {fieldErrors.phone && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>
                    )}


                    <div>
                      <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                        placeholder="City, State"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Professional Information</h3>
                  <div>
                    <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="text"
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                      placeholder="e.g., 2 years, 3-5 years"
                    />
                    <p className="mt-2 text-xs text-gray-500">Optional: Describe your relevant work experience</p>
                  </div>
                </div>

                {/* Resume Upload Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Upload Resume/CV</h3>
                  <div>
                    <label htmlFor="cv_file" className="block text-sm font-semibold text-gray-700 mb-3">
                      Resume/CV (PDF, DOC, DOCX, or Image)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-xl hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer">
                      <div className="space-y-2 text-center">
                        <svg className="mx-auto h-14 w-14 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 text-sm text-gray-600">
                          <label htmlFor="cv_file" className="relative cursor-pointer bg-white rounded-md font-semibold text-brand-600 hover:text-brand-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500 transition-colors">
                            <span className="underline">Upload a file</span>
                            <input
                              id="cv_file"
                              name="cv_file"
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif,image/webp"
                              onChange={handleFileChange}
                              className="sr-only"
                            />
                          </label>
                          <span className="text-gray-500">or drag and drop</span>
                        </div>
                        <p className="text-xs text-gray-500 pt-1">PDF, DOC, DOCX, JPG, PNG, GIF, WEBP up to 10MB</p>
                        {cvFileName && (
                          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg border border-brand-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">Selected: {cvFileName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3.5 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg min-h-[48px] flex items-center justify-center"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                  <Link
                    href={`/jobs/${job.slug}`}
                    className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-center min-h-[48px] flex items-center justify-center"
                  >
                    Cancel
                  </Link>
                </div>

                <p className="text-xs text-gray-500 text-center pt-2">
                  By submitting this application, you agree to our{' '}
                  <Link href="/terms" className="text-brand-600 hover:text-brand-700 underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-brand-600 hover:text-brand-700 underline">Privacy Policy</Link>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
