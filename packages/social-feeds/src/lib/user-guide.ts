export type UserGuideStep = {
  title: string;
  detail: string;
};

export type UserGuideSection = {
  id: string;
  title: string;
  summary: string;
  steps: UserGuideStep[];
  tips: string[];
};

export type UserGuideFaq = {
  question: string;
  answer: string;
};

export const USER_GUIDE_HIGHLIGHTS = [
  "Build workflows from a blank canvas or from a text prompt.",
  "Use your AI persona, Google Sheets rows, and generated content together in one flow.",
  "Choose whether posts publish immediately or wait for approval in Activity.",
  "Bring your own images from Google Sheets when each post row has its own image URL.",
];

export const USER_GUIDE_SECTIONS: UserGuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    summary: "Set up the basics so the app can generate content, reach your channels, and save your work correctly.",
    steps: [
      {
        title: "Open onboarding or settings",
        detail: "Start in Onboarding if you are new, or use Settings later if you need to update keys and profile details.",
      },
      {
        title: "Add your OpenAI API key",
        detail: "The app uses your key for persona generation, workflow generation from text, content generation, and the help assistant.",
      },
      {
        title: "Connect the channels you plan to publish to",
        detail: "Use Connections for LinkedIn, Facebook, Threads, blogs, and Google Sheets before you build a production workflow.",
      },
      {
        title: "Create one simple workflow first",
        detail: "Begin with a manual trigger, one content source or AI step, and one publisher so you can test the full path quickly.",
      },
    ],
    tips: [
      "If a feature depends on AI and nothing happens, check that your OpenAI key is still saved in Settings.",
      "Keep your first workflow small so it is easier to test and understand before adding routing or multiple publishers.",
    ],
  },
  {
    id: "building-workflows",
    title: "Build Workflows Visually",
    summary: "Use the workflow editor when you want full control over how content moves from trigger to source to processing to publishing.",
    steps: [
      {
        title: "Create a blank workflow",
        detail: "Use New Workflow from the library or dashboard to open the visual canvas and add nodes manually.",
      },
      {
        title: "Add the right node types",
        detail: "Start with a trigger, then add sources like RSS or Google Sheets, optional AI or image generation steps, and finally your publish destinations.",
      },
      {
        title: "Connect nodes in order",
        detail: "Drag between nodes to define the path. A simple sequence is usually trigger, source, AI generation, then publisher.",
      },
      {
        title: "Save and test often",
        detail: "Use Save after important edits and Run to confirm the workflow produces the output you expect before you activate it for regular use.",
      },
    ],
    tips: [
      "Use the Tidy button in the editor to auto-arrange nodes when a canvas starts getting messy.",
      "If the editor looks empty, make sure you are opening the actual workflow page and not a filtered dashboard view.",
    ],
  },
  {
    id: "prompt-built-workflows",
    title: "Build Workflows From Text",
    summary: "Describe what you want in plain language and let the app create a draft workflow that you can still edit visually afterward.",
    steps: [
      {
        title: "Choose Build With Text",
        detail: "You can start from text in the workflow library, onboarding, or from the editor header when refining an existing workflow.",
      },
      {
        title: "Describe the outcome, not just the tools",
        detail: "Say what should trigger the flow, where content comes from, how it should be transformed, and where it should end up.",
      },
      {
        title: "Review the generated graph",
        detail: "The app now opens the generated workflow in the editor so you can see the nodes and connections immediately.",
      },
      {
        title: "Adjust the details before publishing",
        detail: "Generated workflows are a draft. Check prompts, sheet columns, accounts, approval settings, and image-source choices before running for real.",
      },
    ],
    tips: [
      "The best prompt includes one trigger, one content source, one content goal, and one or more destinations.",
      "If the generated workflow is close but not perfect, edit the nodes instead of regenerating from scratch every time.",
    ],
  },
  {
    id: "persona",
    title: "Build Your AI Persona",
    summary: "Your persona helps the app write in your tone by combining your answers, recent post samples, and reference files.",
    steps: [
      {
        title: "Answer the persona questions",
        detail: "Give clear information about your audience, tone, positioning, and the type of content you want the app to produce.",
      },
      {
        title: "Upload reference documents",
        detail: "You can add brand guidelines, master prompts, and other supporting files to anchor the persona more strongly than post samples alone.",
      },
      {
        title: "Review the persona summary",
        detail: "The generated voice summary and content pillars should match the way you want the brand to sound in public.",
      },
      {
        title: "Use persona-aware content nodes",
        detail: "When you add AI generation nodes, check that the persona or master prompt field reflects the voice you want used in output.",
      },
    ],
    tips: [
      "If the persona sounds off-brand, upload stronger guidance such as brand rules or a master prompt and regenerate.",
      "Reference files outrank post samples when the two conflict, so use them to set non-negotiable brand rules.",
    ],
  },
  {
    id: "connections",
    title: "Connect Platforms And Data Sources",
    summary: "Connections let the app access the places where you read content from and publish content to.",
    steps: [
      {
        title: "Open the Connections page",
        detail: "Review every service you want to use in workflows and connect it before you rely on it inside a live automation.",
      },
      {
        title: "Connect publishing accounts",
        detail: "Set up the social platforms or blog providers you want to post to, and confirm the right account is linked.",
      },
      {
        title: "Prepare Google Sheets correctly",
        detail: "Use the template download if you want a ready-made structure. The standard headers include content, status, image_url, platform, scheduled_at, and notes.",
      },
      {
        title: "Use the same row for post text and image",
        detail: "If you want the sheet to supply an image, place the image URL in the same row as the post content so the workflow keeps them together.",
      },
    ],
    tips: [
      "If a Google Sheet row should be processed, leave status empty. The app marks used rows as done.",
      "When using sheet images, select Google Sheet Row Image in the publisher node so the output uses that row image intentionally.",
    ],
  },
  {
    id: "approvals-and-publishing",
    title: "Approvals, Images, And Publishing",
    summary: "You can publish immediately or hold content for approval, and you can control whether images come from generation, the trigger, or a Google Sheet row.",
    steps: [
      {
        title: "Choose your image source in each publisher",
        detail: "Publisher nodes can use a fixed image URL, a generated image, a trigger image, or the Google Sheet Row Image option.",
      },
      {
        title: "Decide whether posts need approval",
        detail: "Use the Publish Without Approval toggle in publisher nodes. Leave it on for immediate publishing, or turn it off to hold output for review.",
      },
      {
        title: "Run the workflow",
        detail: "A successful run either publishes the post immediately or records it as awaiting approval if you disabled immediate publishing.",
      },
      {
        title: "Review output in Activity",
        detail: "When approval is required, Activity shows the generated post so you can read it before it goes any further.",
      },
    ],
    tips: [
      "If you expect the sheet image but see a different one, confirm the publisher node is set to Google Sheet Row Image rather than a generated or trigger image source.",
      "Use approval mode for new workflows until you trust the prompts, formatting, and connected accounts.",
    ],
  },
  {
    id: "activity",
    title: "Review Runs In Activity",
    summary: "The Activity page is where you check what happened, spot failures, and inspect outputs when a workflow did not publish straight away.",
    steps: [
      {
        title: "Open Activity after a run",
        detail: "Look at the latest execution first so you can confirm which nodes succeeded and which ones failed.",
      },
      {
        title: "Read held posts before approval",
        detail: "If approval mode is active, the generated post content and related details appear there for review.",
      },
      {
        title: "Use the log to debug failures",
        detail: "Failures usually point to missing API keys, missing platform connections, invalid sheet data, or a node configuration problem.",
      },
      {
        title: "Return to the editor to fix the source",
        detail: "Treat Activity as the audit trail and the editor as the place where you correct the underlying workflow configuration.",
      },
    ],
    tips: [
      "If a workflow saved but did not behave as expected, compare the node output in Activity with the node configuration in the editor.",
      "New workflows are safer when run manually a few times before you rely on any scheduled or ongoing process.",
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    summary: "Most user issues come from missing keys, incomplete connections, or a mismatch between a node setting and the data available to it.",
    steps: [
      {
        title: "Check AI configuration first",
        detail: "If generation, persona work, or help chat fails, confirm the OpenAI key is present and still valid in Settings.",
      },
      {
        title: "Check the source data",
        detail: "If a Google Sheet workflow produces the wrong post or no post, confirm the content and image columns are filled and the row is formatted correctly.",
      },
      {
        title: "Check the destination account",
        detail: "If publishing fails, reconnect the destination on the Connections page and make sure the workflow points to the intended channel.",
      },
      {
        title: "Check Activity for the exact failure point",
        detail: "The log is usually the fastest way to see whether the problem happened during generation, image selection, or publishing.",
      },
    ],
    tips: [
      "Make one change at a time when debugging. It is easier to isolate the real issue that way.",
      "If you are unsure whether the problem is the prompt or the workflow structure, test the nodes in the smallest possible version of the flow.",
    ],
  },
];

