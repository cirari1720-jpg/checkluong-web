"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminOrdersPage() {
    const router = useRouter();
  const supabase = createClient();

  const [checkingRole, setCheckingRole] = useState(true);
  const [orderDate, setOrderDate] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [staffName, setStaffName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [tip, setTip] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
   useEffect(() => {
    async function checkRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || profile?.role !== "admin") {
        router.push("/orders");
        return;
      }

      setCheckingRole(false);
    }

    checkRole();
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setLoading(true);
    setMessage("");

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể lưu đơn");
      }

      setMessage("Đã lưu đơn thành công!");

      setOrderCode("");
      setStaffName("");
      setCustomerName("");
      setAmount("");
      setTip("");
      setNote("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra"
      );
    } finally {
      setLoading(false);
    }
  }
  if (checkingRole) {
    return <p style={{ padding: 40 }}>Đang kiểm tra quyền...</p>;
  }

  return (
    <main
      style={{
        maxWidth: 700,
        margin: "40px auto",
        padding: "0 20px",
      }}
    >
      <h1>Admin - Nhập đơn hàng</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginTop: 30,
        }}
      >
        <label>
          Ngày đơn
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            required
            style={{
              display: "block",
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </label>

        <label>
          Mã đơn
          <input
            type="text"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            placeholder="VD: TEST002"
            required
            style={{
              display: "block",
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </label>

        <label>
          Staff
          <input
            type="text"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            placeholder="VD: Admin"
            required
            style={{
              display: "block",
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </label>

        <label>
          Tên khách hàng
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="VD: Khách test"
            style={{
              display: "block",
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </label>

        <label>
          Số tiền
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="VD: 80000"
            min="0"
            required
            style={{
              display: "block",
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </label>

        <label>
          Tip
          <input
            type="number"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="VD: 3000"
            min="0"
            style={{
              display: "block",
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </label>

        <label>
          Ghi chú
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú..."
            rows={4}
            style={{
              display: "block",
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Đang lưu..." : "Lưu đơn"}
        </button>

        {message && (
          <p
            style={{
              fontWeight: "bold",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}