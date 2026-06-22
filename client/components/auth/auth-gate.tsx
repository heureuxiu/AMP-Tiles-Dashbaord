"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AUTH_EXPIRED_EVENT } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

const PUBLIC_ROUTES = ["/", "/login", "/quotation-response"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getCurrentPath(pathname: string) {
  if (typeof window === "undefined") return pathname;
  return `${pathname}${window.location.search}`;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const lastAuthNoticeRef = useRef(0);

  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    const handleAuthExpired = (event: Event) => {
      if (isPublicRoute(window.location.pathname)) return;

      const now = Date.now();
      if (now - lastAuthNoticeRef.current > 1500) {
        const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
        toast.error(reason === "expired" ? "Session expired" : "Login required", {
          description: "Please sign in again to continue.",
        });
        lastAuthNoticeRef.current = now;
      }

      router.replace(`/login?next=${encodeURIComponent(getCurrentPath(window.location.pathname))}`);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [router]);

  useEffect(() => {
    if (loading) return;

    if (!user && !publicRoute) {
      router.replace(`/login?next=${encodeURIComponent(getCurrentPath(pathname))}`);
      return;
    }

    if (user && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [loading, pathname, publicRoute, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50 text-sm font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
        Checking session...
      </div>
    );
  }

  if (!user && !publicRoute) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50 text-sm font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
        Redirecting to login...
      </div>
    );
  }

  if (user && pathname === "/login") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50 text-sm font-semibold text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
        Opening dashboard...
      </div>
    );
  }

  return children;
}
