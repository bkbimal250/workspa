'use client';

import { ReactNode } from 'react';
import { JobCreateStep } from './types';

const steps: Array<{ number: JobCreateStep; title: string; description: string }> = [
  { number: 1, title: 'Job Basics', description: 'Business, role, and type' },
  { number: 2, title: 'Role & Location', description: 'Description and search area' },
  { number: 3, title: 'Pay & Publish', description: 'Salary, contact, and SEO' },
];

type JobFormWizardProps = {
  children: ReactNode;
  currentStep: JobCreateStep;
  onStepChange?: (step: JobCreateStep) => void;
};

export default function JobFormWizard({ children, currentStep, onStepChange }: JobFormWizardProps) {
  return (
    <div className="w-full">
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isComplete = currentStep > step.number;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => onStepChange?.(step.number)}
              className={`rounded-lg border p-4 text-left transition-all ${
                isActive || isComplete
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    isActive || isComplete ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.number}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{step.title}</span>
                  <span className="block text-xs">{step.description}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8">{children}</div>
    </div>
  );
}
