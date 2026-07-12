/// <reference types="vite/client" />

declare module "@fontsource-variable/outfit";

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_CONVEX_URL: string;
  readonly VITE_AGENCY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
