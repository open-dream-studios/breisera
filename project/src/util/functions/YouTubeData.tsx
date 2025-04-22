export const formatSubs = (subs: string | number): string => {
  const num = typeof subs === "string" ? parseInt(subs, 10) : subs;
  if (isNaN(num)) return "0";
  if (num < 1000) return `${num}`;
  if (num < 1_000_000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
};

export function formatTimeStamp(input: number): string {
  const totalSeconds = Math.floor(input); // ignore decimal part

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  const paddedSeconds = String(seconds).padStart(2, '0');

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`;
}