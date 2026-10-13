import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Columns the account may change; the database grants update on these only.
type EditableProfile = Omit<ProfileUpdate, "owner_id" | "created_at" | "updated_at">;

/** The profile of the signed-in account. Row level security returns no other. */
export async function getOwnProfile(
  db: SupabaseClient<Database>,
  ownerId: string,
): Promise<Profile | null> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the profile: ${error.code}`);
  return data;
}

export async function updateOwnProfile(
  db: SupabaseClient<Database>,
  ownerId: string,
  changes: EditableProfile,
): Promise<void> {
  const { error, count } = await db
    .from("profiles")
    .update(changes, { count: "exact" })
    .eq("owner_id", ownerId);
  if (error) throw new Error(`Could not update the profile: ${error.code}`);
  if (count !== 1) throw new Error("The profile to update was not found");
}
