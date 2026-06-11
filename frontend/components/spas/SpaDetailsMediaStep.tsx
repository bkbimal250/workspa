import { ChangeEvent } from 'react';
import { SpaFieldChangeHandler, SpaFormData } from './types';

type SpaDetailsMediaStepProps = {
  apiUrl?: string;
  existingImages?: string[];
  existingLogoImage?: string | null;
  formData: SpaFormData;
  imagePreviews: string[];
  logoImagePreview: string | null;
  submitting: boolean;
  onBack: () => void;
  onChange: SpaFieldChangeHandler;
  onImagesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLogoImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveExistingImage?: (index: number) => void;
  onRemoveImage: (index: number) => void;
  onSubmitClick?: () => void;
  submitLabel?: string;
  submittingLabel?: string;
};

export default function SpaDetailsMediaStep({
  apiUrl = '',
  existingImages = [],
  existingLogoImage = null,
  formData,
  imagePreviews,
  logoImagePreview,
  submitting,
  onBack,
  onChange,
  onImagesChange,
  onLogoImageChange,
  onRemoveExistingImage,
  onRemoveImage,
  onSubmitClick,
  submitLabel = 'Create SPA',
  submittingLabel = 'Creating...',
}: SpaDetailsMediaStepProps) {
  const handleStatusChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Details & Media</h2>
        <p className="mt-1 text-sm text-gray-500">Add hours, map links, ratings, and images.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="opening_hours" className="block text-sm font-medium text-gray-700">
            Opening Hours
          </label>
          <input
            type="text"
            id="opening_hours"
            name="opening_hours"
            value={formData.opening_hours}
            onChange={onChange}
            className="input-field"
            placeholder="e.g., 9:00 AM"
          />
        </div>

        <div>
          <label htmlFor="closing_hours" className="block text-sm font-medium text-gray-700">
            Closing Hours
          </label>
          <input
            type="text"
            id="closing_hours"
            name="closing_hours"
            value={formData.closing_hours}
            onChange={onChange}
            className="input-field"
            placeholder="e.g., 9:00 PM"
          />
        </div>

        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            id="latitude"
            name="latitude"
            value={formData.latitude}
            onChange={onChange}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            id="longitude"
            name="longitude"
            value={formData.longitude}
            onChange={onChange}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
            Rating
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            id="rating"
            name="rating"
            value={formData.rating}
            onChange={onChange}
            className="input-field"
            placeholder="e.g., 4.5"
          />
          <p className="mt-1 text-xs text-gray-500">Rating from 0.0 to 5.0</p>
        </div>

        <div>
          <label htmlFor="reviews" className="block text-sm font-medium text-gray-700">
            Number of Reviews
          </label>
          <input
            type="number"
            step="1"
            min="0"
            id="reviews"
            name="reviews"
            value={formData.reviews}
            onChange={onChange}
            className="input-field"
            placeholder="e.g., 150"
          />
          <p className="mt-1 text-xs text-gray-500">Total number of reviews</p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="directions" className="block text-sm font-medium text-gray-700">
            Google Maps Directions URL
          </label>
          <input
            type="url"
            id="directions"
            name="directions"
            value={formData.directions}
            onChange={onChange}
            placeholder="https://maps.google.com/?daddr=..."
            className="input-field"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="booking_url_website" className="block text-sm font-medium text-gray-700">
            Booking URL / Website
          </label>
          <input
            type="url"
            id="booking_url_website"
            name="booking_url_website"
            value={formData.booking_url_website}
            onChange={onChange}
            className="input-field"
            placeholder="e.g., https://book.myspa.com"
          />
        </div>
      </div>

      {(typeof formData.is_active === 'boolean' || typeof formData.is_verified === 'boolean') && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-800">Status</h3>
          {typeof formData.is_active === 'boolean' && (
            <label className="flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleStatusChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">Active</span>
            </label>
          )}
          {typeof formData.is_verified === 'boolean' && (
            <label className="flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="is_verified"
                checked={formData.is_verified}
                onChange={handleStatusChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">Verified</span>
            </label>
          )}
        </div>
      )}

      <div>
        <label htmlFor="logo_image" className="mb-2 block text-sm font-medium text-gray-700">
          {existingLogoImage ? 'Replace Logo Image' : 'Logo Image'}
        </label>
        {existingLogoImage && !logoImagePreview && (
          <div className="mb-4">
            <img
              src={`${apiUrl}/${existingLogoImage}`}
              alt="Current logo"
              className="h-48 w-full max-w-xs rounded-md border border-gray-300 object-cover"
            />
          </div>
        )}
        <input
          type="file"
          id="logo_image"
          name="logo_image"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={onLogoImageChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
        />
        {logoImagePreview && (
          <div className="mt-4">
            <img
              src={logoImagePreview}
              alt="Logo preview"
              className="h-48 w-full rounded-md border border-gray-300 object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="images" className="mb-2 block text-sm font-medium text-gray-700">
          {existingImages.length > 0 ? 'Upload New SPA Images' : 'Upload SPA Images'}
        </label>
        {existingImages.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {existingImages.map((image, index) => (
              <div key={`${image}-${index}`} className="relative">
                <img
                  src={`${apiUrl}/${image}`}
                  alt={`Existing ${index + 1}`}
                  className="h-32 w-full rounded-md border border-gray-200 object-cover"
                />
                {onRemoveExistingImage && (
                  <button
                    type="button"
                    onClick={() => onRemoveExistingImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          id="images"
          name="images"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.bmp"
          onChange={onImagesChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
        />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {imagePreviews.map((preview, index) => (
            <div key={`${preview}-${index}`} className="relative">
              <img src={preview} alt={`Preview ${index + 1}`} className="h-32 w-full rounded-md object-cover" />
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute right-1 top-1 rounded-full bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting}
          onClick={onSubmitClick}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}
