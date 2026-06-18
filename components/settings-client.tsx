"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Settings = {
  name: string;
  company: string;
  email: string;
  groqApiKey: string;
  resendApiKey: string;
  emailFrom: string;
};

export function SettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    const data = await response.json();
    setSaving(false);
    if (response.ok) {
      setSettings(data);
      setMessage("Settings saved.");
    } else {
      setMessage(data.error || "Unable to save settings.");
    }
  }

  if (loading || !settings) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading settings</div>;
  }

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Name</span>
            <Input value={settings.name || ""} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Company</span>
            <Input value={settings.company || ""} onChange={(e) => setSettings({ ...settings, company: e.target.value })} />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Account email</span>
            <Input value={settings.email || ""} disabled />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI and Email Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Groq API key</span>
            <Input
              type="password"
              value={settings.groqApiKey || ""}
              onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
              placeholder="gsk_..."
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Resend API key</span>
            <Input
              type="password"
              value={settings.resendApiKey || ""}
              onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
              placeholder="re_..."
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Sender email</span>
            <Input
              value={settings.emailFrom || ""}
              onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
              placeholder="Your Team <sales@yourdomain.com>"
            />
          </label>
          <div className="flex items-center gap-3">
            <Button disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save settings
            </Button>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
