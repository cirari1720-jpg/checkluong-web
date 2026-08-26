import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL trong .env.local");
}

if (!serviceRoleKey) {
  throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEFAULT_PASSWORD = "Staff@2026";

const staffNames = [
  "Q",
  "Zak",
  "Mthien",
  "Vẹt",
  "Ginz",
  "Mika",
  "Pi",
  "Raev",
  "24",
  "Anwir",
  "Byw",
  "Cae",
  "Elis",
  "Dương",
  "ED",
  "Mỏ",
  "Hàn",
  "K",
  "Kz",
  "Min",
  "Mon",
  "Nam",
  "Pppp",
  "Sena",
  "Tia",
  "Tèo",
  "Vi",
  "W",
  "Zịt",
  "Hoàng Bảo",
  "Haru",
];

function makeEmail(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  return `${normalized}@staff.local`;
}

async function findProfileByName(name: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("name", name)
    .maybeSingle();

  if (error) {
    throw new Error(`Lỗi tìm profile ${name}: ${error.message}`);
  }

  return data;
}

async function createStaff(name: string) {
  console.log(`\n--- ${name} ---`);

  // Nếu profile đã tồn tại thì không tạo trùng
  const existingProfile = await findProfileByName(name);

  if (existingProfile) {
    console.log(`Profile đã tồn tại: ${existingProfile.id}`);

    if (existingProfile.role !== "staff") {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "staff" })
        .eq("id", existingProfile.id);

      if (error) {
        throw new Error(
          `Không thể cập nhật role cho ${name}: ${error.message}`
        );
      }

      console.log("Đã cập nhật role = staff");
    }

    console.log("Bỏ qua tạo Auth để tránh tài khoản trùng.");
    return;
  }

  const email = makeEmail(name);

  console.log(`Email: ${email}`);

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });

  if (authError) {
    throw new Error(`Tạo Auth thất bại: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error("Supabase không trả về user sau khi tạo.");
  }

  const userId = authData.user.id;

  console.log(`Auth user ID: ${userId}`);

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      role: "staff",
      name,
    });

  if (profileError) {
    // Nếu tạo Auth thành công nhưng profile lỗi,
    // xóa Auth user để tránh tài khoản rác.
    await supabase.auth.admin.deleteUser(userId);

    throw new Error(
      `Tạo profile thất bại: ${profileError.message}`
    );
  }

  console.log("✓ Đã tạo Auth + profile");
}

async function main() {
  console.log("======================================");
  console.log("     BULK CREATE STAFF");
  console.log("======================================");
  console.log(`Tổng số staff: ${staffNames.length}`);
  console.log(`Mật khẩu mặc định: ${DEFAULT_PASSWORD}`);
  console.log("");

  let success = 0;
  let failed = 0;

  for (const name of staffNames) {
    try {
      await createStaff(name);
      success++;
    } catch (error) {
      failed++;

      console.error(
        `✗ ${name}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log("\n======================================");
  console.log("KẾT QUẢ");
  console.log("======================================");
  console.log(`Thành công: ${success}`);
  console.log(`Lỗi: ${failed}`);
  console.log("======================================");
}

main().catch((error) => {
  console.error("\nSCRIPT ERROR:");
  console.error(error);
  process.exit(1);
});