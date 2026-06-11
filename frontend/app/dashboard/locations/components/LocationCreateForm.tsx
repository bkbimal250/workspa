'use client';

import { useState, useEffect } from 'react';
import { Country, State, City, Area } from '@/lib/location';
import { locationAPI } from '@/lib/location';
import { FaGlobe, FaMapMarkerAlt, FaCity, FaBuilding, FaCheckCircle } from 'react-icons/fa';

type LocationType = 'countries' | 'states' | 'cities' | 'areas';

interface LocationCreateFormProps {
  activeTab: LocationType;
  show: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    country_id?: number;
    state_id?: number;
    city_id?: number;
  }) => Promise<Country | State | City | Area>;
  initialData?: {
    country_id?: number;
    state_id?: number;
    city_id?: number;
  };
  countries: Country[];
  states: State[];
  cities: City[];
}

interface RecentItem {
  id: number;
  name: string;
  type: LocationType;
  country?: string;
  state?: string;
  city?: string;
  timestamp: Date;
}

export default function LocationCreateForm({
  activeTab,
  show,
  onClose,
  onSubmit,
  initialData,
  countries,
  states,
  cities,
}: LocationCreateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    country_id: initialData?.country_id?.toString() || '',
    state_id: initialData?.state_id?.toString() || '',
    city_id: initialData?.city_id?.toString() || '',
  });
  const [availableStates, setAvailableStates] = useState<State[]>(states);
  const [availableCities, setAvailableCities] = useState<City[]>(cities);
  const [submitting, setSubmitting] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setAvailableStates(states);
  }, [states]);

  useEffect(() => {
    setAvailableCities(cities);
  }, [cities]);

  // Load states when country is selected
  useEffect(() => {
    if (show && formData.country_id) {
      locationAPI.getStates(parseInt(formData.country_id)).then(setAvailableStates).catch(console.error);
    } else {
      setAvailableStates([]);
    }
  }, [show, formData.country_id]);

  // Load cities when state is selected
  useEffect(() => {
    if (show && formData.state_id) {
      locationAPI.getCities(parseInt(formData.state_id), parseInt(formData.country_id)).then(setAvailableCities).catch(console.error);
    } else {
      setAvailableCities([]);
    }
  }, [show, formData.state_id, formData.country_id]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: '',
        country_id: initialData.country_id?.toString() || '',
        state_id: initialData.state_id?.toString() || '',
        city_id: initialData.city_id?.toString() || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'country_id') {
        newData.state_id = '';
        newData.city_id = '';
      } else if (name === 'state_id') {
        newData.city_id = '';
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent, saveAndAddAnother: boolean = false) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        country_id: formData.country_id ? parseInt(formData.country_id) : undefined,
        state_id: formData.state_id ? parseInt(formData.state_id) : undefined,
        city_id: formData.city_id ? parseInt(formData.city_id) : undefined,
      };

      if (!submitData.name) {
        throw new Error('Name is required');
      }

      const createdItem = await onSubmit(submitData);
      
      // Add to recent items for display
      const countryName = countries.find(c => c.id === parseInt(formData.country_id || '0'))?.name;
      const stateName = availableStates.find(s => s.id === parseInt(formData.state_id || '0'))?.name;
      const cityName = availableCities.find(c => c.id === parseInt(formData.city_id || '0'))?.name;

      const newItem: RecentItem = {
        id: createdItem.id,
        name: createdItem.name,
        type: activeTab,
        country: countryName,
        state: stateName,
        city: cityName,
        timestamp: new Date(),
      };

      setRecentItems(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10 items
      
      if (saveAndAddAnother) {
        // Reset only the name field, keep parent selections
        setFormData({
          name: '',
          country_id: formData.country_id,
          state_id: formData.state_id,
          city_id: formData.city_id,
        });
      } else {
        // Reset all fields and close form
        setFormData({
          name: '',
          country_id: initialData?.country_id?.toString() || '',
          state_id: initialData?.state_id?.toString() || '',
          city_id: initialData?.city_id?.toString() || '',
        });
        onClose();
      }
    } catch (error) {
      // Error handling is done in parent component
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'countries': return FaGlobe;
      case 'states': return FaMapMarkerAlt;
      case 'cities': return FaCity;
      case 'areas': return FaBuilding;
    }
  };

  const getRequiredFields = () => {
    switch (activeTab) {
      case 'countries':
        return { country: false, state: false, city: false, area: false };
      case 'states':
        return { country: true, state: false, city: false, area: false };
      case 'cities':
        return { country: true, state: true, city: false, area: false };
      case 'areas':
        // For areas, we need country -> state -> city to properly select city
        return { country: true, state: true, city: true, area: false };
      default:
        return { country: false, state: false, city: false, area: false };
    }
  };

  const requiredFields = getRequiredFields();

  return (
    <div className="space-y-5 mb-5">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-brand-200">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="text-brand-600">
                {(() => {
                  const Icon = getLocationIcon(activeTab);
                  return <Icon size={20} />;
                })()}
              </div>
              Add New {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Fill in the hierarchical location structure</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
          {/* Hierarchical Structure - All Dropdowns */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FaGlobe size={14} className="text-brand-600" />
              Location Hierarchy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country {requiredFields.country && <span className="text-red-500">*</span>}
                </label>
                <select
                  name="country_id"
                  value={formData.country_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                  required={requiredFields.country}
                  disabled={activeTab === 'countries'}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State {requiredFields.state && <span className="text-red-500">*</span>}
                </label>
                <select
                  name="state_id"
                  value={formData.state_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                  required={requiredFields.state}
                  disabled={!formData.country_id || activeTab === 'countries' || activeTab === 'states'}
                >
                  <option value="">Select State</option>
                  {availableStates
                    .filter((s) => !formData.country_id || s.country_id === parseInt(formData.country_id))
                    .map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City {requiredFields.city && <span className="text-red-500">*</span>}
                </label>
                <select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                  required={requiredFields.city}
                  disabled={!formData.state_id || activeTab === 'countries' || activeTab === 'states' || activeTab === 'cities'}
                >
                  <option value="">Select City</option>
                  {availableCities
                    .filter((c) => {
                      if (!formData.state_id) return false;
                      return c.state_id === parseInt(formData.state_id);
                    })
                    .map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Area - Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {activeTab === 'areas' ? 'Area Name' : activeTab === 'cities' ? 'City Name' : activeTab === 'states' ? 'State Name' : 'Country Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition bg-white"
                  placeholder={`Enter ${activeTab.slice(0, -1)} name`}
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save & Add Another'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Recently Added Section */}
      {recentItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-green-600" size={18} />
            Recently Added
          </h4>
          <div className="space-y-3">
            {recentItems.map((item, index) => {
              const Icon = getLocationIcon(item.type);
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-green-600">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        {item.country && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{item.country}</span>
                          </>
                        )}
                        {item.state && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{item.state}</span>
                          </>
                        )}
                        {item.city && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{item.city}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1, -1)} • {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-green-600">
                    <FaCheckCircle size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

