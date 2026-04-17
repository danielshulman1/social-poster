import type { Edge, Node } from "@xyflow/react";

type SupportedNodeType =
  | "manual-trigger"
  | "schedule-trigger"
  | "rss-source"
  | "google-sheets-source"
  | "ai-generation"
  | "blog-creation"
  | "image-generation"
  | "router"
  | "facebook-publisher"
  | "linkedin-publisher"
  | "instagram-publisher"
  | "threads-publisher"
  | "wordpress-publisher"
  | "wix-publisher"
  | "squarespace-publisher"
  | "http-request"
  | "google-sheets-publisher";

type SupportedStep = {
  type: SupportedNodeType;
  label?: string;
  data?: Record<string, unknown>;
};

export type WorkflowGenerationBlueprint = {
  name?: string;
  steps?: SupportedStep[];
};

export type WorkflowGenerationContext = {
  defaultMasterPrompt?: string;
  availableAccountIdsByPlatform: Partial<Record<string, string>>;
};

export type BuiltWorkflowDefinition = {
  nodes: Node[];
  edges: Edge[];
  warnings: string[];
};

const VALID_NODE_TYPES = new Set<SupportedNodeType>([
  "manual-trigger",
  "schedule-trigger",
  "rss-source",
  "google-sheets-source",
  "ai-generation",
  "blog-creation",
  "image-generation",
  "router",
  "facebook-publisher",
  "linkedin-publisher",
  "instagram-publisher",
  "threads-publisher",
  "wordpress-publisher",
  "wix-publisher",
  "squarespace-publisher",
  "http-request",
  "google-sheets-publisher",
]);

const DEFAULT_LABELS: Record<SupportedNodeType, string> = {
  "manual-trigger": "Manual Trigger",
  "schedule-trigger": "Schedule Trigger",
  "rss-source": "News URL",
  "google-sheets-source": "Google Sheets",
  "ai-generation": "AI Text Generation",
  "blog-creation": "Blog Creation",
  "image-generation": "AI Image Generation",
  "router": "Router",
  "facebook-publisher": "Facebook Publisher",
  "linkedin-publisher": "LinkedIn Publisher",
  "instagram-publisher": "Instagram Publisher",
  "threads-publisher": "Threads Publisher",
  "wordpress-publisher": "WordPress Publisher",
  "wix-publisher": "Wix Publisher",
  "squarespace-publisher": "Squarespace Publisher",
  "http-request": "HTTP Request",
  "google-sheets-publisher": "Google Sheets Publisher",
};

const PUBLISHER_PLATFORMS: Partial<Record<SupportedNodeType, string>> = {
  "facebook-publisher": "facebook",
  "linkedin-publisher": "linkedin",
  "instagram-publisher": "instagram",
  "threads-publisher": "threads",
  "wordpress-publisher": "wordpress",
  "wix-publisher": "wix",
  "squarespace-publisher": "squarespace",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getBoolean = (value: unknown) =>
  typeof value === "boolean" ? value : undefined;

const getScheduleList = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;
  const schedules = value
    .map((entry) => (isRecord(entry) ? entry : null))
    .filter(Boolean)
    .map((entry, index) => {
      const day = getString(entry?.day);
      const time = getString(entry?.time);
      if (!day || !time) return null;
      return {
        id: `schedule-${index + 1}`,
        day,
        time,
      };
    })
    .filter((entry): entry is { id: string; day: string; time: string } => Boolean(entry));

  return schedules.length > 0 ? schedules : undefined;
};

