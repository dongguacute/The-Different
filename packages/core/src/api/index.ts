import OpenAI from "openai";
import type { ClientOptions } from "openai";
import {
  getApiConfig,
  getInput,
  type MessageWithoutWeather,
} from "../input";
import type { apiConfig } from "../types/api";
import { getTomorrowSunnyOrRainy } from "../search/weather";

/** 与官方 `ClientOptions` 一致，并可附加 `input.getApiConfig` 所用的 `api` 配置源。 */
export type CreateOpenAICompatibleClientOptions = ClientOptions & {
  api?: apiConfig;
};

/** 合并后的客户端构造参数（不含自定义字段 `api`）。 */
export function mergeOpenAICompatibleClientOptions(
  options?: CreateOpenAICompatibleClientOptions,
): ClientOptions {
  const { api, ...clientOptions } = options ?? {};
  const fromInput = api !== undefined ? getApiConfig(api) : undefined;
  return {
    ...(fromInput?.baseURL !== undefined ? { baseURL: fromInput.baseURL } : {}),
    ...(fromInput?.apiKey !== undefined ? { apiKey: fromInput.apiKey } : {}),
    ...clientOptions,
  };
}

/** `options.api` 经 `getApiConfig` 后的默认对话模型（若有）；请求时需传给 `model` 字段。 */
export function resolveChatModel(
  options?: CreateOpenAICompatibleClientOptions,
): string | undefined {
  const { api } = options ?? {};
  return api !== undefined ? getApiConfig(api).model : undefined;
}

/**
 * 创建 OpenAI 官方或 **OpenAI 兼容** Chat API 客户端。
 *
 * - 不传 `baseURL` 时与官方 SDK 一致，默认 `OPENAI_API_KEY` / `OPENAI_BASE_URL` 等来自环境变量。
 * - 对接兼容服务时传入 `baseURL`（通常为带 `/v1` 的根地址），例如 LM Studio：`http://127.0.0.1:1234/v1`、OpenRouter：`https://openrouter.ai/api/v1`。
 * - 若在选项里设置 `api`，会先经 `getApiConfig` 规范化再合并进客户端选项（其余字段其后展开，`api` 不会传给 SDK）。
 */
export function createOpenAICompatibleClient(
  options?: CreateOpenAICompatibleClientOptions,
): OpenAI {
  return new OpenAI(mergeOpenAICompatibleClientOptions(options));
}

/**
 * 按消息中的城市等信息拉取明日晴雨，并生成与 `getInput` 一致的合并输入（含 `weather`）。
 */
export async function buildInputWithTomorrowWeather(
  message: MessageWithoutWeather,
): Promise<ReturnType<typeof getInput>> {
  const weather = await getTomorrowSunnyOrRainy(message);
  return getInput({ ...message, weather }, weather);
}

export { getApiConfig } from "../input";
export type { apiConfig } from "../types/api";
export { OpenAI, type ClientOptions } from "openai";

export type { PlannerChatRolesMessage } from "../prompt/planner";
export {
  buildOutingPlannerChatMessages,
  buildOutingPlannerChatPayload,
  formatOutingPlannerUserFactsMessage,
  loadOutingPlannerSystemPromptMarkdown,
} from "../prompt/planner";
