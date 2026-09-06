import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/supabase/app-auth";

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

async function getCurrentUser() {
  const appUser = await getCurrentAppUser();
  const supabase = await createClient();

  if (!appUser) {
    return {
      user: null,
      profile: null,
      supabase,
    };
  }

  return {
    user: {
      id: appUser.name,
    },
    profile: {
      id: appUser.name,
      name: appUser.name,
      role: appUser.role,
    },
    supabase,
  };
}

export async function GET() {
  const {
    user,
    profile,
    supabase,
  } = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Bạn chưa đăng nhập" },
      { status: 401 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Không xác định được tài khoản" },
      { status: 403 }
    );
  }

 const admin = createAdminClient();

let query = admin
  .from("staff_kpi")
    .select("*")
    .order("id", { ascending: true });

  // Staff chỉ xem KPI của chính mình
  if (profile.role === "staff") {
    query = query.eq(
      "staff_name",
      profile.name
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    console.error(
      "GET /api/kpi ERROR:",
      error
    );

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    data ?? []
  );
}

export async function POST(
  request: Request
) {
  const {
    user,
    profile,
  } = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Bạn chưa đăng nhập" },
      { status: 401 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Không xác định được tài khoản" },
      { status: 403 }
    );
  }

  // Chỉ Admin được sửa KPI
  if (profile.role !== "admin") {
    return NextResponse.json(
      {
        error: "Chỉ admin mới được sửa KPI",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const staffName = String(
      body.staff_name || ""
    ).trim();

    if (!staffName) {
      return NextResponse.json(
        { error: "Thiếu tên staff" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const payload = {
      staff_name: staffName,
      page: Number(body.page ?? 0),
      photo: Number(body.photo ?? 0),
      edit_photo: Number(
        body.edit_photo ?? 0
      ),
      video: Number(body.video ?? 0),
      edit_video: Number(
        body.edit_video ?? 0
      ),
      harem: Number(body.harem ?? 0),
      host_dan: Number(
        body.host_dan ?? 0
      ),
      host_treo: Number(
        body.host_treo ?? 0
      ),
      updated_at:
        new Date().toISOString(),
    };

    for (const field of KPI_FIELDS) {
      if (
        !Number.isFinite(
          payload[field]
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Giá trị KPI "${field}" không hợp lệ`,
          },
          { status: 400 }
        );
      }
    }

    const {
      data,
      error,
    } = await admin
      .from("staff_kpi")
      .upsert(
        payload,
        {
          onConflict: "staff_name",
        }
      )
      .select()
      .single();

    if (error) {
      console.error(
        "POST /api/kpi ERROR:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      data,
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "POST /api/kpi EXCEPTION:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật KPI",
      },
      { status: 500 }
    );
  }
}
