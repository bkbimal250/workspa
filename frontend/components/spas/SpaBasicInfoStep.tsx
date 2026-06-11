import { SpaFieldChangeHandler, SpaFormData } from './types';

type SpaBasicInfoStepProps = {
  formData: SpaFormData;
  onChange: SpaFieldChangeHandler;
  onNext: () => void;
};

export default function SpaBasicInfoStep({
  formData,
  onChange,
  onNext,
}: SpaBasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
        <p className="mt-1 text-sm text-gray-500">Add the spa identity and contact details.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            SPA Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={onChange}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={onChange}
          className="input-field"
        />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onNext} className="btn-primary">
          Next: Location
        </button>
      </div>
    </div>
  );
}
