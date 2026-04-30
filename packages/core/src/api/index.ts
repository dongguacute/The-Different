import OpenAI from "openai";
import type { ClientOptions } from "openai";

/**
 * 创建 OpenAI 官方或 **OpenAI 兼容** Chat API 客户端。
 *
 * - 不传 `baseURL` 时与官方 SDK 一致，默认 `OPENAI_API_KEY` / `OPENAI_BASE_URL` 等来自环境变量。
 * - 对接兼容服务时传入 `baseURL`（通常为带 `/v1` 的根地址），例如 LM Studio：`http://127.0.0.1:1234/v1`、OpenRouter：`https://openrouter.ai/api/v1`。
 */
export function createOpenAICompatibleClient(options?: ClientOptions): OpenAI {
  return new OpenAI(options);
}

export { OpenAI, type ClientOptions } from "openai";
