"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Logged in successfully", {
        description: "Welcome to AMP Tiles Admin.",
      });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Login failed", {
        description: "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md lg:ml-auto"
      noValidate
    >
      <h2 className="mb-8 text-3xl font-semibold text-foreground">Sign in</h2>

      <div className="space-y-6">
        <Input
          label="Email"
          name="email"
          type="email"
          required
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          label="Password"
          name="password"
          required
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Checkbox name="remember-me" label="Remember me" />
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-amp-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>
      </div>

      <div className="mt-12">
        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </div>
    </form>
  );
}
