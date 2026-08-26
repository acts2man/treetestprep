import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import dashboardCss from "../styles/dashboard.css?url";

const title = "Sign In | Tree Test Prep";
const description =
  "Sign in to the Tree Test Prep admin dashboard to manage classes, registrations and website content.";

const treeBg = "/assets/instructors-tree.webp";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] as string } : {},
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

const inputClass =
  "w-full rounded-lg border border-white/15 bg-[#0a0f1e] px-3 py-2.5 text-white outline-none focus:border-[#349e49]";

type Mode = "signin" | "forgot" | "recovery";

function AuthPage() {
  const search = Route.useSearch();
  const redirect = search["redirect"];
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [mode, setMode] = useState<Mode>(() => {
    const hash = typeof window !== "undefined" ? window.location.hash || "" : "";
    return hash.includes("type=recovery") ? "recovery" : "signin";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || !user || !isAdmin || mode === "recovery") return;
    const target = safePath(redirect);
    if (target) {
      window.location.assign(target);
      return;
    }
    void navigate({ to: "/admin/", replace: true });
  }, [loading, user, isAdmin, redirect, navigate, mode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/`,
        });
        if (error) throw error;
        setSent(true);
        toast.success("Check your email for the reset link.");
      } else {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        window.history.replaceState(null, "", window.location.pathname);
        setPassword("");
        setConfirmPassword("");
        setMode("signin");
        toast.success("Password updated. Sign in with your new password.");
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

  const heading =
    mode === "signin"
      ? "Sign in to your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Set a new password";

  return (
    <div
      className="dashboard-shell relative flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12"
      style={{ backgroundImage: `url(${treeBg})` }}
    >
      <div className="absolute inset-0 bg-[#0a0f1e]/75" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-8">
        <div className="mb-6 flex justify-center rounded-xl bg-[#0a0f1e]/80 p-5">
          <img
            src="/assets/tree-test-prep-logo.webp"
            alt="Tree Test Prep"
            className="h-24 w-auto max-w-full object-contain sm:h-28"
          />
        </div>
        <h1 className="text-center text-xl font-semibold text-white">{heading}</h1>
        <p className="mt-1 text-center text-sm text-white/60">
          {mode === "signin"
            ? "Manage classes, registrations and website content."
            : mode === "forgot"
              ? "We'll email you a secure link to choose a new password."
              : "Choose a new password for your account."}
        </p>

        {mode === "signin" && (
          <>
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
          </>
        )}

        {mode === "forgot" && sent ? (
          <p className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-white/75">
            If an account exists for {email}, a reset link is on its way. The link opens this page
            so you can choose a new password.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className={mode === "signin" ? "space-y-4" : "mt-6 space-y-4"}>
            {mode !== "recovery" && (
              <label className="block text-sm">
                <span className="mb-1 block text-white/70">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className={inputClass}
                />
              </label>
            )}
            {mode !== "forgot" && (
              <label className="block text-sm">
                <span className="mb-1 block text-white/70">
                  {mode === "recovery" ? "New password" : "Password"}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                />
              </label>
            )}
            {mode === "recovery" && (
              <label className="block text-sm">
                <span className="mb-1 block text-white/70">Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                />
              </label>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#349e49] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c8b3f] disabled:opacity-60"
            >
              {mode === "signin"
                ? "Sign in"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-white/60">
          {mode === "signin" ? (
            <button
              type="button"
              className="font-semibold text-[#d9c58c] underline"
              onClick={() => {
                setSent(false);
                setMode("forgot");
              }}
            >
              Forgot your password?
            </button>
          ) : (
            <button
              type="button"
              className="font-semibold text-[#d9c58c] underline"
              onClick={() => {
                setSent(false);
                setMode("signin");
              }}
            >
              Back to sign in
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
