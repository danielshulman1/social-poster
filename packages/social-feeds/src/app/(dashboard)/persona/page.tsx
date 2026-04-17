'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  MAX_REFERENCE_DOCUMENTS,
  REFERENCE_DOCUMENT_ACCEPT,
  REFERENCE_DOCUMENT_KIND_OPTIONS,
  sanitizeReferenceDocuments,
  type PersonaReferenceDocument,
  type ReferenceDocumentKind,
} from '@/lib/persona-reference-documents';

interface InterviewAnswer {
  question: string;
  answer: string;
}

interface SavedReferenceDocument {
  name: string;
  fileType: string;
  kind: ReferenceDocumentKind;
  kindLabel?: string;
  characterCount: number;
  truncated: boolean;
}

interface PersonaData {
  brandVoiceSummary: string;
  contentPillars: string[];
  referenceDocuments?: SavedReferenceDocument[];
}

const INTERVIEW_QUESTIONS = [
  'What is your name and what do you do?',
  'What problem do you solve for your audience?',
  'What makes your approach unique compared to competitors?',
  'What are your core values and beliefs?',
  'What topics are you most passionate about?',
  'How do you prefer to communicate (formal, casual, humorous)?',
  'What does success look like for your work?',
  'Who is your ideal audience or customer?',
  "What's a recent win or achievement you're proud of?",
  'What are your top 3 pieces of advice?',
  'How do you want people to feel after reading your content?',
  "What's your long-term vision or goal?",
];

