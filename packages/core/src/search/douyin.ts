/** 必应国内版（在内地通常比 DuckDuckGo 更易访问）。 */
const BING_CN_SEARCH = "https://cn.bing.com/search";
/** 备线：部分地区或网络环境下国际节点更稳。 */
const BING_GLOBAL_SEARCH = "https://www.bing.com/search";

/** 单次网页检索得到的一条可读摘要（来自抖音搜索域名下的公开页面标题与摘要）。 */
export type DouyinInspirationHit = {
  title: string;
  snippet: string;
  pageUrl?: string;
};

const CHROME_Windows_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function decodeHtmlEntities(raw: string): string {
  return raw
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** 必应结果里常见的跳转包装；无法可靠拆开时沿用原始 href（若仍非抖音域则外层会丢弃）。 */
function normalizeResultHref(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

/** 从搜索结果 URL 里尽量抠出抖音搜索的关键词，弱化千篇一律的标题「抖音搜索」。 */
export function inferTopicFromDouyinUrl(url: string): string | undefined {
  try {
    const u = new URL(url);
    const kw = u.searchParams.get("keyword");
    if (kw !== null && kw.trim() !== "") {
      return kw;
    }
  } catch {
    /* ignore */
  }
  try {
    const match = url.match(/keyword(?:=|%3D)([^&]+)/);
    const segment = match?.[1];
    if (!segment) return undefined;
    return decodeURIComponent(segment.replace(/\+/g, " "));
  } catch {
    return undefined;
  }
}

/** 组装面向 [抖音搜索](https://so.douyin.com/) 的站内检索式，交给网页搜索引擎使用。 */
export function buildDouyinSiteSearchQuery(city: string, extraHints?: string): string {
  const tail = (
    extraHints ??
    `${city} 好去处 OR ${city} 好玩 OR ${city} 打卡 OR ${city} 周末`
  ).trim();
  return `site:so.douyin.com ${tail}`;
}

function parseBingOrganicForDouyin(
  html: string,
  maxResults: number,
): DouyinInspirationHit[] {
  /** 必应网页结果块 `li.b_algo` */
  const algoRe =
    /<li[^>]*class="[^"]*\bb_algo\b[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;

  const hits: DouyinInspirationHit[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  algoRe.lastIndex = 0;

  while ((match = algoRe.exec(html)) !== null && hits.length < maxResults) {
    const block = match[1];
    if (block === undefined) continue;

    const hrefMatch = block.match(
      /<h2[^>]*>\s*<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    );
    if (!hrefMatch) continue;

    const hrefRaw = hrefMatch[1];
    if (hrefRaw === undefined) continue;

    const rawTitleHtml = hrefMatch[2] ?? "";
    const pageUrl = normalizeResultHref(hrefRaw);

    if (
      (!pageUrl.includes("so.douyin.com")) ||
      pageUrl.includes("bing.com/ck/")
    ) {
      continue;
    }

    if (pageUrl.endsWith("/readme") || pageUrl.includes("://so.douyin.com/readme")) {
      continue;
    }

    const snippetMatch = block.match(
      /<p\b[^>]*class="[^"]*b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    );
    const snippetText = snippetMatch?.[1] !== undefined ? snippetMatch[1] : "";

    const topic = inferTopicFromDouyinUrl(pageUrl);

    const key = pageUrl;
    if (seen.has(key)) continue;
    seen.add(key);

    hits.push({
      title: stripTags(topic ?? rawTitleHtml),
      snippet:
        snippetText.trim() !== "" ? stripTags(snippetText) : stripTags(rawTitleHtml),
      pageUrl,
    });
  }

  return hits;
}

async function fetchBingSerpHtml(
  base: string,
  query: string,
  fetchImpl: typeof fetch,
): Promise<string | undefined> {
  const url = new URL(base);
  url.searchParams.set("q", query);
  url.searchParams.set("setlang", "zh-hans");

  try {
    const res = await fetchImpl(url.href, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": CHROME_Windows_UA,
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.5",
      },
      redirect: "follow",
    });
    if (!res.ok) return undefined;

    const text = await res.text();
    if (/存在异常访问|CaptchaChallenge/i.test(text)) {
      return undefined;
    }
    return text;
  } catch {
    return undefined;
  }
}

/**
 * 通过 **必应**（内地优先 cn.bing.com）抓取 `site:so.douyin.com …` 的公开摘要。
 * DuckDuckGo 在多地不可用时请依赖此实现；若必应暂时无站内收录则列表可能较短。
 */
export async function searchDouyinInspirationHints(options: {
  city: string;
  extraHints?: string;
  maxResults?: number;
  fetchImpl?: typeof fetch;
}): Promise<DouyinInspirationHit[]> {
  const { city, extraHints, maxResults = 8, fetchImpl = globalThis.fetch } = options;

  const primaryQuery = buildDouyinSiteSearchQuery(city, extraHints);
  const fallbackMinimalQuery = `site:so.douyin.com ${city.trim()}`.trim();

  const sources = [primaryQuery];
  if (fallbackMinimalQuery !== primaryQuery) {
    sources.push(fallbackMinimalQuery);
  }

  const seen = new Set<string>();
  const merged: DouyinInspirationHit[] = [];

  const tryHarvest = (hits: DouyinInspirationHit[]): void => {
    for (const h of hits) {
      const k = h.pageUrl ?? h.title;
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(h);
      if (merged.length >= maxResults) break;
    }
  };

  for (const q of sources) {
    if (merged.length >= maxResults) break;

    const cnHtml = await fetchBingSerpHtml(BING_CN_SEARCH, q, fetchImpl);
    if (cnHtml !== undefined) {
      tryHarvest(parseBingOrganicForDouyin(cnHtml, maxResults - merged.length));
    }

    if (merged.length >= maxResults) break;

    const glHtml = await fetchBingSerpHtml(BING_GLOBAL_SEARCH, q, fetchImpl);
    if (glHtml !== undefined) {
      tryHarvest(parseBingOrganicForDouyin(glHtml, maxResults - merged.length));
    }
  }

  return merged;
}
