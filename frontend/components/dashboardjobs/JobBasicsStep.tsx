'use client';

import { JobCategory, JobType } from '@/lib/job';
import { Spa } from '@/lib/spa';
import SpaSearchableDropdown from './SpaSearchableDropdown';
import { JobFieldChangeHandler, JobFormData, JobFormErrors } from './types';

type JobBasicsStepProps = {
  errors: JobFormErrors;
  formData: JobFormData;
  jobCategories: JobCategory[];
  jobTypes: JobType[];
  onFieldChange: JobFieldChangeHandler;
  spas: Spa[];
  userRole?: string;
};

export default function JobBasicsStep({
  errors,
  formData,
  jobCategories,
  jobTypes,
  onFieldChange,
  spas,
  userRole,
}: JobBasicsStepProps) {
  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Job Basics</h2>
        <p className="mt-1 text-gray-600">Choose the business and define the opening.</p>
      </div>

      <div>
        <label htmlFor="spa_id" className="mb-2 block text-sm font-semibold text-gray-700">
          Select SPA <span className="text-red-500">*</span>
        </label>
        <SpaSearchableDropdown
          spas={spas}
          value={formData.spa_id}
          onChange={(spaId) => onFieldChange('spa_id', spaId)}
          disabled={userRole === 'recruiter'}
          required
          error={errors.spa_id}
        />
      </div>

      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-semibold text-gray-700">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(event) => onFieldChange('title', event.target.value)}
          className={`${inputClass} ${errors.title ? 'border-red-500' : ''}`}
          placeholder="e.g., Senior Spa Therapist"
          required
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="job_type_id" className="mb-2 block text-sm font-semibold text-gray-700">
            Job Type
          </label>
          <select
            id="job_type_id"
            value={formData.job_type_id}
            onChange={(event) => onFieldChange('job_type_id', event.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">Select Type</option>
            {jobTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="job_category_id" className="mb-2 block text-sm font-semibold text-gray-700">
            Job Category
          </label>
          <select
            id="job_category_id"
            value={formData.job_category_id}
            onChange={(event) => onFieldChange('job_category_id', event.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">Select Category</option>
            {jobCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="Industry_type" className="mb-2 block text-sm font-semibold text-gray-700">
            Industry Type
          </label>
          <input
            type="text"
            id="Industry_type"
            value={formData.Industry_type}
            onChange={(event) => onFieldChange('Industry_type', event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="Employee_type" className="mb-2 block text-sm font-semibold text-gray-700">
            Employment Type
          </label>
          <select
            id="Employee_type"
            value={formData.Employee_type}
            onChange={(event) => onFieldChange('Employee_type', event.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>
        </div>

        <div>
          <label htmlFor="required_gender" className="mb-2 block text-sm font-semibold text-gray-700">
            Required Gender
          </label>
          <select
            id="required_gender"
            value={formData.required_gender}
            onChange={(event) => onFieldChange('required_gender', event.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Any">Any</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="job_opening_count" className="mb-2 block text-sm font-semibold text-gray-700">
          Number of Openings
        </label>
        <input
          type="number"
          id="job_opening_count"
          value={formData.job_opening_count}
          onChange={(event) => onFieldChange('job_opening_count', event.target.value)}
          className={inputClass}
          min="1"
        />
      </div>
    </div>
  );
}
