import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderBody = {
  id?: string;
  order_date?: string;
  order_code?: string;
  staff_name?: string;
  customer_name?: string;
  amount?: number | string;
  tip?: number | string;
  note?: string;
};

async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      profile: null,
      supabase,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("GET CURRENT USER PROFILE ERROR:", profileError);

    return {
      user,
      profile: null,
      supabase,
    };
  }

  return {
    user,
    profile,
    supabase,
  };
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      error: message,
    },
    { status }
  );
}

// ======================================================
// GET
// ======================================================
// ADMIN:
//   lấy toàn bộ đơn
//
// STAFF:
//   chỉ lấy đơn của chính mình
// ======================================================

export async function GET() {
  try {
    const { user, profile, supabase } = await getCurrentUser();

    if (!user) {
      return jsonError("Bạn chưa đăng nhập.", 401);
    }

    if (!profile) {
      return jsonError(
        "Không tìm thấy thông tin tài khoản.",
        403
      );
    }

    let query = supabase
      .from("orders")
      .select("*")
      .order("order_date", { ascending: false })
      .order("created_at", { ascending: false });

    // STAFF chỉ được xem đơn của chính mình
    if (profile.role === "staff") {
      if (!profile.name) {
        return jsonError(
          "Tài khoản staff chưa có tên trong profile.",
          403
        );
      }

      query = query.eq("staff_name", profile.name);
    }

    // ADMIN được xem tất cả
    if (
      profile.role !== "admin" &&
      profile.role !== "staff"
    ) {
      return jsonError(
        "Role tài khoản không hợp lệ.",
        403
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "GET /api/orders error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      data ?? [],
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/orders exception:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Không thể tải danh sách đơn.",
      500
    );
  }
}

// ======================================================
// POST
// ======================================================
// CHỈ ADMIN
// ======================================================

export async function POST(
  request: NextRequest
) {
  try {
    const { user, profile } =
      await getCurrentUser();

    if (!user) {
      return jsonError(
        "Bạn chưa đăng nhập.",
        401
      );
    }

    if (!profile) {
      return jsonError(
        "Không tìm thấy thông tin tài khoản.",
        403
      );
    }

    if (profile.role !== "admin") {
      return jsonError(
        "Bạn không có quyền thêm đơn.",
        403
      );
    }

    const body =
      (await request.json()) as OrderBody;

    const {
      order_date,
      order_code,
      staff_name,
      customer_name,
      amount,
      tip,
      note,
    } = body;

    if (
      !staff_name ||
      !String(staff_name).trim()
    ) {
      return jsonError(
        "Vui lòng chọn staff."
      );
    }

    if (
      !order_code ||
      !String(order_code).trim()
    ) {
      return jsonError(
        "Vui lòng nhập mã đơn."
      );
    }

    const parsedAmount =
      Number(amount ?? 0);

    const parsedTip =
      Number(tip ?? 0);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 0
    ) {
      return jsonError(
        "Số tiền đơn không hợp lệ."
      );
    }

    if (
      !Number.isFinite(parsedTip) ||
      parsedTip < 0
    ) {
      return jsonError(
        "Tiền tip không hợp lệ."
      );
    }

    // ==================================================
    // ADMIN CLIENT
    // Service Role chỉ chạy phía server
    // ==================================================

    const admin =
      createAdminClient();

    const { data, error } =
      await admin
        .from("orders")
        .insert({
          order_date:
            order_date ||
            new Date()
              .toISOString()
              .split("T")[0],

          order_code:
            String(order_code).trim(),

          staff_name:
            String(staff_name).trim(),

          customer_name:
            customer_name == null
              ? ""
              : String(
                  customer_name
                ).trim(),

          amount:
            parsedAmount,

          tip:
            parsedTip,

          note:
            note == null
              ? ""
              : String(note).trim(),
        })
        .select()
        .single();

    if (error) {
      console.error(
        "POST /api/orders error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      data,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/orders exception:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Không thể thêm đơn.",
      500
    );
  }
}

// ======================================================
// PATCH
// ======================================================
// CHỈ ADMIN
// ======================================================

export async function PATCH(
  request: NextRequest
) {
  try {
    const { user, profile } =
      await getCurrentUser();

    if (!user) {
      return jsonError(
        "Bạn chưa đăng nhập.",
        401
      );
    }

    if (!profile) {
      return jsonError(
        "Không tìm thấy thông tin tài khoản.",
        403
      );
    }

    if (profile.role !== "admin") {
      return jsonError(
        "Bạn không có quyền sửa đơn.",
        403
      );
    }

    const body =
      (await request.json()) as OrderBody;

    const {
      id,
      order_date,
      order_code,
      staff_name,
      customer_name,
      amount,
      tip,
      note,
    } = body;

    if (!id) {
      return jsonError(
        "Thiếu ID đơn cần sửa."
      );
    }

    const updateData:
      Record<string, unknown> = {};

    if (
      order_date !== undefined
    ) {
      updateData.order_date =
        order_date;
    }

    if (
      order_code !== undefined
    ) {
      const value =
        String(order_code).trim();

      if (!value) {
        return jsonError(
          "Mã đơn không được để trống."
        );
      }

      updateData.order_code =
        value;
    }

    if (
      staff_name !== undefined
    ) {
      const value =
        String(staff_name).trim();

      if (!value) {
        return jsonError(
          "Tên staff không được để trống."
        );
      }

      updateData.staff_name =
        value;
    }

    if (
      customer_name !== undefined
    ) {
      updateData.customer_name =
        customer_name == null
          ? ""
          : String(
              customer_name
            ).trim();
    }

    if (
      amount !== undefined
    ) {
      const parsedAmount =
        Number(amount);

      if (
        !Number.isFinite(
          parsedAmount
        ) ||
        parsedAmount < 0
      ) {
        return jsonError(
          "Số tiền đơn không hợp lệ."
        );
      }

      updateData.amount =
        parsedAmount;
    }

    if (
      tip !== undefined
    ) {
      const parsedTip =
        Number(tip);

      if (
        !Number.isFinite(
          parsedTip
        ) ||
        parsedTip < 0
      ) {
        return jsonError(
          "Tiền tip không hợp lệ."
        );
      }

      updateData.tip =
        parsedTip;
    }

    if (
      note !== undefined
    ) {
      updateData.note =
        note == null
          ? ""
          : String(note).trim();
    }

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return jsonError(
        "Không có dữ liệu nào để cập nhật."
      );
    }

    // ==================================================
    // ADMIN CLIENT
    // Bypass RLS khi admin cập nhật
    // ==================================================

    const admin =
      createAdminClient();

    const { data, error } =
      await admin
        .from("orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
      console.error(
        "PATCH /api/orders error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return jsonError(
        "Không tìm thấy đơn cần sửa.",
        404
      );
    }

    return NextResponse.json(
      data,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PATCH /api/orders exception:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Không thể sửa đơn.",
      500
    );
  }
}

// ======================================================
// DELETE
// ======================================================
// CHỈ ADMIN
// ======================================================

export async function DELETE(
  request: NextRequest
) {
  try {
    const { user, profile } =
      await getCurrentUser();

    if (!user) {
      return jsonError(
        "Bạn chưa đăng nhập.",
        401
      );
    }

    if (!profile) {
      return jsonError(
        "Không tìm thấy thông tin tài khoản.",
        403
      );
    }

    if (profile.role !== "admin") {
      return jsonError(
        "Bạn không có quyền xóa đơn.",
        403
      );
    }

    const body =
      await request.json();

    const { id } =
      body as {
        id?: string;
      };

    if (!id) {
      return jsonError(
        "Thiếu ID đơn cần xóa."
      );
    }

    // ==================================================
    // ADMIN CLIENT
    // Bypass RLS khi admin xóa
    // ==================================================

    const admin =
      createAdminClient();

    const { data, error } =
      await admin
        .from("orders")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
      console.error(
        "DELETE /api/orders error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return jsonError(
        "Không tìm thấy đơn cần xóa.",
        404
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "DELETE /api/orders exception:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Không thể xóa đơn.",
      500
    );
  }
}