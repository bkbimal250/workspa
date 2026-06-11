'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
};

const canManageSpas = (role?: string) =>
  role === 'admin' || role === 'manager' || role === 'recruiter';

export default function CreateSpaPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<SpaCreateStep>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<SpaFormData>(initialFormData);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOptions>({
    countries: [],
    states: [],
    cities: [],
    areas: [],
  });

  useEffect(() => {
    if (!user || !canManageSpas(user.role)) {
      router.push('/dashboard');
      return;
    }

    locationAPI
      .getCountries()
      .then((countries) => setLocationOptions((prev) => ({ ...prev, countries })))
      .catch(console.error);
  }, [user, router]);

  useEffect(() => {
    if (!formData.country_id) {
      setLocationOptions((prev) => ({ ...prev, states: [], cities: [], areas: [] }));
      return;
    }

    locationAPI
      .getStates(parseInt(formData.country_id))
      .then((states) => setLocationOptions((prev) => ({ ...prev, states })))
      .catch(console.error);
  }, [formData.country_id]);

  useEffect(() => {
    if (!formData.state_id) {
      setLocationOptions((prev) => ({ ...prev, cities: [], areas: [] }));
      return;
    }

    locationAPI
      .getCities(parseInt(formData.state_id))
      .then((cities) => setLocationOptions((prev) => ({ ...prev, cities })))
      .catch(console.error);
  }, [formData.state_id]);

  useEffect(() => {
    if (!formData.city_id) {
      setLocationOptions((prev) => ({ ...prev, areas: [] }));
      return;
    }

    locationAPI
      .getAreas(parseInt(formData.city_id))
      .then((areas) => setLocationOptions((prev) => ({ ...prev, areas })))
      .catch(console.error);
  }, [formData.city_id]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'country_id' ? { state_id: '', city_id: '', area_id: '' } : {}),
      ...(name === 'state_id' ? { city_id: '', area_id: '' } : {}),
      ...(name === 'city_id' ? { area_id: '' } : {}),
    }));
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

  const validateCurrentStep = () => {
    if (step === 1 && (!formData.name || !formData.email || !formData.phone)) {
      setError('Please fill in the spa name, email, and phone.');
      return false;
    }

    if (
      step === 2 &&
      (!formData.country_id || !formData.state_id || !formData.city_id || !formData.address)
    ) {
      setError('Please complete the required location fields.');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError(null);

    if (!validateCurrentStep()) {
      return;
    }

    setStep((prev) => Math.min(prev + 1, 3) as SpaCreateStep);
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1) as SpaCreateStep);
  };

  const appendIfPresent = (data: FormData, key: keyof SpaFormData) => {
    const value = formData[key];

    if (typeof value === 'string' && value !== '') {
      data.append(key, value);
    }
  };

  const buildSpaPayload = () => {
    const data = new FormData();

    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('country_id', formData.country_id);
    data.append('state_id', formData.state_id);
    data.append('city_id', formData.city_id);

    (
      [
        'description',
        'address',
        'website',
        'directions',
        'opening_hours',
        'closing_hours',
        'booking_url_website',
        'area_id',
        'postalCode',
        'latitude',
        'longitude',
        'rating',
        'reviews',
      ] as Array<keyof SpaFormData>
    ).forEach((key) => appendIfPresent(data, key));

    if (logoImage) {
      data.append('logo_image', logoImage);
    }

    images.forEach((image) => data.append('images', image));

    return data;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateCurrentStep()) {
      return;
    }

    setSubmitting(true);

    try {
      const createdSpa = await spaAPI.createSpa(buildSpaPayload());
      setSuccess('SPA created successfully!');

      setTimeout(() => {
        router.push(`/dashboard/spas/${createdSpa.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create SPA');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !canManageSpas(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New SPA</h1>
            <p className="mt-2 text-gray-600">Step {step} of 3</p>
          </div>
          <Link href="/dashboard/spas" className="btn-secondary">
            Back to SPAs
          </Link>
        </div>

        <SpaFormProgress currentStep={step} />

        {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</div>}
        {success && (
          <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">{success}</div>
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
              formData={formData}
              imagePreviews={imagePreviews}
              logoImagePreview={logoImagePreview}
              submitting={submitting}
              onBack={handleBack}
              onChange={handleChange}
              onImagesChange={handleImageChange}
              onLogoImageChange={handleLogoImageChange}
              onRemoveImage={handleRemoveImage}
            />
          )}
        </form>
      </div>
    </div>
  );
}
