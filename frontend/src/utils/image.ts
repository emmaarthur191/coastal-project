/**
 * Safely transforms a base64 string or data URL into a valid image source.
 * Handles null/undefined check, already-prefixed data URLs, and raw base64 strings.
 * 
 * @param base64 The image data (raw base64 or full data URL)
 * @returns A string suitable for an <img> tag's src attribute
 */
export const getImageSrc = (base64: string | null | undefined): string => {
  if (!base64) return '/placeholder-avatar.png';

  // If it's already a full data URL, return as is
  if (base64.startsWith('data:')) {
    return base64;
  }

  // If it's only the base64 part, add the prefix (assuming jpeg for photos)
  return `data:image/jpeg;base64,${base64}`;
};
