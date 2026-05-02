import { readFileSync } from "node:fs";

import { getInput, type MessageWithoutWeather } from "../input";
import type { Weather } from "../types/index";
import {
  describeTomorrowPrecipOutlook,
  getTomorrowSunnyOrRainy,
} from "../search/weather";
import type { DouyinInspirationHit } from "../search/douyin";
import { searchDouyinInspirationHints } from "../search/douyin";
import { type OutingDateContext, getOutingDateContext } from "../time/outing";

let cachedPlannerSystemPrompt: string | undefined;

/** 行程种草系统提示全文（Markdown），来自与本文件同目录的 `prompt.md`。 */
export function loadOutingPlannerSystemPromptMarkdown(): string {
  cachedPlannerSystemPrompt ??= readFileSync(
    new URL("./prompt.md", import.meta.url),
    "utf8",
  );
  return cachedPlannerSystemPrompt;
}

function genderLabelCn(
  g: MessageWithoutWeather["gender"],
): string {
  if (g === "male") return "男";
  if (g === "female") return "女";
  return "未填（不限 / 可按中性语气写）";
}

function hitsToMarkdownBullets(hits: DouyinInspirationHit[]): string {
  if (hits.length === 0) {
    return "（本轮未能拿到有效网页摘要——必应可能未收录相关 `so.douyin.com` 页面、或触发了风控验证。请仍可大胆给方案，但不要假装你看过抖音视频。）";
  }
  return hits
    .map((h, i) => {
      const linkLine =
        h.pageUrl !== undefined ? `\n  - 公开页线索: ${h.pageUrl}` : "";
      return `${i + 1}. **${h.title}**\n   - 摘要摘录: ${h.snippet}${linkLine}`;
    })
    .join("\n");
}

/** 拼装给模型读的「结构化事实」用户消息正文。 */
export function formatOutingPlannerUserFactsMessage(options: {
  messageSansWeather: MessageWithoutWeather;
  weather: Weather;
  date: OutingDateContext;
  douyinHits: DouyinInspirationHit[];
}): string {
  const { messageSansWeather: m, weather, date, douyinHits } = options;

  const peopleLine =
    m.numberOfPeople >= 2
      ? `- 几人: ${String(m.numberOfPeople)}\n- 同行关系${m.relationship !== undefined && m.relationship.trim() !== "" ? "" : "（待补）"}: ${m.relationship ?? "______（请用你的话委婉确认或给普适双人方案）"}`
      : `- 几人: ${String(m.numberOfPeople)}（单人；不要臆造同伴）`;

  const extraText =
    m.text.trim() !== ""
      ? m.text.trim()
      : "（用户未额外补充偏好——你可以主动问一句「更想填饱肚子还是先拍照」之类的话术，同时先给两三个方向）";

  const weatherBrief = describeTomorrowPrecipOutlook(weather);

  return [
    "## 用户结构化信息（事实；勿编造未给字段）",
    `- city: ${m.city}`,
    `- age: ${String(m.age)}`,
    `- gender: ${genderLabelCn(m.gender)}`,
    peopleLine,
    `- text（额外描述）: ${extraText}`,
    "",
    "## 明天天气（已由程序拉取 Xiaomi 天气预报并归纳为 sunny / rainy 两档）",
    `- 归类码 \`weather\`: \`${weather}\``,
    `- 套用人话总结: ${weatherBrief}`,
    "",
    "##「今天 / 明天」与时间口吻",
    `- 采用的时区: ${date.timeZone}`,
    `- 当前当地（约）: ${date.localNowZh}`,
    `- 今天（完整日历）: ${date.calendarTodayZh}`,
    `- 明天（完整日历）: ${date.calendarTomorrowZh}`,
    `- datePolicyLineZh: ${date.datePolicyLineZh}`,
    "",
    "## 抖音搜索 · 必应网页检索灵感（`site:so.douyin.com`；仅保留抖音搜索域结果，供转述发散）",
    hitsToMarkdownBullets(douyinHits),
    "",
    "—— 请现在开始回答用户：给一个让人想出门的小小路线 / 点子组合，口吻要有活力但不假嗨。",
  ].join("\n");
}

/** 拉回明日晴雨 + 站内摘要 + Markdown 系统提示与用户事实，一步到位。 */
export async function buildOutingPlannerChatPayload(options: {
  messageSansWeather: MessageWithoutWeather;
  timeZone?: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<{
  systemPrompt: string;
  userFacts: string;
  mergedInput: ReturnType<typeof getInput>;
}> {
  const weather = await getTomorrowSunnyOrRainy(options.messageSansWeather);
  const mergedInput = getInput(
    { ...options.messageSansWeather, weather },
    weather,
  );

  const date = getOutingDateContext(
    options.now ?? new Date(),
    options.timeZone,
  );

  const douyinHits = await searchDouyinInspirationHints({
    city: options.messageSansWeather.city,
    fetchImpl: options.fetchImpl,
  });

  return {
    systemPrompt: loadOutingPlannerSystemPromptMarkdown(),
    userFacts: formatOutingPlannerUserFactsMessage({
      messageSansWeather: options.messageSansWeather,
      weather: mergedInput.weather,
      date,
      douyinHits,
    }),
    mergedInput,
  };
}

export type PlannerChatRolesMessage = {
  role: "system" | "user";
  content: string;
};

/** 直接变成常见 Chat Completions 所需的消息数组。 */
export async function buildOutingPlannerChatMessages(
  options: Parameters<typeof buildOutingPlannerChatPayload>[0],
): Promise<PlannerChatRolesMessage[]> {
  const { systemPrompt, userFacts } = await buildOutingPlannerChatPayload(
    options,
  );
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userFacts },
  ];
}
