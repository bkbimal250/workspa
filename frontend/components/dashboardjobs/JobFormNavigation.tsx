'use client';

import { JobCreateStep } from './types';

type JobFormNavigationProps = {
  currentStep: JobCreateStep;
  onNext: () => void;
  onPrevious: () => void;
  submitting: boolean;
};

export default function JobFormNavigation({
  currentStep,
  onNext,
  onPrevious,
  submitting,
}: JobFormNavigationProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-8">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`rounded-lg px-6 py-3 font-semibold transition-all ${
          currentStep === 1
            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Previous
      </button>

      {currentStep === 3 ? (
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Creating Job...' : 'Create Job Posting'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
        >
          Next Step
        </button>
      )}
    </div>
  );
}
