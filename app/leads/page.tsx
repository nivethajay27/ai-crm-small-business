import { AppShell } from "@/components/app-shell";
import { LeadsClient } from "@/components/leads-client";

export default function LeadsPage() {
  return (
    <AppShell title="Leads">
      <LeadsClient />
    </AppShell>
  );
}
