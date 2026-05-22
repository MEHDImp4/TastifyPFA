export const DEFAULT_BRAND_NAME = 'Tastify';

export const getBrandName = (name?: string | null) => {
  const trimmed = name?.trim();
  return trimmed || DEFAULT_BRAND_NAME;
};
