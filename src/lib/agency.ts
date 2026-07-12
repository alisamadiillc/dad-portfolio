import { AgencyClient } from "@alisamadiillc/agency-api";

// Set VITE_AGENCY_API_KEY in .env.local, then restart `pnpm dev`.
const apiKey = import.meta.env.VITE_AGENCY_API_KEY as string | undefined;

export const agency = new AgencyClient(apiKey || "ak_live_placeholder");
