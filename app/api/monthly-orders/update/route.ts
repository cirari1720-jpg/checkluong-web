import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/supabase/app-auth";

function getNextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber, 1));
  return date.toISOString().slice(0, 10);
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentAppUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền thực hiện thao tác này." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id = String(body?.id || "").trim();
    const month = String(body?.month || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Thiếu ID đơn." },
        { status: 400 }
      );
    }

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { error: "Tháng không hợp lệ. Dùng định dạng YYYY-MM." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Chỉ tìm đơn đã chốt thuộc đúng tháng đang chỉnh.
    const startDate = `${month}-01`;
    const endDate = getNextMonth(month);

    const { data: existingOrder, error: findError } = await supabase
      .from("orders")
      .select(
        "id, order_code, order_date, closed_date, closed_by, amount, tip, staff_per_order, staff_name, order_type, is_closed, mang"
      )
      .eq("id", id)
      .eq("order_type", "staff")
      .eq("is_closed", true)
      .gte("closed_date", startDate)
      .lt("closed_date", endDate)
      .maybeSingle();

    if (findError) {
      console.error("MONTHLY ORDER FIND ERROR:", findError);

      return NextResponse.json(
        { error: "Không thể kiểm tra đơn đã chốt." },
        { status: 500 }
      );
    }

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn đã chốt trong tháng này." },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.order_code !== undefined) {
      const value = String(body.order_code || "").trim();

      if (!value) {
        return NextResponse.json(
          { error: "Mã đơn không được để trống." },
          { status: 400 }
        );
      }

      updateData.order_code = value;
    }

    if (body.amount !== undefined) {
      const value = Number(body.amount);

      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: "Tiền đơn không hợp lệ." },
          { status: 400 }
        );
      }

      updateData.amount = value;
    }

    if (body.tip !== undefined) {
      const value = Number(body.tip);

      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: "Tip không hợp lệ." },
          { status: 400 }
        );
      }

      updateData.tip = value;
    }

    if (body.staff_per_order !== undefined) {
      const value = Number(body.staff_per_order);

      if (!Number.isInteger(value) || value <= 0) {
        return NextResponse.json(
          { error: "Staff/đơn không hợp lệ." },
          { status: 400 }
        );
      }

      updateData.staff_per_order = value;
    }

    if (body.mang !== undefined) {
      const value = String(body.mang || "").trim();

      updateData.mang = value || "Chưa xác định";
    }

    if (body.order_date !== undefined) {
      const value = String(body.order_date || "").trim();

      if (value) {
        updateData.order_date = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Không có dữ liệu cần cập nhật." },
        { status: 400 }
      );
    }

    // QUAN TRỌNG:
    // Không cho thay đổi trạng thái chốt/tháng chốt.
    updateData.is_closed = true;

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .eq("order_type", "staff")
      .eq("is_closed", true)
      .select(
        "id, order_code, order_date, closed_date, closed_by, staff_name, amount, tip, staff_per_order, order_type, is_closed, mang"
      )
      .single();

    if (updateError) {
      console.error("MONTHLY ORDER UPDATE ERROR:", updateError);

      return NextResponse.json(
        { error: "Không thể cập nhật đơn đã chốt." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("MONTHLY ORDER UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi sửa đơn đã chốt." },
      { status: 500 }
    );
  }
}
