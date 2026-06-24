export const getStrokeDashOffset = (percentage, radius = 64) => {
  const circumference = 2 * Math.PI * radius;
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));
  return circumference - (normalizedPercentage / 100) * circumference;
};