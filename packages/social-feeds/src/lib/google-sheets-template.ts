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
    "2026-06-01 09:00",
    "scheduled_at is the post time in your sheet's local timezone (YYYY-MM-DD HH:MM). Leave status empty until the row is used; the workflow marks it done after posting.",
  ],
  [
    "Share a quick educational post. Leave the image cell blank for text-only posts.",
    "",
    "",
    "facebook",
    "2026-06-02 14:30",
    "Default column mapping: content=A, status=B, image=C, platform=D, scheduled_at=E.",
  ],
  [
    "You can drop an image right into column C via Insert > Image > Insert image in cell. The workflow reads the underlying =IMAGE(\"url\") formula and uploads the picture to the platform.",
    "",
    "",
    "twitter",
    "2026-06-03 08:00",
    "Or paste a public URL into column C. Both forms work.",
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
