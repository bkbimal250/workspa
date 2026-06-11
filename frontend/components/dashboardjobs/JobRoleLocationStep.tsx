'use client';

import SearchableSelect from '@/app/dashboard/spas/components/SearchableSelect';
import { Area, City, Country, State } from '@/lib/location';
import { JobFieldChangeHandler, JobFormData, JobFormErrors } from './types';

type JobRoleLocationStepProps = {
  areas: Area[];
  cities: City[];
  countries: Country[];
  errors: JobFormErrors;
  formData: JobFormData;
  onCountryChange: (countryId: string) => void;
  onCityChange: (cityId: string) => void;
  onFieldChange: JobFieldChangeHandler;
  onStateChange: (stateId: string) => void;
  states: State[];
};

export default function JobRoleLocationStep({
  areas,
  cities,
  countries,
  errors,
  formData,
  onCountryChange,
  onCityChange,
  onFieldChange,
  onStateChange,
  states,
}: JobRoleLocationStepProps) {
  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Role & Location</h2>
        <p className="mt-1 text-gray-600">Describe the role and choose where candidates will find it.</p>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-semibold text-gray-700">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          rows={6}
          value={formData.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          className={`${inputClass} resize-none ${errors.description ? 'border-red-500' : ''}`}
          placeholder="Describe the role, expectations, and what makes this opportunity attractive."
          required
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="requirements" className="mb-2 block text-sm font-semibold text-gray-700">
            Requirements
          </label>
          <textarea
            id="requirements"
            rows={4}
            value={formData.requirements}
            onChange={(event) => onFieldChange('requirements', event.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="Qualifications, certifications, skills, and experience."
          />
        </div>

        <div>
          <label htmlFor="responsibilities" className="mb-2 block text-sm font-semibold text-gray-700">
            Responsibilities
          </label>
          <textarea
            id="responsibilities"
            rows={4}
            value={formData.responsibilities}
            onChange={(event) => onFieldChange('responsibilities', event.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="Daily tasks and responsibilities for this position."
          />
        </div>

        <div>
          <label htmlFor="benefits" className="mb-2 block text-sm font-semibold text-gray-700">
            Benefits
          </label>
          <textarea
            id="benefits"
            rows={3}
            value={formData.benefits}
            onChange={(event) => onFieldChange('benefits', event.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="Perks, paid leave, bonus, incentives, accommodation, etc."
          />
        </div>

        <div>
          <label htmlFor="key_skills" className="mb-2 block text-sm font-semibold text-gray-700">
            Key Skills
          </label>
          <textarea
            id="key_skills"
            rows={3}
            value={formData.key_skills}
            onChange={(event) => onFieldChange('key_skills', event.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="Customer Service, Massage Therapy, Product Knowledge"
          />
        </div>
      </div>

      <div>
        <label htmlFor="job_timing" className="mb-2 block text-sm font-semibold text-gray-700">
          Job Timing
        </label>
        <select
          id="job_timing"
          value={formData.job_timing}
          onChange={(event) => onFieldChange('job_timing', event.target.value)}
          className={`${inputClass} bg-white`}
        >
          <option value="">Select Job Timing</option>
          <option value="11:00 AM to 8:00 PM">11:00 AM to 8:00 PM</option>
          <option value="11:00 AM to 10:00 PM">11:00 AM to 10:00 PM</option>
          <option value="11:00 AM to 11:00 PM">11:00 AM to 11:00 PM</option>
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Location</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Country <span className="text-red-500">*</span>
            </label>
            <div className={errors.country_id ? 'rounded-lg border border-red-500 p-1' : ''}>
              <SearchableSelect
                options={countries.map((country) => ({ id: country.id, name: country.name }))}
                value={formData.country_id ? parseInt(formData.country_id) : null}
                onChange={(value) => {
                  const countryId = value ? value.toString() : '';
                  onFieldChange('country_id', countryId);
                  onCountryChange(countryId);
                }}
                placeholder="Select Country"
              />
            </div>
            {errors.country_id && <p className="mt-1 text-sm text-red-600">{errors.country_id}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              State <span className="text-red-500">*</span>
            </label>
            <div className={errors.state_id ? 'rounded-lg border border-red-500 p-1' : ''}>
              <SearchableSelect
                options={states.map((state) => ({ id: state.id, name: state.name }))}
                value={formData.state_id ? parseInt(formData.state_id) : null}
                onChange={(value) => {
                  const stateId = value ? value.toString() : '';
                  onFieldChange('state_id', stateId);
                  onStateChange(stateId);
                }}
                placeholder="Select State"
                disabled={!formData.country_id}
              />
            </div>
            {errors.state_id && <p className="mt-1 text-sm text-red-600">{errors.state_id}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              City <span className="text-red-500">*</span>
            </label>
            <div className={errors.city_id ? 'rounded-lg border border-red-500 p-1' : ''}>
              <SearchableSelect
                options={cities.map((city) => ({ id: city.id, name: city.name }))}
                value={formData.city_id ? parseInt(formData.city_id) : null}
                onChange={(value) => {
                  const cityId = value ? value.toString() : '';
                  onFieldChange('city_id', cityId);
                  onCityChange(cityId);
                }}
                placeholder="Select City"
                disabled={!formData.state_id}
              />
            </div>
            {errors.city_id && <p className="mt-1 text-sm text-red-600">{errors.city_id}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Area</label>
            <SearchableSelect
              options={areas.map((area) => ({ id: area.id, name: area.name }))}
              value={formData.area_id ? parseInt(formData.area_id) : null}
              onChange={(value) => onFieldChange('area_id', value ? value.toString() : '')}
              placeholder="Select Area"
              disabled={!formData.city_id}
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="mb-2 block text-sm font-semibold text-gray-700">
              Postal Code
            </label>
            <input
              type="text"
              id="postalCode"
              value={formData.postalCode}
              onChange={(event) => onFieldChange('postalCode', event.target.value)}
              className={inputClass}
              maxLength={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
