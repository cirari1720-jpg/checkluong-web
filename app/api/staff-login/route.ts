import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const code = String(body.code ?? "")
      .trim()
      .toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: "Thiếu mã truy cập." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Kiểm tra mã trong staff_access
    const { data: loginData, error: loginError } =
      await admin.rpc("staff_login", {
        p_code: code,
      });

    if (loginError) {
      console.error(
        "STAFF LOGIN RPC ERROR:",
        loginError
      );

      return NextResponse.json(
        { error: "Không thể xác thực mã staff." },
        { status: 500 }
      );
    }

    const result = Array.isArray(loginData)
      ? loginData[0]
      : loginData;

    if (!result?.staff_name || !result?.role) {
      return NextResponse.json(
        { error: "Mã truy cập không đúng." },
        { status: 401 }
      );
    }

    const staffName = String(
      result.staff_name
    ).trim();

    // 2. Tạo email nội bộ ổn định cho staff.
    // Email này chỉ dùng cho Supabase Auth,
    // không hiển thị cho staff.
    const email =
      `staff_${staffName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase()}@staff.local`;

    /*
     * Dùng chính mã staff làm password Auth.
     * Staff không cần biết email này.
     *
     * Quan trọng:
     * Mã đã được xác thực bởi staff_login()
     * trước khi tới bước này.
     */

    let authUserId: string | null = null;

    // 3. Tìm Auth user hiện có
    const {
      data: usersData,
      error: usersError,
    } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) {
      console.error(
        "LIST AUTH USERS ERROR:",
        usersError
      );

      return NextResponse.json(
        { error: "Không thể kiểm tra tài khoản đăng nhập." },
        { status: 500 }
      );
    }

    const existingUser =
      usersData.users.find(
        (user) =>
          user.email?.toLowerCase() ===
          email.toLowerCase()
      );

    if (existingUser) {
      authUserId = existingUser.id;

      // Đồng bộ password với mã hiện tại
      const { error: updateAuthError } =
        await admin.auth.admin.updateUserById(
          authUserId,
          {
            password: code,
            email_confirm: true,
          }
        );

      if (updateAuthError) {
        console.error(
          "UPDATE AUTH USER ERROR:",
          updateAuthError
        );

        return NextResponse.json(
          {
            error:
              "Không thể cập nhật tài khoản đăng nhập.",
          },
          { status: 500 }
        );
      }
    } else {
      // 4. Tạo Auth user nếu staff chưa có
      const { data: createdUser, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password: code,
          email_confirm: true,
          user_metadata: {
            staff_name: staffName,
            role: result.role,
          },
        });

      if (createError || !createdUser.user) {
        console.error(
          "CREATE AUTH USER ERROR:",
          createError
        );

        return NextResponse.json(
          {
            error:
              "Không thể tạo tài khoản đăng nhập staff.",
          },
          { status: 500 }
        );
      }

      authUserId = createdUser.user.id;
    }

    // 5. Đảm bảo profiles có đúng user ID
    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("id, name, role")
      .eq("id", authUserId)
      .maybeSingle();

    if (profileError) {
      console.error(
        "PROFILE CHECK ERROR:",
        profileError
      );

      return NextResponse.json(
        { error: "Không thể kiểm tra profile staff." },
        { status: 500 }
      );
    }

    if (!profile) {
      const { error: profileInsertError } =
        await admin.from("profiles").insert({
          id: authUserId,
          name: staffName,
          role: result.role,
        });

      if (profileInsertError) {
        console.error(
          "PROFILE INSERT ERROR:",
          profileInsertError
        );

        return NextResponse.json(
          {
            error:
              "Không thể tạo profile cho staff.",
          },
          { status: 500 }
        );
      }
    }

    // 6. Tạo Supabase Auth session
    const cookieStore = await cookies();

    const response = NextResponse.json({
      staff_name: staffName,
      role: result.role,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                response.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password: code,
      });

    if (signInError) {
      console.error(
        "STAFF AUTH SIGN-IN ERROR:",
        signInError
      );

      return NextResponse.json(
        {
          error:
            "Xác thực staff thành công nhưng không thể tạo phiên đăng nhập.",
        },
        { status: 500 }
      );
    }

    return response;
  } catch (error) {
    console.error(
      "STAFF LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Lỗi đăng nhập staff.",
      },
      { status: 500 }
    );
  }
}