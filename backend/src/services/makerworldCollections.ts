import { IMPORT_BROWSER_USER_AGENT, IMPORT_TIMEOUT_SECONDS } from "../config";
import {
  extractJsonFromBrowserBody,
  fetchViaFlaresolverr,
  isFlaresolverrEnabled,
  looksLikeCloudflareBlock,
} from "./flaresolverr";
import { maybeSleep } from "../utils/concurrency";
import {
  isCaptchaChallenge,
  makerworldCaptchaCooloffActive,
  MakerworldAuthError,
  MakerworldCaptchaError,
  noteCaptchaChallenge,
} from "./makerworldCaptcha";

// Not behind Cloudflare. Private collections return 403 without the bearer token, so it's sent
// whenever available.
const COLLECTION_API_BASE = "https://makerworld.com/api/v1/design-service/favorites";
const COLLECTION_PAGE_SIZE = 20;
const COLLECTION_MAX_ENTRIES = 300;

export type MakerworldCollectionEntry = {
  designId: string;
  title: string;
  cover: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function collectionHeaders(bearerToken: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": IMPORT_BROWSER_USER_AGENT,
    Accept: "application/json",
    Referer: "https://makerworld.com/",
  };
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
  return headers;
}

// What a strict fetch returns for a collection MakerWorld says doesn't exist.
const NOT_FOUND = Symbol("not found");

class MakerworldCollectionFetchError extends Error {
  constructor(detail: string) {
    super(`Couldn't read the MakerWorld collection (${detail})`);
    this.name = "MakerworldCollectionFetchError";
  }
}

/** Retries once through FlareSolverr if Cloudflare ever appears. Shares the CAPTCHA cooldown and
 * `paceMs` convention with makerworldCloudApi.ts, since a large collection's pagination is its
 * own burst. A `strict` fetch answers NOT_FOUND only for a 404 or 410 and throws on any other
 * failure, so a sync never takes an outage for a deleted collection. */
async function fetchCollectionJson(url: string, bearerToken: string | null, paceMs?: number): Promise<unknown | null>;
async function fetchCollectionJson(
  url: string,
  bearerToken: string | null,
  paceMs: number | undefined,
  strict: true,
): Promise<unknown | typeof NOT_FOUND>;
async function fetchCollectionJson(
  url: string,
  bearerToken: string | null,
  paceMs?: number,
  strict = false,
): Promise<unknown | typeof NOT_FOUND | null> {
  const fail = (detail: string) => {
    if (strict) throw new MakerworldCollectionFetchError(detail);
    return null;
  };
  if (makerworldCaptchaCooloffActive()) throw new MakerworldCaptchaError();
  await maybeSleep(paceMs);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMPORT_TIMEOUT_SECONDS * 1000);
  try {
    const res = await fetch(url, {
      headers: collectionHeaders(bearerToken),
      redirect: "follow",
      signal: controller.signal,
    });
    // An edge challenge does not establish that the user's session was rejected.
    if (res.status === 403 && res.headers.get("cf-mitigated") === "challenge" && !(await isFlaresolverrEnabled())) {
      return fail("HTTP 403: blocked by a Cloudflare challenge; the MakerWorld session may still be valid");
    }
    if (res.status === 403 && looksLikeCloudflareBlock(res.headers) && (await isFlaresolverrEnabled())) {
      const solved = await fetchViaFlaresolverr(url, bearerToken ? `token=${bearerToken}` : null);
      if (!solved) return fail("blocked by Cloudflare");
      const data = extractJsonFromBrowserBody(solved.body);
      if (data === null) return fail("unreadable answer");
      if (isCaptchaChallenge(data)) {
        noteCaptchaChallenge();
        throw new MakerworldCaptchaError();
      }
      return data;
    }
    if (res.status === 401 || res.status === 403) throw new MakerworldAuthError();
    if (strict && (res.status === 404 || res.status === 410)) return NOT_FOUND;
    if (!res.ok) return fail(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.trim()) return fail("empty answer");
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return fail("unreadable answer");
    }
    if (isCaptchaChallenge(data)) {
      noteCaptchaChallenge();
      throw new MakerworldCaptchaError();
    }
    return data;
  } catch (err) {
    if (
      err instanceof MakerworldCaptchaError ||
      err instanceof MakerworldAuthError ||
      err instanceof MakerworldCollectionFetchError
    ) {
      throw err;
    }
    return fail(err instanceof Error ? err.message : "network error");
  } finally {
    clearTimeout(timeout);
  }
}

