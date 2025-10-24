import { actions } from "astro:actions";

export type SystemStatus =
  | "operational"
  | "degraded"
  | "outage"
  | "maintenance";

const STATUS_COLORS: Record<SystemStatus, string> = {
  operational: "bg-green-500",
  degraded: "bg-yellow-500",
  outage: "bg-red-500",
  maintenance: "bg-blue-500",
};

const STATUS_TRANSLATIONS: Record<SystemStatus, { en: string; sv: string }> = {
  operational: { en: "Operational", sv: "I drift" },
  degraded: { en: "Degraded", sv: "Nedsatt prestanda" },
  outage: { en: "Outage", sv: "Driftstörning" },
  maintenance: { en: "Maintenance", sv: "Underhåll" },
};

const CACHE_KEY = "systemStatusCache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedStatus {
  status: SystemStatus;
  timestamp: number;
}

/**
 * Updates the status indicator elements on the page with the given status and
 * optional text.
 *
 * @param status - The system status to display.
 * @param statusText - Optional text to display for the status.
 */
export function updateStatusIndicator(
  status: SystemStatus,
  statusText?: string,
) {
  const statusTextElement = document.getElementById("status-text");

  if (!statusTextElement) return;

  const pingDot = document.getElementById("status-dot-ping");
  const staticDot = document.getElementById("status-dot-static");

  if (!pingDot || !staticDot) return;

  const colorClass = STATUS_COLORS[status];

  Object.values(STATUS_COLORS).forEach((color) => {
    pingDot.classList.remove(color);
    staticDot.classList.remove(color);
  });

  pingDot.classList.add(colorClass);
  staticDot.classList.add(colorClass);

  if (statusText) {
    statusTextElement.textContent = statusText;
  }

  statusTextElement.setAttribute("data-status", status);
}

/**
 * Retrieves the cached system status if it exists and is not expired.
 *
 * @returns The cached status or null if not available or expired.
 */
function getCachedStatus(): SystemStatus | null {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) return null;

    const parsed: CachedStatus = JSON.parse(cachedData);
    const cacheAge = Date.now() - parsed.timestamp;

    if (cacheAge < CACHE_TTL_MS) {
      return parsed.status;
    }
  } catch (e) {
    console.warn("Failed to parse status cache:", e);
  }

  return null;
}

/**
 * Caches the given system status with a timestamp.
 *
 * @param status - The status to cache.
 */
function setCachedStatus(status: SystemStatus) {
  try {
    const cacheData: CachedStatus = {
      status,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn("Failed to cache status:", e);
  }
}

/**
 * Fetches the system status from the server or cache.
 *
 * @returns The system status or null if failed.
 */
async function fetchStatus(): Promise<SystemStatus | null> {
  try {
    const cachedStatus = getCachedStatus();
    if (cachedStatus) {
      return cachedStatus;
    }

    const result = await actions.getSystemStatus.fetch();

    if (result.error) {
      console.error("Failed to fetch status from action:", result.error);
      return null;
    }

    setCachedStatus(result.data.status);

    return result.data.status;
  } catch (error) {
    console.error("Failed to fetch status:", error);

    const statusTextElement = document.getElementById("status-text");
    if (statusTextElement) {
      const currentStatus = statusTextElement.getAttribute(
        "data-status",
      ) as SystemStatus | null;
      if (currentStatus) {
        return currentStatus;
      }
    }

    return null;
  }
}

/**
 * Refreshes the status indicator by fetching the latest status and updating the
 * UI.
 */
export async function refreshStatus() {
  try {
    const result = await fetchStatus();
    if (result) {
      const htmlLang = document.documentElement.lang || "en";
      const lang = (htmlLang.startsWith("sv") ? "sv" : "en") as "en" | "sv";
      const statusText = STATUS_TRANSLATIONS[result][lang];

      updateStatusIndicator(result, statusText);
    }
  } catch (error) {
    console.error("Failed to refresh status:", error);
  }
}
