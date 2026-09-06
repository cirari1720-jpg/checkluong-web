import { NextResponse } from "next/server";
import { clearAppSession } from "@/lib/supabase/app-auth";

export async function POST() {
  try {
    await clearAppSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        error: "Không thể đăng xuất",
      },
      {
        status: 500,
      }
    );
  }
}