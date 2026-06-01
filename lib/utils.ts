const formatCompactNumber = (value: number): string =>
  value.toFixed(1).replace(/\.0$/, "");

const EURO_SYMBOL = "\u20AC";

export const formatPrice = (value: number | string): string => {
  const price = Number(value);

  if (!Number.isFinite(price)) {
    return `${EURO_SYMBOL}0`;
  }

  const absolutePrice = Math.abs(price);
  const sign = price < 0 ? "-" : "";

  if (absolutePrice >= 1000000) {
    return `${sign}${EURO_SYMBOL}${formatCompactNumber(
      absolutePrice / 1000000,
    )}M`;
  }

  if (absolutePrice >= 100000) {
    return `${sign}${EURO_SYMBOL}${formatCompactNumber(absolutePrice / 1000)}K`;
  }

  return `${sign}${EURO_SYMBOL}${absolutePrice.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
};

export const formatAreaSqft = (value: number | string): string =>
  `${value} ft\u00B2`;

export const formatPriceRange = (
  minPrice: number | string | null,
  maxPrice: number | string | null,
): string => {
  if (minPrice !== null && maxPrice !== null) {
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  }

  if (minPrice !== null) {
    return `From ${formatPrice(minPrice)}`;
  }

  if (maxPrice !== null) {
    return `Up to ${formatPrice(maxPrice)}`;
  }

  return "Any price";
};
