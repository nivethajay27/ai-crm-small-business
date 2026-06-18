import { AppShell } from "@/components/app-shell";
import { PipelineBoard } from "@/components/pipeline-board";

export default function PipelinePage() {
  return (
    <AppShell title="Pipeline">
      <PipelineBoard />
    </AppShell>
  );
}
