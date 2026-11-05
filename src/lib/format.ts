export const CURRENCY_SYMBOL = "₦";

/**
 * Formats a number as a Naira currency string.
 * @param amount - The numerical amount to format.
 * @param includeDecimals - Whether to include kobo (decimals). Defaults to false for amounts >= 1000.
 * @returns A formatted string like ₦1,200,000
 */
export const formatPrice = (amount: number, includeDecimals?: boolean): string => {
  const shouldIncludeDecimals = includeDecimals ?? !Number.isInteger(amount);
  
  return `${CURRENCY_SYMBOL}${amount.toLocaleString("en-NG", {
    minimumFractionDigits: shouldIncludeDecimals ? 2 : 0,
    maximumFractionDigits: shouldIncludeDecimals ? 2 : 0,
  })}`;
};
