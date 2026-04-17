export const GOOGLE_SHEETS_TEMPLATE_FILENAME =
  "socialposter-google-sheets-template.csv";

const GOOGLE_SHEETS_TEMPLATE_HEADERS = [
  "content",
  "status",
  "image_url",
  "platform",
  "scheduled_at",
  "notes",
] as const;

const GOOGLE_SHEETS_TEMPLATE_ROWS = [
  GOOGLE_SHEETS_TEMPLATE_HEADERS,
  [
    "We just shipped a new workflow update. Put each post on its own row so the workflow can match this text with the image in the same row.",
    "",
    "https://example.com/image.png",
    "linkedin",
    "2026-04-17 09:00",
    "Leave status empty until the row is used. The default app mapping reads content from A, status from B, and image from C on the same row.",
  ],
  [
    "Share a quick educational post here. Leave image_url blank for text-only posts.",
    "",
    "",
    "facebook",
    "",
    "After the workflow uses a row it will mark the status cell as done.",
  ],
];

const escapeCsvCell = (value: string) => {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

export function buildGoogleSheetsTemplateCsv() {
  return GOOGLE_SHEETS_TEMPLATE_ROWS.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(",")
  ).join("\n");
}
