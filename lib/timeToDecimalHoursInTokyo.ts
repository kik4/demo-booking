import { TOKYO_TZ_OFFSET } from "../constants/timeZone";

export function timeToDecimalHoursInTokyo(time: Date): number {
  const res = time.getUTCHours() + TOKYO_TZ_OFFSET + time.getUTCMinutes() / 60;
  return res >= 24 ? res - 24 : res;
}
