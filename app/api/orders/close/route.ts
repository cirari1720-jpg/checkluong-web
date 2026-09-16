import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/supabase/app-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAppUser();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Không có quyền thực hiện thao tác này" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const staffName = String(body?.staff_name || "").trim();
    const closedDate = String(body?.closed_date || "").trim();

    if (!staffName) {
      return NextResponse.json(
        { error: "Thiếu tên Staff" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(closedDate)) {
      return NextResponse.json(
        { error: "Ngày chốt không hợp lệ" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: orders, error: findError } = await supabase
      .from("orders")
      .select("id")
      .eq("staff_name", staffName)
      .eq("order_type", "staff")
      .eq("is_closed", false);

    if (findError) {
      console.error("CLOSE ORDERS FIND ERROR:", findError);

      return NextResponse.json(
        { error: "Không thể lấy danh sách đơn cần chốt" },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: `Không có đơn chưa chốt của ${staffName}` },
        { status: 400 }
      );
    }

    const orderIds = orders.map((order) => order.id);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        is_closed: true,
        closed_date: closedDate,
        closed_by: user.name,
      })
      .in("id", orderIds)
      .eq("is_closed", false);

    if (updateError) {
      console.error("CLOSE ORDERS UPDATE ERROR:", updateError);

      return NextResponse.json(
        { error: "Không thể lưu và chốt các đơn" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      staff_name: staffName,
      closed_date: closedDate,
      count: orderIds.length,
    });
  } catch (error) {
    console.error("CLOSE ORDERS ERROR:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi chốt đơn" },
      { status: 500 }
    );
  }
}
