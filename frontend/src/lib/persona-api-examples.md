# Persona Builder API Examples

## OpenAI Response Example

When the persona generation API is called, OpenAI returns a response that gets parsed into this structure:

```json
{
  "brandVoiceSummary": "You're a passionate business mentor who believes in practical action over theory. Your voice is warm, encouraging, and grounded in real-world experience. You share insights with enthusiasm and back them up with examples from your own journey.",
  "writingStyle": {
    "postLength": "Medium posts (150-300 words), occasionally longer for deeper insights",
    "emojiUsage": "Selective emoji use - typically 1-2 per post, favoring action-oriented emojis (👊, 🚀, 💡) and gestures (👈, 👉)",
    "punctuationHabits": "Uses dashes and ellipsis for emphasis. Exclamation marks for enthusiasm but not overused. Occasional rhetorical questions.",
    "paragraphStructure": "Short paragraphs with white space, conversational tone, starts with hook or question"
  },
  "recurringThemes": [
    "Actionable business strategies",
    "Personal development and growth",
    "Common business mistakes",
    "Success stories and case studies",
    "Mindset shifts for entrepreneurs"
  ],
  "powerWordsAndPhrases": [
    "here's the thing",
    "real talk",
    "this is why",
    "let me be clear",
    "you'll want to",
    "the secret is",
    "watch what happens when",
    "most people miss this",
    "it all comes down to"
  ],
  "wordsToAvoid": [
    "bro/sis (too casual)",
    "literally (overused)",
    "basically (filler word)",
    "guys (inclusive language)",
    "just",
    "honestly (implied in authentic voice)"
  ],
  "idealPostStructures": {
    "facebook": "Hook → Personal story → Lesson learned → Call to action. ~250 words, 2-3 paragraphs",
    "instagram": "Attention-grabbing first line → Quick insights (bullet format works) → CTA to comment/DM. ~150 words",
    "linkedin": "Professional context → Deeper insight → Reflection on business impact → Thought-provoking question. ~280 words",
    "twitter": "Hot take or insight → Supporting context → Thought to leave readers with. ~280 characters including hashtags"
  },
  "hashtagStyle": "Uses 3-5 relevant hashtags on Instagram/Twitter, avoids hashtags on Facebook/LinkedIn. Favors niche community tags (#EntrepreneurCommunity, #BusinessMentor) over broad ones.",
  "engagementStyle": "Frequently asks questions to spark conversation. Responds to comments with longer, thoughtful replies. Uses CTAs like 'What do you think?' or 'Share your experience below.' Occasionally shares reader experiences in follow-up posts.",
  "contentPillars": [
    "Business Strategy & Tactics",
    "Personal Development & Mindset",
    "Real Talk: Mistakes & Lessons",
    "Success Stories & Case Studies",
    "Entrepreneur Community Building"
  ],
  "samplePosts": {
    "facebook": "Here's the thing about starting a business — everyone tells you to 'follow your passion,' but nobody talks about the days when your passion feels exhausted.\n\nI learned this the hard way. Six months into my first venture, I was burned out, questioning everything. That's when I realized the secret isn't passion alone — it's purpose.\n\nPassion gets you excited. Purpose keeps you going.\n\nPassion fades on tough days. Purpose reminds you why you started.\n\nIf you're building something right now and feeling that fatigue creeping in, take a step back and reconnect with your 'why.' Not the money. Not the status. The real, deep reason you decided to do this.\n\nThat's what will carry you through.\n\nWhat's your 'why' right now? I'd love to hear it.",
    "instagram": "passion ≠ purpose 🔥\n\npassion gets you started\npurpose keeps you going\n\npassion is a feeling\npurpose is a promise\n\nmost founders mix these up. then they burn out.\n\nwhich one are you running on right now? 👇",
    "linkedin": "I had a conversation with a founder yesterday who said: 'I love my idea, but I don't love the business.'\n\nThat stuck with me.\n\nHere's what I've learned after mentoring 50+ entrepreneurs: the most successful ones don't chase passion — they chase purpose.\n\nPassion is emotional. It fluctuates. It depends on momentum and market feedback.\n\nPurpose is intentional. It's stable. It survives the inevitable valleys every business goes through.\n\nThe businesses that last aren't built on the strongest ideas. They're built by people who have a clear answer to: 'Why does this matter to me?' Not 'Why will this make money?' Not 'Why is this trendy?'\n\nWhy does THIS matter to me?\n\nIf you can't articulate that in one sentence, it's worth revisiting before you invest another year of your life.\n\nWhat's your answer?",
    "twitter": "most founders chase passion. smart ones chase purpose.\n\npassion = feeling\npurpose = why\n\nguess which one survives the inevitable shit storm. 🚀"
  }
}
```

