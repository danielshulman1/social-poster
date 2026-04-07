const KNOWN_HOST_CORRECTIONS: Record<string, string> = {
    "socailposter.easy-ai.co.uk": "socialposter.easy-ai.co.uk",
};

export const normalizeEnv = (value?: string | null) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const extractCandidates = (value?: string | null) =>
    normalizeEnv(value)
        .split(/[\r\n,\s]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);

const normalizeBaseUrlCandidate = (value: string) => {
    const normalized = normalizeEnv(value);
    if (!normalized) return "";

    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;

    try {
        const url = new URL(withProtocol);
        const correctedHost = KNOWN_HOST_CORRECTIONS[url.hostname];
        if (correctedHost) {
            url.hostname = correctedHost;
        }

        url.pathname = "";
        url.search = "";
        url.hash = "";

        return url.origin;
    } catch {
        return "";
    }
};

export const getAppBaseUrl = (requestUrl?: string) => {
    const candidates = [
        ...extractCandidates(process.env.NEXT_PUBLIC_APP_URL),
        ...extractCandidates(process.env.NEXTAUTH_URL),
        ...extractCandidates(process.env.VERCEL_PROJECT_PRODUCTION_URL),
        ...extractCandidates(process.env.VERCEL_URL),
    ];

    if (requestUrl) {
        candidates.push(requestUrl);
    }

    for (const candidate of candidates) {
        const normalized = normalizeBaseUrlCandidate(candidate);
        if (normalized) {
            return normalized;
        }
    }

    return "";
};
