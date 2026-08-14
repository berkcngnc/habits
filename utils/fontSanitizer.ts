/**
 * Sanitizes characters. Previously used to strip Turkish characters for fonts that didn't support them.
 * Now simply returns the text since Pixelify Sans supports Latin Extended.
 */
export function sanitizeForPixelFont(text: string): string {
  if (!text) return '';
  return text;
}

/**
 * Safely converts text to uppercase.
 */
export function toPixelUpper(text: string): string {
  if (!text) return '';
  return text.toLocaleUpperCase();
}
