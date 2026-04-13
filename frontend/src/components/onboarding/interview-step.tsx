'use client';

import { useState } from 'react';
import { InterviewData } from '@/lib/supabase';

interface InterviewStepProps {
  onComplete: (answers: Partial<InterviewData>) => void;
  initialData?: Partial<InterviewData>;
  onProgress?: (progress: number) => void;
}

const INTERVIEW_QUESTIONS = [
  {
    key: 'businessDescription',
    question: 'What does your business do and who does it serve?',
    placeholder: 'Tell us about your business and your target audience...',
  },
  {
    key: 'problemsSolved',
    question: 'What problems do you solve for your customers?',
    placeholder: 'Describe the main challenges you help your customers overcome...',
  },
  {
    key: 'brandPersonality',
    question:
      'What is your brand personality? (e.g., fun, professional, inspirational, educational)',
    placeholder: 'Think about how you want people to perceive your brand...',
  },
  {
    key: 'toneOfVoice',
    question: 'What tone do you want for your social media? (e.g., formal, casual, conversational)',
    placeholder: 'How do you want to sound when you communicate with your audience?...',
  },
  {
    key: 'topicsToPostAbout',
    question: 'What topics do you want to post about?',
    placeholder: 'List the main topics you plan to cover in your posts...',
  },
  {
    key: 'topicsToAvoid',
    question: 'Are there any topics you want to avoid?',
    placeholder: 'List any topics that are off-limits for your brand...',
  },
  {
    key: 'achievements',
    question: 'What achievements or results are you proud of and want to share?',
    placeholder: 'Share your biggest wins and milestones...',
  },
  {
    key: 'phraseFrequency',
    question: 'Are there any phrases or words you use frequently?',
    placeholder: 'What are your go-to phrases or catchphrases?...',
  },
  {
    key: 'phrasesToAvoid',
    question: 'Are there any phrases or words you want to avoid?',
    placeholder: 'List any clichés or phrases that don\'t fit your brand...',
  },
  {
    key: 'idealCustomer',
    question: 'Who is your ideal customer?',
    placeholder: 'Describe your perfect customer in detail...',
  },
  {
    key: 'platformsActive',
    question:
      'What social media platforms are you active on? (facebook, instagram, linkedin, twitter, etc)',
    placeholder: 'List all platforms where you post content...',
  },
  {
    key: 'businessGoals',
    question: 'What do you want social media to do for your business? (leads, awareness, authority, etc)',
    placeholder: 'Explain what success looks like for your social media presence...',
  },
];

export function InterviewStep({
  onComplete,
  initialData = {},
  onProgress,
}: InterviewStepProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<InterviewData>>(initialData);
  const [currentInput, setCurrentInput] = useState(
    (initialData[INTERVIEW_QUESTIONS[currentQuestion].key as keyof InterviewData] as string) || ''
  );

  const handleNext = () => {
    const key = INTERVIEW_QUESTIONS[currentQuestion].key as keyof InterviewData;
    const updatedAnswers = {
      ...answers,
      [key]: currentInput,
    };
    setAnswers(updatedAnswers);

    if (currentQuestion < INTERVIEW_QUESTIONS.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setCurrentInput(
        (updatedAnswers[INTERVIEW_QUESTIONS[nextQuestion].key as keyof InterviewData] as string) || ''
      );
      onProgress?.((nextQuestion / INTERVIEW_QUESTIONS.length) * 100);
    } else {
      onComplete(updatedAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const key = INTERVIEW_QUESTIONS[currentQuestion].key as keyof InterviewData;
      setAnswers({
        ...answers,
        [key]: currentInput,
      });

      const prevQuestion = currentQuestion - 1;
      setCurrentQuestion(prevQuestion);
      setCurrentInput(
        (answers[INTERVIEW_QUESTIONS[prevQuestion].key as keyof InterviewData] as string) || ''
      );
      onProgress?.((prevQuestion / INTERVIEW_QUESTIONS.length) * 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleNext();
    }
  };

  const progress = ((currentQuestion + 1) / INTERVIEW_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700">
              Question {currentQuestion + 1} of {INTERVIEW_QUESTIONS.length}
            </h2>
            <span className="text-xs sm:text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            {INTERVIEW_QUESTIONS[currentQuestion].question}
          </h1>

          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={INTERVIEW_QUESTIONS[currentQuestion].placeholder}
            className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
            rows={6}
            autoFocus
          />

          <p className="text-xs text-gray-500 mt-2">Ctrl+Enter to continue</p>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            ← Previous
          </button>

          <button
            onClick={handleNext}
            className="px-4 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            {currentQuestion === INTERVIEW_QUESTIONS.length - 1 ? 'Complete Interview' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
