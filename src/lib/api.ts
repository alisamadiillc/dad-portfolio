import axios from "axios";

/**
 * Configured axios instance for the agency-api (api.alisamadii.com) — our own backend.
 *
 * The agency-api authenticates with its own scoped API key, so every request carries
 * `Authorization: Bearer <VITE_AGENCY_API_KEY>`. Use this `agencyApi` instance for all calls
 * to the agency-api; use raw `axios` for third-party URLs (e.g. presigned R2 upload URLs),
 * which reject the Bearer header.
 */
export const agencyApi = axios.create({
  baseURL: "https://api.alisamadii.com",
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_AGENCY_API_KEY}`,
  },
});
