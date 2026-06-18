"use client";

import { BarChart3, Bell, KanbanSquare, LogOut, Search, Settings, Users } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children, title, action }: { children: React.ReactNode; title: string; action?: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-[#26455a] bg-[#142f40] px-4 py-5 text-white md:block xl:w-64">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#4ba3dc] text-sm font-bold text-white shadow-soft">
            <span className="relative flex h-5 w-4 flex-col items-center justify-between">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#66c6bd]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ba3dc] ring-1 ring-white/70" />
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold leading-tight">AI CRM</p>
            <p className="text-xs text-slate-300">Small business sales</p>
          </div>
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-[#1d4055] hover:text-white",
                  active && "bg-[#4ba3dc] text-white shadow-soft"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-56 xl:pl-64">
        <header className="sticky top-0 z-20 border-b border-[#26455a] bg-[#142f40] px-4 py-3 text-white shadow-soft md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
              <p className="text-sm text-slate-300">{data?.user?.email}</p>
            </div>
            <div className="hidden min-w-56 items-center gap-2 rounded-md bg-[#0f2533] px-3 py-2 text-sm text-slate-300 md:flex">
              <Search className="h-4 w-4" />
              <span>Search CRM</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              {action}
              <ThemeToggle />
              <Button type="button" variant="ghost" size="icon" title="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" title="Sign out" onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <nav className="mt-3 grid grid-cols-4 gap-1 md:hidden">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md text-slate-300",
                    active && "bg-[#4ba3dc] text-white"
                  )}
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
