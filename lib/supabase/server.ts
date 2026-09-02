import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase client dành cho user hiện tại.
 *
 * Client này giữ session bằng cookie và dùng Publishable Key.
 * Dùng cho:
 * - supabase.auth.getUser()
 * - kiểm tra user đăng nhập
 * - các thao tác chịu RLS
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            // Server Component có thể không cho phép set cookie.
          }
        },
      },
    }
  );
}

/**
 * Supabase Admin Client
 *
 * CHỈ được gọi ở server.
 *
 * Client này dùng Service Role Key nên BYPASS RLS.
 *
 * TUYỆT ĐỐI KHÔNG import hàm này vào Client Component
 * hoặc đưa SUPABASE_SERVICE_ROLE_KEY ra trình duyệt.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Thiếu SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}