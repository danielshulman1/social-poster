-- Add a dedicated Gemini (Google AI Studio) API key, separate from the
-- existing googleApiKey (which is used for Google Sheets / Cloud APIs).
ALTER TABLE "User"
ADD COLUMN "geminiApiKey" TEXT;
