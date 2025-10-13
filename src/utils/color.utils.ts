/**
 * Converts a hexadecimal color string to an RGB object.
 *
 * @param hex - The hexadecimal color string (3 or 6 digits, with or without #
 *   prefix).
 * @returns An object with r, g, b properties representing the RGB values, or
 *   null if the input is invalid.
 */
export async function hexToRgb(
  hex: string,
): Promise<{ r: number; g: number; b: number } | null> {
  hex = hex.replace(/^#/, "");

  if (hex.length !== 3 && hex.length !== 6) {
    return null;
  }

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/**
 * Calculates the contrast color (black or white) for a given hex color based on
 * WCAG relative luminance formula.
 *
 * @param hex - The hexadecimal color string (3 or 6 digits, with or without #
 *   prefix).
 * @returns The contrast hex color ("#000" or "#FFF"), or null if the input is
 *   invalid.
 */
export async function getContrastHex(hex: string): Promise<string | null> {
  const rgb = await hexToRgb(hex);

  if (!rgb) {
    return null;
  }

  // Normalize RGB values from 0-255 to 0-1
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  // Apply gamma correction to adjust for human perceived brightness
  const adjust = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  // Calculate perceived brightness using weighted values for red, green, and blue
  const L = 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);

  // Use luminance threshold to determine contrast color (0.179 is the WCAG recommended cutoff)
  return L > 0.5 ? "#000" : "#FFF";
}
