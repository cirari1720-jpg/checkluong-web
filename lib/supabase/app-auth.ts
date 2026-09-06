import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AppUserRole = "admin" | "staff";

export type AppUser = {
  role: AppUserRole;
  name: string;
};

const COOKIE_NAME = "kpi_app_session";

function getSessionSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY");
  }

  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
}

function encodeSession(user: AppUser) {
  const payload = Buffer.from(
    JSON.stringify(user),
    "utf8"
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string): AppUser | null {
  try {
    const separator = value.lastIndexOf(".");

    if (separator <= 0) {
      return null;
    }

    const payload = value.slice(0, separator);
    const signature = value.slice(separator + 1);

    const expected = sign(payload);

    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expected, "utf8");

    if (a.length !== b.length) {
      return null;
    }

    if (!timingSafeEqual(a, b)) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      !parsed ||
      (parsed.role !== "admin" && parsed.role !== "staff") ||
      typeof parsed.name !== "string" ||
      !parsed.name.trim()
    ) {
      return null;
    }

    return {
      role: parsed.role,
      name: parsed.name.trim(),
    };
  } catch {
    return null;
  }
}

export async function setAppSession(user: AppUser) {
  const cookieStore = await cookies();

  cookieStore.set(
    COOKIE_NAME,
    encodeSession(user),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }
  );
}

export async function clearAppSession() {
  const cookieStore = await cookies();

  cookieStore.set(
    COOKIE_NAME,
    "",
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  // 1. Ưu tiên session Staff do /api/staff-login tạo.
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;

  if (session) {
    const staffUser = decodeSession(session);

    if (staffUser) {
      return staffUser;
    }
  }

  // 2. Nếu không có Staff session thì kiểm tra Supabase Auth
  //    dành cho Admin hiện tại.
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    (profile.role !== "admin" && profile.role !== "staff") ||
    !profile.name
  ) {
    return null;
  }

  return {
    role: profile.role,
    name: profile.name,
  };
}
