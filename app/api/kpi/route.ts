import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentUserRole,
} from "@/lib/supabase/auth";

const KPI_FIELDS = [
  "page",
  "photo",
  "edit_photo",
  "video",
  "edit_video",
  "harem",
  "host_dan",
  "host_treo",
] as const;

type KpiField = (typeof KPI_FIELDS)[number];

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  const role = await getCurrentUserRole();

  if (!role) {
    return NextResponse.json(
      { error: "Không xác định được quyền người dùng" },
      { status: 403 }
    );
  }

  let query = supabase
    .from("staff_kpi")
    .select("*")
    .order("id", { ascending: true });

  // Staff chỉ được xem KPI của chính mình
  if (role === "staff") {
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

    if (profileError || !profile?.name) {
      return NextResponse.json(
        { error: "Staff chưa có tên trong profiles" },
        { status: 403 }
      );
    }

    query = query.eq("staff_name", profile.name);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Chưa đăng nhập" },
      { status: 401 }
    );
  }

  const role = await getCurrentUserRole();

  if (role !== "admin") {
    return NextResponse.json(
      {
        error: "Chỉ admin mới được cập nhật KPI",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const staffName = String(
    body.staff_name || ""
  ).trim();

  if (!staffName) {
    return NextResponse.json(
      {
        error: "Vui lòng chọn staff",
      },
      { status: 400 }
    );
  }

  const updateData: Record<string, any> = {
    staff_name: staffName,
  };

  for (const field of KPI_FIELDS) {
    if (body[field] !== undefined) {
      const value = Number(body[field]);

      if (!Number.isFinite(value)) {
        return NextResponse.json(
          {
            error: `KPI "${field}" không hợp lệ`,
          },
          { status: 400 }
        );
      }

      updateData[field] = value;
    }
  }

const admin = createAdminClient();

const { data, error } = await admin
  .from("staff_kpi")
  .upsert(updateData, {
    onConflict: "staff_name",
  })
  .select()
  .single();

  if (error) {
    console.error(
      "POST /api/kpi ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}