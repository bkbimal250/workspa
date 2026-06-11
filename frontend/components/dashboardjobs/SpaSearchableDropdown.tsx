'use client';

import { useEffect, useRef, useState } from 'react';
import { Spa } from '@/lib/spa';

type SpaSearchableDropdownProps = {
  disabled?: boolean;
  error?: string;
  onChange: (spaId: string) => void;
  required?: boolean;
  spas: Spa[];
  value: string;
};

export default function SpaSearchableDropdown({
  disabled = false,
  error,
  onChange,
  required = false,
  spas,
  value,
}: SpaSearchableDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedSpa = spas.find((spa) => spa.id.toString() === value);

  useEffect(() => {
    if (selectedSpa) {
      setSearchTerm(selectedSpa.name);
    }
  }, [selectedSpa]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSpas = spas.filter((spa) =>
    spa.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (disabled && selectedSpa) {
    return (
      <div>
        <input
          type="text"
          value={selectedSpa.name}
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700"
        />
        <input type="hidden" name="spa_id" value={value} />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={(event) => {
          setSearchTerm(event.target.value);
          setShowDropdown(true);
          if (!event.target.value) {
            onChange('');
          }
        }}
        onFocus={() => setShowDropdown(true)}
        className={`w-full rounded-lg border px-4 py-3 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'cursor-not-allowed bg-gray-50' : 'bg-white'}`}
        placeholder={selectedSpa?.name || 'Search and select SPA...'}
        required={required}
        disabled={disabled}
      />

      {showDropdown && !disabled && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-xl">
          {filteredSpas.length > 0 ? (
            filteredSpas.map((spa) => (
              <button
                key={spa.id}
                type="button"
                onClick={() => {
                  onChange(spa.id.toString());
                  setSearchTerm(spa.name);
                  setShowDropdown(false);
                }}
                className={`block w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-blue-50 ${
                  value === spa.id.toString() ? 'bg-blue-50' : ''
                }`}
              >
                <span className="block font-medium text-gray-900">{spa.name}</span>
                {spa.address && <span className="mt-0.5 block text-sm text-gray-500">{spa.address}</span>}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-sm text-gray-500">No SPAs found</div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <input type="hidden" name="spa_id" value={value} />
    </div>
  );
}
