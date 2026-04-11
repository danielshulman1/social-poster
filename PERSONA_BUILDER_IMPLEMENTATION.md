# Persona Builder - Complete Implementation

All the backend code is now ready. Here's how to use it.

---

## ✅ What's Been Created

### Database Migrations (2 files)
- `003_create_user_personas_table.sql` - Stores AI personas
- `004_create_interview_progress_table.sql` - Tracks multi-step progress

### Utilities (3 files)
- `persona-db.js` - Database CRUD operations
- `openai-persona.js` - OpenAI persona generation + interview questions
- `post-parser.js` - Parse .txt and .csv files

### API Endpoints (5 routes)
- `POST /api/onboarding/interview/start` - Start interview, get first question
- `POST /api/onboarding/interview/answer` - Submit answer, get next question
- `POST /api/onboarding/posts/upload` - Upload/paste posts
- `POST /api/onboarding/persona/build` - Call OpenAI, generate persona
- `POST /api/onboarding/persona/save` - Save persona, complete onboarding

### Updated Files (1)
- `lib/email.js` - Added onboarding complete email

---

## 🚀 Setup Steps

### Step 1: Run Database Migrations

```bash
# Copy contents of:
# 003_create_user_personas_table.sql
# 004_create_interview_progress_table.sql
# Paste into Supabase SQL Editor and execute
```

### Step 2: Add Environment Variables

Add to `.env.local` and Vercel:

