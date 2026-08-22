"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: number;
  order_date: string;
  order_code: string;
  staff_name: string;
  customer_name: string;
  amount: number;
  tip: number;
  note: string | null;
  created_at: string;
};

export default function OrdersPage() {
    const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

   async function loadOrders() {
  try {
    setLoading(true);
    setError("");

    // Lấy tài khoản đang đăng nhập
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Lấy role + tên staff
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error("Không lấy được thông tin tài khoản");
    }

    // Lấy danh sách đơn
    const response = await fetch("/api/orders");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không thể tải dữ liệu");
    }

    // Admin được xem tất cả
    if (profile.role === "admin") {
      setOrders(data);
      return;
    }

    // Staff chỉ xem đơn có staff_name trùng với tên của mình
    const myOrders = data.filter(
      (order: Order) => order.staff_name === profile.name
    );

    setOrders(myOrders);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Có lỗi xảy ra"
    );
  } finally {
    setLoading(false);
  }
}

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();

}

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>Danh sách đơn hàng</h1>

      <div style={{ marginBottom: "20px" }}>
  <button
    onClick={loadOrders}
    style={{
      padding: "10px 16px",
      marginRight: "10px",
      cursor: "pointer",
    }}
  >
    Làm mới
  </button>

  <button
    onClick={handleLogout}
    style={{
      padding: "10px 16px",
      cursor: "pointer",
    }}
  >
    Đăng xuất
  </button>
</div>

      {loading && <p>Đang tải dữ liệu...</p>}

      {error && (
        <p style={{ color: "red" }}>
          Lỗi: {error}
        </p>
      )}

      {!loading && !error && orders.length === 0 && (
        <p>Chưa có đơn hàng nào.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Ngày</th>
              <th style={thStyle}>Mã đơn</th>
              <th style={thStyle}>Staff</th>
              <th style={thStyle}>Khách hàng</th>
              <th style={thStyle}>Số tiền</th>
              <th style={thStyle}>Tip</th>
              <th style={thStyle}>Ghi chú</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={tdStyle}>{order.order_date}</td>
                <td style={tdStyle}>{order.order_code}</td>
                <td style={tdStyle}>{order.staff_name}</td>
                <td style={tdStyle}>{order.customer_name}</td>
                <td style={tdStyle}>
                  {Number(order.amount).toLocaleString("vi-VN")}đ
                </td>
                <td style={tdStyle}>
                  {Number(order.tip).toLocaleString("vi-VN")}đ
                </td>
                <td style={tdStyle}>{order.note || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const thStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left" as const,
  background: "#f5f5f5",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "10px",
};
