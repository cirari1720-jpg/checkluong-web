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
  const [success, setSuccess] = useState("");

  const [role, setRole] = useState("");
  const [profileName, setProfileName] = useState("");

  // ==============================
  // FORM THÊM / SỬA ĐƠN
  // ==============================

  const [orderDate, setOrderDate] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [staffName, setStaffName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [tip, setTip] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ID đơn đang sửa
  const [editingId, setEditingId] = useState<number | null>(null);

  // ==============================
  // LOAD ORDERS
  // ==============================

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

      // Lấy role + tên profile
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error(
          "Không lấy được thông tin tài khoản."
        );
      }

      setRole(profile.role || "");
      setProfileName(profile.name || "");

      // Lấy dữ liệu qua API
      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Không thể tải dữ liệu."
        );
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // RESET FORM
  // ==============================

  function resetForm() {
    setOrderDate("");
    setOrderCode("");
    setStaffName("");
    setCustomerName("");
    setAmount("");
    setTip("");
    setNote("");
    setEditingId(null);
  }

  // ==============================
  // THÊM ĐƠN
  // ==============================

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
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Không thể thêm đơn."
        );
      }

      setSuccess("Nhập đơn thành công!");

      resetForm();

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ==============================
  // BẮT ĐẦU SỬA
  // ==============================

  function handleEditOrder(order: Order) {
    setError("");
    setSuccess("");

    setEditingId(order.id);
    setOrderDate(order.order_date || "");
    setOrderCode(order.order_code || "");
    setStaffName(order.staff_name || "");
    setCustomerName(order.customer_name || "");
    setAmount(String(order.amount ?? 0));
    setTip(String(order.tip ?? 0));
    setNote(order.note || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==============================
  // CẬP NHẬT ĐƠN
  // ==============================

  async function handleUpdateOrder(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (editingId === null) {
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          order_date: orderDate,
          order_code: orderCode,
          staff_name: staffName,
          customer_name: customerName,
          amount: Number(amount),
          tip: Number(tip || 0),
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Không thể cập nhật đơn."
        );
      }

      setSuccess("Cập nhật đơn thành công!");

      resetForm();

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật đơn."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ==============================
  // HỦY SỬA
  // ==============================

  function handleCancelEdit() {
    resetForm();
    setError("");
    setSuccess("");
  }

  // ==============================
  // XÓA ĐƠN
  // ==============================

  async function handleDeleteOrder(
    order: Order
  ) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa đơn "${order.order_code}" của ${order.staff_name}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Không thể xóa đơn."
        );
      }

      setSuccess("Xóa đơn thành công!");

      // Nếu đang sửa chính đơn vừa xóa
      if (editingId === order.id) {
        resetForm();
      }

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa đơn."
      );
    }
  }

  // ==============================
  // ĐĂNG XUẤT
  // ==============================

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  // ==============================
  // INITIAL LOAD
  // ==============================

  useEffect(() => {
    loadOrders();
  }, []);

  // ==============================
  // UI
  // ==============================

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>Danh sách đơn hàng</h1>

      <p style={{ marginBottom: "20px" }}>
        Tài khoản:{" "}
        <strong>
          {profileName || "..."}
        </strong>

        {" · "}

        Quyền:{" "}
        <strong>
          {role || "..."}
        </strong>
      </p>

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <button
          onClick={loadOrders}
          disabled={loading}
          style={buttonStyle}
        >
          Làm mới
        </button>

        <button
          onClick={handleLogout}
          style={{
            ...buttonStyle,
            marginLeft: "10px",
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* =========================================
          FORM ADMIN
          ========================================= */}

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
            {editingId !== null
              ? `Sửa đơn #${editingId}`
              : "Nhập đơn hàng"}
          </h2>

          <form
            onSubmit={
              editingId !== null
                ? handleUpdateOrder
                : handleSubmitOrder
            }
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
                  <option
                    key={staff}
                    value={staff}
                  >
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
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...primaryButtonStyle,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting
                  ? editingId !== null
                    ? "Đang cập nhật..."
                    : "Đang nhập..."
                  : editingId !== null
                  ? "Lưu thay đổi"
                  : "Nhập đơn"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  style={buttonStyle}
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {/* =========================================
          THÔNG BÁO
          ========================================= */}

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
        <p
          style={{
            color: "red",
            fontWeight: "bold",
          }}
        >
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

      {/* =========================================
          BẢNG ĐƠN
          ========================================= */}

      {!loading &&
        !error &&
        orders.length > 0 && (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>
                    Ngày
                  </th>

                  <th style={thStyle}>
                    Mã đơn
                  </th>

                  <th style={thStyle}>
                    Staff
                  </th>

                  <th style={thStyle}>
                    Khách hàng
                  </th>

                  <th style={thStyle}>
                    Số tiền
                  </th>

                  <th style={thStyle}>
                    Tip
                  </th>

                  <th style={thStyle}>
                    Ghi chú
                  </th>

                  {role === "admin" && (
                    <th style={thStyle}>
                      Thao tác
                    </th>
                  )}
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
                      ).toLocaleString(
                        "vi-VN"
                      )}
                      đ
                    </td>

                    <td style={tdStyle}>
                      {Number(
                        order.tip
                      ).toLocaleString(
                        "vi-VN"
                      )}
                      đ
                    </td>

                    <td style={tdStyle}>
                      {order.note || ""}
                    </td>

                    {role === "admin" && (
                      <td
                        style={{
                          ...tdStyle,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleEditOrder(
                              order
                            )
                          }
                          style={{
                            ...smallButtonStyle,
                            marginRight:
                              "8px",
                          }}
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteOrder(
                              order
                            )
                          }
                          style={
                            dangerButtonStyle
                          }
                        >
                          Xóa
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </main>
  );
}

// ============================================
// STYLES
// ============================================

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  boxSizing: "border-box" as const,
};

const buttonStyle = {
  padding: "10px 16px",
  cursor: "pointer",
};

const primaryButtonStyle = {
  padding: "12px 20px",
  cursor: "pointer",
  fontWeight: "bold",
};

const smallButtonStyle = {
  padding: "7px 12px",
  cursor: "pointer",
};

const dangerButtonStyle = {
  padding: "7px 12px",
  cursor: "pointer",
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