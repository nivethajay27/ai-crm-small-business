import { Activity, CheckCircle2, Mail, Users } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusLabels, statusOrder } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const [leads, recentEmails, notes] = await Promise.all([
    prisma.lead.findMany({ where: { userId: user.id }, include: { emails: true, notes: true }, orderBy: { updatedAt: "desc" } }),
    prisma.emailLog.findMany({ where: { lead: { userId: user.id } }, include: { lead: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.note.findMany({ where: { lead: { userId: user.id } }, include: { lead: true }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  const won = leads.filter((lead) => lead.status === "WON").length;
  const open = leads.filter((lead) => !["WON", "LOST"].includes(lead.status)).length;
  const sent = recentEmails.filter((email) => email.sent).length;
  const counts = Object.fromEntries(statusOrder.map((status) => [status, leads.filter((lead) => lead.status === status).length]));

  return (
    <AppShell
      title="Dashboard"
      action={
        <Link className="hidden h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 md:inline-flex" href="/leads">
          Add lead
        </Link>
      }
    >
      <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <Stat title="Total leads" value={leads.length} icon={<Users className="h-4 w-4" />} />
        <Stat title="Open pipeline" value={open} icon={<Activity className="h-4 w-4" />} />
        <Stat title="Won deals" value={won} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Stat title="Emails sent" value={sent} icon={<Mail className="h-4 w-4" />} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusOrder.map((status) => (
              <div key={status} className="grid grid-cols-[120px_1fr_40px] items-center gap-3">
                <span className="text-sm text-muted-foreground">{statusLabels[status]}</span>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${leads.length ? (Number(counts[status]) / leads.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-right text-sm font-medium">{Number(counts[status])}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...recentEmails, ...notes]
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
              .slice(0, 6)
              .map((item) => (
                <div key={`${"subject" in item ? "email" : "note"}-${item.id}`} className="flex items-start justify-between gap-3">
                  <div>
                    <Link className="text-sm font-medium hover:text-primary" href={`/leads/${item.lead.id}`}>
                      {item.lead.name}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {"subject" in item ? item.subject : item.content}
                    </p>
                  </div>
                  <Badge>{"subject" in item ? "Email" : "Note"}</Badge>
                </div>
              ))}
            {!recentEmails.length && !notes.length && <p className="text-sm text-muted-foreground">Activity will appear here as your team works leads.</p>}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function Stat({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-semibold">{value}</p>
        </div>
        <div className="rounded-md bg-accent p-3 text-accent-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}
