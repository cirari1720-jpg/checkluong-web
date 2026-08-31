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

  // ======================================================
  // DATA
  // ======================================================

  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [role, setRole] = useState("");

  const [profileName, setProfileName] = useState("");

  // ======================================================
  // FORM
  // ======================================================

  const [orderDate, setOrderDate] = useState("");

  const [orderCode, setOrderCode] = useState("");

  const [staffName, setStaffName] = useState("");

  const [customerName, setCustomerName] = useState("");

  const [amount, setAmount] = useState("");

  const [tip, setTip] = useState("");

  const [note, setNote] = useState("");

  // ======================================================
  // SUBMIT
  // ======================================================

  const [submitting, setSubmitting] = useState(false);

  // ======================================================
  // EDITING ID
  // ======================================================

  const [editingId, setEditingId] = useState<number | null>(
    null
  );

  // ======================================================
  // LOAD ORDERS
  // ======================================================

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

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );

        throw new Error(
          "Không lấy được thông tin tài khoản."
        );
      }

      setRole(profile.role || "");

      setProfileName(profile.name || "");

      // ==================================================
      // GET ORDERS
      // ==================================================

      const response = await fetch(
        "/api/orders",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          error:
            text ||
            "API không trả về dữ liệu hợp lệ.",
        };
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Không thể tải dữ liệu. HTTP ${response.status}`
        );
      }

      // Đảm bảo luôn là array
      setOrders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "LOAD ORDERS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // RESET FORM
  // ======================================================

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

  // ======================================================
  // ADD ORDER
  // ======================================================

  async function handleSubmitOrder(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    setSuccess("");

    setSubmitting(true);

    try {
      const parsedAmount =
        Number(amount);

      const parsedTip =
        Number(tip || 0);

      if (
        !Number.isFinite(
          parsedAmount
        ) ||
        parsedAmount < 0
      ) {
        throw new Error(
          "Số tiền đơn không hợp lệ."
        );
      }

      if (
        !Number.isFinite(
          parsedTip
        ) ||
        parsedTip < 0
      ) {
        throw new Error(
          "Tiền tip không hợp lệ."
        );
      }

      const payload = {
        order_date:
          orderDate,

        order_code:
          orderCode.trim(),

        staff_name:
          staffName.trim(),

        customer_name:
          customerName.trim(),

        amount:
          parsedAmount,

        tip:
          parsedTip,

        note:
          note.trim(),
      };

      console.log(
        "=== CREATE ORDER ==="
      );

      console.log(
        "CREATE ORDER PAYLOAD:",
        payload
      );

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(payload),
        }
      );

      const text =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          error:
            text ||
            "API không trả về dữ liệu hợp lệ.",
        };
      }

      console.log(
        "CREATE ORDER RESPONSE:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Không thể thêm đơn. HTTP ${response.status}`
        );
      }

      setSuccess(
        "Nhập đơn thành công!"
      );

      resetForm();

      await loadOrders();
    } catch (err) {
      console.error(
        "CREATE ORDER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể thêm đơn."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ======================================================
  // EDIT ORDER
  // ======================================================

  function handleEditOrder(
    order: Order
  ) {
    setError("");

    setSuccess("");

    console.log(
      "=== EDIT ORDER ==="
    );

    console.log(
      "FULL ORDER:",
      order
    );

    console.log(
      "ORDER ID:",
      order.id
    );

    const id =
      Number(order.id);

    console.log(
      "NUMBER ID:",
      id
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      setError(
        "ID đơn hàng không hợp lệ."
      );

      return;
    }

    // QUAN TRỌNG:
    // Lưu ID database vào editingId
    setEditingId(id);

    setOrderDate(
      order.order_date || ""
    );

    setOrderCode(
      order.order_code || ""
    );

    setStaffName(
      order.staff_name || ""
    );

    setCustomerName(
      order.customer_name || ""
    );

    setAmount(
      String(
        order.amount ?? 0
      )
    );

    setTip(
      String(
        order.tip ?? 0
      )
    );

    setNote(
      order.note || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ======================================================
  // UPDATE ORDER
  // ======================================================

  async function handleUpdateOrder(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    setSuccess("");

    console.log(
      "================================"
    );

    console.log(
      "=== UPDATE ORDER START ==="
    );

    console.log(
      "editingId:",
      editingId
    );

    // ==================================================
    // KIỂM TRA EDITING ID
    // ==================================================

    if (editingId === null) {
      setError(
        "Không xác định được ID đơn cần cập nhật."
      );

      console.error(
        "UPDATE ERROR: editingId IS NULL"
      );

      return;
    }

    const id =
      Number(editingId);

    console.log(
      "converted id:",
      id
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      setError(
        "ID đơn hàng không hợp lệ."
      );

      console.error(
        "UPDATE ERROR: INVALID ID",
        editingId
      );

      return;
    }

    // ==================================================
    // VALIDATE MONEY
    // ==================================================

    const parsedAmount =
      Number(amount);

    const parsedTip =
      Number(tip || 0);

    if (
      !Number.isFinite(
        parsedAmount
      ) ||
      parsedAmount < 0
    ) {
      setError(
        "Số tiền đơn không hợp lệ."
      );

      return;
    }

    if (
      !Number.isFinite(
        parsedTip
      ) ||
      parsedTip < 0
    ) {
      setError(
        "Tiền tip không hợp lệ."
      );

      return;
    }

    setSubmitting(true);

    // ==================================================
    // PAYLOAD
    // ==================================================

    const payload = {
      // ID DATABASE
      id: id,

      // Gửi thêm order_id để tương thích
      order_id: id,

      order_date:
        orderDate,

      order_code:
        orderCode.trim(),

      staff_name:
        staffName.trim(),

      customer_name:
        customerName.trim(),

      amount:
        parsedAmount,

      tip:
        parsedTip,

      note:
        note.trim(),
    };

    // ==================================================
    // DEBUG
    // ==================================================

    console.log(
      "=== UPDATE ORDER DEBUG ==="
    );

    console.log(
      "editingId:",
      editingId
    );

    console.log(
      "id:",
      id
    );

    console.log(
      "payload:",
      payload
    );

    console.log(
      "JSON PAYLOAD:",
      JSON.stringify(payload)
    );

    // ==================================================
    // TRY UPDATE
    // ==================================================

    try {
      const response = await fetch(
        "/api/orders",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(payload),
        }
      );

      // ==================================================
      // READ RESPONSE
      // ==================================================

      const text =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          error:
            text ||
            "API không trả về dữ liệu hợp lệ.",
        };
      }

      console.log(
        "=== UPDATE ORDER RESPONSE ==="
      );

      console.log(
        "HTTP STATUS:",
        response.status
      );

      console.log(
        "RESPONSE:",
        data
      );

      // ==================================================
      // ERROR
      // ==================================================

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Không thể cập nhật đơn. HTTP ${response.status}`
        );
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      setSuccess(
        "Cập nhật đơn thành công!"
      );

      resetForm();

      await loadOrders();
    } catch (err) {
      console.error(
        "UPDATE ORDER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật đơn."
      );
    } finally {
      setSubmitting(false);
    }

    console.log(
      "=== UPDATE ORDER END ==="
    );

    console.log(
      "================================"
    );
  }

  // ======================================================
  // CANCEL EDIT
  // ======================================================

  function handleCancelEdit() {
    resetForm();

    setError("");

    setSuccess("");
  }

  // ======================================================
  // DELETE ORDER
  // ======================================================

  async function handleDeleteOrder(
    order: Order
  ) {
    const confirmed =
      window.confirm(
        `Bạn có chắc muốn xóa đơn "${order.order_code}" của ${order.staff_name}?`
      );

    if (!confirmed) {
      return;
    }

    setError("");

    setSuccess("");

    try {
      const id =
        Number(order.id);

      console.log(
        "=== DELETE ORDER ==="
      );

      console.log(
        "DELETE ID:",
        id
      );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        throw new Error(
          "ID đơn hàng không hợp lệ."
        );
      }

      const response = await fetch(
        "/api/orders",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              id: id,
              order_id: id,
            }),
        }
      );

      const text =
        await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          error:
            text ||
            "API không trả về dữ liệu hợp lệ.",
        };
      }

      console.log(
        "DELETE RESPONSE:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Không thể xóa đơn. HTTP ${response.status}`
        );
      }

      setSuccess(
        "Xóa đơn thành công!"
      );

      if (
        editingId === id
      ) {
        resetForm();
      }

      await loadOrders();
    } catch (err) {
      console.error(
        "DELETE ORDER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa đơn."
      );
    }
  }

  // ======================================================
  // LOGOUT
  // ======================================================

  async function handleLogout() {
    try {
      await supabase.auth.signOut();

      router.push(
        "/login"
      );

      router.refresh();
    } catch (err) {
      console.error(
        "LOGOUT ERROR:",
        err
      );
    }
  }

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    loadOrders();
  }, []);

  // ======================================================
  // UI
  // ======================================================

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* ==================================================
          TITLE
      ================================================== */}

      <h1>
        Danh sách đơn hàng
      </h1>

      <p
        style={{
          marginBottom: "20px",
        }}
      >
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

      {/* ==================================================
          BUTTONS
      ================================================== */}

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity:
              loading ? 0.6 : 1,
          }}
        >
          Làm mới
        </button>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            ...buttonStyle,
            marginLeft: "10px",
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* ==================================================
          ADMIN FORM
      ================================================== */}

      {role === "admin" && (
        <section
          style={{
            border:
              "1px solid #ccc",
            borderRadius: "10px",
            padding: "24px",
            marginBottom: "30px",
            background: "#fff",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
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
            {/* ============================================
                NGÀY
            ============================================ */}

            <div>
              <label>
                Ngày
              </label>

              <input
                type="date"
                value={orderDate}
                onChange={(e) =>
                  setOrderDate(
                    e.target.value
                  )
                }
                required
                style={inputStyle}
              />
            </div>

            {/* ============================================
                MÃ ĐƠN
            ============================================ */}

            <div>
              <label>
                Mã đơn
              </label>

              <input
                type="text"
                value={orderCode}
                onChange={(e) =>
                  setOrderCode(
                    e.target.value
                  )
                }
                placeholder="VD: DH001"
                required
                style={inputStyle}
              />
            </div>

            {/* ============================================
                STAFF
            ============================================ */}

            <div>
              <label>
                Staff
              </label>

              <select
                value={staffName}
                onChange={(e) =>
                  setStaffName(
                    e.target.value
                  )
                }
                required
                style={inputStyle}
              >
                <option value="">
                  -- Chọn staff --
                </option>

                {STAFF.map(
                  (staff) => (
                    <option
                      key={staff}
                      value={staff}
                    >
                      {staff}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* ============================================
                KHÁCH HÀNG
            ============================================ */}

            <div>
              <label>
                Khách hàng
              </label>

              <input
                type="text"
                value={
                  customerName
                }
                onChange={(e) =>
                  setCustomerName(
                    e.target.value
                  )
                }
                placeholder="Tên khách hàng"
                required
                style={inputStyle}
              />
            </div>

            {/* ============================================
                SỐ TIỀN
            ============================================ */}

            <div>
              <label>
                Số tiền
              </label>

              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="80000"
                required
                style={inputStyle}
              />
            </div>

            {/* ============================================
                TIP
            ============================================ */}

            <div>
              <label>
                Tip
              </label>

              <input
                type="number"
                min="0"
                value={tip}
                onChange={(e) =>
                  setTip(
                    e.target.value
                  )
                }
                placeholder="3000"
                style={inputStyle}
              />
            </div>

            {/* ============================================
                GHI CHÚ
            ============================================ */}

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              <label>
                Ghi chú
              </label>

              <input
                type="text"
                value={note}
                onChange={(e) =>
                  setNote(
                    e.target.value
                  )
                }
                placeholder="Ghi chú đơn hàng"
                style={inputStyle}
              />
            </div>

            {/* ============================================
                BUTTONS
            ============================================ */}

            <div
              style={{
                gridColumn:
                  "1 / -1",
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                type="submit"
                disabled={
                  submitting
                }
                style={{
                  ...primaryButtonStyle,
                  opacity:
                    submitting
                      ? 0.6
                      : 1,
                }}
              >
                {submitting
                  ? editingId !==
                    null
                    ? "Đang cập nhật..."
                    : "Đang nhập..."
                  : editingId !==
                    null
                  ? "Lưu thay đổi"
                  : "Nhập đơn"}
              </button>

              {editingId !==
                null && (
                <button
                  type="button"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={
                    submitting
                  }
                  style={
                    buttonStyle
                  }
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {/* ==================================================
          SUCCESS
      ================================================== */}

      {success && (
        <p
          style={{
            color: "green",
            fontWeight: "bold",
            marginBottom: "15px",
          }}
        >
          {success}
        </p>
      )}

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <p
          style={{
            color: "red",
            fontWeight: "bold",
            marginBottom: "15px",
          }}
        >
          Lỗi: {error}
        </p>
      )}

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading && (
        <p>
          Đang tải dữ liệu...
        </p>
      )}

      {/* ==================================================
          EMPTY
      ================================================== */}

      {!loading &&
        !error &&
        orders.length === 0 && (
          <p>
            Chưa có đơn hàng nào.
          </p>
        )}

      {/* ==================================================
          ORDER TABLE
      ================================================== */}

      {!loading &&
        !error &&
        orders.length > 0 && (
          <div
            style={{
              overflowX:
                "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                minWidth:
                  "1000px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={thStyle}
                  >
                    Ngày
                  </th>

                  <th
                    style={thStyle}
                  >
                    Mã đơn
                  </th>

                  <th
                    style={thStyle}
                  >
                    Staff
                  </th>

                  <th
                    style={thStyle}
                  >
                    Khách hàng
                  </th>

                  <th
                    style={thStyle}
                  >
                    Số tiền
                  </th>

                  <th
                    style={thStyle}
                  >
                    Tip
                  </th>

                  <th
                    style={thStyle}
                  >
                    Ghi chú
                  </th>

                  {role ===
                    "admin" && (
                    <th
                      style={
                        thStyle
                      }
                    >
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {orders.map(
                  (order) => (
                    <tr
                      key={
                        order.id
                      }
                    >
                      {/* ================================
                          DATE
                      ================================= */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          order.order_date
                        }
                      </td>

                      {/* ================================
                          ORDER CODE
                      ================================= */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          order.order_code
                        }
                      </td>

                      {/* ================================
                          STAFF
                      ================================= */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          order.staff_name
                        }
                      </td>

                      {/* ================================
                          CUSTOMER
                      ================================= */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          order.customer_name
                        }
                      </td>

                      {/* ================================
                          AMOUNT
                      ================================= */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {Number(
                          order.amount
                        ).toLocaleString(
                          "vi-VN"
                        )}
                        đ
                      </td>

                      {/* ================================
                          TIP
                      ================================= */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {Number(
                          order.tip
                        ).toLocaleString(
                          "vi-VN"
                        )}
                        đ
                      </td>

                      {/* ================================
                          NOTE
                      ================================= */}

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          order.note ||
                          ""
                        }
                      </td>

                      {/* ================================
                          ADMIN ACTIONS
                      ================================= */}

                      {role ===
                        "admin" && (
                        <td
                          style={{
                            ...tdStyle,
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleEditOrder(
                                order
                              )
                            }
                            disabled={
                              submitting
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
                            disabled={
                              submitting
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
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
    </main>
  );
}

// ======================================================
// STYLES
// ======================================================

const inputStyle = {
  width: "100%",

  padding: "10px",

  marginTop: "6px",

  border:
    "1px solid #ccc",

  borderRadius: "6px",

  boxSizing:
    "border-box" as const,
};

const buttonStyle = {
  padding:
    "10px 16px",

  cursor:
    "pointer",
};

const primaryButtonStyle = {
  padding:
    "12px 20px",

  cursor:
    "pointer",

  fontWeight:
    "bold",
};

const smallButtonStyle = {
  padding:
    "7px 12px",

  cursor:
    "pointer",
};

const dangerButtonStyle = {
  padding:
    "7px 12px",

  cursor:
    "pointer",

  color:
    "#b91c1c",

  background:
    "#fee2e2",

  border:
    "1px solid #fecaca",

  borderRadius:
    "6px",
};

const thStyle = {
  border:
    "1px solid #ccc",

  padding:
    "10px",

  textAlign:
    "left" as const,

  background:
    "#f5f5f5",
};

const tdStyle = {
  border:
    "1px solid #ccc",

  padding:
    "10px",
};