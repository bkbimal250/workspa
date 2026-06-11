import { LocationOptions, SpaFieldChangeHandler, SpaFormData } from './types';

type SpaLocationStepProps = {
  formData: SpaFormData;
  locationOptions: LocationOptions;
  onBack: () => void;
  onChange: SpaFieldChangeHandler;
  onNext: () => void;
};

export default function SpaLocationStep({
  formData,
  locationOptions,
  onBack,
  onChange,
  onNext,
}: SpaLocationStepProps) {
  const { countries, states, cities, areas } = locationOptions;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Location Details</h2>
        <p className="mt-1 text-sm text-gray-500">Set where this spa appears in search.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="country_id" className="block text-sm font-medium text-gray-700">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            id="country_id"
            name="country_id"
            value={formData.country_id}
            onChange={onChange}
            className="input-field"
            required
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="state_id" className="block text-sm font-medium text-gray-700">
            State <span className="text-red-500">*</span>
          </label>
          <select
            id="state_id"
            name="state_id"
            value={formData.state_id}
            onChange={onChange}
            className="input-field"
            required
            disabled={!formData.country_id}
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="city_id" className="block text-sm font-medium text-gray-700">
            City <span className="text-red-500">*</span>
          </label>
          <select
            id="city_id"
            name="city_id"
            value={formData.city_id}
            onChange={onChange}
            className="input-field"
            required
            disabled={!formData.state_id}
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="area_id" className="block text-sm font-medium text-gray-700">
            Area
          </label>
          <select
            id="area_id"
            name="area_id"
            value={formData.area_id}
            onChange={onChange}
            className="input-field"
            disabled={!formData.city_id}
          >
            <option value="">Select Area (Optional)</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            Postal Code
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            className="input-field"
            placeholder="e.g., 12345"
            maxLength={10}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Full Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            value={formData.address}
            onChange={onChange}
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="button" onClick={onNext} className="btn-primary">
          Next: Details & Media
        </button>
      </div>
    </div>
  );
}
