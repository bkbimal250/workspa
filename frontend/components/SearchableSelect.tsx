'use client';

import { useState, useEffect, useRef } from 'react';

interface Option {
  id: number;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    if (value && options.length > 0) {
      const selected = options.find((opt) => opt.id === value);
      if (selected) {
        setSearchTerm(selected.name);
      }
    } else {
      setSearchTerm('');
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setDropdownSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setDropdownSearchTerm('');
    }
  }, [showDropdown]);

  const filteredOptions = dropdownSearchTerm
    ? options.filter((option) =>
        option.name.toLowerCase().includes(dropdownSearchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setSearchTerm(option.name);
    setShowDropdown(false);
    setDropdownSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
    setDropdownSearchTerm('');
  };

  const handleButtonClick = () => {
    if (!disabled) {
      setShowDropdown(!showDropdown);
    }
  };

  if (disabled && selectedOption) {
    return (
      <input
        type="text"
        value={selectedOption.name}
        disabled
        className={`w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed text-sm ${className}`}
      />
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Button/Input to trigger dropdown */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className={`w-full h-11 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm text-left flex items-center justify-between gap-2 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
        }`}
        disabled={disabled}
      >
        <span className={`min-w-0 flex-1 truncate leading-5 ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {value ? selectedOption?.name : placeholder}
        </span>
        <div className="flex flex-shrink-0 items-center gap-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown with search */}
      {showDropdown && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 flex flex-col">
          {/* Search input inside dropdown */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={dropdownSearchTerm}
                onChange={(e) => setDropdownSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <svg
                className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No options found</div>
            ) : (
              <ul className="py-1">
                {filteredOptions.map((option) => (
                  <li
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-brand-50 transition-colors ${
                      value === option.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