```bash
# Required
OPENAI_API_KEY=sk_test_...

# Optional (for OAuth later)
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

### Step 3: Install OpenAI SDK

```bash
npm install openai
# or
pnpm add openai
```

---

## 📚 The 5-Step Flow

### Step 1: Interview (API: `/api/onboarding/interview/*`)

**Start Interview:**
```javascript
const response = await fetch('/api/onboarding/interview/start', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});
const data = await response.json();
// Returns: { currentQuestion, questionsCount, totalSteps: 5 }
```

**Submit Answer:**
```javascript
const response = await fetch('/api/onboarding/interview/answer', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    questionId: 'business_description',
    answer: 'I help entrepreneurs build their online presence...',
  }),
});
const data = await response.json();
// Returns: { nextQuestion, interviewComplete, progress: { currentQuestion, totalQuestions, percentage } }
```

### Step 2: Collect Posts (API: `/api/onboarding/posts/upload`)

**Upload File or Text:**
```javascript
const response = await fetch('/api/onboarding/posts/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    uploadType: 'file', // or 'text'
    fileContent: csvContent, // or textPaste for text
    fileName: 'posts.csv', // optional
  }),
});
const data = await response.json();
// Returns: { postsCount, stats: { totalPosts, averageLength, etc }, readyForAnalysis: true }
```

**Supported Formats:**

CSV:
```csv
date,platform,content
2024-04-10,facebook,"Post content here..."
2024-04-09,instagram,"Another post..."
```

TXT:
```
Post content goes here

This is another post separated by blank lines

And another one
```

### Step 3: Build Persona (API: `/api/onboarding/persona/build`)

**Generate Persona:**
```javascript
const response = await fetch('/api/onboarding/persona/build', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});
const data = await response.json();
// Returns: { persona: { brandVoice, writingStyle, themes, ... }, postsAnalysed }
```

Returns complete persona structure with:
- Brand voice analysis
- Writing style guidelines
- Content pillars
- Platform-specific guides
- Sample posts in their voice

### Step 4: Confirm & Save (API: `/api/onboarding/persona/save`)

**Save Persona:**
```javascript
const response = await fetch('/api/onboarding/persona/save', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    persona: generatedPersona, // from build step
  }),
});
const data = await response.json();
// Returns: { success, message, persona: { onboardingComplete, platformsConnected, postsAnalysed } }
```

---

## 🎨 Building the Frontend

The backend is complete. Here's how to build the React UI:

### Page Structure

```
/onboarding
├── page.jsx (redirect to step 1)
└── layout.jsx (progress bar component)

/onboarding-steps
├── interview.jsx (Step 1: Chat interface)
├── collect-posts.jsx (Step 2: Upload/paste)
├── build-persona.jsx (Step 3: Building...)
└── confirm.jsx (Step 4: Review & save)
```

### Step 1: Interview Chat Component

```javascript
// app/components/InterviewChat.jsx

export function InterviewChat() {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start interview on mount
    const startInterview = async () => {
      const res = await fetch('/api/onboarding/interview/start', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setQuestion(data.currentQuestion);
    };
    startInterview();
  }, []);

  const submitAnswer = async () => {
    const res = await fetch('/api/onboarding/interview/answer', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        questionId: question.id,
        answer,
      }),
    });
    const data = await res.json();
    setProgress(data.progress.percentage);
    
    if (data.interviewComplete) {
      // Move to next step
      router.push('/onboarding-steps/collect-posts');
    } else {
      setQuestion(data.nextQuestion);
      setAnswer('');
    }
  };

  return (
    <div>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="interview-container">
        <h2>{question?.question}</h2>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={question?.placeholder}
        />
        <button onClick={submitAnswer}>Next</button>
      </div>
    </div>
  );
}
```

### Step 2: File Upload Component

```javascript
// app/components/PostUploader.jsx

export function PostUploader() {
  const [uploadType, setUploadType] = useState('file');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [stats, setStats] = useState(null);

  const handleUpload = async () => {
    let body;

    if (uploadType === 'file' && file) {
      const content = await file.text();
      body = {
        uploadType: 'file',
        fileContent: content,
        fileName: file.name,
      };
    } else if (uploadType === 'text' && text) {
      body = {
        uploadType: 'text',
        textPaste: text,
      };
    }

    const res = await fetch('/api/onboarding/posts/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.success) {
      setStats(data.stats);
      // Move to next step after short delay
      setTimeout(() => router.push('/onboarding-steps/build-persona'), 1000);
    }
  };

  return (
    <div>
      <div className="upload-options">
        <button
          className={uploadType === 'file' ? 'active' : ''}
          onClick={() => setUploadType('file')}
        >
          Upload File
        </button>
        <button
          className={uploadType === 'text' ? 'active' : ''}
          onClick={() => setUploadType('text')}
        >
          Paste Text
        </button>
      </div>

      {uploadType === 'file' ? (
        <input
          type="file"
          accept=".txt,.csv"
          onChange={(e) => setFile(e.target.files[0])}
        />
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your posts here (one per line or paragraph)"
        />
      )}

      <button onClick={handleUpload}>Upload & Continue</button>

      {stats && (
        <div className="stats">
          <p>Posts uploaded: {stats.totalPosts}</p>
          <p>Average length: {stats.averagePostLength} characters</p>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Build Persona Component

```javascript
// app/components/PersonaBuilder.jsx

export function PersonaBuilder() {
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const buildPersona = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/onboarding/persona/build', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }

        const data = await res.json();
        setPersona(data.persona);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    buildPersona();
  }, []);

  if (loading) {
    return <div className="loading">Building your persona...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="persona-preview">
      <h2>Your AI Persona</h2>
      
      <section>
        <h3>Brand Voice</h3>
        <p>{persona.brandVoice.summary}</p>
      </section>

      <section>
        <h3>Writing Style</h3>
        <p>Post length: {persona.writingStyle.postLength}</p>
        <p>Uses emojis: {persona.writingStyle.useEmojis ? 'Yes' : 'No'}</p>
      </section>

      <section>
        <h3>Content Pillars</h3>
        <ul>
          {persona.contentPillars.map(pillar => (
            <li key={pillar}>{pillar}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Sample Posts</h3>
        {Object.entries(persona.platformGuides).map(([platform, guide]) => (
          <div key={platform} className="sample-post">
            <h4>{platform.charAt(0).toUpperCase() + platform.slice(1)}</h4>
            <p className="sample-text">{guide.samplePost}</p>
          </div>
        ))}
      </section>

      <button onClick={savePersona}>Complete Onboarding</button>
    </div>
  );
}

async function savePersona() {
  const res = await fetch('/api/onboarding/persona/save', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ persona }),
  });

  if (res.ok) {
    router.push('/dashboard');
  }
}
```

---

## 🔒 Security Checklist

✅ Verify setup_fee_paid before allowing onboarding
✅ Verify onboarding_complete before redirecting to dashboard
✅ Rate limit API calls to prevent abuse
✅ Validate file uploads (size, type, content)
✅ Don't expose OpenAI key to frontend
✅ Hash/encrypt social credentials if storing
✅ Clear progress data after persona is saved

---

## 📊 Interview Questions

The system asks 12 questions:

1. What your business does
2. Problems you solve
3. Brand personality
4. Desired tone
5. Topics to post about
6. Topics to avoid
7. Key achievements
8. Favorite phrases
9. Words to avoid
10. Ideal customer
11. Connected platforms
12. Social media goals

All defined in `openai-persona.js` - easy to customize.

---

## 🎯 Integration Points

### After Onboarding Complete

1. User redirected to `/dashboard`
2. Show persona summary
3. Allow creating first post
4. Posts will use persona for styling
5. Can reset onboarding from admin panel

### Tier System Integration

- Check `setup_fee_paid` = true to allow onboarding
- Persona is stored in `user_personas` table
- Platform connections limited by tier (via tier-check)
- Reset onboarding available via admin reset endpoint

---

## 🚀 Testing the Flow

### Test Locally

```javascript
// Test interview endpoint
const res = await fetch('http://localhost:3000/api/onboarding/interview/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TEST_TOKEN',
    'Content-Type': 'application/json',
  },
});

// Test post upload
const res = await fetch('http://localhost:3000/api/onboarding/posts/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TEST_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    uploadType: 'text',
    textPaste: 'Sample post 1\n\nSample post 2',
  }),
});

// Test persona build
const res = await fetch('http://localhost:3000/api/onboarding/persona/build', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TEST_TOKEN',
  },
});
```

---

## 📈 Next Steps

1. **Run migrations** - Create database tables
2. **Add OpenAI key** - Set OPENAI_API_KEY env var
3. **Install dependency** - `npm install openai`
4. **Build UI components** - Use examples above
5. **Test flow** - Walk through all 5 steps
6. **Deploy** - Push to production

---

## 💡 Customization

### Change Interview Questions

Edit `INTERVIEW_QUESTIONS` in `openai-persona.js`:

```javascript
export const INTERVIEW_QUESTIONS = [
  {
    id: 'your_id',
    question: 'Your question here?',
    placeholder: 'Example answer...',
  },
  // Add more...
];
```

### Adjust OpenAI Prompt

Edit `buildPersonaPrompt()` in `openai-persona.js` to change:
- What data is analyzed
- Persona structure returned
- Analysis focus

### Add OAuth for Social Posts

Later: Add `/api/integrations/*/callback` routes to fetch posts directly from platforms instead of manual upload.

---

## 🎉 You're Ready!

All backend is complete. Build the frontend UI using the examples provided and you have a complete AI onboarding flow!

**Next: Build the React components and integrate with your dashboard.**
