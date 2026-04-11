'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function PersonaInterview({ onComplete, getAuthToken }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    startInterview();
  }, []);

  const startInterview = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const res = await fetch('/api/onboarding/interview/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start interview');
      }

      const data = await res.json();
      setCurrentQuestion(data.currentQuestion);
      setTotalQuestions(data.questionsCount);
      setProgress(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const res = await fetch('/api/onboarding/interview/answer', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: answer.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit answer');
      }

      const data = await res.json();

      if (data.interviewComplete) {
        onComplete();
      } else {
        setCurrentQuestion(data.nextQuestion);
        setProgress(data.progress.percentage);
        setAnswer('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitAnswer();
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-black dark:text-white" />
          <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
          <p className="text-sm font-semibold text-black dark:text-white">
            {Math.round(progress)}%
          </p>
        </div>
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-gradient-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="bg-gray-100 dark:bg-[#1E1E1E] rounded-2xl p-6 mb-6">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
            Question {Math.round(progress / (100 / totalQuestions))} of {totalQuestions}
          </p>
          <h2 className="text-xl font-sora font-bold text-black dark:text-white">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answer Input */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentQuestion.placeholder || 'Type your answer here...'}
          className="w-full h-32 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-white focus:ring-0 resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Press Ctrl+Enter to submit, or click the button below
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={submitAnswer}
        disabled={loading || !answer.trim()}
        className="w-full px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold text-lg hover:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          'Next Question'
        )}
      </button>
    </div>
  );
}
