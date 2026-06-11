'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import Navbar from '@/components/Navbar';
import {
  LocationOptions,
  SpaBasicInfoStep,
  SpaCreateStep,
  SpaDetailsMediaStep,
  SpaFormData,
  SpaFormProgress,
  SpaLocationStep,
} from '@/components/spas';
import { useAuth } from '@/contexts/AuthContext';
import { locationAPI, spaAPI } from '@/lib/spa';

const initialFormData: SpaFormData = {
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  directions: '',
  opening_hours: '',
  closing_hours: '',
  booking_url_website: '',
  country_id: '',
  state_id: '',
  city_id: '',
  area_id: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  rating: '',
  reviews: '',
  is_active: true,
  is_verified: false,
};

const canEditSpas = (role?: string) => role === 'admin' || role === 'manager';

export default function EditSpaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const spaId = params?.id ? parseInt(params.id as string) : null;

  const [step, setStep] = useState<SpaCreateStep>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<SpaFormData>(initialFormData);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string | null>(null);
  const [existingLogoImage, setExistingLogoImage] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const submitRequestedRef = useRef(false);
  const [locationOptions, setLocationOptions] = useState<LocationOptions>({
    countries: [],
    states: [],
    cities: [],
    areas: [],
  });

  useEffect(() => {
    if (!user || !canEditSpas(user.role)) {
      router.push('/dashboard');
      return;
    }

    if (spaId) {
      fetchPageData();
    }
  }, [user, router, spaId]);

  const fetchPageData = async () => {
    if (!spaId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [spa, countries] = await Promise.all([
        spaAPI.getSpaById(spaId),
        locationAPI.getCountries(),
      ]);

      const [states, cities, areas] = await Promise.all([
        spa.country_id ? locationAPI.getStates(spa.country_id) : Promise.resolve([]),
        spa.state_id ? locationAPI.getCities(spa.state_id) : Promise.resolve([]),
        spa.city_id ? locationAPI.getAreas(spa.city_id) : Promise.resolve([]),
      ]);

      setLocationOptions({ countries, states, cities, areas });
      setExistingLogoImage(spa.logo_image || null);
      setExistingImages(spa.spa_images || []);
      setFormData({
        name: spa.name || '',
        description: spa.description || '',
        phone: spa.phone || '',
        email: spa.email || '',
        address: spa.address || '',
        website: spa.website || '',
        directions: spa.directions || '',
        opening_hours: spa.opening_hours || '',
        closing_hours: spa.closing_hours || '',
        booking_url_website: spa.booking_url_website || '',
        country_id: spa.country_id?.toString() || '',
        state_id: spa.state_id?.toString() || '',
        city_id: spa.city_id?.toString() || '',
        area_id: spa.area_id?.toString() || '',
        postalCode: spa.postalCode || '',
        latitude: spa.latitude?.toString() || '',
        longitude: spa.longitude?.toString() || '',
        rating: spa.rating?.toString() || '',
        reviews: spa.reviews?.toString() || '',
        is_active: spa.is_active ?? true,
        is_verified: spa.is_verified ?? false,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch SPA');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    const nextValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(name === 'country_id' ? { state_id: '', city_id: '', area_id: '' } : {}),
      ...(name === 'state_id' ? { city_id: '', area_id: '' } : {}),
      ...(name === 'city_id' ? { area_id: '' } : {}),
    }));

    if (name === 'country_id') {
      setLocationOptions((prev) => ({ ...prev, states: [], cities: [], areas: [] }));
      if (value) {
        locationAPI
          .getStates(parseInt(value))
          .then((states) => setLocationOptions((prev) => ({ ...prev, states })))
          .catch(console.error);
      }
    }

    if (name === 'state_id') {
      setLocationOptions((prev) => ({ ...prev, cities: [], areas: [] }));
      if (value) {
        locationAPI
          .getCities(parseInt(value))
          .then((cities) => setLocationOptions((prev) => ({ ...prev, cities })))
          .catch(console.error);
      }
    }

    if (name === 'city_id') {
      setLocationOptions((prev) => ({ ...prev, areas: [] }));
      if (value) {
        locationAPI
          .getAreas(parseInt(value))
          .then((areas) => setLocationOptions((prev) => ({ ...prev, areas })))
          .catch(console.error);
      }
    }
  };

  const handleLogoImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLogoImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setLogoImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedImages = Array.from(event.target.files || []);

    if (selectedImages.length === 0) {
      return;
    }

    setImages((prev) => [...prev, ...selectedImages]);
    setImagePreviews((prev) => [
      ...prev,
      ...selectedImages.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const validateStep = (currentStep: SpaCreateStep) => {
    if (currentStep === 1 && (!formData.name || !formData.email || !formData.phone)) {
      setError('Please fill in the spa name, email, and phone.');
      return false;
    }

    if (
      currentStep === 2 &&
      (!formData.country_id || !formData.state_id || !formData.city_id || !formData.address)
    ) {
      setError('Please complete the required location fields.');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError(null);

    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3) as SpaCreateStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1) as SpaCreateStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildSpaPayload = () => {
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'postalCode') {
        data.append(key, value?.toString() || '');
        return;
      }

      if (value !== '' && value !== null && value !== undefined) {
        data.append(key, value.toString());
      }
    });

    data.append('existing_images', JSON.stringify(existingImages));
    images.forEach((image) => data.append('images', image));

    if (logoImage) {
      data.append('logo_image', logoImage);
    }

    return data;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!submitRequestedRef.current) {
      return;
    }

    if (!spaId) {
      submitRequestedRef.current = false;
      return;
    }

    if (!validateStep(1)) {
      setStep(1);
      submitRequestedRef.current = false;
      return;
    }

    if (!validateStep(2)) {
      setStep(2);
      submitRequestedRef.current = false;
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await spaAPI.updateSpa(spaId, buildSpaPayload());
      setSuccess('SPA updated successfully!');

      setTimeout(() => {
        router.push(`/dashboard/spas/${spaId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update SPA');
    } finally {
      submitRequestedRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading || !user || !canEditSpas(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit SPA</h1>
            <p className="mt-2 text-gray-600">Step {step} of 3</p>
          </div>
          <Link href={`/dashboard/spas/${spaId}`} className="btn-secondary">
            Back to View
          </Link>
        </div>

        <SpaFormProgress currentStep={step} />

        {error && (
          <div className="mb-4 rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-400 bg-green-100 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          {step === 1 && (
            <SpaBasicInfoStep formData={formData} onChange={handleChange} onNext={handleNext} />
          )}

          {step === 2 && (
            <SpaLocationStep
              formData={formData}
              locationOptions={locationOptions}
              onBack={handleBack}
              onChange={handleChange}
              onNext={handleNext}
            />
          )}

          {step === 3 && (
            <SpaDetailsMediaStep
              apiUrl={process.env.NEXT_PUBLIC_API_URL}
              existingImages={existingImages}
              existingLogoImage={existingLogoImage}
              formData={formData}
              imagePreviews={imagePreviews}
              logoImagePreview={logoImagePreview}
              submitting={submitting}
              onBack={handleBack}
              onChange={handleChange}
              onImagesChange={handleImageChange}
              onLogoImageChange={handleLogoImageChange}
              onRemoveExistingImage={(index) =>
                setExistingImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
              }
              onRemoveImage={handleRemoveImage}
              onSubmitClick={() => {
                submitRequestedRef.current = true;
              }}
              submitLabel="Update SPA"
              submittingLabel="Updating..."
            />
          )}
        </form>
      </div>
    </div>
  );
}