const sanitizeStepData = (
  step: SupportedStep,
  context: WorkflowGenerationContext,
  warnings: string[]
) => {
  const data = isRecord(step.data) ? step.data : {};
  const label = getString(step.label) || DEFAULT_LABELS[step.type];
  const nodeData: Record<string, unknown> = { label, type: step.type };

  switch (step.type) {
    case "manual-trigger": {
      const testContent = getString(data.testContent);
      const testImageUrl = getString(data.testImageUrl);
      if (testContent) nodeData.testContent = testContent;
      if (testImageUrl) nodeData.testImageUrl = testImageUrl;
      break;
    }
    case "schedule-trigger": {
      const schedules = getScheduleList(data.schedules);
      if (schedules) {
        nodeData.schedules = schedules;
      } else {
        warnings.push("Schedule trigger was added without a concrete time. Review the schedule settings before activating it.");
      }
      break;
    }
    case "rss-source": {
      const url = getString(data.url);
      if (url) nodeData.url = url;
      break;
    }
    case "google-sheets-source": {
      const sheetId = getString(data.sheetId);
      const sheetName = getString(data.sheetName) || getString(data.sheetTab) || "Sheet1";
      const sheetColumn = getString(data.sheetColumn) || "A";
      const imageColumn = getString(data.imageColumn) || "C";
      if (sheetId) nodeData.sheetId = sheetId;
      nodeData.sheetName = sheetName;
      nodeData.sheetColumn = sheetColumn;
      nodeData.imageColumn = imageColumn;
      if (!sheetId) {
        warnings.push("Google Sheets was selected as a source, but no spreadsheet ID was provided. Add the sheet ID before running.");
      }
      break;
    }
    case "ai-generation": {
      const taskPrompt = getString(data.taskPrompt) || "Write a social media post using the available source material.";
      const masterPrompt = getString(data.masterPrompt) || context.defaultMasterPrompt || "You are a helpful social media assistant.";
      nodeData.taskPrompt = taskPrompt;
      nodeData.masterPrompt = masterPrompt;
      nodeData.provider = "openai";
      const contentSource = getString(data.contentSource);
      if (contentSource) nodeData.contentSource = contentSource;
      break;
    }
    case "blog-creation": {
      const blogPrompt = getString(data.blogPrompt) || "Write a polished blog post from the source material.";
      nodeData.blogPrompt = blogPrompt;
      break;
    }
    case "image-generation": {
      const prompt = getString(data.prompt) || "Create an image that matches the generated post.";
      nodeData.prompt = prompt;
      nodeData.provider = getString(data.provider) || "dalle-3";
      break;
    }
    case "http-request": {
      const url = getString(data.url);
      const method = getString(data.method) || "POST";
      if (url) nodeData.url = url;
      nodeData.method = method;
      const contentType = getString(data.contentType);
      if (contentType) nodeData.contentType = contentType;
      const body = getString(data.body);
      if (body) nodeData.body = body;
      if (!url) {
        warnings.push("HTTP Request destination was generated without a URL. Add the endpoint before running.");
      }
      break;
    }
    case "google-sheets-publisher": {
      const sheetId = getString(data.sheetId);
      const sheetTab = getString(data.sheetTab) || "Sheet1";
      nodeData.sheetTab = sheetTab;
      nodeData.contentColumn = getString(data.contentColumn) || "A";
      nodeData.imageColumn = getString(data.imageColumn) || "C";
      if (sheetId) nodeData.sheetId = sheetId;
      if (!sheetId) {
        warnings.push("Google Sheets publisher was generated without a spreadsheet ID. Add it before running.");
      }
      break;
    }
    case "facebook-publisher":
    case "linkedin-publisher":
    case "instagram-publisher":
    case "threads-publisher":
    case "wordpress-publisher":
    case "wix-publisher":
    case "squarespace-publisher": {
      const platform = PUBLISHER_PLATFORMS[step.type] || "";
      const accountId = getString(data.accountId) || context.availableAccountIdsByPlatform[platform] || "";
      const imageUrl = getString(data.imageUrl);
      const imageSource = getString(data.imageSource);
      const textSource = getString(data.textSource);
      const siteUrl = getString(data.siteUrl);
      const title = getString(data.title);
      const publishWithoutApproval = getBoolean(data.publishWithoutApproval);

      if (accountId) {
        nodeData.accountId = accountId;
      } else {
        warnings.push(`${DEFAULT_LABELS[step.type]} has no connected account assigned yet.`);
      }

      if (imageUrl) nodeData.imageUrl = imageUrl;
      if (imageSource) nodeData.imageSource = imageSource;
      if (textSource) nodeData.textSource = textSource;
      if (siteUrl) nodeData.siteUrl = siteUrl;
      if (title) nodeData.title = title;
      if (publishWithoutApproval !== undefined) {
        nodeData.publishWithoutApproval = publishWithoutApproval;
      }
      break;
    }
    case "router":
      break;
  }

  return nodeData;
};

export function parseWorkflowGenerationBlueprint(input: string) {
  const parsed = JSON.parse(input) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("Workflow generator returned an invalid payload.");
  }

  const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
  const normalizedSteps = steps
    .map((step) => (isRecord(step) ? step : null))
    .filter(Boolean)
    .map((step) => {
      const type = getString(step?.type) as SupportedNodeType;
      if (!VALID_NODE_TYPES.has(type)) return null;
      return {
        type,
        label: getString(step?.label) || undefined,
        data: isRecord(step?.data) ? step.data : {},
      } satisfies SupportedStep;
    })
    .filter((step): step is SupportedStep => Boolean(step));

  return {
    name: getString(parsed.name) || "Generated Workflow",
    steps: normalizedSteps,
  } satisfies WorkflowGenerationBlueprint;
}

export function buildWorkflowDefinitionFromBlueprint(
  blueprint: WorkflowGenerationBlueprint,
  context: WorkflowGenerationContext
): BuiltWorkflowDefinition {
  const warnings: string[] = [];
  const steps = [...(blueprint.steps || [])];

  if (steps.length === 0) {
    steps.push({
      type: "manual-trigger",
      data: {},
    });
    steps.push({
      type: "ai-generation",
      data: {},
    });
  }

  const firstType = steps[0]?.type;
  if (firstType !== "manual-trigger" && firstType !== "schedule-trigger") {
    steps.unshift({
      type: "manual-trigger",
      data: {},
    });
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  steps.forEach((step, index) => {
    const id = `generated-${index + 1}`;
    const data = sanitizeStepData(step, context, warnings);
    nodes.push({
      id,
      type: step.type,
      position: { x: 120 + index * 260, y: 220 },
      data,
    });

    if (index > 0) {
      edges.push({
        id: `edge-${index}`,
        source: `generated-${index}`,
        target: id,
        type: "deletable-edge",
      });
    }
  });

  return { nodes, edges, warnings };
}
