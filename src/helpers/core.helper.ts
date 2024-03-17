export const createOTP = (length: number) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  return Math.floor(Math.random() * (max - min) + min);
};
