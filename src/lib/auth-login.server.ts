export async function lookupEmailForUsername(identifier: string): Promise<string | null> {
  const username = identifier.trim().toLowerCase();
  if (!username || username.includes("@")) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("username", username)
    .maybeSingle();

  return (data?.email as string | null) ?? null;
}
