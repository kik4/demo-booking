export function timeToDecimalHours(time: Date): number {
  return time.getHours() + time.getMinutes() / 60;
}
