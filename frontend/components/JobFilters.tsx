'use client';

import { useState, useEffect } from 'react';
import { jobAPI, JobType, JobCategory } from '@/lib/job';
import { locationAPI } from '@/lib/location';
import { FaFilter, FaBriefcase, FaTags, FaMapMarkerAlt, FaRupeeSign, FaUserTie, FaStar, FaChevronDown, FaChevronUp, FaTimes, FaCrosshairs } from 'react-icons/fa';
import { useLocation } from '@/hooks/useLocation';
import SearchableSelect from '@/components/SearchableSelect';

interface JobFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

interface FilterState {
  jobTypeId?: number;
  jobCategoryId?: number;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  areaId?: number;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  isFeatured?: boolean;
}

export default function JobFilters({ onFilterChange, initialFilters = {} }: JobFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    location: true,
    salary: true,
    experience: true,
    jobType: true,
    jobCategory: true,
  });
  const [useNearMe, setUseNearMe] = useState(false);
  const { location: userLocation, loading: locationLoading } = useLocation(false);

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    if (filters.countryId) {
      locationAPI.getStates(filters.countryId, 0, 1000).then(setStates).catch(console.error);
      setFilters((prev) => ({ ...prev, stateId: undefined, cityId: undefined, areaId: undefined }));
      setCities([]);
      setAreas([]);
    }
  }, [filters.countryId]);

  useEffect(() => {
    if (filters.stateId) {
      locationAPI.getCities(filters.stateId, undefined, 0, 1000).then(setCities).catch(console.error);
      setFilters((prev) => ({ ...prev, cityId: undefined, areaId: undefined }));
      setAreas([]);
    }
  }, [filters.stateId]);

  useEffect(() => {
    if (filters.cityId) {
      locationAPI.getAreas(filters.cityId, 0, 1000).then(setAreas).catch(console.error);
      setFilters((prev) => ({ ...prev, areaId: undefined }));
    }
  }, [filters.cityId]);

  const fetchFilterData = async () => {
    try {
      const [typesData, categoriesData, countriesData] = await Promise.all([
        jobAPI.getJobTypes(0, 1000),
        jobAPI.getJobCategories(0, 1000),
        locationAPI.getCountries(0, 1000),
      ]);
      setJobTypes(typesData);
      setJobCategories(categoriesData);
      setCountries(countriesData);
      
      // Set default country to India if no country is selected
      const india = countriesData.find((c: any) => c.name.toLowerCase() === 'india');
      if (india && !filters.countryId && !initialFilters?.countryId) {
        const newFilters = { ...filters, countryId: india.id };
        setFilters(newFilters);
        onFilterChange(newFilters);
        // Load states for India
        locationAPI.getStates(india.id, 0, 1000).then(setStates).catch(console.error);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
    setStates([]);
    setCities([]);
    setAreas([]);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== null && value !== '');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-4 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          <FaFilter color="white" size={18} />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-white hover:text-gray-200 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <FaTimes size={12} />
            Clear All
          </button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {/* Job Type Filter */}
        <div className="border border-gray-200 rounded-lg overflow-visible">
          <button
            onClick={() => toggleSection('jobType')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FaBriefcase color="#115e59" size={16} />
              <span className="text-sm font-semibold text-gray-900">Job Type</span>
            </div>
            {expandedSections.jobType ? (
              <FaChevronUp color="#6b7280" size={14} />
            ) : (
              <FaChevronDown color="#6b7280" size={14} />
            )}
          </button>
          {expandedSections.jobType && (
            <div className="px-3 pb-3 pt-1 bg-gray-50">
              <select
                value={filters.jobTypeId || ''}
                onChange={(e) => updateFilter('jobTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full h-11 input-field text-sm leading-5 border-gray-300 focus:border-brand-500 focus:ring-brand-500"
              >
                <option value="">All Job Types</option>
                {jobTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Job Category Filter */}
        <div className="border border-gray-200 rounded-lg overflow-visible">
          <button
            onClick={() => toggleSection('jobCategory')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FaTags color="#115e59" size={16} />
              <span className="text-sm font-semibold text-gray-900">Job Category</span>
            </div>
            {expandedSections.jobCategory ? (
              <FaChevronUp color="#6b7280" size={14} />
            ) : (
              <FaChevronDown color="#6b7280" size={14} />
            )}
          </button>
          {expandedSections.jobCategory && (
            <div className="px-3 pb-3 pt-1 bg-gray-50">
              <select
                value={filters.jobCategoryId || ''}
                onChange={(e) => updateFilter('jobCategoryId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full h-11 input-field text-sm leading-5 border-gray-300 focus:border-brand-500 focus:ring-brand-500"
              >
                <option value="">All Categories</option>
                {jobCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Location Filter */}
        <div className="border border-gray-200 rounded-lg overflow-visible">
          <button
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt color="#115e59" size={16} />
              <span className="text-sm font-semibold text-gray-900">Location</span>
            </div>
            {expandedSections.location ? (
              <FaChevronUp color="#6b7280" size={14} />
            ) : (
              <FaChevronDown color="#6b7280" size={14} />
            )}
          </button>
          {expandedSections.location && (
            <div className="px-3 pb-3 pt-1 bg-gray-50 space-y-3">
              {/* Near Me Button */}
              <div>
                <button
                  onClick={async () => {
                    if (!useNearMe && userLocation) {
                      setUseNearMe(true);
                      // Clear location filters when using near me
                      const newFilters = { ...filters };
                      delete newFilters.countryId;
                      delete newFilters.stateId;
                      delete newFilters.cityId;
                      delete newFilters.areaId;
                      setFilters(newFilters);
                      onFilterChange(newFilters);
                    } else {
                      setUseNearMe(false);
                    }
                  }}
                  disabled={locationLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    useNearMe
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white border-2 border-brand-500 text-brand-700 hover:bg-brand-50'
                  } ${locationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {locationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600"></div>
                      <span>Detecting location...</span>
                    </>
                  ) : (
                    <>
                      <FaCrosshairs size={14} />
                      <span>{useNearMe ? 'Using My Location' : 'Find Jobs Near Me'}</span>
                    </>
                  )}
                </button>
                {useNearMe && userLocation && (
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Showing jobs near {userLocation.city || 'your location'}
                  </p>
                )}
              </div>
              
              {/* Rest of location filters */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Country</label>
                <SearchableSelect
                  options={countries.map((country) => ({ id: country.id, name: country.name }))}
                  value={filters.countryId || null}
                  onChange={(value) => updateFilter('countryId', value || undefined)}
                  placeholder="Search and select country..."
                />
              </div>
              {filters.countryId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">State</label>
                  <SearchableSelect
                    options={states.map((state) => ({ id: state.id, name: state.name }))}
                    value={filters.stateId || null}
                    onChange={(value) => updateFilter('stateId', value || undefined)}
                    placeholder="Search and select state..."
                  />
                </div>
              )}
              {filters.stateId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">City</label>
                  <SearchableSelect
                    options={cities.map((city) => ({ id: city.id, name: city.name }))}
                    value={filters.cityId || null}
                    onChange={(value) => updateFilter('cityId', value || undefined)}
                    placeholder="Search and select city..."
                  />
                </div>
              )}
              {filters.cityId && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Area</label>
                  <SearchableSelect
                    options={areas.map((area) => ({ id: area.id, name: area.name }))}
                    value={filters.areaId || null}
                    onChange={(value) => updateFilter('areaId', value || undefined)}
                    placeholder="Search and select area..."
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Salary Filter */}
        <div className="border border-gray-200 rounded-lg overflow-visible">
          <button
            onClick={() => toggleSection('salary')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FaRupeeSign color="#115e59" size={16} />
              <span className="text-sm font-semibold text-gray-900">Salary (₹)</span>
            </div>
            {expandedSections.salary ? (
              <FaChevronUp color="#6b7280" size={14} />
            ) : (
              <FaChevronDown color="#6b7280" size={14} />
            )}
          </button>
          {expandedSections.salary && (
            <div className="px-3 pb-3 pt-1 bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Min (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.salaryMin || ''}
                    onChange={(e) => updateFilter('salaryMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full h-11 input-field text-sm leading-5 border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Max (₹)</label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.salaryMax || ''}
                    onChange={(e) => updateFilter('salaryMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full h-11 input-field text-sm leading-5 border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '0-20k', min: 0, max: 20000 },
                  { label: '20k-40k', min: 20000, max: 40000 },
                  { label: '40k-60k', min: 40000, max: 60000 },
                  { label: '60k-1L', min: 60000, max: 100000 },
                  { label: '1L+', min: 100000, max: undefined },
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => {
                      updateFilter('salaryMin', range.min);
                      updateFilter('salaryMax', range.max);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      filters.salaryMin === range.min && filters.salaryMax === range.max
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-brand-400 hover:text-brand-700'
                    }`}
                  >
                    ₹{range.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Experience Filter */}
        <div className="border border-gray-200 rounded-lg overflow-visible">
          <button
            onClick={() => toggleSection('experience')}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FaUserTie color="#115e59" size={16} />
              <span className="text-sm font-semibold text-gray-900">Experience</span>
            </div>
            {expandedSections.experience ? (
              <FaChevronUp color="#6b7280" size={14} />
            ) : (
              <FaChevronDown color="#6b7280" size={14} />
            )}
          </button>
          {expandedSections.experience && (
            <div className="px-3 pb-3 pt-1 bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Min (Years)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.experienceMin || ''}
                    onChange={(e) => updateFilter('experienceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full h-11 input-field text-sm leading-5 border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Max (Years)</label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.experienceMax || ''}
                    onChange={(e) => updateFilter('experienceMax', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full h-11 input-field text-sm leading-5 border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '0-1', min: 0, max: 1 },
                  { label: '1-3', min: 1, max: 3 },
                  { label: '3-5', min: 3, max: 5 },
                  { label: '5-10', min: 5, max: 10 },
                  { label: '10+', min: 10, max: undefined },
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => {
                      updateFilter('experienceMin', range.min);
                      updateFilter('experienceMax', range.max);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      filters.experienceMin === range.min && filters.experienceMax === range.max
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-brand-400 hover:text-brand-700'
                    }`}
                  >
                    {range.label} {range.max ? 'years' : '+'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Featured Jobs Filter */}
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.isFeatured === true}
              onChange={(e) => updateFilter('isFeatured', e.target.checked ? true : undefined)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <div className="flex items-center gap-2 ml-3">
              <FaStar color={filters.isFeatured ? "#fbbf24" : "#9ca3af"} size={14} />
              <span className={`text-sm font-medium ${filters.isFeatured ? 'text-gray-900' : 'text-gray-700'}`}>
                Featured Jobs Only
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
