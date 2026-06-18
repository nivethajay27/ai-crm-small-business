"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email, password })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to create account.");
      setLoading(false);
      return;
    }
    await signIn("credentials", { redirect: false, email, password });
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your CRM workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input name="name" placeholder="Your name" />
            <Input name="email" type="email" placeholder="you@company.com" required />
            <Input name="password" type="password" placeholder="Password, 8+ characters" minLength={8} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account? <Link className="font-medium text-primary" href="/login">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
