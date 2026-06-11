'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import HeaderSearchBar from '@/components/HeaderSearchBar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-brand-800 shadow-lg border-b border-brand-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Logo, Search Bar, and Menu */}
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center h-full">
              <div className="h-14 w-auto flex items-center">
                <Image
                  src="/uploads/navbar.png"
                  alt="Workspa Logo"
                  width={200}
                  height={56}
                  className="h-full w-auto object-contain"
                  priority
                  unoptimized
                />
              </div>
            </Link>
          </div>

          {/* Search Bar - Inline in navbar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <HeaderSearchBar />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-1 flex-shrink-0">
            <Link href="/jobs" className="text-white/90 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Search Jobs
            </Link>
            <Link href="/spa-near-me" className="text-white/90 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              SPAs Near Me
            </Link>
            <Link href="/blog" className="text-white/90 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Blog
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-white/90 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  My Dashboard
                </Link>
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-700 font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-white font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-white/80 hover:text-white px-3 py-1 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link href="/login" className="text-white/90 hover:text-white px-4 py-2 text-sm font-medium">
                  Login
                </Link>
                <Link href="/register" className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-md">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-white/80 p-2"
            >
              {mobileMenuOpen ? (
                <div className="text-white">
                  <FaTimes size={24} />
                </div>
              ) : (
                <div className="text-white">
                  <FaBars size={24} />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-2">
          <HeaderSearchBar />
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 space-y-1 animate-in slide-in-from-top duration-200">
            <Link 
              href="/jobs" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white rounded-md font-medium transition-colors active:bg-white/20"
            >
              Search Jobs
            </Link>
            <Link 
              href="/spa-near-me" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white rounded-md font-medium transition-colors active:bg-white/20"
            >
              SPAs Near Me
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white rounded-md font-medium transition-colors active:bg-white/20"
            >
              Blog
            </Link>
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white rounded-md font-medium transition-colors active:bg-white/20"
                >
                  My Dashboard
                </Link>
                <div className="px-4 py-3 border-t border-white/20 mt-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-700 font-semibold text-base">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{user.name}</p>
                      <p className="text-xs text-white/70">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }} 
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 border-t border-white/20 mt-2 space-y-2">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center text-white/90 hover:bg-white/10 py-3 rounded-lg font-medium transition-colors active:bg-white/20 border border-white/20"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-lg font-semibold transition-colors active:bg-gold-600 shadow-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

