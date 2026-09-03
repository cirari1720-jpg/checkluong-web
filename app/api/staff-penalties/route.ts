import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  getCurrentUserRole,
  getCurrentUserName,
} from "@/lib/supabase/auth";


// =====================================================
// GET - LẤY DANH SÁCH PHẠT
// =====================================================

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Chưa đăng nhập",
        },
        {
          status: 401,
        }
      );
    }

    const role = await getCurrentUserRole();

    if (!role) {
      return NextResponse.json(
        {
          error: "Không xác định được quyền",
        },
        {
          status: 403,
        }
      );
    }

    let query = supabase
      .from("staff_penalties")
      .select(
        "id, staff_name, error, amount, form, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    // Staff chỉ được xem khoản phạt của chính mình
   if (role === "staff") {
  const staffName = await getCurrentUserName();

  if (!staffName) {
    return NextResponse.json(
      {
        error: "Staff chưa có tên trong profiles",
      },
      {
        status: 403,
      }
    );
  }

  query = query.eq("staff_name", staffName);
}
    const { data, error } = await query;

    if (error) {
      console.error(
        "GET STAFF PENALTIES ERROR:",
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

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error(
      "GET /api/staff-penalties:",
      error
    );

    return NextResponse.json(
      {
        error: "Không thể tải danh sách phạt",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// POST - THÊM KHOẢN PHẠT
// =====================================================

export async function POST(
  request: Request
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Chưa đăng nhập",
        },
        {
          status: 401,
        }
      );
    }

    const role = await getCurrentUserRole();

    if (role !== "admin") {
      return NextResponse.json(
        {
          error: "Chỉ admin mới được thêm phạt",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const {
      staff_name,
      error: errorText,
      amount,
      form,
    } = body;

    if (
      typeof staff_name !== "string" ||
      !staff_name.trim()
    ) {
      return NextResponse.json(
        {
          error: "Thiếu tên staff",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof errorText !== "string" ||
      !errorText.trim()
    ) {
      return NextResponse.json(
        {
          error: "Thiếu nội dung lỗi",
        },
        {
          status: 400,
        }
      );
    }

    const numericAmount = Number(
      amount ?? 0
    );

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      return NextResponse.json(
        {
          error: "Số tiền phạt không hợp lệ",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabase
      .from("staff_penalties")
      .insert({
        staff_name: staff_name.trim(),
        error: errorText.trim(),
        amount: numericAmount,
        form:
          typeof form === "string"
            ? form.trim()
            : "",
      })
      .select(
        "id, staff_name, error, amount, form, created_at"
      )
      .maybeSingle();

    if (error) {
      console.error(
        "POST STAFF PENALTY ERROR:",
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

    if (!data) {
      return NextResponse.json(
        {
          error: "Không tạo được khoản phạt",
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
      "POST /api/staff-penalties:",
      error
    );

    return NextResponse.json(
      {
        error: "Không thể thêm phạt",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// PATCH - SỬA KHOẢN PHẠT
// =====================================================

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Chưa đăng nhập",
        },
        {
          status: 401,
        }
      );
    }

    const role = await getCurrentUserRole();

    if (role !== "admin") {
      return NextResponse.json(
        {
          error: "Chỉ admin mới được sửa phạt",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const id = body.id;
    const errorText = body.error;
    const amount = body.amount;
    const form = body.form;

    console.log("===== PATCH PENALTY =====");
    console.log("BODY:", body);
    console.log("ID nhận được:", id);
    console.log("ID type:", typeof id);

    // ==========================================
    // KIỂM TRA ID
    // ==========================================

    const numericId = Number(id);

    console.log("ID sau Number():", numericId);
    console.log("ID type sau Number():", typeof numericId);

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      return NextResponse.json(
        {
          error: "ID khoản phạt không hợp lệ",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // KIỂM TRA NỘI DUNG LỖI
    // ==========================================

    if (
      typeof errorText !== "string" ||
      !errorText.trim()
    ) {
      return NextResponse.json(
        {
          error: "Thiếu nội dung lỗi",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // KIỂM TRA SỐ TIỀN
    // ==========================================

    const numericAmount = Number(amount ?? 0);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      return NextResponse.json(
        {
          error: "Số tiền phạt không hợp lệ",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // KIỂM TRA RECORD TRƯỚC KHI UPDATE
    // ==========================================

    const {
      data: existingPenalty,
      error: findError,
    } = await supabase
      .from("staff_penalties")
      .select(
        "id, staff_name, error, amount, form, created_at"
      )
      .eq("id", numericId)
      .maybeSingle();

    console.log(
      "EXISTING PENALTY:",
      existingPenalty
    );

    console.log(
      "FIND ERROR:",
      findError
    );

    if (findError) {
      console.error(
        "FIND PENALTY ERROR:",
        findError
      );

      return NextResponse.json(
        {
          error: findError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!existingPenalty) {
      return NextResponse.json(
        {
          error: "Không tìm thấy khoản phạt",
          id: numericId,
        },
        {
          status: 404,
        }
      );
    }

    // ==========================================
    // UPDATE
    // ==========================================

    const {
      data: updatedPenalty,
      error: updateError,
    } = await supabase
      .from("staff_penalties")
      .update({
        error: errorText.trim(),
        amount: numericAmount,
        form:
          typeof form === "string"
            ? form.trim()
            : "",
      })
      .eq("id", numericId)
      .select(
        "id, staff_name, error, amount, form, created_at"
      )
      .maybeSingle();

    console.log(
      "UPDATED PENALTY:",
      updatedPenalty
    );

    console.log(
      "UPDATE ERROR:",
      updateError
    );

    if (updateError) {
      console.error(
        "UPDATE PENALTY ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          error: updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // UPDATE KHÔNG TRẢ VỀ RECORD
    // ==========================================

    if (!updatedPenalty) {
      return NextResponse.json(
        {
          error:
            "Không thể cập nhật khoản phạt. Có thể RLS đang chặn UPDATE.",
          id: numericId,
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    console.log(
      "PATCH SUCCESS:",
      updatedPenalty
    );

    return NextResponse.json({
      success: true,
      data: updatedPenalty,
    });
  } catch (error) {
    console.error(
      "PATCH /api/staff-penalties:",
      error
    );

    return NextResponse.json(
      {
        error: "Không thể sửa phạt",
      },
      {
        status: 500,
      }
    );
  }
}
// =====================================================
// DELETE - XÓA KHOẢN PHẠT
// =====================================================

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Chưa đăng nhập",
        },
        {
          status: 401,
        }
      );
    }

    const role = await getCurrentUserRole();

    if (role !== "admin") {
      return NextResponse.json(
        {
          error: "Chỉ admin mới được xóa phạt",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const numericId = Number(body.id);

    console.log("===== DELETE PENALTY =====");
    console.log("ID nhận được:", body.id);
    console.log("ID sau Number():", numericId);

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      return NextResponse.json(
        {
          error: "ID khoản phạt không hợp lệ",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Dùng Admin Client để DELETE không bị RLS chặn.
     */
    const admin = createAdminClient();

    const {
      data,
      error,
    } = await admin
      .from("staff_penalties")
      .delete()
      .eq("id", numericId)
      .select(
        "id, staff_name, error, amount, form, created_at"
      )
      .maybeSingle();

    if (error) {
      console.error(
        "DELETE STAFF PENALTY ERROR:",
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
      return NextResponse.json(
        {
          error: "Không tìm thấy khoản phạt",
          id: numericId,
        },
        {
          status: 404,
        }
      );
    }

    console.log(
      "DELETE PENALTY SUCCESS:",
      data
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "DELETE /api/staff-penalties:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể xóa phạt",
      },
      {
        status: 500,
      }
    );
  }
}