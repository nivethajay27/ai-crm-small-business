"use client";

import { Edit3, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { statusLabels, statusOrder, type LeadStatusKey } from "@/lib/utils";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: LeadStatusKey;
  tags: string[];
  summary: string | null;
  createdAt: string;
};

const emptyForm = { id: "", name: "", email: "", company: "", status: "NEW" as LeadStatusKey, tags: "", notes: "" };

export function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status !== "ALL") params.set("status", status);
    const response = await fetch(`/api/leads?${params.toString()}`);
    setLeads(await response.json());
    setLoading(false);
  }

  useEffect(() => {
    const handle = window.setTimeout(load, 200);
    return () => window.clearTimeout(handle);
  }, [query, status]);

  function editLead(lead: Lead) {
    setForm({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      company: lead.company || "",
      status: lead.status,
      tags: lead.tags.join(", "),
      notes: lead.summary || ""
    });
    setOpen(true);
  }

  async function saveLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      email: form.email,
      company: form.company,
      status: form.status,
      tags: form.tags,
      notes: form.notes
    };
    const response = await fetch(form.id ? `/api/leads/${form.id}` : "/api/leads", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to save lead.");
      return;
    }
    setOpen(false);
    setForm(emptyForm);
    await load();
  }

  async function deleteLead(id: string) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLeads((current) => current.filter((lead) => lead.id !== id));
  }

  const filteredCount = useMemo(() => leads.length, [leads]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" />
        </div>
        <div className="flex gap-2 overflow-auto">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            {statusOrder.map((item) => (
              <option key={item} value={item}>{statusLabels[item]}</option>
            ))}
          </select>
          <Button onClick={() => { setForm(emptyForm); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add lead
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Lead</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Tags</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <Link className="font-medium hover:text-primary" href={`/leads/${lead.id}`}>{lead.name}</Link>
                      <p className="text-muted-foreground">{lead.email}</p>
                    </td>
                    <td className="px-5 py-4">{lead.company || "-"}</td>
                    <td className="px-5 py-4"><Badge>{statusLabels[lead.status]}</Badge></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.map((tag) => <Badge key={tag} className="bg-muted text-muted-foreground">{tag}</Badge>)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Edit lead" onClick={() => editLead(lead)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Delete lead" onClick={() => deleteLead(lead.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading leads</div>}
          {!loading && !filteredCount && <div className="p-8 text-center text-sm text-muted-foreground">No leads match this view.</div>}
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={saveLead} className="w-full max-w-xl rounded-lg border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{form.id ? "Edit lead" : "Add lead"}</h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" required />
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" required />
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" />
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatusKey })}>
                {statusOrder.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
              </select>
              <Input className="md:col-span-2" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags, comma separated" />
              <Textarea className="md:col-span-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save lead</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