export default function PersonaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<InterviewAnswer[]>(
    INTERVIEW_QUESTIONS.map((question) => ({ question, answer: '' }))
  );
  const [postSamples, setPostSamples] = useState<string[]>(['', '', '']);
  const [referenceDocuments, setReferenceDocuments] = useState<PersonaReferenceDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [isUploadingReferences, setIsUploadingReferences] = useState(false);
  const [referenceUploadError, setReferenceUploadError] = useState<string | null>(null);
  const [auditStatus, setAuditStatus] = useState<{
    locked: boolean;
    authorizedAt: string | null;
    canRun: boolean;
  } | null>(null);

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

      try {
        const postsRes = await fetch('/api/personas/posts');
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          if (postsData.posts && postsData.posts.length > 0) {
            setPostSamples((currentPosts) => {
              const nextPosts = [...currentPosts];
              postsData.posts.slice(0, 3).forEach((post: string, index: number) => {
                nextPosts[index] = post;
              });
              return nextPosts;
            });
          }
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    initPage();
  }, []);

  const handleInterviewChange = (index: number, value: string) => {
    setInterviewAnswers((currentAnswers) =>
      currentAnswers.map((answer, currentIndex) =>
        currentIndex === index ? { ...answer, answer: value } : answer
      )
    );
  };

  const handlePostChange = (index: number, value: string) => {
    setPostSamples((currentPosts) =>
      currentPosts.map((post, currentIndex) => (currentIndex === index ? value : post))
    );
  };

  const handleReferenceDocumentKindChange = (
    name: string,
    kind: ReferenceDocumentKind
  ) => {
    setReferenceDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.name === name ? { ...document, kind } : document
      )
    );
  };

  const handleRemoveReferenceDocument = (name: string) => {
    setReferenceDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document.name !== name)
    );
  };

  const handleReferenceFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (referenceDocuments.length + files.length > MAX_REFERENCE_DOCUMENTS) {
      const message = `You can keep up to ${MAX_REFERENCE_DOCUMENTS} reference files in the persona builder.`;
      setReferenceUploadError(message);
      toast.error(message);
      event.target.value = '';
      return;
    }

    setIsUploadingReferences(true);
    setReferenceUploadError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/personas/reference-files', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload reference files');
      }

      const uploadedDocuments = sanitizeReferenceDocuments(data.documents);

      setReferenceDocuments((currentDocuments) => {
        const merged = [...currentDocuments];

        uploadedDocuments.forEach((document) => {
          const existingIndex = merged.findIndex(
            (currentDocument) => currentDocument.name === document.name
          );

          if (existingIndex >= 0) {
            merged[existingIndex] = document;
          } else {
            merged.push(document);
          }
        });

        return merged.slice(0, MAX_REFERENCE_DOCUMENTS);
      });

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const message = data.errors.join(' ');
        setReferenceUploadError(message);
        toast.warning(message);
      }

      if (uploadedDocuments.length > 0) {
        toast.success(`Added ${uploadedDocuments.length} reference file(s)`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload reference files';
      setReferenceUploadError(message);
      toast.error(message);
    } finally {
      setIsUploadingReferences(false);
      event.target.value = '';
    }
  };

  const handleFetchPosts = async () => {
    setIsFetchingPosts(true);

    try {
      const res = await fetch('/api/personas/posts');
      if (res.ok) {
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          const filledPosts = data.posts.slice(0, 3);
          setPostSamples((currentPosts) => {
            const nextPosts = [...currentPosts];
            filledPosts.forEach((post: string, index: number) => {
              nextPosts[index] = post;
            });
            return nextPosts;
          });
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
      const allAnswered = interviewAnswers.every((answer) => answer.answer.trim().length > 0);
      if (!allAnswered) {
        toast.error('Please answer all interview questions');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      void generatePersona();
    }
  };

  const generatePersona = async () => {
    setIsGenerating(true);
    setStep(3);

    try {
      const filledPosts = postSamples.filter((post) => post.trim().length > 0);
      const res = await fetch('/api/personas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewAnswers,
          postSamples: filledPosts.length > 0 ? filledPosts : undefined,
          referenceDocuments: referenceDocuments.length > 0 ? referenceDocuments : undefined,
        }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to generate persona';
        try {
          const error = await res.json();
          errorMsg = error.error || errorMsg;
        } catch {
          // Ignore invalid JSON bodies from the API.
        }
        throw new Error(errorMsg);
      }

      const generatedPersona = (await res.json()) as PersonaData;

      if (!generatedPersona.brandVoiceSummary || !generatedPersona.contentPillars) {
        throw new Error('Invalid persona generated - missing required fields');
      }

      setPersona(generatedPersona);
      setIsGenerating(false);
      setStep(4);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate persona';
      console.error('Persona generation error:', error);
      toast.error(message);
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

      if (!res.ok) {
        throw new Error('Failed to save persona');
      }

      toast.success('Persona saved successfully!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save persona';
      toast.error(message);
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <section className="page-hero">
        <button onClick={() => router.back()} className="eyebrow-link mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="space-y-3">
          <span className="page-kicker">Persona Builder</span>
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em]">
              Create an AI persona that matches your voice.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              Answer the interview, upload reference material, add recent post samples, and generate
              a reusable brand voice profile for your workflows.
            </p>
          </div>
        </div>
      </section>

      <div className="mb-8 flex gap-2">
        {[1, 2, 3, 4].map((currentStep) => (
          <div
            key={currentStep}
            className={`h-2 flex-1 rounded-full transition-colors ${
              currentStep <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {auditStatus?.locked && step !== 4 && (
        <Card className="mb-8 border-destructive/30 bg-[linear-gradient(180deg,rgba(196,71,59,0.08),rgba(255,250,243,0.95))]">
          <CardHeader>
            <CardTitle>Persona Audit Locked</CardTitle>
            <CardDescription>
              Your persona audit has already been used. Contact your administrator to authorize
              another audit run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once your admin authorizes it, you&apos;ll be able to run the audit again.
            </p>
          </CardContent>
        </Card>
      )}

      {auditStatus?.authorizedAt && !auditStatus?.locked && step !== 4 && (
        <Card className="mb-8 border-accent/60 bg-[linear-gradient(180deg,rgba(238,217,188,0.5),rgba(255,250,243,0.96))]">
          <CardHeader>
            <CardTitle>Audit Re-authorized by Admin</CardTitle>
            <CardDescription>
              Your administrator has authorized one more persona audit. Complete the form below to
              regenerate.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {step === 1 && !auditStatus?.locked && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Brand Interview</CardTitle>
            <CardDescription>
              Answer these 12 questions to help us understand your voice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {interviewAnswers.map((item, index) => (
              <div key={item.question}>
                <Label>{item.question}</Label>
                <Textarea
                  value={item.answer}
                  onChange={(event) => handleInterviewChange(index, event.target.value)}
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

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Step 2: Reference Material & Recent Posts</CardTitle>
                <CardDescription>
                  Upload brand guidelines or master prompts, then add recent posts to ground the
                  persona in your real voice.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchPosts}
                disabled={isFetchingPosts}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isFetchingPosts ? 'Fetching...' : 'Auto-fetch from Social'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-[2rem] border border-border/80 bg-background/60 p-5">
              <div className="space-y-1">
                <Label>Reference Files</Label>
                <p className="text-sm text-muted-foreground">
                  Upload up to {MAX_REFERENCE_DOCUMENTS} files such as brand guidelines, messaging
                  frameworks, and master prompts.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-dashed border-border/80 bg-muted/20 p-6">
                <input
                  type="file"
                  id="persona-reference-files"
                  accept={REFERENCE_DOCUMENT_ACCEPT}
                  multiple
                  onChange={handleReferenceFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="persona-reference-files"
                  className="flex cursor-pointer flex-col items-center gap-3 text-center"
                >
                  <div className="rounded-full border border-border/80 bg-background/80 p-3">
                    {isUploadingReferences ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {isUploadingReferences
                        ? 'Extracting text from your files...'
                        : 'Upload reference documents'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports .txt, .md, .pdf, and .docx
                    </p>
                  </div>
                </label>
              </div>

              {referenceUploadError && (
                <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {referenceUploadError}
                </div>
              )}

              {referenceDocuments.length > 0 && (
                <div className="space-y-3">
                  {referenceDocuments.map((document) => (
                    <div
                      key={document.name}
                      className="rounded-[1.5rem] border border-border/80 bg-background/85 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{document.fileType.toUpperCase()}</Badge>
                            <span className="text-sm font-medium text-foreground">
                              {document.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {document.characterCount.toLocaleString()} chars
                            </span>
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {document.excerpt}
                          </p>
                          {document.truncated && (
                            <p className="text-xs text-muted-foreground">
                              Long document detected. We clipped the extracted text before sending
                              it to the persona model.
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Select
                            value={document.kind}
                            onValueChange={(value) =>
                              handleReferenceDocumentKindChange(
                                document.name,
                                value as ReferenceDocumentKind
                              )
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[190px]">
                              <SelectValue placeholder="Reference type" />
                            </SelectTrigger>
                            <SelectContent>
                              {REFERENCE_DOCUMENT_KIND_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveReferenceDocument(document.name)}
                            aria-label={`Remove ${document.name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label>Recent Posts (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Add recent posts if you want the persona to mirror your day-to-day phrasing as well
                as your uploaded guidance.
              </p>
            </div>

            {postSamples.map((post, index) => (
              <div key={`post-${index}`}>
                <Label>Post {index + 1}</Label>
                <Textarea
                  value={post}
                  onChange={(event) => handlePostChange(index, event.target.value)}
                  placeholder="Paste a recent post here..."
                  className="mt-2 min-h-[80px]"
                />
              </div>
            ))}

            <div className="pt-4 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Persona
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Generating your persona...</p>
            <p className="mt-2 text-muted-foreground">This may take a moment.</p>
          </CardContent>
        </Card>
      )}

      {step === 4 && persona && (
        <div className="space-y-6">
          <Card className="border-secondary/80 bg-[linear-gradient(180deg,rgba(219,232,227,0.7),rgba(255,250,243,0.95))]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-secondary-foreground" />
                <CardTitle>Your AI Persona</CardTitle>
              </div>
              <CardDescription>Here&apos;s your personalized brand voice summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-2 block">Brand Voice Summary</Label>
                <p className="leading-7 text-muted-foreground">{persona.brandVoiceSummary}</p>
              </div>

              <div>
                <Label className="mb-3 block">Content Pillars</Label>
                <div className="flex flex-wrap gap-2">
                  {persona.contentPillars.map((pillar) => (
                    <Badge key={pillar} variant="outline" className="px-3 py-1">
                      {pillar}
                    </Badge>
                  ))}
                </div>
              </div>

              {persona.referenceDocuments && persona.referenceDocuments.length > 0 && (
                <div>
                  <Label className="mb-3 block">Reference Documents Used</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {persona.referenceDocuments.map((document) => (
                      <div
                        key={`${document.name}-${document.kind}`}
                        className="rounded-[1.5rem] border border-border/80 bg-background/70 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-full border border-border/80 bg-background/85 p-2">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{document.name}</p>
                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                              {document.kindLabel || document.kind}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {document.characterCount.toLocaleString()} chars
                              {document.truncated ? ' - clipped for model input' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setPersona(null);
                    setInterviewAnswers(
                      INTERVIEW_QUESTIONS.map((question) => ({ question, answer: '' }))
                    );
                    setPostSamples(['', '', '']);
                    setReferenceDocuments([]);
                    setReferenceUploadError(null);
                  }}
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
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
  );
}
