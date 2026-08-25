import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, buttonClass, inputClass } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/portal/profile")({
  component: PortalProfile,
});

function PortalProfile() {
  const { user, profile, refreshRoles, roles } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setPhone(profile?.phone ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, phone, avatar_url: avatarUrl || null })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile saved");
      await refreshRoles();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleAvatar(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const path = `avatars/${user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success("Photo uploaded. Save to apply.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="Update your contact details." />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
        className="max-w-xl space-y-4 rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-5"
      >
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#162b5c] text-sm text-white">
              {(displayName || user?.email || "T").slice(0, 2).toUpperCase()}
            </div>
          )}
          <label className="text-sm">
            <span className="mb-1 block text-white/70">Profile photo</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              className={inputClass}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleAvatar(file);
              }}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-white/70">Full name</span>
          <input
            className={inputClass}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-white/70">Phone</span>
          <input
            className={inputClass}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <p className="text-xs text-white/40">
          Email: {user?.email} · Roles: {roles.join(", ") || "student"}
        </p>
        <button type="submit" className={buttonClass} disabled={save.isPending}>
          Save profile
        </button>
      </form>
    </div>
  );
}
