"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const GLOBAL_LOADING_EVENT = "amp:global-loading";

export function GlobalActionLoader() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onLoadingChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isLoading?: boolean }>;
      setIsLoading(Boolean(customEvent.detail?.isLoading));
    };

    window.addEventListener(GLOBAL_LOADING_EVENT, onLoadingChange as EventListener);
    return () => {
      window.removeEventListener(GLOBAL_LOADING_EVENT, onLoadingChange as EventListener);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
      <div className="relative flex flex-col items-center justify-center px-8 py-7">
        <div className="absolute h-28 w-28 rounded-full border-2 border-amber-300/70 animate-ping" />
        <div className="absolute h-36 w-36 rounded-full border border-amber-200/70 animate-spin" style={{ animationDuration: "2.4s" }} />
        <div className="relative animate-pulse drop-shadow-[0_0_28px_rgba(251,191,36,0.55)]">
          <Image
            src="/assets/AMP-TILES-LOGO.png"
            alt="AMP Tiles"
            width={180}
            height={72}
            priority
            className="h-auto w-[180px] brightness-125 contrast-125 saturate-125"
          />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-white">
          LOADING
        </p>
      </div>
    </div>
  );
}
