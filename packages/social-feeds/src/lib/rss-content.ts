export type RssItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
};

export type ArticleExtract = {
    sourceUrl: string;
    title: string;
    description: string;
    content: string;
};

const decodeHtml = (input: string) =>
    input
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

const stripTags = (input: string) =>
    decodeHtml(input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());

const extractMeta = (html: string, keys: string[]) => {
    for (const key of keys) {
        const re = new RegExp(
            `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
            "i",
        );
        const match = html.match(re);
        if (match?.[1]) return decodeHtml(match[1]);
    }
    return "";
};

const extractTag = (xml: string, tag: string) => {
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    if (!match?.[1]) return "";
    return decodeHtml(
        match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim(),
    );
};

export const parseRssItems = (xml: string): RssItem[] => {
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    return itemMatches.map((itemXml) => ({
        title: extractTag(itemXml, "title"),
        link: extractTag(itemXml, "link"),
        description: stripTags(extractTag(itemXml, "description")),
        pubDate: extractTag(itemXml, "pubDate"),
    }));
};

const looksLikeUrlWithoutScheme = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || /\s/.test(trimmed)) return false;
    return /^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(trimmed);
};

export const resolveRssInputToRequestUrl = (
    rawInput: string,
): { requestUrl: string; kind: "url" | "query"; query?: string } => {
    const input = rawInput.trim();
    if (!input) return { requestUrl: "", kind: "url" };

    if (input.startsWith("http://") || input.startsWith("https://")) {
        try {
            const asUrl = new URL(input);
            const googleNewsRss = toGoogleNewsRssUrl(asUrl);
            return { requestUrl: googleNewsRss || input, kind: "url" };
        } catch {
            return { requestUrl: input, kind: "url" };
        }
    }

    if (looksLikeUrlWithoutScheme(input)) {
        return { requestUrl: `https://${input}`, kind: "url" };
    }

    return {
        requestUrl: `https://news.google.com/rss/search?q=${encodeURIComponent(input)}&hl=en-US&gl=US&ceid=US:en`,
        kind: "query",
        query: input,
    };
};

const toGoogleNewsRssUrl = (url: URL): string | null => {
    const host = url.hostname.toLowerCase();
    if (!host.endsWith("news.google.com")) return null;

    const path = url.pathname || "/";
    if (path.startsWith("/rss")) return url.toString();

    const next = new URL(url.toString());
    if (path === "/" || path.startsWith("/topstories")) {
        next.pathname = "/rss";
        return next.toString();
    }

    // For most Google News pages, the RSS URL is the same path prefixed with `/rss`.
    next.pathname = `/rss${path.startsWith("/") ? "" : "/"}${path}`;
    return next.toString();
};

const decodeBase64UrlSafeBytes = (encoded: string): Uint8Array | null => {
    const BufferCtor = (globalThis as any).Buffer;
    if (!BufferCtor) return null;

    let normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) normalized += "=";
    try {
        return BufferCtor.from(normalized, "base64") as Uint8Array;
    } catch {
        return null;
    }
};

export const tryDecodeGoogleNewsRssLink = (maybeGoogleNewsUrl: string): string | null => {
    try {
        const url = new URL(maybeGoogleNewsUrl);
        if (!url.hostname.endsWith("news.google.com")) return null;

        const encoded = url.pathname.split("/").filter(Boolean).pop();
        if (!encoded) return null;

        const bytes = decodeBase64UrlSafeBytes(encoded);
        if (!bytes) return null;

        // Try to find a literal URL in the decoded bytes.
        const BufferCtor = (globalThis as any).Buffer;
        if (!BufferCtor?.isBuffer?.(bytes)) return null;
        const buf = bytes as any;

        const start = buf.indexOf("http");
        if (typeof start !== "number" || start < 0) return null;

        let end = buf.length;
        for (let i = start; i < buf.length; i++) {
            const b = buf[i] as number;
            if (b < 0x20 || b === 0x7f) {
                end = i;
                break;
            }
        }

        const decoded = buf.slice(start, end).toString("utf8").trim();
        return decoded.startsWith("http://") || decoded.startsWith("https://") ? decoded : null;
    } catch {
        return null;
    }
};

