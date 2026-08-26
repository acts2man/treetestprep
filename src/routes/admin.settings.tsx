import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  DataTable,
  PageHeader,
  buttonClass,
  inputClass,
  type Column,
} from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type RoleRow = {
  id: string;
  user_id: string;
  role: string;
  profiles: { display_name: string | null; email: string | null } | null;
};

const ROLES = ["super_admin", "admin", "instructor"] as const;

function AdminSettings() {
  const queryClient = useQueryClient();
  const { profile, user, refreshRoles } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("admin");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id, user_id, role, profiles:user_id(display_name, email)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RoleRow[];
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await refreshRoles();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const grantRole = useMutation({
    mutationFn: async () => {
      const { data: match, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!match) throw new Error("No account found with that email.");
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: (match as { id: string }).id, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role granted");
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role removed");
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<RoleRow>[] = [
    { key: "name", header: "Person", render: (row) => row.profiles?.display_name || "—" },
    { key: "email", header: "Email", render: (row) => row.profiles?.email || row.user_id },
    {
      key: "role",
      header: "Role",
      render: (row) => <span className="capitalize">{row.role.replace("_", " ")}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => revokeRole.mutate(row.id)}
          className="text-xs text-rose-300 underline"
        >
          Remove
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your account and staff access." />

      <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
        <h2 className="text-sm font-semibold text-white">Your profile</h2>
        <div className="mt-4">
          <AvatarUploader />
        </div>
        <form

          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveProfile.mutate();
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Display name</span>
            <input
              className={inputClass}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <button type="submit" className={buttonClass}>
            Save
          </button>
        </form>
        <p className="mt-2 text-xs text-white/40">Signed in as {user?.email}</p>
      </section>

      <section className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4">
        <h2 className="text-sm font-semibold text-white">Grant a role</h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            grantRole.mutate();
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Account email</span>
            <input
              className={inputClass}
              value={email}
              required
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Role</span>
            <select
              className={inputClass}
              value={role}
              onChange={(event) => setRole(event.target.value as (typeof ROLES)[number])}
            >
              {ROLES.map((option) => (
                <option key={option} value={option}>
                  {option.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClass} disabled={grantRole.isPending}>
            Grant role
          </button>
        </form>
      </section>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Roles</h2>
        <DataTable rows={data ?? []} columns={columns} isLoading={isLoading} empty="No roles yet." />
      </div>
    </div>
  );
}
