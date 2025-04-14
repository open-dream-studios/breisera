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