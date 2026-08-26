import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserRole,
  getCurrentUserName,
} from "@/lib/supabase/auth";

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
      { error: "Không xác định được quyền" },
      { status: 403 }
    );
  }

  let query = supabase
    .from("staff_kpi")
    .select("*")
    .order("id", { ascending: true });

  // Staff chỉ xem KPI của chính mình
  if (role === "staff") {
    const staffName = await getCurrentUserName();

    if (!staffName) {
      return NextResponse.json(
        { error: "Staff chưa có tên trong profiles" },
        { status: 403 }
      );
    }

    query = query.eq("staff_name", staffName);
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

export async function PATCH(request: Request) {
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

  // Chỉ ADMIN được sửa KPI
  if (role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ admin mới được sửa KPI" },
      { status: 403 }
    );
  }

  const body = await request.json();

  console.log("===== KPI PATCH DEBUG =====");
  console.log("BODY =", body);
  console.log("===========================");

  const staffName = String(body.staff_name || "").trim();

  if (!staffName) {
    return NextResponse.json(
      { error: "Thiếu tên staff" },
      { status: 400 }
    );
  }

  // Kiểm tra staff tồn tại
  const {
    data: existingStaff,
    error: findError,
  } = await supabase
    .from("staff_kpi")
    .select("id, staff_name")
    .eq("staff_name", staffName);

  console.log("===== FIND STAFF =====");
  console.log("STAFF NAME =", staffName);
  console.log("EXISTING STAFF =", existingStaff);
  console.log("FIND ERROR =", findError);
  console.log("======================");

  if (findError) {
    return NextResponse.json(
      { error: findError.message },
      { status: 500 }
    );
  }

  if (!existingStaff || existingStaff.length === 0) {
    return NextResponse.json(
      {
        error: `Không tìm thấy staff: ${staffName}`,
      },
      { status: 404 }
    );
  }

  const staffId = existingStaff[0].id;

  // Cập nhật KPI
  const {
    data,
    error: updateError,
  } = await supabase
    .from("staff_kpi")
    .update({
      page: Number(body.page ?? 0),
      photo: Number(body.photo ?? 0),
      edit_photo: Number(body.edit_photo ?? 0),
      video: Number(body.video ?? 0),
      edit_video: Number(body.edit_video ?? 0),
      harem: Number(body.harem ?? 0),
      host_dan: Number(body.host_dan ?? 0),
      host_treo: Number(body.host_treo ?? 0),
      updated_at: new Date().toISOString(),
    })
    .eq("id", staffId)
    .select();

  if (updateError) {
    console.log("===== UPDATE ERROR =====");
    console.log(updateError);
    console.log("========================");

    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      {
        error: `Không cập nhật được staff: ${staffName}`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(data[0]);
}