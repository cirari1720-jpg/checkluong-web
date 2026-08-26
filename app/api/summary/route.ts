import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const role = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (role.error) {
    return NextResponse.json(
      { error: role.error.message },
      { status: 500 }
    );
  }

  const { data: orderSummary, error: orderError } =
    await supabase
      .from("staff_order_summary")
      .select("*");

  if (orderError) {
    return NextResponse.json(
      { error: orderError.message },
      { status: 500 }
    );
  }

  const { data: kpiData, error: kpiError } =
    await supabase
      .from("staff_kpi")
      .select("*");

  if (kpiError) {
    return NextResponse.json(
      { error: kpiError.message },
      { status: 500 }
    );
  }

  const summary = (kpiData || []).map((kpi) => {
    const order = (orderSummary || []).find(
      (item) => item.staff_name === kpi.staff_name
    );

    return {
      staff_name: kpi.staff_name,

      total_orders: Number(
        order?.total_orders ?? 0
      ),

      total_amount: Number(
        order?.total_amount ?? 0
      ),

      total_tip: Number(
        order?.total_tip ?? 0
      ),

      page: Number(kpi.page ?? 0),
      photo: Number(kpi.photo ?? 0),
      edit_photo: Number(kpi.edit_photo ?? 0),
      video: Number(kpi.video ?? 0),
      edit_video: Number(kpi.edit_video ?? 0),
      harem: Number(kpi.harem ?? 0),
      host_dan: Number(kpi.host_dan ?? 0),
      host_treo: Number(kpi.host_treo ?? 0),
    };
  });

  return NextResponse.json(summary);
}