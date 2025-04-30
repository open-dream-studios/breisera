import crypto from "crypto"

export const formatStripeDate = (date: any) => {
  return date
    ? new Date(date * 1000).toISOString().slice(0, 19).replace("T", " ")
    : null;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  return date.toLocaleString("en-US", options);
};

export const formatStripeAmount = (amount: string) => {
  return (parseInt(amount) / 100).toFixed(2);
};

export const capitalizeFirstLetter = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};

export const validateEmail = (email: string) => {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
};

export const removeWhiteSpace = (input: string) => {
  return input.replace(/\s+/g, '')
}

export const generateUniqueId = () => {
  return crypto.randomBytes(15).toString("hex");
};

export function secondsToISO8601(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  let isoString = 'PT';
  if (hours) isoString += `${hours}H`;
  if (minutes) isoString += `${minutes}M`;
  if (secs) isoString += `${secs}S`;
  
  return isoString;
}

export function iso8601ToSeconds(isoString: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(\.\d+)?)S)?/;
  const match = isoString.match(regex);
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return (
    (parseInt(hours || "0") * 3600) +
    (parseInt(minutes || "0") * 60) +
    (parseFloat(seconds || "0"))   
  );
}
