import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { convex } from "@/lib/convex";

import { ErrorBoundary } from "@/components/error-boundary";
import { ProtectedRoute } from "@/components/protected-route";

import { AdminLayout } from "@/layouts/admin-layout";
import { CmsHome } from "@/pages/admin/cms-home";
import { Dashboard } from "@/pages/admin/dashboard";
import { ExperienceList } from "@/pages/admin/experience-list";
import { PostEditor } from "@/pages/admin/post-editor";
import { PostsList } from "@/pages/admin/posts-list";
import { ProjectsList } from "@/pages/admin/projects-list";
import { SiteSettings } from "@/pages/admin/site-settings";
import { SkillsList } from "@/pages/admin/skills-list";
import { BlogList } from "@/pages/blog/blog-list";
import { BlogPost } from "@/pages/blog/blog-post";
import Landing from "@/pages/landing";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Admin subtree — the only part that needs Clerk + the reactive Convex client.
 * Public pages render without either (they read via the HTTP client).
 */
function AdminApp() {
  const navigate = useNavigate();

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="text-muted-foreground mx-auto max-w-md p-8 text-center">
        Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>.env.local</code>{" "}
        and restart the dev server to enable the admin.
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      afterSignOutUrl="/admin"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ErrorBoundary>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="settings" element={<SiteSettings />} />
                <Route path="cms" element={<CmsHome />} />
                <Route path="cms/experience" element={<ExperienceList />} />
                <Route path="cms/skills" element={<SkillsList />} />
                <Route path="cms/projects" element={<ProjectsList />} />
                <Route path="cms/blog" element={<PostsList />} />
                <Route path="cms/blog/new" element={<PostEditor />} />
                <Route path="cms/blog/:id" element={<PostEditor />} />
              </Route>
            </Route>
          </Routes>
        </ErrorBoundary>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
