import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/lib/supabase/app-auth";

function getNextMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber, 1));
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAppUser();

    if (!user) {
      return NextResponse.json(
        { error: "Chưa đăng nhập" },
        { status: 401 }
      );
    }

    const month = request.nextUrl.searchParams.get("month");

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json(
        { error: "Tháng không hợp lệ. Dùng định dạng YYYY-MM." },
        { status: 400 }
      );
    }

    const startDate = `${month}-01`;
    const endDate = getNextMonth(month);

    const supabase = createAdminClient();

    let query = supabase
      .from("orders")
      .select(
        "id, order_code, order_date, closed_date, staff_name, amount, tip, staff_per_order, order_type"
      )
      .eq("order_type", "staff")
      .eq("is_closed", true)
      .gte("closed_date", startDate)
      .lt("closed_date", endDate)
      .order("closed_date", { ascending: true })
      .order("order_date", { ascending: true });

    if (user.role === "staff") {
      query = query.eq("staff_name", user.name);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("MONTHLY SALARY QUERY ERROR:", error);

      return NextResponse.json(
        { error: "Không thể lấy dữ liệu lương tháng." },
        { status: 500 }
      );
    }

    const rows = (orders || []).map((order) => {
      const amount = Number(order.amount || 0);
      const tip = Number(order.tip || 0);
      const staffPerOrder = Number(order.staff_per_order || 1);

      const grossShare = amount / staffPerOrder;
      const deduction20 = grossShare * 0.2;
      const salaryShare = grossShare * 0.8;
      const tipShare = tip / staffPerOrder;
      const total = salaryShare + tipShare;

      return {
        id: order.id,
        order_code: order.order_code,
        order_date: order.order_date,
        closed_date: order.closed_date,
        staff_name: order.staff_name,
        amount,
        tip,
        staff_per_order: staffPerOrder,
        gross_share: grossShare,
        deduction_20: deduction20,
        salary_share: salaryShare,
        tip_share: tipShare,
        total,
      };
    });

    const summary = rows.reduce(
      (result, row) => {
        result.orderValue += row.gross_share;
        result.deduction20 += row.deduction_20;
        result.salaryAfterDeduction += row.salary_share;
        result.tip += row.tip_share;
        result.total += row.total;
        return result;
      },
      {
        orderValue: 0,
        deduction20: 0,
        salaryAfterDeduction: 0,
        tip: 0,
        total: 0,
      }
    );

    return NextResponse.json({
      success: true,
      month,
      user,
      summary,
      orders: rows,
    });
  } catch (error) {
    console.error("MONTHLY SALARY ERROR:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lấy lương tháng." },
      { status: 500 }
    );
  }
}