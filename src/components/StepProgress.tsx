import React from 'react';
import { Check, Layers, Calculator, CreditCard } from 'lucide-react';

interface StepProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  maxAccessibleStep: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  onStepClick,
  maxAccessibleStep,
}) => {
  const steps = [
    { number: 1, title: 'Step 1', label: 'Service', icon: Layers },
    { number: 2, title: 'Step 2', label: 'Volume', icon: Calculator },
    { number: 3, title: 'Step 3', label: 'Payment', icon: CreditCard },
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2">
      <div className="relative flex items-center justify-between">
        {/* Progress connecting line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-gray-200 dark:bg-neutral-700 -z-0 rounded-full">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = step.number <= maxAccessibleStep && onStepClick;
          const Icon = step.icon;

          return (
            <button
              key={step.number}
              id={`step-indicator-${step.number}`}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.number)}
              className={`relative z-10 flex flex-col items-center group transition-all duration-200 ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-xs ${
                  isCompleted
                    ? 'bg-blue-600 dark:bg-blue-500 text-white ring-2 ring-blue-100 dark:ring-blue-950'
                    : isCurrent
                    ? 'bg-blue-600 dark:bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950 scale-105'
                    : 'bg-white dark:bg-neutral-800 border-2 border-gray-300 dark:border-neutral-600 text-gray-400 dark:text-neutral-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              <div className="mt-1.5 text-center">
                <span
                  className={`block text-[11px] font-bold tracking-tight ${
                    isCurrent
                      ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                      : isCompleted
                      ? 'text-gray-800 dark:text-neutral-200'
                      : 'text-gray-400 dark:text-neutral-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
