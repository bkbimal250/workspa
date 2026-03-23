'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { spaAPI, Spa } from '@/lib/spa';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function BusinessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [spa, setSpa] = useState<Spa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'recruiter') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    loadMySpa();
  }, []);

  const loadMySpa = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await spaAPI.getMySpa();
      setSpa(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('You don\'t have a managed SPA yet. Create one to get started.');
      } else {
        setError('Failed to load your business. Please try again.');
        console.error('Failed to load SPA:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Business</h1>
            <p className="text-gray-600 mt-2">Manage your spa/business</p>
          </div>
          {!spa && (
            <Link href="/dashboard/spas/create" className="btn-primary">
              Create Business
            </Link>
          )}
        </div>

        {error && !spa ? (
          <div className="card">
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/dashboard/spas/create" className="btn-primary inline-block">
                Create Your Business
              </Link>
            </div>
          </div>
        ) : spa ? (
          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{spa.name}</h2>
                  {spa.logo_image && (
                    <div className="mt-4">
                      <img
                        src={`https://api.backend.workspa.in/${spa.logo_image}`}
                        alt={spa.name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
                <Link href={`/dashboard/spas/${spa.id}/edit`} className="btn-primary">
                  Edit Business
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><span className="font-medium">Phone:</span> {spa.phone}</p>
                    <p><span className="font-medium">Email:</span> {spa.email}</p>
                    {spa.website && (
                      <p>
                        <span className="font-medium">Website:</span>{' '}
                        <a href={spa.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          {spa.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Location</h3>
                  <div className="space-y-2 text-gray-600">
                    {spa.address && <p>{spa.address}</p>}
                    {spa.latitude && spa.longitude && (
                      <p className="text-sm">
                        <span className="font-medium">Coordinates:</span> {spa.latitude}, {spa.longitude}
                      </p>
                    )}
                  </div>
                </div>

                {spa.description && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-600">{spa.description}</p>
                  </div>
                )}

                {spa.opening_hours && spa.closing_hours && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Hours</h3>
                    <p className="text-gray-600">{spa.opening_hours} - {spa.closing_hours}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${spa.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {spa.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${spa.is_verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {spa.is_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {spa.spa_images && spa.spa_images.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {spa.spa_images.map((image, index) => (
                      <img
                        key={index}
                        src={`https://api.backend.workspa.in/${image}`}
                        alt={`${spa.name} - Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card bg-blue-50 border border-blue-200">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Link href="/dashboard/jobs/create" className="btn-primary text-sm">
                      Post a Job
                    </Link>
                    <Link href="/dashboard/jobs" className="btn-secondary text-sm">
                      View My Jobs
                    </Link>
                    <Link href="/dashboard/applications" className="btn-secondary text-sm">
                      View Applications
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

