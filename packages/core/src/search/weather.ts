import type {
  MessageWithoutWeather,
  WeatherLocationInput,
} from "../input";
import type { Weather } from "../types/index";

/** 小米天气非公开接口常量（社区常用参数，可能随时变更）。 */
const XIAOMI_WEATHER_BASE = "https://weatherapi.market.xiaomi.com/wtr-v3/weather/all";
const XIAOMI_APP_KEY = "weather20151024";
const XIAOMI_SIGN = "zUFJoAR2ZVrDy1vF3D07";

/** 含「雨/雪/冻雨/冰雹」等降水现象的代码，其余归为「非雨天」晴天侧。 */
const PRECIPITATION_CODES = new Set([
  3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 22, 23, 24, 25, 26, 27,
  28,
]);

export type { Weather };

/** 与历史命名兼容，等价于 `WeatherLocationInput`。 */
export type ResolveLocationInput = WeatherLocationInput;

export type { WeatherLocationInput };

function classifyDailyDayNight(dayCode: number, nightCode: number): Weather {
  if (PRECIPITATION_CODES.has(dayCode) || PRECIPITATION_CODES.has(nightCode)) {
    return "rainy";
  }
  return "sunny";
}

function parseNum(s: string): number {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : 99;
}

async function geocodeCityToLatLon(city: MessageWithoutWeather["city"]): Promise<{
  latitude: number;
  longitude: number;
}> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", city.trim());
  url.searchParams.set("countrycodes", "cn");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  const res = await fetch(url, {
    headers: {
      /** Nominatim 使用政策要求可识别的 User-Agent。 */
      "User-Agent": "The-Different-Core/0.1 (weather lookup)",
      "Accept-Language": "zh-CN",
    },
  });
  if (!res.ok) {
    throw new Error(`地理编码请求失败：${res.status}`);
  }
  const rows = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    importance?: number;
  }>;
  if (!rows.length) {
    throw new Error(`无法解析城市：${city}`);
  }
  const hit = [...rows].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))[0];
  if (!hit) {
    throw new Error(`无法解析城市：${city}`);
  }
  return {
    latitude: Number.parseFloat(hit.lat),
    longitude: Number.parseFloat(hit.lon),
  };
}

async function resolveLatLon(input: WeatherLocationInput): Promise<{
  latitude: number;
  longitude: number;
}> {
  if ("city" in input && !("latitude" in input)) {
    return geocodeCityToLatLon(input.city);
  }
  return input as { latitude: number; longitude: number };
}

function toWeatherLocationInput(
  input: WeatherLocationInput | MessageWithoutWeather,
): WeatherLocationInput {
  if ("text" in input) {
    return { city: input.city };
  }
  return input;
}

/**
 * 用小米天气接口拉取预报，只返回**明天**是 `'sunny'` 还是 `'rainy'`。
 *
 * 可传入 `WeatherLocationInput`，或与 `getInput` 第一参数相同但尚未含 `weather` 的 `MessageWithoutWeather`（仅使用其中的 `city`）。
 */
export async function getTomorrowSunnyOrRainy(
  input: WeatherLocationInput | MessageWithoutWeather,
): Promise<Weather> {
  const { latitude, longitude } = await resolveLatLon(toWeatherLocationInput(input));

  const url = new URL(XIAOMI_WEATHER_BASE);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("isLocated", "true");
  url.searchParams.set("days", "3");
  url.searchParams.set("appKey", XIAOMI_APP_KEY);
  url.searchParams.set("sign", XIAOMI_SIGN);
  url.searchParams.set("isGlobal", "false");
  url.searchParams.set("locale", "zh_cn");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`小米天气请求失败：${res.status}`);
  }

  const data = (await res.json()) as {
    forecastDaily?: {
      weather?: {
        status: number;
        value?: Array<{ from: string; to: string }>;
      };
    };
  };

  const daily = data.forecastDaily?.weather;
  if (daily?.status !== 0 || !daily.value?.[1]) {
    throw new Error("小米天气返回中缺少明日逐日预报");
  }

  const tomorrow = daily.value[1];
  const dayCode = parseNum(tomorrow.from);
  const nightCode = parseNum(tomorrow.to);

  return classifyDailyDayNight(dayCode, nightCode);
}

/** 明日晴雨归类后的可读说明，便于写入提示词或对外展示（与 {@link getTomorrowSunnyOrRainy} 同属一套口径）。 */
export function describeTomorrowPrecipOutlook(weather: Weather): string {
  return weather === "sunny"
    ? "明日整体偏干、降水风险低，户外走走很友好。"
    : "明日有较明显雨雪或湿滑时段的可能，室内外搭配更稳妥，出门记得带好雨具/保暖。";
}
