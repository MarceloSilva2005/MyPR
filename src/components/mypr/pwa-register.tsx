"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaRegister({ completedCount, hidden }: { completedCount: number; hidden?: boolean }) {
  const [install, setInstall] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      if (completedCount >= 2) setInstall(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [completedCount]);

  if (!install || hidden || completedCount < 2) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-30 mx-auto flex w-[min(100%-2rem,28rem)] items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 lg:bottom-6">
      <p className="text-sm">Instalar o MyPR neste aparelho</p>
      <Button
        size="sm"
        onClick={() => {
          void install.prompt();
          setInstall(null);
        }}
      >
        Instalar
      </Button>
    </div>
  );
}
