'use client';

import { JobFieldChangeHandler, JobFormData } from './types';

type JobPayPublishStepProps = {
  formData: JobFormData;
  onFieldChange: JobFieldChangeHandler;
};

export default function JobPayPublishStep({ formData, onFieldChange }: JobPayPublishStepProps) {
  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Pay & Publish</h2>
        <p className="mt-1 text-gray-600">Add compensation, contact, and publishing settings.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Salary & Experience</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="salary_min" className="mb-2 block text-sm font-semibold text-gray-700">
              Minimum Salary
            </label>
            <input
              type="number"
              id="salary_min"
              value={formData.salary_min}
              onChange={(event) => onFieldChange('salary_min', event.target.value)}
              className={inputClass}
              min="0"
            />
          </div>

          <div>
            <label htmlFor="salary_max" className="mb-2 block text-sm font-semibold text-gray-700">
              Maximum Salary
            </label>
            <input
              type="number"
              id="salary_max"
              value={formData.salary_max}
              onChange={(event) => onFieldChange('salary_max', event.target.value)}
              className={inputClass}
              min="0"
            />
          </div>

          <div>
            <label htmlFor="salary_currency" className="mb-2 block text-sm font-semibold text-gray-700">
              Currency
            </label>
            <select
              id="salary_currency"
              value={formData.salary_currency}
              onChange={(event) => onFieldChange('salary_currency', event.target.value)}
              className={`${inputClass} bg-white`}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="experience_years_min" className="mb-2 block text-sm font-semibold text-gray-700">
              Minimum Experience (Years)
            </label>
            <input
              type="number"
              id="experience_years_min"
              value={formData.experience_years_min}
              onChange={(event) => onFieldChange('experience_years_min', event.target.value)}
              className={inputClass}
              min="0"
            />
          </div>

          <div>
            <label htmlFor="experience_years_max" className="mb-2 block text-sm font-semibold text-gray-700">
              Maximum Experience (Years)
            </label>
            <input
              type="number"
              id="experience_years_max"
              value={formData.experience_years_max}
              onChange={(event) => onFieldChange('experience_years_max', event.target.value)}
              className={inputClass}
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">HR Contact Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="hr_contact_name" className="mb-2 block text-sm font-semibold text-gray-700">
              Contact Name
            </label>
            <input
              type="text"
              id="hr_contact_name"
              value={formData.hr_contact_name}
              onChange={(event) => onFieldChange('hr_contact_name', event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="hr_contact_email" className="mb-2 block text-sm font-semibold text-gray-700">
              Contact Email
            </label>
            <input
              type="email"
              id="hr_contact_email"
              value={formData.hr_contact_email}
              onChange={(event) => onFieldChange('hr_contact_email', event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="hr_contact_phone" className="mb-2 block text-sm font-semibold text-gray-700">
              Contact Phone
            </label>
            <input
              type="tel"
              id="hr_contact_phone"
              value={formData.hr_contact_phone}
              onChange={(event) => onFieldChange('hr_contact_phone', event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Publishing</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="expires_at" className="mb-2 block text-sm font-semibold text-gray-700">
              Job Expiry Date
            </label>
            <input
              type="datetime-local"
              id="expires_at"
              value={formData.expires_at}
              onChange={(event) => onFieldChange('expires_at', event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center rounded-lg border border-gray-300 p-4 transition-colors hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(event) => onFieldChange('is_featured', event.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3">
                <span className="block text-sm font-semibold text-gray-700">Featured Job</span>
                <span className="block text-xs text-gray-500">Highlight this job in search results</span>
              </span>
            </label>
          </div>

          <div className="flex items-end md:col-span-2">
            <label className="flex w-full cursor-pointer items-center rounded-lg border border-gray-300 p-4 transition-colors hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(event) => onFieldChange('is_active', event.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3">
                <span className="block text-sm font-semibold text-gray-700">Active Job</span>
                <span className="block text-xs text-gray-500">Make this job visible to candidates</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">SEO Settings</h3>
        <div>
          <label htmlFor="meta_title" className="mb-2 block text-sm font-semibold text-gray-700">
            Meta Title <span className="text-xs font-normal text-gray-500">(Max 60 characters)</span>
          </label>
          <input
            type="text"
            id="meta_title"
            value={formData.meta_title}
            onChange={(event) => onFieldChange('meta_title', event.target.value)}
            className={inputClass}
            maxLength={60}
          />
          <p className="mt-1 text-right text-xs text-gray-500">{formData.meta_title.length}/60</p>
        </div>

        <div>
          <label htmlFor="meta_description" className="mb-2 block text-sm font-semibold text-gray-700">
            Meta Description <span className="text-xs font-normal text-gray-500">(Max 160 characters)</span>
          </label>
          <textarea
            id="meta_description"
            rows={3}
            value={formData.meta_description}
            onChange={(event) => onFieldChange('meta_description', event.target.value)}
            className={`${inputClass} resize-none`}
            maxLength={160}
          />
          <p className="mt-1 text-right text-xs text-gray-500">{formData.meta_description.length}/160</p>
        </div>
      </div>
    </div>
  );
}
