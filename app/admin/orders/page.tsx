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
  staff_per_order: number;
  note: string | null;
  created_at: string;
};

const STAFF = [
  "Q",
  "Zak",
  "Mthien",
  "V\u1EB9t",
  "Ginz",
  "Mika",
  "Pi",
  "Raev",
  "24",
  "Anwir",
  "Byw",
  "Cae",
  "Elis",
  "ED",
  "M\u1ECF",
  "H\u00E0n",
  "K",
  "Kz",
  "Min",
  "Mon",
  "Nam",
  "Pppp",
  "Sena",
  "Tia",
  "T\u00E8o",
  "Vi",
  "W",
  "Z\u1ECBt",
  "Kio",
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

  const [staffPerOrder, setStaffPerOrder] = useState("1");

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
          "KhÃƒÂ´ng lÃ¡ÂºÂ¥y Ã„â€˜Ã†Â°Ã¡Â»Â£c thÃƒÂ´ng tin tÃƒÂ i khoÃ¡ÂºÂ£n."
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
            "API khÃƒÂ´ng trÃ¡ÂºÂ£ vÃ¡Â»Â dÃ¡Â»Â¯ liÃ¡Â»â€¡u hÃ¡Â»Â£p lÃ¡Â»â€¡.",
        };
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i dÃ¡Â»Â¯ liÃ¡Â»â€¡u. HTTP ${response.status}`
        );
      }

      // Ã„ÂÃ¡ÂºÂ£m bÃ¡ÂºÂ£o luÃƒÂ´n lÃƒÂ  array
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
          : "CÃƒÂ³ lÃ¡Â»â€”i xÃ¡ÂºÂ£y ra."
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

      const parsedStaffPerOrder = Number(staffPerOrder);

      if (!Number.isInteger(parsedStaffPerOrder) || parsedStaffPerOrder <= 0) {
        throw new Error("Staff/Ä‘Æ¡n pháº£i lÃ  sá»‘ nguyÃªn lá»›n hÆ¡n 0.");
      }

      if (
        !Number.isFinite(
          parsedAmount
        ) ||
        parsedAmount < 0
      ) {
        throw new Error(
          "SÃ¡Â»â€˜ tiÃ¡Â»Ân Ã„â€˜Ã†Â¡n khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡."
        );
      }

      if (
        !Number.isFinite(
          parsedTip
        ) ||
        parsedTip < 0
      ) {
        throw new Error(
          "TiÃ¡Â»Ân tip khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡."
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

        staff_per_order:
          Number(staffPerOrder),

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
            "API khÃƒÂ´ng trÃ¡ÂºÂ£ vÃ¡Â»Â dÃ¡Â»Â¯ liÃ¡Â»â€¡u hÃ¡Â»Â£p lÃ¡Â»â€¡.",
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
            `KhÃƒÂ´ng thÃ¡Â»Æ’ thÃƒÂªm Ã„â€˜Ã†Â¡n. HTTP ${response.status}`
        );
      }

      setSuccess(
        "NhÃ¡ÂºÂ­p Ã„â€˜Ã†Â¡n thÃƒÂ nh cÃƒÂ´ng!"
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
          : "KhÃƒÂ´ng thÃ¡Â»Æ’ thÃƒÂªm Ã„â€˜Ã†Â¡n."
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
        "ID Ã„â€˜Ã†Â¡n hÃƒÂ ng khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡."
      );

      return;
    }

    // QUAN TRÃ¡Â»Å’NG:
    // LÃ†Â°u ID database vÃƒÂ o editingId
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

    setStaffPerOrder(
      String(
        order.staff_per_order ?? 1
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
    // KIÃ¡Â»â€šM TRA EDITING ID
    // ==================================================

    if (editingId === null) {
      setError(
        "KhÃƒÂ´ng xÃƒÂ¡c Ã„â€˜Ã¡Â»â€¹nh Ã„â€˜Ã†Â°Ã¡Â»Â£c ID Ã„â€˜Ã†Â¡n cÃ¡ÂºÂ§n cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t."
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
        "ID Ã„â€˜Ã†Â¡n hÃƒÂ ng khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡."
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

    const parsedStaffPerOrder =
      Number(staffPerOrder);

    if (
      !Number.isInteger(parsedStaffPerOrder) ||
      parsedStaffPerOrder <= 0
    ) {
      setError(
        "Staff/đơn phải là số nguyên lớn hơn 0."
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

      // GÃ¡Â»Â­i thÃƒÂªm order_id Ã„â€˜Ã¡Â»Æ’ tÃ†Â°Ã†Â¡ng thÃƒÂ­ch
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

        staff_per_order:
          Number(staffPerOrder),

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
            "API khÃƒÂ´ng trÃ¡ÂºÂ£ vÃ¡Â»Â dÃ¡Â»Â¯ liÃ¡Â»â€¡u hÃ¡Â»Â£p lÃ¡Â»â€¡.",
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
            `KhÃƒÂ´ng thÃ¡Â»Æ’ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t Ã„â€˜Ã†Â¡n. HTTP ${response.status}`
        );
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      setSuccess(
        "CÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t Ã„â€˜Ã†Â¡n thÃƒÂ nh cÃƒÂ´ng!"
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
          : "KhÃƒÂ´ng thÃ¡Â»Æ’ cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t Ã„â€˜Ã†Â¡n."
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
        `BÃ¡ÂºÂ¡n cÃƒÂ³ chÃ¡ÂºÂ¯c muÃ¡Â»â€˜n xÃƒÂ³a Ã„â€˜Ã†Â¡n "${order.order_code}" cÃ¡Â»Â§a ${order.staff_name}?`
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
          "ID Ã„â€˜Ã†Â¡n hÃƒÂ ng khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡."
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
            "API khÃƒÂ´ng trÃ¡ÂºÂ£ vÃ¡Â»Â dÃ¡Â»Â¯ liÃ¡Â»â€¡u hÃ¡Â»Â£p lÃ¡Â»â€¡.",
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
            `KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ³a Ã„â€˜Ã†Â¡n. HTTP ${response.status}`
        );
      }

      setSuccess(
        "XÃƒÂ³a Ã„â€˜Ã†Â¡n thÃƒÂ nh cÃƒÂ´ng!"
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
          : "KhÃƒÂ´ng thÃ¡Â»Æ’ xÃƒÂ³a Ã„â€˜Ã†Â¡n."
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
        Danh sÃƒÂ¡ch Ã„â€˜Ã†Â¡n hÃƒÂ ng
      </h1>

      <p
        style={{
          marginBottom: "20px",
        }}
      >
        TÃƒÂ i khoÃ¡ÂºÂ£n:{" "}
        <strong>
          {profileName || "..."}
        </strong>

        {" Ã‚Â· "}

        QuyÃ¡Â»Ân:{" "}
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
          LÃƒÂ m mÃ¡Â»â€ºi
        </button>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            ...buttonStyle,
            marginLeft: "10px",
          }}
        >
          Ã„ÂÃ„Æ’ng xuÃ¡ÂºÂ¥t
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
              ? `SÃ¡Â»Â­a Ã„â€˜Ã†Â¡n #${editingId}`
              : "NhÃ¡ÂºÂ­p Ã„â€˜Ã†Â¡n hÃƒÂ ng"}
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
                NGÃƒâ‚¬Y
            ============================================ */}

            <div>
              <label>
                NgÃƒÂ y
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
                MÃƒÆ’ Ã„ÂÃ†Â N
            ============================================ */}

            <div>
              <label>
                MÃƒÂ£ Ã„â€˜Ã†Â¡n
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
                  -- ChÃ¡Â»Ân staff --
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
                KHÃƒÂCH HÃƒâ‚¬NG
            ============================================ */}

            <div>
              <label>
                KhÃƒÂ¡ch hÃƒÂ ng
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
                placeholder="TÃƒÂªn khÃƒÂ¡ch hÃƒÂ ng"
                required
                style={inputStyle}
              />
            </div>

            {/* ============================================
                SÃ¡Â»Â TIÃ¡Â»â‚¬N
            ============================================ */}

            <div>
              <label>
                SÃ¡Â»â€˜ tiÃ¡Â»Ân
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

            <div>
              <label>
                Staff/Ã„â€˜Ã†Â¡n
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={staffPerOrder}
                onChange={(e) =>
                  setStaffPerOrder(e.target.value)
                }
                placeholder="SÃ¡Â»â€˜ staff tham gia Ã„â€˜Ã†Â¡n"
                style={inputStyle}
              />
            </div>

            {/* ============================================
                GHI CHÃƒÅ¡
            ============================================ */}

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              <label>
                Ghi chÃƒÂº
              </label>

              <input
                type="text"
                value={note}
                onChange={(e) =>
                  setNote(
                    e.target.value
                  )
                }
                placeholder="Ghi chÃƒÂº Ã„â€˜Ã†Â¡n hÃƒÂ ng"
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
                    ? "Ã„Âang cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t..."
                    : "Ã„Âang nhÃ¡ÂºÂ­p..."
                  : editingId !==
                    null
                  ? "LÃ†Â°u thay Ã„â€˜Ã¡Â»â€¢i"
                  : "NhÃ¡ÂºÂ­p Ã„â€˜Ã†Â¡n"}
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
                  HÃ¡Â»Â§y sÃ¡Â»Â­a
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
          LÃ¡Â»â€”i: {error}
        </p>
      )}

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading && (
        <p>
          Ã„Âang tÃ¡ÂºÂ£i dÃ¡Â»Â¯ liÃ¡Â»â€¡u...
        </p>
      )}

      {/* ==================================================
          EMPTY
      ================================================== */}

      {!loading &&
        !error &&
        orders.length === 0 && (
          <p>
            ChÃ†Â°a cÃƒÂ³ Ã„â€˜Ã†Â¡n hÃƒÂ ng nÃƒÂ o.
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
                    NgÃƒÂ y
                  </th>

                  <th
                    style={thStyle}
                  >
                    MÃƒÂ£ Ã„â€˜Ã†Â¡n
                  </th>

                  <th
                    style={thStyle}
                  >
                    Staff
                  </th>

                  <th
                    style={thStyle}
                  >
                    SÃ¡Â»â€˜ tiÃ¡Â»Ân
                  </th>

                  <th
                    style={thStyle}
                  >
                    Tip
                  </th>

                  <th
                    style={thStyle}
                  >
                    Ghi chÃƒÂº
                  </th>

                  {role ===
                    "admin" && (
                    <th
                      style={
                        thStyle
                      }
                    >
                      Thao tÃƒÂ¡c
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
                        Ã„â€˜
                      </td>

                      {/* ================================
                          TIP
                      ================================= */}

<td style={tdStyle}>
  {Number(order.tip ?? 0).toLocaleString("vi-VN")}Ã„â€˜
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
                            SÃ¡Â»Â­a
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
                            XÃƒÂ³a
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
