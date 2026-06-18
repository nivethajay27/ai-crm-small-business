"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    setReady(true);
  }, []);

  return <SessionProvider>{ready ? children : children}</SessionProvider>;
}
