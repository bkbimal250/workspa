/**
 * Message form component for sending free messages about jobs
 */

'use client'

import { useState } from 'react';
import { messageAPI, MessageCreate } from '@/lib/message';
import { FaEnvelope, FaUser, FaPhone, FaComment, FaTimes } from 'react-icons/fa';

interface MessageFormProps {
  jobId: number;
  jobTitle?: string;
  onSuccess?: () => void;
  isPopup?: boolean;
  onClose?: () => void;
}

export default function MessageForm({ jobId, jobTitle, onSuccess, isPopup = false, onClose }: MessageFormProps) {
  const [formData, setFormData] = useState<MessageCreate>({
    job_id: jobId,
    sender_name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');


  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');

    // Limit to 10 digits
    const limitedDigits = digitsOnly.slice(0, 10);

    setFormData({ ...formData, phone: limitedDigits });

    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };
  const handleEmailChange = (value: string) => {
    const trimmed = value.trimStart(); // allow typing, prevent leading space
    setFormData({ ...formData, email: trimmed });

    if (trimmed && !validateEmail(trimmed)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };



  const validatePhone = (phone: string): boolean => {
    // Check if phone is exactly 10 digits
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const validateEmail = (email: string) => {
    // If empty, it’s valid (optional)
    if (!email) return true;

    // Regex for validating email
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPhoneError('');
    setLoading(true);

    // Validate phone
    if (!validatePhone(formData.phone)) {
      setPhoneError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    // Validate email (optional, but must be correct if entered)
    const validateEmail = (email: string) => {
      if (!email) return true;

      const trimmedEmail = email.trim();
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      return regex.test(trimmedEmail);
    };



    try {
      const dataToSend = {
        ...formData,
        email: formData.email?.trim() || undefined, // Send undefined if blank
      };

      await messageAPI.createMessage(dataToSend);

      setSuccess(true);
      setPhoneError('');
      setFormData({
        job_id: jobId,
        sender_name: '',
        phone: '',
        email: '',
        message: '',
      });

      if (onSuccess) onSuccess();

      if (isPopup && onClose) {
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        setTimeout(() => setSuccess(false), 3000);
      }

    } catch (err: any) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <div className="text-green-600">
            <FaEnvelope />
          </div>
          <p className="font-semibold">Message sent successfully!</p>
        </div>
        <p className="text-sm text-green-600 mt-1">
          Your inquiry has been sent. We'll get back to you soon.
        </p>
      </div>
    );
  }

  // Popup wrapper
  if (isPopup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label="Close popup"
          >
            <FaTimes size={20} />
          </button>

          <div className="mb-4 pr-8">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaEnvelope className="text-brand-600" size={20} />
              Apply for {jobTitle}
            </h3>

          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="popup_sender_name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" size={16} />
                </div>
                <input
                  id="popup_sender_name"
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Enter your full name"
                  value={formData.sender_name}
                  onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="popup_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number * <span className="text-gray-500 text-xs">(10 digits)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400" size={16} />
                </div>
                <input
                  id="popup_phone"
                  type="tel"
                  required
                  maxLength={10}
                  className={`w-full rounded-lg border px-4 py-2 pl-10 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${phoneError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter 10 digit phone number"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
              </div>
              {phoneError && (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              )}
              {formData.phone && !phoneError && (
                <p className="mt-1 text-xs text-gray-500">
                  {formData.phone.length}/10 digits
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  className={`w-full rounded-lg border px-4 py-2 pl-10 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter your email (optional)"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                />
              </div>
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
            </div>


            <div>
              <label htmlFor="popup_message" className="block text-sm font-medium text-gray-700 mb-1">
                Your Message *
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FaComment className="text-gray-400" size={16} />
                </div>
                <textarea
                  id="popup_message"
                  required
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 pt-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                  placeholder="Ask about the job, working hours, salary details, or any other questions..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FaEnvelope />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-center text-gray-500">
              No account required. Your message will be reviewed by the admin/manager.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Regular (non-popup) form
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FaEnvelope className="text-brand-600" size={20} />
          Send a Free Message
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Have a question about this job? Send a message without creating an account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="sender_name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="text-gray-400" size={16} />
            </div>
            <input
              id="sender_name"
              type="text"
              required
              className="input-field pl-10"
              placeholder="Enter your full name"
              value={formData.sender_name}
              onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number * <span className="text-gray-500 text-xs">(10 digits)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaPhone className="text-gray-400" size={16} />
            </div>
            <input
              id="phone"
              type="tel"
              required
              maxLength={10}
              className={`input-field pl-10 ${phoneError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              placeholder="Enter 10 digit phone number"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
          </div>
          {phoneError && (
            <p className="mt-1 text-sm text-red-600">{phoneError}</p>
          )}
          {formData.phone && !phoneError && (
            <p className="mt-1 text-xs text-gray-500">
              {formData.phone.length}/10 digits
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="text-gray-400" size={16} />
            </div>
            <input
              id="email"
              type="email"
              className={`w-full rounded-lg border px-4 py-2 pl-10 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter your email (optional)"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
          </div>
          {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
        </div>


        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Your Message *
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FaComment className="text-gray-400" size={16} />
            </div>
            <textarea
              id="message"
              required
              rows={4}
              className="input-field pl-10 pt-3"
              placeholder="Ask about the job, working hours, salary details, or any other questions..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <FaEnvelope />
              <span>Send Message</span>
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          No account required. Your message will be reviewed by the admin/manager.
        </p>
      </form>
    </div>
  );
}

