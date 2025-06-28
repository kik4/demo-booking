import { TOKYO_TZ_OFFSET } from "./constants";

export function timeToDecimalHours(time: Date): number {
  const zoned = new Date(time.getTime() + time.getTimezoneOffset() * 60 * 1000);
  const res =
    zoned.getUTCHours() + TOKYO_TZ_OFFSET + zoned.getUTCMinutes() / 60;
  return res >= 24 ? res - 24 : res;
}
