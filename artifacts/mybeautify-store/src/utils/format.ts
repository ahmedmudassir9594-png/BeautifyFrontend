/**
 * Formatting utilities
 */

/** Formats a number as Indian Rupee (₹), default format for customer storefront */
export const formatCurrency = (val: number | undefined | null): string => {
  const num = typeof val === 'number' ? val : 0;
  return `₹ ${num.toFixed(2)}`;
};

/** Formats a number as USD ($), used in the editorial view */
export const money = (value = 0): string => `$${value.toFixed(2)}`;

/** Extracts 2-letter uppercase initials from a name */
export const initials = (name = 'Guest'): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
