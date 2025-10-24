import { ActionError, defineAction } from "astro:actions";
import {
  BETTERSTACK_API_TOKEN,
  BETTERSTACK_STATUS_PAGE_ID,
} from "astro:env/server";

export type SystemStatus =
  | "operational"
  | "degraded"
  | "outage"
  | "maintenance";

interface BetterStackStatusPageResponse {
  data: {
    attributes: {
      aggregate_state: string;
    };
  };
}

interface CachedStatus {
  status: SystemStatus;
  timestamp: number;
}

let statusCache: CachedStatus | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const API_BASE_URL = "https://uptime.betterstack.com/api/v2";

function mapBetterStackStatus(betterStackStatus: string): SystemStatus {
  switch (betterStackStatus.toLowerCase()) {
    case "operational":
      return "operational";
    case "degraded":
      return "degraded";
    case "downtime":
      return "outage";
    case "maintenance":
      return "maintenance";
    default:
      return "operational";
  }
}

export const getSystemStatus = {
  fetch: defineAction({
    accept: "json",
    handler: async () => {
      if (statusCache) {
        const cacheAge = Date.now() - statusCache.timestamp;
        if (cacheAge < CACHE_TTL_MS) {
          return {
            status: statusCache.status,
          };
        }
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/status-pages/${BETTERSTACK_STATUS_PAGE_ID}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${BETTERSTACK_API_TOKEN}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new ActionError({
            code: "BAD_GATEWAY",
            message: `Better Stack API returned ${response.status}: ${response.statusText}`,
          });
        }

        const data: BetterStackStatusPageResponse = await response.json();
        const betterStackStatus = data.data.attributes.aggregate_state;
        const mappedStatus = mapBetterStackStatus(betterStackStatus);

        statusCache = {
          status: mappedStatus,
          timestamp: Date.now(),
        };

        return {
          status: mappedStatus,
        };
      } catch (error) {
        console.error(
          "Failed to fetch system status from Better Stack:",
          error,
        );

        if (statusCache) {
          return {
            status: statusCache.status,
          };
        }

        if (error instanceof ActionError) {
          throw error;
        }

        return {
          status: "operational" as SystemStatus,
        };
      }
    },
  }),
};
