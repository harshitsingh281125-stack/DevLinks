import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { DashboardPage } from "@/routes/DashboardPage";
import { HomePage } from "@/routes/HomePage";
import { NotFoundPage } from "@/routes/NotFoundPage";
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
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
