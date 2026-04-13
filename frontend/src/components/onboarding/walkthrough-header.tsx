'use client';

import { ChevronRight } from 'lucide-react';

interface WalkthroughHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  description?: string;
}

export function WalkthroughHeader({
  currentStep,
  totalSteps,
  stepName,
  description,
}: WalkthroughHeaderProps) {
  return (
    <div className="mb-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-blue-600">
          STEP {currentStep} OF {totalSteps}
        </span>
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-600 mb-6">
        <span className="text-xs">Get Started</span>
        {Array.from({ length: currentStep }).map((_, i) => (
          <span key={i}>
            <ChevronRight className="w-3 h-3 inline" />
            <span className="text-xs ml-1">{i + 1}</span>
          </span>
        ))}
      </div>

      {/* Title and description */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
        {stepName}
      </h1>
      {description && (
        <p className="text-lg text-gray-600">{description}</p>
      )}
    </div>
  );
}
