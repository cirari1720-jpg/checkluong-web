"use client";

import { FormEvent, useEffect, useState } from "react";
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

const STAFF = [
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

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [role, setRole] = useState("");
  const [profileName, setProfileName] = useState("");

  // Form nhập đơn
  const [orderDate, setOrderDate] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [staffName, setStaffName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [tip, setTip] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Lấy role + tên tài khoản
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error("Không lấy được thông tin tài khoản");
      }

      setRole(profile.role);
      setProfileName(profile.name || "");

      // API tự xử lý quyền:
      // admin -> tất cả đơn
      // staff -> chỉ đơn của chính mình
      const response = await fetch("/api/orders");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tải dữ liệu");
      }

      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitOrder(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_date: orderDate,
          order_code: orderCode,
          staff_name: staffName,
          customer_name: customerName,
          amount: Number(amount),
          tip: Number(tip || 0),
          note: note || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Không thể nhập đơn"
        );
      }

      setSuccess("Nhập đơn thành công!");

      // Xóa form
      setOrderDate("");
      setOrderCode("");
      setStaffName("");
      setCustomerName("");
      setAmount("");
      setTip("");
      setNote("");

      // Load lại danh sách
      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra"
      );
    } finally {
      setSubmitting(false);
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

      {!loading && (
        <p style={{ marginBottom: "20px" }}>
          Tài khoản: <strong>{profileName}</strong>
          {" · "}
          Quyền: <strong>{role}</strong>
        </p>
      )}

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

      {/* ==============================
          CHỈ ADMIN MỚI THẤY FORM
          ============================== */}
      {role === "admin" && (
        <section
          style={{
            border: "1px solid #ccc",
            borderRadius: "10px",
            padding: "24px",
            marginBottom: "30px",
            background: "#fff",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Nhập đơn hàng
          </h2>

          <form
            onSubmit={handleSubmitOrder}
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label>Ngày</label>

              <input
                type="date"
                value={orderDate}
                onChange={(e) =>
                  setOrderDate(e.target.value)
                }
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Mã đơn</label>

              <input
                type="text"
                value={orderCode}
                onChange={(e) =>
                  setOrderCode(e.target.value)
                }
                placeholder="VD: DH001"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Staff</label>

              <select
                value={staffName}
                onChange={(e) =>
                  setStaffName(e.target.value)
                }
                required
                style={inputStyle}
              >
                <option value="">
                  -- Chọn staff --
                </option>

                {STAFF.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Khách hàng</label>

              <input
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
                placeholder="Tên khách hàng"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Số tiền</label>

              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="80000"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label>Tip</label>

              <input
                type="number"
                min="0"
                value={tip}
                onChange={(e) =>
                  setTip(e.target.value)
                }
                placeholder="3000"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label>Ghi chú</label>

              <input
                type="text"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                placeholder="Ghi chú đơn hàng"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "12px 20px",
                  cursor: submitting
                    ? "not-allowed"
                    : "pointer",
                  fontWeight: "bold",
                }}
              >
                {submitting
                  ? "Đang nhập..."
                  : "Nhập đơn"}
              </button>
            </div>
          </form>
        </section>
      )}

      {success && (
        <p
          style={{
            color: "green",
            fontWeight: "bold",
          }}
        >
          {success}
        </p>
      )}

      {error && (
        <p style={{ color: "red" }}>
          Lỗi: {error}
        </p>
      )}

      {loading && (
        <p>Đang tải dữ liệu...</p>
      )}

      {!loading &&
        !error &&
        orders.length === 0 && (
          <p>Chưa có đơn hàng nào.</p>
        )}

      {!loading &&
        !error &&
        orders.length > 0 && (
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
                  <td style={tdStyle}>
                    {order.order_date}
                  </td>

                  <td style={tdStyle}>
                    {order.order_code}
                  </td>

                  <td style={tdStyle}>
                    {order.staff_name}
                  </td>

                  <td style={tdStyle}>
                    {order.customer_name}
                  </td>

                  <td style={tdStyle}>
                    {Number(
                      order.amount
                    ).toLocaleString("vi-VN")}
                    đ
                  </td>

                  <td style={tdStyle}>
                    {Number(
                      order.tip
                    ).toLocaleString("vi-VN")}
                    đ
                  </td>

                  <td style={tdStyle}>
                    {order.note || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  boxSizing: "border-box" as const,
};

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