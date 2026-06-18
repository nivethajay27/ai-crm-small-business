"use client";

import { Clipboard, Loader2, Mail, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  notes: Array<{ id: string; content: string; aiSummary: unknown; createdAt: string }>;
  emails: Array<{ id: string; subject: string; body: string; sent: boolean; error: string | null; createdAt: string }>;
};

type GeneratedEmail = { subject: string; body: string };
type FollowupPlan = { sequence: Array<{ timing: string; subject: string; body: string }> };

export function LeadDetailClient({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [emailType, setEmailType] = useState("cold");
  const [tone, setTone] = useState("professional");
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [plan, setPlan] = useState<FollowupPlan | null>(null);

  async function load() {
    const response = await fetch(`/api/leads/${leadId}`);
    const data = await response.json();
    setLead(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [leadId]);

  async function updateLead(partial: Partial<Lead>) {
    if (!lead) return;
    setLead({ ...lead, ...partial });
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial)
    });
  }

  async function addNote(content = note, aiSummary?: unknown) {
    if (!lead || !content.trim()) return;
    setSaving(true);
    const response = await fetch(`/api/leads/${lead.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, aiSummary })
    });
    setSaving(false);
    if (response.ok) {
      setNote("");
      await load();
    }
  }

  async function runAi(action: "email" | "summary" | "followup") {
    if (!lead) return;
    setAiLoading(action);
    setError("");
    const payload =
      action === "email"
        ? { action, leadId: lead.id, emailType, tone }
        : action === "summary"
          ? { action, notes: meetingNotes }
          : { action, leadId: lead.id };
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setAiLoading("");
    if (!response.ok) {
      setError(data.error || "AI request failed.");
      return;
    }
    if (action === "email") setGeneratedEmail(data);
    if (action === "summary") setSummary(data);
    if (action === "followup") setPlan(data);
  }

  async function sendGeneratedEmail(email: GeneratedEmail, type = "CUSTOM") {
    if (!lead) return;
    setAiLoading("send");
    setError("");
    const response = await fetch(`/api/leads/${lead.id}/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...email, type })
    });
    const data = await response.json();
    setAiLoading("");
    if (!response.ok) {
      setError(data.error || data.error || "Email send failed. Check Resend settings.");
      await load();
      return;
    }
    await load();
  }

  if (loading || !lead) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading lead</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{lead.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} onBlur={() => updateLead({ name: lead.name })} />
              <Input value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} onBlur={() => updateLead({ email: lead.email })} />
              <Input value={lead.company || ""} onChange={(e) => setLead({ ...lead, company: e.target.value })} onBlur={() => updateLead({ company: lead.company })} placeholder="Company" />
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={lead.status} onChange={(e) => updateLead({ status: e.target.value as LeadStatusKey })}>
                {statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
              {!lead.tags.length && <span className="text-sm text-muted-foreground">No tags yet</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add call notes, objections, requirements, or buying signals" />
            <Button onClick={() => addNote()} disabled={saving || !note.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save note
            </Button>
            <div className="space-y-3">
              {lead.notes.map((item) => (
                <div key={item.id} className="rounded-md border bg-background p-3">
                  <p className="whitespace-pre-wrap text-sm">{item.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Email Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={emailType} onChange={(e) => setEmailType(e.target.value)}>
                <option value="cold">Cold outreach</option>
                <option value="follow_up">Follow-up</option>
                <option value="re_engagement">Re-engagement</option>
              </select>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="persuasive">Persuasive</option>
              </select>
            </div>
            <Button onClick={() => runAi("email")} disabled={aiLoading === "email"}>
              {aiLoading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Generate email
            </Button>
            {generatedEmail && (
              <GeneratedEmailBlock email={generatedEmail} loading={aiLoading} onSend={() => sendGeneratedEmail(generatedEmail, emailType.toUpperCase())} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting Notes Summarizer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Paste meeting notes or transcript text" />
            <Button onClick={() => runAi("summary")} disabled={aiLoading === "summary" || !meetingNotes.trim()}>
              {aiLoading === "summary" && <Loader2 className="h-4 w-4 animate-spin" />}
              Summarize notes
            </Button>
            {summary && (
              <div className="rounded-md border bg-background p-4 text-sm">
                <p className="font-medium">Summary</p>
                <p className="mt-2 text-muted-foreground">{String(summary.summary || "")}</p>
                <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(summary, null, 2)}</pre>
                <Button className="mt-3" variant="outline" size="sm" onClick={() => addNote(meetingNotes, summary)}>Store note with AI summary</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Follow-up Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => runAi("followup")} disabled={aiLoading === "followup"}>
              {aiLoading === "followup" && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate follow-up plan
            </Button>
            {plan?.sequence?.map((step) => (
              <GeneratedEmailBlock
                key={step.timing}
                email={{ subject: step.subject, body: `${step.timing}\n\n${step.body}` }}
                loading={aiLoading}
                onSend={() => sendGeneratedEmail({ subject: step.subject, body: step.body }, "FOLLOW_UP")}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.emails.map((email) => (
              <div key={email.id} className="rounded-md border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{email.subject}</p>
                  <Badge className={email.sent ? "" : "bg-destructive/10 text-destructive"}>{email.sent ? "Sent" : "Failed"}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{email.body}</p>
                {email.error && <p className="mt-2 text-xs text-destructive">{email.error}</p>}
              </div>
            ))}
            {!lead.emails.length && <p className="text-sm text-muted-foreground">Generated and sent emails will be logged here.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function GeneratedEmailBlock({ email, loading, onSend }: { email: GeneratedEmail; loading: string; onSend: () => void }) {
  return (
    <div className="rounded-md border bg-background p-4 text-sm">
      <p className="font-medium">{email.subject}</p>
      <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{email.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${email.subject}\n\n${email.body}`)}>
          <Clipboard className="h-4 w-4" />
          Copy
        </Button>
        <Button size="sm" onClick={onSend} disabled={loading === "send"}>
          {loading === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send via Resend
        </Button>
      </div>
    </div>
  );
}
