'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wand2, ArrowLeft, Check, Loader2, Zap, Download } from 'lucide-react';
import { toast } from 'sonner';

interface InterviewAnswer {
  question: string;
  answer: string;
}

interface PersonaData {
  brandVoiceSummary: string;
  contentPillars: string[];
}

const INTERVIEW_QUESTIONS = [
  "What is your name and what do you do?",
  "What problem do you solve for your audience?",
  "What makes your approach unique compared to competitors?",
  "What are your core values and beliefs?",
  "What topics are you most passionate about?",
  "How do you prefer to communicate (formal, casual, humorous)?",
  "What does success look like for your work?",
  "Who is your ideal audience or customer?",
  "What's a recent win or achievement you're proud of?",
  "What are your top 3 pieces of advice?",
  "How do you want people to feel after reading your content?",
  "What's your long-term vision or goal?",
];

export default function PersonaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: interview, 2: posts, 3: generating, 4: results
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<InterviewAnswer[]>(
    INTERVIEW_QUESTIONS.map((q) => ({ question: q, answer: '' }))
  );
  const [postSamples, setPostSamples] = useState<string[]>(['', '', '']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [auditStatus, setAuditStatus] = useState<{ locked: boolean; authorizedAt: string | null; canRun: boolean } | null>(null);

  // Check if user already has a persona and fetch posts from social accounts
  useEffect(() => {
    const initPage = async () => {
      try {
        const res = await fetch('/api/personas');
        if (res.ok) {
          const data = await res.json();
          if (data && data.personaData) {
            setPersona(data.personaData as PersonaData);
            if (data.auditStatus) {
              setAuditStatus(data.auditStatus);
            }
            setStep(4);
          }
        }
      } catch (error) {
        console.error('Error checking persona:', error);
      }

      // Auto-fetch posts from connected social accounts
      try {
        const postsRes = await fetch('/api/personas/posts');
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          if (postsData.posts && postsData.posts.length > 0) {
            // Pre-fill the post samples with fetched posts
            const filledPosts = postsData.posts.slice(0, 3);
            const newPosts = [...postSamples];
            filledPosts.forEach((post, index) => {
              if (index < 3) newPosts[index] = post;
            });
            setPostSamples(newPosts);
          }
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    initPage();
  }, []);

  const handleInterviewChange = (index: number, value: string) => {
    const newAnswers = [...interviewAnswers];
    newAnswers[index].answer = value;
    setInterviewAnswers(newAnswers);
  };

  const handlePostChange = (index: number, value: string) => {
    const newPosts = [...postSamples];
    newPosts[index] = value;
    setPostSamples(newPosts);
  };

  const handleFetchPosts = async () => {
    setIsFetchingPosts(true);
    try {
      const res = await fetch('/api/personas/posts');
      if (res.ok) {
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          const filledPosts = data.posts.slice(0, 3);
          const newPosts = [...postSamples];
          filledPosts.forEach((post, index) => {
            if (index < 3) newPosts[index] = post;
          });
          setPostSamples(newPosts);
          toast.success(`Fetched ${filledPosts.length} post(s) from your connected accounts`);
        } else {
          toast.info('No posts found. Try connecting your social accounts first.');
        }
      } else {
        toast.error('Failed to fetch posts');
      }
    } catch (error) {
      toast.error('Error fetching posts from social accounts');
      console.error(error);
    } finally {
      setIsFetchingPosts(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate interview
      const allAnswered = interviewAnswers.every((a) => a.answer.trim().length > 0);
      if (!allAnswered) {
        toast.error('Please answer all interview questions');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      generatePersona();
    }
  };

  const generatePersona = async () => {
    setIsGenerating(true);
    setStep(3);
    try {
      const filledPosts = postSamples.filter((p) => p.trim().length > 0);
      const res = await fetch('/api/personas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewAnswers,
          postSamples: filledPosts.length > 0 ? filledPosts : undefined,
        }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to generate persona';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch (e) {
          // If response isn't JSON, use default message
        }
        throw new Error(errorMsg);
      }

      const generatedPersona = await res.json();
      if (!generatedPersona.brandVoiceSummary || !generatedPersona.contentPillars) {
        throw new Error('Invalid persona generated - missing required fields');
      }
      setPersona(generatedPersona);
      setStep(4);
    } catch (error: any) {
      console.error('Persona generation error:', error);
      toast.error(error.message || 'Failed to generate persona');
      setStep(2);
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!persona) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaData: persona }),
      });

      if (!res.ok) throw new Error('Failed to save persona');

      toast.success('Persona saved successfully!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save persona');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your AI Persona</h1>
          <p className="text-gray-600">
            Let's analyze your communication style and create a persona that captures your voice
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Audit Locked */}
        {auditStatus?.locked && step !== 4 && (
          <Card className="border-red-200 bg-red-50 mb-8">
            <CardHeader>
              <CardTitle className="text-red-900">Persona Audit Locked</CardTitle>
              <CardDescription className="text-red-800">
                Your persona audit has already been used. Contact your administrator to authorize another audit run.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800">
                Once your admin authorizes it, you'll be able to run the audit again.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Audit Authorized (waiting for user to run) */}
        {auditStatus?.authorizedAt && !auditStatus?.locked && step !== 4 && (
          <Card className="border-yellow-200 bg-yellow-50 mb-8">
            <CardHeader>
              <CardTitle className="text-yellow-900">Audit Re-authorized by Admin</CardTitle>
              <CardDescription className="text-yellow-800">
                Your administrator has authorized one more persona audit. Complete the form below to regenerate.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Step 1: Interview */}
        {step === 1 && !auditStatus?.locked && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Brand Interview</CardTitle>
              <CardDescription>Answer these 12 questions to help us understand your voice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {interviewAnswers.map((item, index) => (
                <div key={index}>
                  <Label className="font-medium text-gray-900">{item.question}</Label>
                  <Textarea
                    value={item.answer}
                    onChange={(e) => handleInterviewChange(index, e.target.value)}
                    placeholder="Your answer..."
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              ))}
              <div className="pt-4">
                <Button onClick={handleNext} className="w-full">
                  Continue to Next Step
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Post Samples */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Step 2: Recent Posts (Optional)</CardTitle>
                  <CardDescription>
                    Add up to 3 recent posts to help train the persona. You can skip this if you prefer.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFetchPosts}
                  disabled={isFetchingPosts}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isFetchingPosts ? 'Fetching...' : 'Auto-fetch from Social'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {postSamples.map((post, index) => (
                <div key={index}>
                  <Label className="font-medium text-gray-900">Post {index + 1}</Label>
                  <Textarea
                    value={post}
                    onChange={(e) => handlePostChange(index, e.target.value)}
                    placeholder="Paste a recent post here..."
                    className="mt-2 min-h-[80px]"
                  />
                </div>
              ))}
              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Persona
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Generating */}
        {step === 3 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-lg font-medium text-gray-900">Generating your persona...</p>
              <p className="text-gray-600 mt-2">This may take a moment</p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === 4 && persona && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <CardTitle>Your AI Persona</CardTitle>
                </div>
                <CardDescription>Here's your personalized brand voice summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="font-medium text-gray-900 mb-2 block">Brand Voice Summary</Label>
                  <p className="text-gray-700 leading-relaxed">{persona.brandVoiceSummary}</p>
                </div>

                <div>
                  <Label className="font-medium text-gray-900 mb-3 block">Content Pillars</Label>
                  <div className="flex flex-wrap gap-2">
                    {persona.contentPillars.map((pillar, index) => (
                      <Badge key={index} variant="default" className="px-3 py-1">
                        {pillar}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setPersona(null);
                      setInterviewAnswers(INTERVIEW_QUESTIONS.map((q) => ({ question: q, answer: '' })));
                    }}
                    className="flex-1"
                  >
                    Start Over
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save & Continue
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