export const USER_GUIDE_FAQS: UserGuideFaq[] = [
  {
    question: "What is the fastest way to make my first workflow?",
    answer: "Use Build With Text, then review the generated workflow in the editor. It is the quickest path because you can start from plain language and still edit the result visually.",
  },
  {
    question: "Do I need an OpenAI API key?",
    answer: "Yes for AI-powered features such as persona generation, building workflows from text, AI content generation, and the in-app help assistant. Save it in Settings.",
  },
  {
    question: "Can I post with my own images from Google Sheets?",
    answer: "Yes. Put the image URL in the same row as the post content and set the publisher node image source to Google Sheet Row Image.",
  },
  {
    question: "How do I stop posts going live immediately?",
    answer: "Turn off Publish Without Approval in the publisher node. The post will then appear in Activity so you can review it first.",
  },
  {
    question: "Where can I see what a workflow produced?",
    answer: "Use the Activity page. It shows execution history, failures, and held posts that are waiting for approval.",
  },
  {
    question: "What should I upload for my persona?",
    answer: "Upload brand guidelines, master prompts, and a few recent post examples. Strong reference files usually improve the consistency of the generated voice.",
  },
  {
    question: "What should I do if a workflow looks blank in the editor?",
    answer: "Reload the workflow page and confirm you opened the correct workflow. If the problem continues, check whether the workflow loads from the library and whether Activity shows recent runs for it.",
  },
];

