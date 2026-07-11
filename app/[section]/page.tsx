import { notFound } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";

const sections = ["transactions", "analytics", "accounts"];

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();

  return (
    <main className="shell">
      <AppHeader active={section} />
      <section className="empty-page">
        <span>Expanse</span>
        <h1>{section[0].toUpperCase() + section.slice(1)}</h1>
        <p>Coming soon.</p>
      </section>
    </main>
  );
}
