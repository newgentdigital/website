import { statSync } from "fs";
import { join } from "path";

/**
 * Converts a number of bytes to target unit. Units are case-insensitive and use
 * base 1024.
 *
 * @param bytes - The number of bytes to convert.
 * @param unit - The target unit ('b', 'kb', 'mb', 'gb').
 * @returns The converted number.
 * @throws Throws an error if the unit is invalid.
 */
export async function convertBytes(
  bytes: number,
  unit: string,
): Promise<number> {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
  };

  const normalizedUnit = unit.toLowerCase();
  if (!(normalizedUnit in units)) {
    throw new Error(
      `Invalid unit: "${unit}". (${Object.keys(units).join(", ")})`,
    );
  }

  return bytes / units[normalizedUnit];
}

/**
 * Retrieves the size of a file in bytes, optionally converted to a unit.
 *
 * @param filePath - The relative path to the file.
 * @param unit - Optional unit to convert to ('b', 'kb', 'mb', 'gb'). If
 *   undefined, returns bytes.
 * @returns A promise that resolves the file size in the specified unit.
 * @throws Throws an error if the file cannot be accessed or if the unit is
 *   invalid.
 */
export async function getFileSize(
  filePath: string,
  unit?: string,
): Promise<number> {
  try {
    const fullPath = join(process.cwd(), filePath);
    const fileSize = statSync(fullPath).size;

    if (unit) {
      return await convertBytes(fileSize, unit);
    }

    return fileSize;
  } catch (error) {
    throw new Error(
      `Unable to get '${filePath}' size: ${(error as Error).message}`,
    );
  }
}
