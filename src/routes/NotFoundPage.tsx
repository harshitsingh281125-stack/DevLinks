import { Link } from "react-router-dom";
import { SiteLayout } from "@/components/site/SiteLayout";

export function NotFoundPage() {
  return (
    <SiteLayout>
      <div className="center-state" style={{ minHeight: "60dvh" }}>
        <p className="center-state-code">404</p>
        <h1 className="center-state-title">This page doesn’t exist.</h1>
        <p className="center-state-text">
          The link may be mistyped, or the page may have moved. If you followed a shared collection, ask
          its owner for a fresh link.
        </p>
        <Link to="/" className="btn btn-secondary">
          Go to the homepage
        </Link>
      </div>
    </SiteLayout>
  );
}
