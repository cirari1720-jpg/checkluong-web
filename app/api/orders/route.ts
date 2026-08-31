import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderBody = {
  id?: string | number;
  order_id?: string | number;

  order_date?: string;
  order_code?: string;
  staff_name?: string;
  customer_name?: string;

  amount?: number | string;
  tip?: number | string;

  note?: string | null;
};

// ======================================================
// CURRENT USER
// ======================================================

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

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error(
      "GET CURRENT USER PROFILE ERROR:",
      profileError
    );

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

// ======================================================
// JSON ERROR
// ======================================================

function jsonError(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    }
  );
}

// ======================================================
// GET
// ======================================================

export async function GET() {
  try {
    const {
      user,
      profile,
      supabase,
    } = await getCurrentUser();

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

    if (
      profile.role !== "admin" &&
      profile.role !== "staff"
    ) {
      return jsonError(
        "Role tài khoản không hợp lệ.",
        403
      );
    }

    let query = supabase
      .from("orders")
      .select("*")
      .order("order_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    // STAFF chỉ xem đơn của chính mình
    if (profile.role === "staff") {
      if (!profile.name) {
        return jsonError(
          "Tài khoản staff chưa có tên trong profile.",
          403
        );
      }

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
        "GET /api/orders error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
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
    const {
      user,
      profile,
    } = await getCurrentUser();

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

    const admin =
      createAdminClient();

    const {
      data,
      error,
    } = await admin
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
          details: error.details,
          hint: error.hint,
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
// UPDATE ORDER
// ======================================================
// CHỈ ADMIN
//
// Hỗ trợ cả:
//
// PUT   /api/orders
// PATCH /api/orders
//
// Frontend hiện tại sử dụng PUT.
// ======================================================

async function updateOrder(
  request: NextRequest
) {
  try {
    const {
      user,
      profile,
    } = await getCurrentUser();

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
        "Bạn không có quyền cập nhật đơn.",
        403
      );
    }

    const body =
      (await request.json()) as OrderBody;

    console.log(
      "UPDATE /api/orders BODY:",
      body
    );

    // ==================================================
    // NHẬN ID
    // ==================================================
    //
    // Ưu tiên id.
    // Nếu không có id thì lấy order_id.
    //

    const rawId =
      body.id ??
      body.order_id;

    if (
      rawId === undefined ||
      rawId === null ||
      String(rawId).trim() === ""
    ) {
      console.error(
        "UPDATE /api/orders: MISSING ID",
        body
      );

      return jsonError(
        "Thiếu ID đơn cần cập nhật."
      );
    }

    const id =
      Number(rawId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      console.error(
        "UPDATE /api/orders: INVALID ID",
        rawId
      );

      return jsonError(
        "ID đơn cần cập nhật không hợp lệ."
      );
    }

    console.log(
      "UPDATE /api/orders ID:",
      id
    );

    // ==================================================
    // DATA UPDATE
    // ==================================================

    const updateData:
      Record<string, unknown> = {};

    // --------------------------------------------------
    // NGÀY
    // --------------------------------------------------

    if (
      order_dateIsProvided(body)
    ) {
      const value =
        String(
          body.order_date
        ).trim();

      if (!value) {
        return jsonError(
          "Ngày đơn không được để trống."
        );
      }

      updateData.order_date =
        value;
    }

    // --------------------------------------------------
    // MÃ ĐƠN
    // --------------------------------------------------

    if (
      body.order_code !== undefined
    ) {
      const value =
        String(
          body.order_code
        ).trim();

      if (!value) {
        return jsonError(
          "Mã đơn không được để trống."
        );
      }

      updateData.order_code =
        value;
    }

    // --------------------------------------------------
    // STAFF
    // --------------------------------------------------

    if (
      body.staff_name !== undefined
    ) {
      const value =
        String(
          body.staff_name
        ).trim();

      if (!value) {
        return jsonError(
          "Tên staff không được để trống."
        );
      }

      updateData.staff_name =
        value;
    }

    // --------------------------------------------------
    // KHÁCH HÀNG
    // --------------------------------------------------

    if (
      body.customer_name !== undefined
    ) {
      updateData.customer_name =
        body.customer_name == null
          ? ""
          : String(
              body.customer_name
            ).trim();
    }

    // --------------------------------------------------
    // SỐ TIỀN
    // --------------------------------------------------

    if (
      body.amount !== undefined
    ) {
      const parsedAmount =
        Number(body.amount);

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

    // --------------------------------------------------
    // TIP
    // --------------------------------------------------

    if (
      body.tip !== undefined
    ) {
      const parsedTip =
        Number(body.tip);

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

    // --------------------------------------------------
    // GHI CHÚ
    // --------------------------------------------------

    if (
      body.note !== undefined
    ) {
      updateData.note =
        body.note == null
          ? ""
          : String(
              body.note
            ).trim();
    }

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return jsonError(
        "Không có dữ liệu nào để cập nhật."
      );
    }

    console.log(
      "UPDATE /api/orders DATA:",
      updateData
    );

    // ==================================================
    // ADMIN CLIENT
    // BYPASS RLS
    // ==================================================

    const admin =
      createAdminClient();

    const {
      data,
      error,
    } = await admin
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error(
        "UPDATE /api/orders SUPABASE ERROR:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      console.error(
        "UPDATE /api/orders: ORDER NOT FOUND",
        id
      );

      return jsonError(
        `Không tìm thấy đơn có ID ${id} cần cập nhật.`,
        404
      );
    }

    console.log(
      "UPDATE /api/orders SUCCESS:",
      data
    );

    return NextResponse.json(
      data,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "UPDATE /api/orders EXCEPTION:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Không thể cập nhật đơn.",
      500
    );
  }
}

// ======================================================
// PATCH
// ======================================================

export async function PATCH(
  request: NextRequest
) {
  return updateOrder(request);
}

// ======================================================
// PUT
// ======================================================

export async function PUT(
  request: NextRequest
) {
  return updateOrder(request);
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
    const {
      user,
      profile,
    } = await getCurrentUser();

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
      (await request.json()) as OrderBody;

    const rawId =
      body.id ??
      body.order_id;

    if (
      rawId === undefined ||
      rawId === null ||
      String(rawId).trim() === ""
    ) {
      return jsonError(
        "Thiếu ID đơn cần xóa."
      );
    }

    const id =
      Number(rawId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return jsonError(
        "ID đơn cần xóa không hợp lệ."
      );
    }

    const admin =
      createAdminClient();

    const {
      data,
      error,
    } = await admin
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
          details: error.details,
          hint: error.hint,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return jsonError(
        `Không tìm thấy đơn có ID ${id} cần xóa.`,
        404
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
      }
    );
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

// ======================================================
// HELPER
// ======================================================

function order_dateIsProvided(
  body: OrderBody
) {
  return body.order_date !== undefined;
}