export const normalizeRssItemLink = (link: string) =>
    tryDecodeGoogleNewsRssLink(link) || link;

export const fetchArticleExtract = async (articleUrl: string): Promise<ArticleExtract> => {
    const resolvedUrl = normalizeRssItemLink(articleUrl);

    const articleRes = await fetch(resolvedUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SocialPosterBot/1.0)",
            Accept: "text/html,application/xhtml+xml",
        },
    });

    if (!articleRes.ok) {
        throw new Error(`Failed to fetch article: HTTP ${articleRes.status}`);
    }

    const finalUrl = articleRes.url || resolvedUrl;
    const html = await articleRes.text();
    const title =
        extractMeta(html, ["og:title", "twitter:title"]) ||
        (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
    const description = extractMeta(html, ["og:description", "description", "twitter:description"]);

    const paragraphMatches = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const content = paragraphMatches
        .map((p) => stripTags(p))
        .filter((p) => p.length > 40)
        .slice(0, 12)
        .join("\n")
        .slice(0, 4000);

    if (!title && !content) {
        throw new Error("Could not extract readable article content from this URL.");
    }

    return {
        sourceUrl: finalUrl,
        title,
        description,
        content,
    };
};

export const formatArticleExtractForPrompt = (
    extract: ArticleExtract,
    fallback?: { title?: string; description?: string },
) => {
    const title = extract.title || fallback?.title || "Untitled";
    const description = extract.description || fallback?.description || "N/A";
    const content = extract.content || extract.description || fallback?.description || fallback?.title || "";

    return `SOURCE_URL: ${extract.sourceUrl}\nTITLE: ${title}\nDESCRIPTION: ${description}\nCONTENT:\n${content}`;
};

export const fetchRssFirstItemArticlePrompt = async (
    rssInput: string,
): Promise<
    | { ok: true; promptText: string; details: { rssRequestUrl: string; item: RssItem; articleUrl: string } }
    | { ok: false; error: string; details?: { rssRequestUrl?: string } }
> => {
    const { requestUrl } = resolveRssInputToRequestUrl(rssInput);
    if (!requestUrl) return { ok: false, error: "No RSS feed URL or query provided." };

    const rssRes = await fetch(requestUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SocialPosterBot/1.0)" },
    });

    if (!rssRes.ok) {
        return {
            ok: false,
            error: `RSS fetch failed: HTTP ${rssRes.status}`,
            details: { rssRequestUrl: requestUrl },
        };
    }

    const rssXml = await rssRes.text();
    const items = parseRssItems(rssXml);
    const firstItem = items.find((i) => i.link);

    if (!firstItem?.link) {
        return {
            ok: false,
            error: "RSS Feed found but no items detected.",
            details: { rssRequestUrl: requestUrl },
        };
    }

    const articleUrl = normalizeRssItemLink(firstItem.link);

    try {
        const extract = await fetchArticleExtract(articleUrl);
        return {
            ok: true,
            promptText: formatArticleExtractForPrompt(extract, {
                title: firstItem.title,
                description: firstItem.description,
            }),
            details: { rssRequestUrl: requestUrl, item: firstItem, articleUrl: extract.sourceUrl },
        };
    } catch {
        // Fallback when the article page can't be parsed/fetched reliably.
        return {
            ok: true,
            promptText:
                `SOURCE_URL: ${articleUrl}\n` +
                `TITLE: ${firstItem.title || "Untitled"}\n` +
                `DESCRIPTION: ${firstItem.description || "N/A"}\n` +
                `CONTENT:\n${firstItem.description || firstItem.title || ""}`,
            details: { rssRequestUrl: requestUrl, item: firstItem, articleUrl },
        };
    }
};
