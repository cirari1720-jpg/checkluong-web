import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
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
    const {
      data: loginData,
      error: loginError,
    } = await admin.rpc("staff_login", {
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

    // 2. Tạo email nội bộ ổn định cho staff
    const email =
      `staff_${staffName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase()}@staff.local`;

    // Password nội bộ cho Supabase Auth
    const authPassword =
      `${code}-StaffAuth2026!`;

    let authUserId: string | null = null;
    let authLoginEmail = email;

    // 3. Lấy danh sách Auth users
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
        {
          error:
            "Không thể kiểm tra tài khoản đăng nhập.",
          detail: usersError.message,
        },
        { status: 500 }
      );
    }

    /*
     * ƯU TIÊN:
     *
     * Nếu staff đã có profile thì dùng chính Auth User
     * đang liên kết với profile đó.
     *
     * Điều này xử lý các tài khoản cũ như Tia:
     *
     * profiles.id
     *     =
     * auth.users.id
     */
    const {
      data: linkedProfile,
      error: linkedProfileError,
    } = await admin
      .from("profiles")
      .select("id, name, role")
      .eq("name", staffName)
      .maybeSingle();

    if (linkedProfileError) {
      console.error(
        "LINKED PROFILE CHECK ERROR:",
        linkedProfileError
      );

      return NextResponse.json(
        {
          error:
            "Không thể kiểm tra profile staff.",
          detail:
            linkedProfileError.message,
        },
        { status: 500 }
      );
    }

    let existingUser =
      linkedProfile
        ? usersData.users.find(
            (user) =>
              user.id === linkedProfile.id
          )
        : undefined;

    /*
     * Nếu không có Auth User theo profile ID,
     * mới tìm theo email chuẩn.
     */
    if (!existingUser) {
      existingUser =
        usersData.users.find(
          (user) =>
            user.email?.toLowerCase() ===
            email.toLowerCase()
        );
    }

    // 4. Đã có Auth user
    if (existingUser) {
      authUserId = existingUser.id;

      /*
       * Với tài khoản cũ như Tia,
       * phải đăng nhập bằng email thật của Auth user.
       */
      authLoginEmail =
        existingUser.email ?? email;

      // Đồng bộ password với mã hiện tại
      const {
        error: updateAuthError,
      } =
        await admin.auth.admin.updateUserById(
          authUserId,
          {
            password: authPassword,
            email_confirm: true,
            user_metadata: {
              staff_name: staffName,
              role: result.role,
            },
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
            detail:
              updateAuthError.message,
          },
          { status: 500 }
        );
      }
    } else {
      // 5. Chưa có Auth user → tạo mới
      const {
        data: createdUser,
        error: createError,
      } =
        await admin.auth.admin.createUser({
          email,
          password: authPassword,
          email_confirm: true,
          user_metadata: {
            staff_name: staffName,
            role: result.role,
          },
        });

      if (
        createError ||
        !createdUser.user
      ) {
        console.error(
          "CREATE AUTH USER ERROR:",
          createError
        );

        return NextResponse.json(
          {
            error:
              "Không thể tạo tài khoản đăng nhập staff.",
            detail:
              createError?.message,
          },
          { status: 500 }
        );
      }

      authUserId =
        createdUser.user.id;

      authLoginEmail = email;
    }

    /*
     * 6. Đảm bảo profiles có đúng Auth User ID
     */
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
        {
          error:
            "Không thể kiểm tra profile staff.",
          detail:
            profileError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Profile đã tồn tại đúng Auth User ID
     * → chỉ đồng bộ tên và role.
     */
    if (profile) {
      const {
        error: profileUpdateError,
      } = await admin
        .from("profiles")
        .update({
          name: staffName,
          role: result.role,
        })
        .eq("id", authUserId);

      if (profileUpdateError) {
        console.error(
          "PROFILE UPDATE ERROR:",
          profileUpdateError
        );

        return NextResponse.json(
          {
            error:
              "Không thể cập nhật profile cho staff.",
            detail:
              profileUpdateError.message,
          },
          { status: 500 }
        );
      }
    } else {
      /*
       * Không có profile theo Auth User ID.
       *
       * Kiểm tra profile cũ theo tên.
       */
      const {
        data: oldProfile,
        error: oldProfileError,
      } = await admin
        .from("profiles")
        .select("id, name, role")
        .eq("name", staffName)
        .maybeSingle();

      if (oldProfileError) {
        console.error(
          "OLD PROFILE CHECK ERROR:",
          oldProfileError
        );

        return NextResponse.json(
          {
            error:
              "Không thể kiểm tra profile staff cũ.",
            detail:
              oldProfileError.message,
          },
          { status: 500 }
        );
      }

      if (oldProfile) {
        /*
         * Profile cũ tồn tại nhưng không liên kết
         * với Auth User hiện tại.
         *
         * Xóa profile cũ rồi tạo lại bằng Auth ID mới.
         */
        const {
          error: oldProfileDeleteError,
        } = await admin
          .from("profiles")
          .delete()
          .eq("id", oldProfile.id);

        if (oldProfileDeleteError) {
          console.error(
            "OLD PROFILE DELETE ERROR:",
            oldProfileDeleteError
          );

          return NextResponse.json(
            {
              error:
                "Không thể xóa profile staff cũ.",
              detail:
                oldProfileDeleteError.message,
            },
            { status: 500 }
          );
        }

        const {
          error: profileInsertError,
        } = await admin
          .from("profiles")
          .insert({
            id: authUserId,
            name: staffName,
            role: result.role,
          });

        if (profileInsertError) {
          console.error(
            "PROFILE RECREATE ERROR:",
            profileInsertError
          );

          return NextResponse.json(
            {
              error:
                "Không thể tạo lại profile staff.",
              detail:
                profileInsertError.message,
            },
            { status: 500 }
          );
        }
      } else {
        /*
         * Hoàn toàn chưa có profile → tạo mới.
         */
        const {
          error: profileInsertError,
        } = await admin
          .from("profiles")
          .insert({
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
              detail:
                profileInsertError.message,
            },
            { status: 500 }
          );
        }
      }
    }

    // 7. Tạo Supabase Auth session
    const cookieStore = await cookies();

    const response = NextResponse.json({
      staff_name: staffName,
      role: result.role,
    });

    const supabase = createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
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

    const {
      error: signInError,
    } =
      await supabase.auth.signInWithPassword({
        email: authLoginEmail,
        password: authPassword,
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
          detail:
            signInError.message,
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