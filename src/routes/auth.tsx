import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import dashboardCss from "../styles/dashboard.css?url";

const title = "Sign In | Tree Test Prep";
const description =
  "Sign in to the Tree Test Prep student portal to see your classes, registrations and study resources.";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: dashboardCss }],
  }),
  component: AuthPage,
});

const safePath = (value: string | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : undefined;

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const target = safePath(redirect);
    if (target) {
      window.location.assign(target);
      return;
    }
    void navigate({ to: isAdmin ? "/admin" : "/portal", replace: true });
  }, [loading, user, isAdmin, redirect, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${safePath(redirect) ?? "/portal/"}`,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  }

  return (
    <div className="dashboard-shell flex min-h-screen flex-col items-center justify-center bg-[#0a0f1e] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-8">
        <div className="mb-6 flex justify-center rounded-xl bg-white p-4">
          <img
            src="/assets/tree-test-prep-logo.webp"
            alt="Tree Test Prep"
            className="h-12 w-auto object-contain"
          />
        </div>
        <h1 className="text-center text-xl font-semibold text-white">
          {mode === "signin" ? "Sign in to your account" : "Create your student account"}
        </h1>
        <p className="mt-1 text-center text-sm text-white/60">
          Track your classes, registrations and study resources.
        </p>

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-white/35">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-[#0a0f1e] px-3 py-2.5 text-white outline-none focus:border-[#349e49]"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-[#0a0f1e] px-3 py-2.5 text-white outline-none focus:border-[#349e49]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-white/15 bg-[#0a0f1e] px-3 py-2.5 text-white outline-none focus:border-[#349e49]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#349e49] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c8b3f] disabled:opacity-60"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/60">
          {mode === "signin" ? "Need an account?" : "Already registered?"}{" "}
          <button
            type="button"
            className="font-semibold text-[#d9c58c] underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
