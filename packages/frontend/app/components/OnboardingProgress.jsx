'use client';

import { CheckCircle2, Circle } from 'lucide-react';

export default function OnboardingProgress({ currentStep, totalSteps = 5 }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                isCompleted
                  ? 'bg-gradient-accent'
                  : isActive
                  ? 'bg-gradient-accent ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0A0A0A] ring-[#A855F7]'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {stepNum}
                </span>
              )}
            </div>

            {stepNum < totalSteps && (
              <div className={`w-12 h-1 rounded-full transition-all ${isCompleted ? 'bg-gradient-accent' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
