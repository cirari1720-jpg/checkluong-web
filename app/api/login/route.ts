import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setAppSession } from "@/lib/supabase/app-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body?.code || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: "Thiếu mã đăng nhập" },
        { status: 400 }
      );
    }

    // =====================================================
    // ADMIN LOGIN
    // =====================================================

    const adminLoginCode = String(
      process.env.ADMIN_LOGIN_CODE || ""
    )
      .trim()
      .toUpperCase();

    if (adminLoginCode && code === adminLoginCode) {
      await setAppSession({
        role: "admin",
        name: "Admin",
      });

      return NextResponse.json({
        success: true,
        user: {
          role: "admin",
          name: "Admin",
        },
      });
    }

    // =====================================================
    // STAFF LOGIN
    // =====================================================

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("staff_login", {
      p_code: code,
    });

    if (error) {
      console.error("STAFF LOGIN RPC ERROR:", error);

      return NextResponse.json(
        { error: "Không thể xác thực mã đăng nhập" },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (
      result?.staff_name &&
      result?.role === "staff"
    ) {
      const staffName = String(
        result.staff_name
      ).trim();

      await setAppSession({
        role: "staff",
        name: staffName,
      });

      return NextResponse.json({
        success: true,
        user: {
          role: "staff",
          name: staffName,
        },
      });
    }

    return NextResponse.json(
      { error: "Mã đăng nhập không hợp lệ" },
      { status: 401 }
    );
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi đăng nhập" },
      { status: 500 }
    );
  }
}