import { SpaCreateStep } from './types';

const steps: Array<{ id: SpaCreateStep; label: string }> = [
  { id: 1, label: 'Basic Information' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Details & Media' },
];

type SpaFormProgressProps = {
  currentStep: SpaCreateStep;
};

export default function SpaFormProgress({ currentStep }: SpaFormProgressProps) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {steps.map((item) => {
          const isActive = currentStep === item.id;
          const isComplete = currentStep > item.id;

          return (
            <div
              key={item.id}
              className={`flex items-center rounded-md border px-4 py-3 ${
                isActive || isComplete
                  ? 'border-primary-200 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              <span
                className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive || isComplete
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {item.id}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
