"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type StaffSummary = {
  staff_name: string;

  total_orders: number;
  total_amount: number;
  total_tip: number;

  page: number;
  photo: number;
  edit_photo: number;
  video: number;
  edit_video: number;
  harem: number;
  host_dan: number;
  host_treo: number;
};

type Penalty = {
  id: number;
  staff_name: string;
  error: string;
  amount: number;
  form: string;
  created_at: string;
};

export default function KpiPage() {
  const router = useRouter();
  const supabase = createClient();

  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FORM THÊM PHẠT
  // =========================

  const [penaltyStaff, setPenaltyStaff] = useState("");
  const [penaltyError, setPenaltyError] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyForm, setPenaltyForm] = useState("");

  const [addingPenalty, setAddingPenalty] = useState(false);
  const [penaltyMessage, setPenaltyMessage] = useState("");

  // =========================
  // LOAD SUMMARY
  // =========================

  async function loadSummary() {
    try {
      setError("");

      const response = await fetch("/api/summary", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Không thể tải dữ liệu KPI"
        );
      }

      setStaff(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu KPI"
      );
    }
  }

  // =========================
  // LOAD PENALTIES
  // =========================

  async function loadPenalties() {
    try {
      setError("");

      const response = await fetch(
        "/api/staff-penalties",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Không thể tải danh sách phạt"
        );
      }

      setPenalties(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách phạt"
      );
    }
  }

  // =========================
  // LOAD EVERYTHING
  // =========================

  async function loadAll() {
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

      await Promise.all([
        loadSummary(),
        loadPenalties(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // THÊM PHẠT
  // =========================

  async function handleAddPenalty(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setAddingPenalty(true);
    setPenaltyMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/staff-penalties",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staff_name: penaltyStaff,
            error: penaltyError,
            amount: Number(
              penaltyAmount || 0
            ),
            form: penaltyForm,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Không thể thêm phạt"
        );
      }

      setPenaltyMessage(
        `Đã thêm phạt cho ${penaltyStaff}`
      );

      setPenaltyStaff("");
      setPenaltyError("");
      setPenaltyAmount("");
      setPenaltyForm("");

      await Promise.all([
        loadPenalties(),
        loadSummary(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể thêm phạt"
      );
    } finally {
      setAddingPenalty(false);
    }
  }

  // =========================
  // SỬA PHẠT
  // =========================

  async function handleEditPenalty(
    penalty: Penalty
  ) {
    const newError = window.prompt(
      "Nội dung lỗi:",
      penalty.error
    );

    if (newError === null) {
      return;
    }

    const newAmountText = window.prompt(
      "Số tiền phạt:",
      String(penalty.amount)
    );

    if (newAmountText === null) {
      return;
    }

    const newForm = window.prompt(
      "Hình thức phạt:",
      penalty.form
    );

    if (newForm === null) {
      return;
    }

    const newAmount = Number(
      newAmountText
    );

    if (
      !Number.isFinite(newAmount) ||
      newAmount < 0
    ) {
      alert("Số tiền phạt không hợp lệ");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        "/api/staff-penalties",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: penalty.id,
            error: newError.trim(),
            amount: newAmount,
            form: newForm.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Không thể sửa phạt"
        );
      }

      setPenaltyMessage(
        `Đã sửa phạt cho ${penalty.staff_name}`
      );

      await Promise.all([
        loadPenalties(),
        loadSummary(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể sửa phạt"
      );
    }
  }

  // =========================
  // XÓA PHẠT
  // =========================

  async function handleDeletePenalty(
    id: number
  ) {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa khoản phạt này?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        "/api/staff-penalties",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Không thể xóa phạt"
        );
      }

      setPenaltyMessage(
        "Đã xóa khoản phạt"
      );

      await Promise.all([
        loadPenalties(),
        loadSummary(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể xóa phạt"
      );
    }
  }

  // =========================
  // LOGOUT
  // =========================

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  // =========================
  // FORMAT TIỀN
  // =========================

  function money(value: number) {
    return (
      Number(value || 0).toLocaleString(
        "vi-VN"
      ) + "đ"
    );
  }

  // =========================
  // TỔNG KPI
  // =========================

  function totalKpi(
    person: StaffSummary
  ) {
    return (
      Number(person.page || 0) +
      Number(person.photo || 0) +
      Number(person.edit_photo || 0) +
      Number(person.video || 0) +
      Number(person.edit_video || 0) +
      Number(person.harem || 0) +
      Number(person.host_dan || 0) +
      Number(person.host_treo || 0)
    );
  }

  // =========================
  // TỔNG PHẠT STAFF
  // =========================

  function totalPenalty(
    staffName: string
  ) {
    return penalties
      .filter(
        (penalty) =>
          penalty.staff_name === staffName
      )
      .reduce(
        (total, penalty) =>
          total +
          Number(penalty.amount || 0),
        0
      );
  }

  // =========================
  // TIỀN THỰC NHẬN
  // =========================

  function netMoney(
    person: StaffSummary
  ) {
    const totalPenaltyMoney =
      totalPenalty(person.staff_name);

    return (
      Number(person.total_amount || 0) +
      Number(person.total_tip || 0) -
      totalPenaltyMoney
    );
  }

  // =========================
  // USE EFFECT
  // =========================

  useEffect(() => {
    loadAll();
  }, []);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main style={pageStyle}>
        <h1>Quản lý KPI</h1>

        <p>Đang tải dữ liệu...</p>
      </main>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <main style={pageStyle}>
      {/* HEADER */}

      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>
            Quản lý KPI
          </h1>

          <p style={{ marginTop: 8 }}>
            Theo dõi đơn hàng, tip, KPI,
            phạt và tiền thực nhận
          </p>
        </div>

        <div>
          <button
            onClick={loadAll}
            style={buttonStyle}
          >
            Làm mới
          </button>

          <button
            onClick={handleLogout}
            style={{
              ...buttonStyle,
              marginLeft: 10,
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div style={errorStyle}>
          Lỗi: {error}
        </div>
      )}

      {/* FORM THÊM PHẠT */}

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>
          Thêm phạt
        </h2>

        <form
          onSubmit={handleAddPenalty}
          style={formGridStyle}
        >
          <div>
            <label>Staff</label>

            <select
              value={penaltyStaff}
              onChange={(e) =>
                setPenaltyStaff(
                  e.target.value
                )
              }
              required
              style={inputStyle}
            >
              <option value="">
                -- Chọn staff --
              </option>

              {staff.map((person) => (
                <option
                  key={person.staff_name}
                  value={person.staff_name}
                >
                  {person.staff_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Nội dung lỗi</label>

            <input
              type="text"
              value={penaltyError}
              onChange={(e) =>
                setPenaltyError(
                  e.target.value
                )
              }
              placeholder="VD: Sai thông tin đơn"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label>Số tiền phạt</label>

            <input
              type="number"
              min="0"
              value={penaltyAmount}
              onChange={(e) =>
                setPenaltyAmount(
                  e.target.value
                )
              }
              placeholder="10000"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label>Hình thức phạt</label>

            <input
              type="text"
              value={penaltyForm}
              onChange={(e) =>
                setPenaltyForm(
                  e.target.value
                )
              }
              placeholder="VD: Trừ tiền"
              required
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
              disabled={addingPenalty}
              style={{
                ...buttonStyle,
                fontWeight: "bold",
              }}
            >
              {addingPenalty
                ? "Đang thêm..."
                : "Thêm phạt"}
            </button>
          </div>
        </form>

        {penaltyMessage && (
          <p
            style={{
              color: "green",
              fontWeight: "bold",
              marginBottom: 0,
            }}
          >
            {penaltyMessage}
          </p>
        )}
      </section>

      {/* BẢNG KPI */}

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>
          Tổng hợp KPI & tiền
        </h2>

        {!error &&
          staff.length === 0 && (
            <p>
              Chưa có dữ liệu staff.
            </p>
          )}

        {!error &&
          staff.length > 0 && (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>
                      Staff
                    </th>

                    <th style={thStyle}>
                      Số đơn
                    </th>

                    <th style={thStyle}>
                      Tiền đơn
                    </th>

                    <th style={thStyle}>
                      Tip
                    </th>

                    <th style={thStyle}>
                      Đóng góp Page
                    </th>

                    <th style={thStyle}>
                      Chụp Ảnh
                    </th>

                    <th style={thStyle}>
                      Edit Ảnh
                    </th>

                    <th style={thStyle}>
                      Quay Video
                    </th>

                    <th style={thStyle}>
                      Edit Video
                    </th>

                    <th style={thStyle}>
                      Harem
                    </th>

                    <th style={thStyle}>
                      Host Dàn
                    </th>

                    <th style={thStyle}>
                      Host Treo
                    </th>

                    <th style={thStyle}>
                      Tổng KPI
                    </th>

                    <th style={thStyle}>
                      Tổng phạt
                    </th>

                    <th style={thStyle}>
                      Tiền thực nhận
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {staff.map((person) => (
                    <tr
                      key={
                        person.staff_name
                      }
                    >
                      <td style={tdStyle}>
                        <strong>
                          {
                            person.staff_name
                          }
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {
                          person.total_orders
                        }
                      </td>

                      <td style={tdStyle}>
                        {money(
                          person.total_amount
                        )}
                      </td>

                      <td style={tdStyle}>
                        {money(
                          person.total_tip
                        )}
                      </td>

                      <td style={tdStyle}>
                        {person.page}
                      </td>

                      <td style={tdStyle}>
                        {person.photo}
                      </td>

                      <td style={tdStyle}>
                        {
                          person.edit_photo
                        }
                      </td>

                      <td style={tdStyle}>
                        {person.video}
                      </td>

                      <td style={tdStyle}>
                        {
                          person.edit_video
                        }
                      </td>

                      <td style={tdStyle}>
                        {person.harem}
                      </td>

                      <td style={tdStyle}>
                        {
                          person.host_dan
                        }
                      </td>

                      <td style={tdStyle}>
                        {
                          person.host_treo
                        }
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                        }}
                      >
                        {totalKpi(
                          person
                        )}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          color:
                            totalPenalty(
                              person.staff_name
                            ) > 0
                              ? "#c62828"
                              : undefined,
                          fontWeight:
                            totalPenalty(
                              person.staff_name
                            ) > 0
                              ? "bold"
                              : undefined,
                        }}
                      >
                        {money(
                          totalPenalty(
                            person.staff_name
                          )
                        )}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                        }}
                      >
                        {money(
                          netMoney(person)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {/* DANH SÁCH PHẠT */}

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>
          Danh sách phạt
        </h2>

        {penalties.length === 0 ? (
          <p>
            Chưa có khoản phạt nào.
          </p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>
                    Staff
                  </th>

                  <th style={thStyle}>
                    Nội dung lỗi
                  </th>

                  <th style={thStyle}>
                    Số tiền
                  </th>

                  <th style={thStyle}>
                    Hình thức
                  </th>

                  <th style={thStyle}>
                    Ngày
                  </th>

                  <th style={thStyle}>
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {penalties.map(
                  (penalty) => (
                    <tr
                      key={penalty.id}
                    >
                      <td style={tdStyle}>
                        <strong>
                          {
                            penalty.staff_name
                          }
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {penalty.error}
                      </td>

                      <td style={tdStyle}>
                        {money(
                          penalty.amount
                        )}
                      </td>

                      <td style={tdStyle}>
                        {penalty.form}
                      </td>

                      <td style={tdStyle}>
                        {new Date(
                          penalty.created_at
                        ).toLocaleString(
                          "vi-VN"
                        )}
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            display:
                              "flex",
                            gap: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              handleEditPenalty(
                                penalty
                              )
                            }
                            style={
                              editButtonStyle
                            }
                          >
                            Sửa
                          </button>

                          <button
                            onClick={() =>
                              handleDeletePenalty(
                                penalty.id
                              )
                            }
                            style={
                              deleteButtonStyle
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

// =========================
// STYLE
// =========================

const pageStyle = {
  padding: "40px",
  maxWidth: "1600px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "30px",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "24px",
  marginBottom: "30px",
  background: "#fff",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "20px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

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
  border: "1px solid #ccc",
  borderRadius: "6px",
  background: "#fff",
};

const editButtonStyle = {
  padding: "7px 12px",
  cursor: "pointer",
  border: "1px solid #1976d2",
  borderRadius: "6px",
  background: "#fff",
  color: "#1976d2",
  fontWeight: "bold",
};

const deleteButtonStyle = {
  padding: "7px 12px",
  cursor: "pointer",
  border: "1px solid #d32f2f",
  borderRadius: "6px",
  background: "#fff",
  color: "#d32f2f",
};

const errorStyle = {
  padding: "12px",
  marginBottom: "20px",
  color: "#b00020",
  background: "#ffe5e5",
  borderRadius: "6px",
};

const tableWrapperStyle = {
  overflowX: "auto" as const,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "1500px",
};

const thStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left" as const,
  background: "#f5f5f5",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  whiteSpace: "nowrap" as const,
};