import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/supabase/app-auth";

export async function GET() {
  try {
    const user = await getCurrentAppUser();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("SESSION CHECK ERROR:", error);

    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 500,
      }
    );
  }
}
