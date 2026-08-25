import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  PageHeader,
  StatusBadge,
  buttonClass,
  inputClass,
} from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/portal/messages")({
  component: PortalMessages,
});

type InquiryRow = {
  id: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

function PortalMessages() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["portal-messages", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("id, subject, message, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as InquiryRow[];
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be signed in");
      const { error } = await supabase.from("inquiries").insert({
        user_id: user.id,
        name: profile?.display_name || user.email || "Student",
        email: user.email ?? "",
        subject: subject || null,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message sent. We reply within one business day.");
      setSubject("");
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["portal-messages"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Ask the Tree Test Prep team a question." />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send.mutate();
        }}
        className="space-y-3 rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-white/70">Subject</span>
          <input
            className={inputClass}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-white/70">Message</span>
          <textarea
            className={`${inputClass} min-h-28`}
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <button type="submit" className={buttonClass} disabled={send.isPending}>
          Send message
        </button>
      </form>

      {isLoading && <p className="text-sm text-white/50">Loading...</p>}

      <div className="space-y-3">
        {(data ?? []).map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0a1228] to-[#05070d] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">{row.subject || "Question"}</h2>
              <StatusBadge value={row.status} />
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-white/75">{row.message}</p>
            <p className="mt-2 text-xs text-white/40">
              {new Date(row.created_at).toLocaleString()}
            </p>
          </article>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="rounded-xl border border-white/10 bg-[#0a1228] p-10 text-center text-sm text-white/50">
            You haven't sent any messages yet.
          </p>
        )}
      </div>
    </div>
  );
}
