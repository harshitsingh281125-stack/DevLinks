import { Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-ink-950 text-sand-50">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,#07111f_0%,#0f172a_100%)]" />
      <div className="fixed inset-0 -z-10 bg-grid-fade bg-[size:48px_48px] opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <Outlet />
    </div>
  );
}
