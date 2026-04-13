# Onboarding Walkthrough - Quick Setup Guide

## What Was Created

A complete guided onboarding experience that takes new users through 9 steps from signup to dashboard in approximately 15-20 minutes.

## Files Created

```
frontend/src/
├── app/
│   └── guided-onboarding/
│       └── page.tsx                    (Main orchestrator - 450+ lines)
└── components/
    └── onboarding/
        ├── walkthrough-header.tsx      (Reusable header)
        ├── social-connection-step.tsx  (Social media setup)
        ├── persona-creation-step.tsx   (Persona intro)
        └── flows-setup-step.tsx        (Flows explanation)
```

Also created:
- `ONBOARDING_WALKTHROUGH.md` - Full documentation
- `ONBOARDING_SETUP.md` - This file

## The 9-Step Flow

1. **Welcome** - Introduction and overview
2. **Social Connection** - Connect Facebook, Instagram, LinkedIn (optional)
3. **Persona Intro** - Learn what a brand persona is
4. **Interview** - Answer 12 questions about business/brand
5. **Posts** - Upload existing posts for analysis
6. **Generating** - AI analyzes input (loading state)
7. **Confirmation** - Review generated persona
8. **Flows Setup** - Learn about content automation
9. **Complete** - Success screen, ready to go

## Key Changes

### Modified Files
- `packages/social-feeds/src/app/(auth)/signup/page.tsx`
  - Changed: Redirects to `/guided-onboarding` instead of `/login`
  - This happens automatically after signup

### New Route
- `/guided-onboarding` - The entire walkthrough experience

## Features Included

✅ **Welcome Screen**
- Explains the 4-step process
- Shows time commitment (15-20 min)
- Lists benefits
- "Maybe Later" option

✅ **Social Media Connection** 
- Three platforms: Facebook, Instagram, LinkedIn
- Interactive instruction modals for each platform
- Step-by-step connection guide
- Platform-specific tips and requirements
- Can skip if user prefers manual upload

✅ **Persona Creation Intro**
- Explains what a brand persona is
- Shows the 4-step process
- Sample interview questions
- Tips for best results
- 6 FAQ questions with answers
- Expected time: 10-15 minutes

✅ **Interview Questions**
- 12 detailed questions about business
- Progress bar showing completion
- Navigate forward/backward
- Keyboard shortcut: Ctrl+Enter

✅ **Post Collection**
- Manual upload via textarea or file
- File support: .txt, .csv formats
- Tab interface (manual vs. social)
- Post preview
- Recommendation: 5-10 posts minimum

✅ **Persona Confirmation**
- Complete persona display
- Brand voice summary
- Writing style analysis
- Content pillars
- Power words and phrases
- Sample posts for platforms
- Download option
- Copy buttons for samples

✅ **Flows Setup Introduction**
- Explains what content flows are
- 4 example flows:
  - Daily Posts
  - Weekly Newsletter
  - Thought Leadership
  - Engagement Posts
- 6 customization options
- Benefits of automation
- First flow overview

✅ **Completion Screen**
- Celebration with emoji
- 3-step next steps
- Links to edit persona or dashboard
- What happens in next 24 hours

## How It Works

### User Flow
1. User signs up → Redirected to `/guided-onboarding`
2. Clicks "Let's Get Started" on welcome
3. Goes through each step in order
4. Can skip optional steps (social connection)
5. At completion → Redirected to `/dashboard`

### Progress Saving
- Each step auto-saves to database via `updateOnboardingProgress()`
- Can pause and resume later
- Automatic session persistence with Supabase

### Data Flow
```
User Input
    ↓
Interview Answers + Posts
    ↓
API: /api/onboarding/generate-persona
    ↓
AI Analysis (Backend)
    ↓
PersonaData returned
    ↓
Display in Confirmation
    ↓
Save to Database
```

## Components Used

### New Components
- `WalkthroughHeader` - Progress bar + step info
- `SocialConnectionStep` - Social media setup
- `PersonaCreationStep` - Persona introduction
- `FlowsSetupStep` - Flows explanation

### Existing Components (Reused)
- `InterviewStep` - Interview questions
- `PostsStep` - Post upload
- `PersonaConfirmation` - Persona display

## Styling

All components use:
- Tailwind CSS (existing utility classes)
- Consistent color scheme:
  - Blue (#0066FF) - Primary actions
  - Green (#22C55E) - Success/tips
  - Amber (#F59E0B) - Warnings
  - Red (#EF4444) - Errors
- Responsive design (mobile-first)
- Icons from lucide-react

## Backend Requirements

The onboarding assumes these already exist:

1. **Supabase Functions**
   - `getOrCreateOnboardingProgress()`
   - `updateOnboardingProgress()`
   - `getUserPersona()`

2. **API Endpoints**
   - `/api/oauth/initiate` - Social media OAuth
   - `/api/oauth/callback` - OAuth callback
   - `/api/onboarding/generate-persona` - Persona generation

3. **Database Tables**
   - `user_onboarding_progress` - Tracks progress
   - `user_personas` - Stores personas

## Testing Checklist

- [ ] Click "Let's Get Started" on welcome screen
- [ ] Try to connect social media (opens instruction modals)
- [ ] Skip social connection, proceed to interview
- [ ] Answer all 12 interview questions
- [ ] Upload or paste some posts
- [ ] Wait for persona generation
- [ ] Review generated persona
- [ ] Explore flows setup page
- [ ] Click "Go to Dashboard" on completion
- [ ] Verify you're on dashboard
- [ ] Check that you can edit persona from settings

## Customization Ideas

### Easy to Modify
- Questions in `InterviewStep` - just edit INTERVIEW_QUESTIONS array
- Flow examples in `FlowsSetupStep` - modify FLOW_EXAMPLES array
- FAQ items in `PersonaCreationStep` - modify FAQS array
- Colors and styling - Tailwind classes throughout

### Example: Add More Interview Questions
```tsx
const INTERVIEW_QUESTIONS = [
  // ... existing questions
  {
    key: 'newQuestion',
    question: 'Your new question here?',
    placeholder: 'User input hint...',
  },
];
```

## Troubleshooting

### User redirects back to login
- Check Supabase auth is working
- Verify user is authenticated before showing onboarding
- Check `checkAuth()` function in main page

### Persona generation fails
- Check `/api/onboarding/generate-persona` endpoint
- Verify AI/Claude API is configured
- Check console for error messages

### Posts don't upload
- Verify file upload handler in `PostsStep`
- Check file size limits
- Ensure .txt and .csv files are supported

### Social media connection doesn't work
- Check `/api/oauth/initiate` endpoint
- Verify OAuth credentials for each platform
- Check redirect URLs in platform settings

## Next Steps

After onboarding works, you may want:

1. **Flow Creation Interface** - Let users create their first flow
2. **Dashboard Widget** - Show onboarding progress on dashboard
3. **Onboarding Completion Badge** - Celebrate milestone
4. **Email Confirmation** - Send welcome email after signup
5. **In-App Tooltips** - First-time user tips on dashboard
6. **Help Center Links** - Context-sensitive help throughout

## Questions?

Check `ONBOARDING_WALKTHROUGH.md` for detailed documentation on each component and step.
