import { type Message } from "./types/index";
import { type Weather } from "./types/index";
import { type apiConfig } from "./types/api";
/** 与 `getInput` 第一参数一致，但尚未填入明日预报（可先据此请求天气）。 */
export type MessageWithoutWeather = Omit<Message, "weather">;

/** 天气接口所需位置信息（城市或经纬度）。 */
export type WeatherLocationInput =
  | { latitude: number; longitude: number }
  | Pick<MessageWithoutWeather, "city">;

export function getInput(message: Message, weather: Weather) {
    return {
        text: message.text,
        city: message.city,
        age: message.age,
        gender: message.gender,
        numberOfPeople: message.numberOfPeople,
        relationship: message.relationship,
        weather: weather,
    }
}

export function getApiConfig(config: apiConfig) {
    return {
        baseURL: config.baseURL,
        apiKey: config.apiKey,
        model: config.model,
    };
}