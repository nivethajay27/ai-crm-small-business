"use client";

import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { statusLabels, statusOrder, type LeadStatusKey } from "@/lib/utils";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: LeadStatusKey;
  tags: string[];
};

export function PipelineBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    fetch("/api/leads")
      .then((response) => response.json())
      .then(setLeads)
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(
    () => Object.fromEntries(statusOrder.map((status) => [status, leads.filter((lead) => lead.status === status)])) as Record<LeadStatusKey, Lead[]>,
    [leads]
  );

  async function onDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const nextStatus = event.over?.id as LeadStatusKey | undefined;
    if (!nextStatus || !statusOrder.includes(nextStatus)) return;
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.status === nextStatus) return;

    setLeads((current) => current.map((item) => (item.id === leadId ? { ...item, status: nextStatus } : item)));
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) {
      setLeads((current) => current.map((item) => (item.id === leadId ? { ...item, status: lead.status } : item)));
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading pipeline</div>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-4 overflow-x-auto pb-4 xl:grid-cols-6">
        {statusOrder.map((status) => (
          <PipelineColumn key={status} status={status} leads={grouped[status]} />
        ))}
      </div>
    </DndContext>
  );
}

function PipelineColumn({ status, leads }: { status: LeadStatusKey; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`min-h-[480px] min-w-[260px] rounded-lg border bg-muted/40 p-3 transition ${isOver ? "border-primary bg-accent/60" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{statusLabels[status]}</h2>
        <Badge>{leads.length}</Badge>
      </div>
      <div className="space-y-3">
        {leads.map((lead) => <PipelineCard key={lead.id} lead={lead} />)}
      </div>
    </section>
  );
}

function PipelineCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = { transform: CSS.Translate.toString(transform) };
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab p-4 transition active:cursor-grabbing ${isDragging ? "z-30 opacity-70 shadow-lg" : ""}`}
      {...listeners}
      {...attributes}
    >
      <Link href={`/leads/${lead.id}`} className="font-medium hover:text-primary">{lead.name}</Link>
      <p className="mt-1 text-sm text-muted-foreground">{lead.email}</p>
      {lead.company && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          {lead.company}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {lead.tags.slice(0, 3).map((tag) => <Badge key={tag} className="bg-muted text-muted-foreground">{tag}</Badge>)}
      </div>
    </Card>
  );
}
