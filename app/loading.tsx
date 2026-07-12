export default function Loading() {
  return (
    <main className="shell skeleton-page" aria-busy="true" aria-label="Loading page">
      <header className="skeleton-topbar">
        <i className="skeleton skeleton-brand" />
        <i className="skeleton skeleton-nav" />
        <i className="skeleton skeleton-actions" />
      </header>
      <section className="skeleton-heading"><div><i className="skeleton" /><i className="skeleton" /></div><i className="skeleton" /></section>
      <i className="skeleton skeleton-filter" />
      <section className="skeleton-grid">
        <i className="skeleton" /><i className="skeleton" /><i className="skeleton" /><i className="skeleton" /><i className="skeleton" />
      </section>
      <span className="sr-only">Loading content…</span>
    </main>
  );
}
