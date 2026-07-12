// Clerk <-> Convex integration. Requires:
// 1. Clerk dashboard -> JWT Templates -> new template from the "Convex"
//    preset (name must stay `convex`).
// 2. Convex env var CLERK_JWT_ISSUER_DOMAIN=<Issuer URL from that template>
//    (dashboard Settings -> Environment Variables, or `npx convex env set`).
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
