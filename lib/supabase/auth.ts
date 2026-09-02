import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "staff";

/**
 * Lấy user hiện tại từ session cookie.
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Lấy role của user hiện tại.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error(
      "GET CURRENT USER ROLE ERROR:",
      profileError
    );

    return null;
  }

  const role = profile.role;

  if (role !== "admin" && role !== "staff") {
    return null;
  }

  return role;
}

/**
 * Lấy tên staff hiện tại.
 */
export async function getCurrentUserName(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.name) {
    console.error(
      "GET CURRENT USER NAME ERROR:",
      profileError
    );

    return null;
  }

  return profile.name;
}