export function parseMakerworldCollectionUrl(url: string): { collectionId: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!parsed.hostname.toLowerCase().endsWith("makerworld.com")) return null;
  const match = parsed.pathname.match(/\/collections\/(\d+)/i);
  return match ? { collectionId: match[1] } : null;
}

export async function fetchMakerworldCollectionTitle(
  collectionId: string,
  bearerToken: string | null = null,
  paceMs?: number,
): Promise<string | null> {
  const data = await fetchCollectionJson(`${COLLECTION_API_BASE}/${collectionId}`, bearerToken, paceMs);
  if (!isRecord(data)) return null;
  return typeof data.title === "string" && data.title.trim() ? data.title.trim() : null;
}

/** For a sync: null when MakerWorld says the collection doesn't exist any more. Throws on anything
 * else that goes wrong, a CAPTCHA or a private collection included. */
export async function checkMakerworldCollection(
  collectionId: string,
  bearerToken: string | null,
  paceMs?: number,
): Promise<{ title: string | null } | null> {
  const data = await fetchCollectionJson(`${COLLECTION_API_BASE}/${collectionId}`, bearerToken, paceMs, true);
  if (data === NOT_FOUND) return null;
  if (!isRecord(data)) throw new MakerworldCollectionFetchError("unexpected answer");
  return { title: typeof data.title === "string" && data.title.trim() ? data.title.trim() : null };
}

/** maxItems is a safety cap against a misreported `total`, not a UX limit. `paceMs` is awaited
 * before every page, including the first. */
export async function fetchMakerworldCollectionEntries(
  collectionId: string,
  bearerToken: string | null = null,
  maxItems: number = COLLECTION_MAX_ENTRIES,
  paceMs?: number,
): Promise<{ total: number; entries: MakerworldCollectionEntry[]; truncated: boolean }> {
  const entries: MakerworldCollectionEntry[] = [];
  const seen = new Set<string>();
  let total = 0;
  let offset = 0;

  for (;;) {
    const url = `${COLLECTION_API_BASE}/${collectionId}/designs?seed=0&collectionId=${collectionId}&limit=${COLLECTION_PAGE_SIZE}&offset=${offset}`;
    const data = await fetchCollectionJson(url, bearerToken, paceMs, true);
    if (!isRecord(data) || !Array.isArray(data.hits) || !Number.isSafeInteger(data.total) || Number(data.total) < 0) {
      throw new MakerworldCollectionFetchError("unexpected listing page");
    }
    total = Number(data.total);
    if (offset + data.hits.length > total) throw new MakerworldCollectionFetchError("inconsistent listing total");
    if (!data.hits.length) {
      if (offset < total) throw new MakerworldCollectionFetchError("incomplete listing");
      break;
    }

    for (const hit of data.hits) {
      if (!isRecord(hit) || !/^[1-9]\d*$/.test(String(hit.id))) {
        throw new MakerworldCollectionFetchError("missing or invalid model identity");
      }
      const designId = String(hit.id);
      if (seen.has(designId)) throw new MakerworldCollectionFetchError("repeated model identity; retry the listing");
      seen.add(designId);
      entries.push({
        designId,
        title: typeof hit.title === "string" && hit.title.trim() ? hit.title.trim() : `Design ${hit.id}`,
        cover: typeof hit.cover === "string" && hit.cover.trim() ? hit.cover.trim() : null,
      });
      if (entries.length >= maxItems) break;
    }

    offset += data.hits.length;
    if (entries.length >= maxItems || entries.length >= total) break;
  }

  return { total, entries, truncated: total > entries.length };
}