export const USER_GUIDE_SUGGESTED_QUESTIONS = [
  "How do I build a workflow from text?",
  "How do I use my own images from Google Sheets?",
  "How do approvals work before publishing?",
  "What should I upload to build my persona?",
  "Why did my workflow fail to publish?",
  "Where do I review a post before it goes live?",
];

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);

const countMatches = (haystack: string, tokens: string[]) =>
  tokens.reduce((score, token) => {
    const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    const matches = haystack.match(regex);
    return score + (matches?.length || 0);
  }, 0);

export function findRelevantGuideSections(query: string, limit = 3) {
  const tokens = tokenize(query);
  const ranked = USER_GUIDE_SECTIONS
    .map((section) => {
      const searchText = [
        section.title,
        section.summary,
        ...section.steps.map((step) => `${step.title} ${step.detail}`),
        ...section.tips,
      ]
        .join(" ")
        .toLowerCase();

      const score = tokens.length > 0 ? countMatches(searchText, tokens) : 0;
      return { section, score };
    })
    .sort((a, b) => b.score - a.score);

  const filtered = ranked.filter((item) => item.score > 0).slice(0, limit).map((item) => item.section);
  return filtered.length > 0 ? filtered : USER_GUIDE_SECTIONS.slice(0, limit);
}

export function findRelevantGuideFaqs(query: string, limit = 3) {
  const tokens = tokenize(query);
  return USER_GUIDE_FAQS
    .map((faq) => {
      const searchText = `${faq.question} ${faq.answer}`.toLowerCase();
      const score = tokens.length > 0 ? countMatches(searchText, tokens) : 0;
      return { faq, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => item.faq);
}

export function buildUserGuidePlainText() {
  return [
    "Social Poster User Guide",
    "This guide is for end users who build workflows, generate content, connect platforms, and review outputs. It is not an admin guide.",
    "",
    "Highlights:",
    ...USER_GUIDE_HIGHLIGHTS.map((highlight) => `- ${highlight}`),
    "",
    ...USER_GUIDE_SECTIONS.flatMap((section) => [
      `${section.title}`,
      `${section.summary}`,
      ...section.steps.map((step, index) => `${index + 1}. ${step.title}: ${step.detail}`),
      ...section.tips.map((tip) => `Tip: ${tip}`),
      "",
    ]),
    "Frequently Asked Questions:",
    ...USER_GUIDE_FAQS.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`),
  ].join("\n");
}