## Supabase Response Example

After successful persona generation, the user_personas table contains:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "user-uuid-here",
  "persona_data": { /* PersonaData object from above */ },
  "interview_data": {
    "businessDescription": "I'm a business mentor and entrepreneur coach. I help founders and solopreneurs build profitable businesses without burnout.",
    "problemsSolved": "People struggle with overwhelm, lack of direction, and burnout in their entrepreneurial journey. I help them get clarity, create systems, and stay sustainable.",
    "brandPersonality": "Professional but approachable, authentic, direct but warm",
    "toneOfVoice": "Conversational, mentoring-like, honest and no-fluff",
    "topicsToPostAbout": "Business strategy, entrepreneurship lessons, mindset, personal development, common business mistakes, success strategies",
    "topicsToAvoid": "Politics, religion, unproven get-rich-quick schemes, overly salesy content",
    "achievements": "Helped 50+ entrepreneurs reach 6-figures, published 2 books on business, 10k+ followers across platforms",
    "phraseFrequency": "here's the thing, real talk, this is why, watch what happens when",
    "phrasesToAvoid": "bro, sis, literally, basically, guys, just",
    "idealCustomer": "Founders and entrepreneurs aged 25-45 who are serious about building sustainable businesses, not get-rich-quick people",
    "platformsActive": ["facebook", "linkedin", "instagram", "twitter"],
    "businessGoals": "Build authority and trust, generate coaching leads, create community of entrepreneurs"
  },
  "platforms_connected": ["facebook", "linkedin"],
  "posts_analysed_count": 24,
  "onboarding_complete": true,
  "created_at": "2026-04-12T10:30:00.000Z",
  "updated_at": "2026-04-12T10:35:00.000Z"
}
```

## API Endpoint Requests & Responses

### POST /api/onboarding/generate-persona

**Request:**
```json
{
  "userId": "user-uuid-here",
  "interviewData": {
    "businessDescription": "...",
    "problemsSolved": "...",
    // ... all interview fields
  },
  "posts": [
    {
      "content": "Sample post content here...",
      "platform": "facebook",
      "datePosted": "2024-03-15T10:00:00Z",
      "hashtags": ["business", "entrepreneurship"],
      "engagement": {
        "likes": 45,
        "comments": 12
      }
    }
    // ... more posts
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "persona": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "user-uuid-here",
    "persona_data": { /* Full PersonaData */ },
    "interview_data": { /* Full InterviewData */ },
    "platforms_connected": ["facebook", "linkedin"],
    "posts_analysed_count": 24,
    "onboarding_complete": true,
    "created_at": "2026-04-12T10:30:00.000Z",
    "updated_at": "2026-04-12T10:35:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "error": "Failed to generate persona from OpenAI response"
}
```

### POST /api/oauth/initiate

**Request:**
```json
{
  "platform": "facebook"
}
```

**Response:**
```json
{
  "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?client_id=...&redirect_uri=...&state=..."
}
```

### GET /api/oauth/callback

**Query Parameters:**
- `code` - Authorization code from OAuth provider
- `state` - State parameter for CSRF protection
- `platform` - Which platform (facebook, instagram, linkedin)
- `error` - Error message if auth failed

**Redirect:** Redirects to `/onboarding?step=posts&platform=facebook&success=true`

## Error Handling Examples

### Missing Environment Variables
```
Error: Missing Supabase environment variables
```

### OAuth Connection Failed
```
Error: Failed to connect to facebook. Please try again.
```

### Persona Generation Timeout
```
Error: Request timeout - persona generation took too long. Please try with fewer posts.
```

### OpenAI API Rate Limited
```
Error: OpenAI API rate limit exceeded. Please try again in a few moments.
```

### RLS Policy Violation
```
Error: new row violates row-level security policy "Users can view own personas"
```

## Usage in Components

```typescript
// In a component or API route

// Get user's persona
const persona = await getUserPersona(userId);

// Save persona to database
const saved = await saveUserPersona(
  userId,
  personaData,
  interviewData,
  ['facebook', 'linkedin'],
  24 // posts count
);

// Get onboarding progress
const progress = await getOrCreateOnboardingProgress(userId);

// Update progress
const updated = await updateOnboardingProgress(
  userId,
  2, // step
  interviewResponses,
  collectedPosts
);
```

## Performance Notes

- Interview → Persona generation takes ~10-30 seconds depending on post count
- Each persona generation costs ~$0.03-0.05 in OpenAI API usage
- Maximum recommended posts for analysis: 100 (larger samples take longer)
- Supabase queries are optimized with indexes on user_id and created_at
