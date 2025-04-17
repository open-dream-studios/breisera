export const formatSubs = (subs: string | number): string => {
  const num = typeof subs === "string" ? parseInt(subs, 10) : subs;
  if (isNaN(num)) return "0";
  if (num < 1000) return `${num}`;
  if (num < 1_000_000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
};