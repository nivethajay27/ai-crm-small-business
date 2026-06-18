import { AppShell } from "@/components/app-shell";
import { LeadDetailClient } from "@/components/lead-detail-client";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title="Lead Detail">
      <LeadDetailClient leadId={id} />
    </AppShell>
  );
}
