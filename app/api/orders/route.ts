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
      { error: "Không xác định được quyền người dùng" },
      { status: 403 }
    );
  }

  let query = supabase
    .from("orders")
    .select("*")
    .order("order_date", { ascending: false })
    .order("id", { ascending: false });

  // Staff chỉ được xem đơn của chính mình
  if (role === "staff") {
    const staffName = await getCurrentUserName();

console.log("ROLE =", role);
console.log("STAFF NAME =", staffName);

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

  if (!role) {
    return NextResponse.json(
      { error: "Không xác định được quyền người dùng" },
      { status: 403 }
    );
  }

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ admin mới được nhập đơn" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const {
    order_date,
    order_code,
    customer_name,
    amount,
    tip,
    note,
  } = body;

  // Lấy tên staff từ dữ liệu form
  const staffNameInput = String(body.staff_name || "").trim();

  if (!staffNameInput) {
    return NextResponse.json(
      { error: "Vui lòng nhập tên staff" },
      { status: 400 }
    );
  }

  // Kiểm tra staff có tồn tại trong profiles không
  const { data: staffProfile, error: staffError } = await supabase
  .from("profiles")
  .select("name")
  .eq("role", "staff")
  .ilike("name", staffNameInput)
  .single();

  if (staffError || !staffProfile?.name) {
  console.log("===== STAFF DEBUG =====");
  console.log("INPUT:", staffNameInput);
  console.log("PROFILE:", staffProfile);
  console.log("ERROR:", staffError);
  console.log("=======================");

  return NextResponse.json(
    {
      error: "Không tìm thấy staff",
      input: staffNameInput,
      profile: staffProfile,
      detail: staffError?.message || null,
      code: staffError?.code || null,
    },
    { status: 400 }
  );
}

  // Đây mới là đoạn INSERT đơn hàng vào orders
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_date,
      order_code,
      staff_name: staffProfile.name,
      customer_name,
      amount,
      tip,
      note,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}