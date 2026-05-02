import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-panel backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Page not found</h1>
        <p className="mt-4 text-sand-200/75">
          The route exists in the app shell now, but this path does not.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-ink-950"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
