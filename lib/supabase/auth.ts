import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "staff";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile.role as UserRole;
}

export async function getCurrentUserName(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile.name;
}