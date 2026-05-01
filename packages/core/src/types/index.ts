export type { apiConfig } from "./api.ts";

/** 与 `Message.weather` 一致：明日预报等业务里复用。 */
export type Weather = "sunny" | "rainy";

export type Message = {
  /** 用户补充想说的场景、偏好或禁忌 */
  text: string;
  city: string;
  age: number;
  /** 男 / 女；可留空（undefined）表示不区分或不填 */
  gender: "male" | "female" | undefined;
  numberOfPeople: number;
  /** 两人及以上时填写关系（如闺蜜、情侣、亲子）；单人可省略 */
  relationship?: string;
  weather: Weather;
};