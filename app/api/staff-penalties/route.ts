import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/supabase/app-auth";

// =====================================================
// GET - LẤY DANH SÁCH PHẠT
// =====================================================

export async function GET() {
  try {
    const appUser = await getCurrentAppUser();
    const supabase = await createClient();

    if (!appUser) {
      return NextResponse.json(
        {
          error: "Chưa đăng nhập",
        },
        {
          status: 401,
        }
      );
    }

 const admin = createAdminClient();

let query = admin
      .from("staff_penalties")
      .select(
        "id, staff_name, error, amount, form, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    // Staff chỉ xem khoản phạt của chính mình
    if (appUser.role === "staff") {
      query = query.eq(
        "staff_name",
        appUser.name
      );
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

    return NextResponse.json(
      data ?? []
    );
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
    const appUser = await getCurrentAppUser();

    if (!appUser) {
      return NextResponse.json(
        {
          error: "Chưa đăng nhập",
        },
        {
          status: 401,
        }
      );
    }

    // Chỉ Admin được thêm phạt
    if (appUser.role !== "admin") {
      return NextResponse.json(
        {
          error: "Chỉ admin mới được thêm khoản phạt",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const staffName = String(
      body.staff_name || ""
    ).trim();

    const errorText = String(
      body.error || ""
    ).trim();

    const amount = Number(
      body.amount ?? 0
    );

    const form = String(
      body.form || ""
    ).trim();

    if (!staffName) {
      return NextResponse.json(
        {
          error: "Thiếu tên staff",
        },
        {
          status: 400,
        }
      );
    }

    if (!errorText) {
      return NextResponse.json(
        {
          error: "Thiếu nội dung lỗi",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount < 0
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

    const admin =
      createAdminClient();

    const {
      data,
      error,
    } = await admin
      .from("staff_penalties")
      .insert({
        staff_name: staffName,
        error: errorText,
        amount,
        form,
      })
      .select()
      .single();

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
        error: "Không thể thêm khoản phạt",
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

export async function PATCH(
  request: Request
) {
  try {
    const appUser = await getCurrentAppUser();

    if (!appUser) {
      return NextResponse.json(
        {
          error: "Chưa đăng nhập",
        },
        {
          status: 401,
        }
      );
    }

    if (appUser.role !== "admin") {
      return NextResponse.json(
        {
          error: "Chỉ admin mới được sửa khoản phạt",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const id = Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
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

    const updateData: Record<
      string,
      unknown
    > = {};

    if (
      body.staff_name !== undefined
    ) {
      const staffName = String(
        body.staff_name
      ).trim();

      if (!staffName) {
        return NextResponse.json(
          {
            error: "Tên staff không được để trống",
          },
          {
            status: 400,
          }
        );
      }

      updateData.staff_name =
        staffName;
    }

    if (
      body.error !== undefined
    ) {
      const errorText = String(
        body.error
      ).trim();

      if (!errorText) {
        return NextResponse.json(
          {
            error:
              "Nội dung lỗi không được để trống",
          },
          {
            status: 400,
          }
        );
      }

      updateData.error =
        errorText;
    }

    if (
      body.amount !== undefined
    ) {
      const amount = Number(
        body.amount
      );

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Số tiền phạt không hợp lệ",
          },
          {
            status: 400,
          }
        );
      }

      updateData.amount =
        amount;
    }

    if (
      body.form !== undefined
    ) {
      updateData.form =
        String(
          body.form ?? ""
        ).trim();
    }

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Không có dữ liệu để cập nhật",
        },
        {
          status: 400,
        }
      );
    }

    const admin =
      createAdminClient();

    const {
      data,
      error,
    } = await admin
      .from("staff_penalties")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error(
        "PATCH STAFF PENALTY ERROR:",
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
          error:
            "Không tìm thấy khoản phạt",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      data
    );
  } catch (error) {
    console.error(
      "PATCH /api/staff-penalties:",
      error
    );

    return NextResponse.json(
      {
        error: "Không thể sửa khoản phạt",
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

export async function DELETE(
  request: Request
) {
  try {
    const appUser = await getCurrentAppUser();

    if (!appUser) {
      return NextResponse.json(
        {
          error: "Chưa đăng nhập",
        },
        {
          status: 401,
        }
      );
    }

    if (appUser.role !== "admin") {
      return NextResponse.json(
        {
          error: "Chỉ admin mới được xóa khoản phạt",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const id = Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
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

    const admin =
      createAdminClient();

    const {
      data,
      error,
    } = await admin
      .from("staff_penalties")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error(
        "DELETE STAFF PENALTY ERROR:",
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
          error:
            "Không tìm thấy khoản phạt",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      }
    );
  } catch (error) {
    console.error(
      "DELETE /api/staff-penalties:",
      error
    );

    return NextResponse.json(
      {
        error: "Không thể xóa khoản phạt",
      },
      {
        status: 500,
      }
    );
  }
}
