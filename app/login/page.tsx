"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      redirect: false,
      email: form.get("email"),
      password: form.get("password")
    });
    setLoading(false);
    if (result?.error) setError("Invalid email or password.");
    else router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to AI CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input name="email" type="email" placeholder="you@company.com" required />
            <Input name="password" type="password" placeholder="Password" required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            New here? <Link className="font-medium text-primary" href="/register">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
