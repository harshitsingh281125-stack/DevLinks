import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AboutPage } from "@/routes/AboutPage";
import { DashboardPage } from "@/routes/DashboardPage";
import { HomePage } from "@/routes/HomePage";
import { NotFoundPage } from "@/routes/NotFoundPage";
import { PrivacyPage } from "@/routes/PrivacyPage";
import { PublicCollectionPage } from "@/routes/PublicCollectionPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "app",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "public/collections/:slug",
        element: <PublicCollectionPage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "privacy",
        element: <PrivacyPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
