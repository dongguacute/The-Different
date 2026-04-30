/** 与 `Message.weather` 一致：明日预报等业务里复用。 */
export type Weather = "sunny" | "rainy";

export type Message = {
  text: string;
  city: string;
  age: number;
  gender: "male" | "female" | undefined;
  numberOfPeople: number;
  relationship: string;
  weather: Weather;
};