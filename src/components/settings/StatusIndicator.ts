type SystemStatus =
  | "operational"
  | "partial_outage"
  | "degraded_performance"
  | "full_outage"
  | "maintenance";

const STATUS_COLORS: Record<SystemStatus, string> = {
  operational: "bg-green-500",
  partial_outage: "bg-yellow-500",
  degraded_performance: "bg-yellow-500",
  full_outage: "bg-red-500",
  maintenance: "bg-blue-500",
};

const STATUS_TRANSLATIONS: Record<SystemStatus, { en: string; sv: string }> = {
  operational: { en: "Operational", sv: "Normal drift" },
  partial_outage: { en: "Partial outage", sv: "Driftstörningar" },
  degraded_performance: { en: "Degraded performance", sv: "Nedsatt prestanda" },
  full_outage: { en: "Outage", sv: "Driftavbrott" },
  maintenance: { en: "Maintenance", sv: "Underhåll" },
};

const STATUS_API_URL = "https://statuspage.incident.io/newgent/api/v1/summary";
const CACHE_KEY = "systemStatusCache";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface IncidentIoResponse {
  ongoing_incidents?: {
    current_worst_impact?: string;
  }[];
  in_progress_maintenances?: unknown[];
}

interface CachedStatus {
  status: SystemStatus;
  timestamp: number;
}

const impactToStatus: Record<string, SystemStatus> = {
  partial_outage: "partial_outage",
  degraded_performance: "degraded_performance",
  full_outage: "full_outage",
};

/**
 * Updates the status indicator elements on the page with the given status and
 * optional text.
 *
 * @param status - The system status to display.
 * @param statusText - Optional text to display for the status.
 */
function updateStatusIndicator(status: SystemStatus, statusText?: string) {
  const statusTextElement = document.getElementById("status-text");
  const pingDot = document.getElementById("status-dot-ping");
  const staticDot = document.getElementById("status-dot-static");

  if (!statusTextElement || !pingDot || !staticDot) return;

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
 * Fetches the system status from the incident.io API or cache.
 *
 * @returns The system status or null if failed.
 */
async function fetchStatus(): Promise<SystemStatus | null> {
  try {
    const cachedStatus = getCachedStatus();
    if (cachedStatus) return cachedStatus;

    const response = await fetch(STATUS_API_URL);
    if (!response.ok) {
      console.error("Failed to fetch status from API:", response.statusText);
      return null;
    }

    const data: IncidentIoResponse = await response.json();
    const worstImpact = data.ongoing_incidents?.[0]?.current_worst_impact;
    const status: SystemStatus = worstImpact
      ? impactToStatus[worstImpact] || "operational"
      : data.in_progress_maintenances?.length
        ? "maintenance"
        : "operational";

    setCachedStatus(status);
    return status;
  } catch (error) {
    console.error("Failed to fetch status:", error);
    return (
      (document
        .getElementById("status-text")
        ?.getAttribute("data-status") as SystemStatus) || null
    );
  }
}

/**
 * Refreshes the status indicator by fetching the latest status and updating the
 * UI.
 */
async function refreshStatus() {
  const result = await fetchStatus();
  if (result) {
    const lang = (document.documentElement.lang || "en").startsWith("sv")
      ? "sv"
      : "en";
    const statusText = STATUS_TRANSLATIONS[result][lang as "en" | "sv"];
    updateStatusIndicator(result, statusText);
  }
}

document.addEventListener("DOMContentLoaded", refreshStatus);
