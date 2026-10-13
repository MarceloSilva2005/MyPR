import "server-only";

import { cache } from "react";

import { requireUser } from "./session";
import { createSupabaseServerClient } from "./supabase";
import { getOwnProfile, type Profile } from "@/data/profiles";

/** Profile of the person behind this request. Cached per request. */
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const user = await requireUser();
  const profile = await getOwnProfile(await createSupabaseServerClient(), user.id);
  // Every account gets a profile from a database trigger; its absence is a defect.
  if (!profile) throw new Error("Profile missing for the signed-in account");
  return profile;
});
