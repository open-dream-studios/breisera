export const formatDateForMySQL = (date) => {
  return date
    ? new Date(date * 1000).toISOString().slice(0, 19).replace("T", " ")
    : null;
};

export function formatTimeStamp(input) {
  const totalSeconds = Math.floor(input); // ignore decimal part

  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${hours}:${paddedMinutes}:${paddedSeconds}`
}