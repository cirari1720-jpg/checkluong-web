"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* =========================================================
   DANH SÁCH STAFF
========================================================= */

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
] as const;

/*
  Mỏ và Tia:
  - Vẫn là Staff
  - Đồng thời là Trực Page
*/
const PAGE_STAFF = ["Mỏ", "Tia"] as const;

/* =========================================================
   KPI
========================================================= */

const KPI_FIELDS = [
  {
    key: "page",
    label: "Đóng góp Page",
  },
  {
    key: "photo",
    label: "Mảng Chụp Ảnh",
  },
  {
    key: "editPhoto",
    label: "Mảng Edit Ảnh",
  },
  {
    key: "video",
    label: "Mảng Quay Video",
  },
  {
    key: "editVideo",
    label: "Mảng Edit Video",
  },
  {
    key: "harem",
    label: "Mảng Harem Đi Chơi",
  },
  {
    key: "hostDan",
    label: "Mảng Host Dàn",
  },
  {
    key: "hostTreo",
    label: "Mảng Host Treo",
  },
] as const;

type KpiKey = (typeof KPI_FIELDS)[number]["key"];

type KpiData = Record<KpiKey, number>;

/* =========================================================
   ORDER
========================================================= */

type Order = {
  id: string;          // ID thật trong database
  order_code: string;  // mã đơn hiển thị
  amount: number;
};

/* =========================================================
   PENALTY
========================================================= */

type Penalty = {
  id: string;
  error: string;
  amount: number;
  form: string;
};

/* =========================================================
   PERSON
========================================================= */

type PersonData = {
  staffOrders: Order[];
  pageOrders: Order[];
  kpi: KpiData;
  penalties: Penalty[];
};

type Database = Record<string, PersonData>;

/* =========================================================
   ACCOUNT
========================================================= */

type Account =
  | {
      role: "staff";
      name: string;
    }
  | {
      role: "admin";
      name: "Admin";
    };

/* =========================================================
   MÃ ĐĂNG NHẬP
=========================================================

   Mỗi người có một mã riêng.

   STAFF:
   Q123       -> Q
   ZAK456     -> Zak
   MTHIEN789  -> Mthien
   VET111     -> Vẹt
   GINZ222    -> Ginz
   ...

   PAGE:
   MO333      -> Mỏ
   TIA789     -> Tia

   ADMIN:
   ADMIN2026  -> Admin

   Có thể tự đổi mã ở đây.
========================================================= */

const LOGIN_ACCOUNTS: Record<string, Account> = {
  Q1811: {
    role: "staff",
    name: "Q",
  },

  ZAK176: {
    role: "staff",
    name: "Zak",
  },

  MTHIEN1912: {
    role: "staff",
    name: "Mthien",
  },

  VET239: {
    role: "staff",
    name: "Vẹt",
  },

  GINZ142: {
    role: "staff",
    name: "Ginz",
  },

  MIKA117: {
    role: "staff",
    name: "Mika",
  },

  PI035: {
    role: "staff",
    name: "Pi",
  },

  RAEV104: {
    role: "staff",
    name: "Raev",
  },

  HAIBON245: {
    role: "staff",
    name: "24",
  },

  ANWIR783: {
    role: "staff",
    name: "Anwir",
  },

  BYW769: {
    role: "staff",
    name: "Byw",
  },

  CAE253: {
    role: "staff",
    name: "Cae",
  },

  ELIS408: {
    role: "staff",
    name: "Elis",
  },

  DUONG692: {
    role: "staff",
    name: "Dương",
  },

  ED244: {
    role: "staff",
    name: "ED",
  },

MO201: {
  role: "staff",
  name: "Mỏ",
},

  HAN724: {
    role: "staff",
    name: "Hàn",
  },

  K233: {
    role: "staff",
    name: "K",
  },

  KZ248: {
    role: "staff",
    name: "Kz",
  },

  MIN825: {
    role: "staff",
    name: "Min",
  },

  MON307: {
    role: "staff",
    name: "Mon",
  },

  NAM110: {
    role: "staff",
    name: "Nam",
  },

  PPPP035: {
    role: "staff",
    name: "Pppp",
  },

  SENA456: {
    role: "staff",
    name: "Sena",
  },

TIA196: {
  role: "staff",
  name: "Tia",
},

  TEO1611: {
    role: "staff",
    name: "Tèo",
  },

  VI672: {
    role: "staff",
    name: "Vi",
  },

  W906: {
    role: "staff",
    name: "W",
  },

  ZIT1305: {
    role: "staff",
    name: "Zịt",
  },

  HOANGBAO555: {
    role: "staff",
    name: "Hoàng Bảo",
  },

  HARU635: {
    role: "staff",
    name: "Haru",
  },

  ZEFROSTY: {
    role: "admin",
    name: "Admin",
  },
};

/* =========================================================
   EMPTY DATA
========================================================= */

function emptyKpi(): KpiData {
  return {
    page: 0,
    photo: 0,
    editPhoto: 0,
    video: 0,
    editVideo: 0,
    harem: 0,
    hostDan: 0,
    hostTreo: 0,
  };
}

function emptyPerson(): PersonData {
  return {
    staffOrders: [],
    pageOrders: [],
    kpi: emptyKpi(),
    penalties: [],
  };
}

function createDatabase(): Database {
  const db: Database = {};

  STAFF.forEach((name) => {
    db[name] = emptyPerson();
  });

  return db;
}

/* =========================================================
   NORMALIZE
========================================================= */

function normalizePerson(raw: any): PersonData {
  const source = raw || {};
  const oldKpi = source.kpi || {};

  return {
    staffOrders: Array.isArray(source.staffOrders)
      ? source.staffOrders
      : [],

    pageOrders: Array.isArray(source.pageOrders)
      ? source.pageOrders
      : [],

    kpi: {
      page: Number(oldKpi.page ?? 0),

      photo: Number(
        oldKpi.photo ??
          oldKpi.a ??
          0
      ),

      editPhoto: Number(
        oldKpi.editPhoto ??
          oldKpi.b ??
          0
      ),

      video: Number(
        oldKpi.video ??
          oldKpi.c ??
          0
      ),

      editVideo: Number(
        oldKpi.editVideo ??
          oldKpi.d ??
          0
      ),

      harem: Number(
        oldKpi.harem ??
          oldKpi.e ??
          0
      ),

      hostDan: Number(
        oldKpi.hostDan ??
          oldKpi.f ??
          0
      ),

      hostTreo: Number(
        oldKpi.hostTreo ??
          oldKpi.g ??
          0
      ),
    },

    penalties: Array.isArray(source.penalties)
      ? source.penalties
      : [],
  };
}

function normalizeDatabase(raw: any): Database {
  const db = createDatabase();

  if (!raw || typeof raw !== "object") {
    return db;
  }

  STAFF.forEach((name) => {
    db[name] = normalizePerson(
      raw[name]
    );
  });

  return db;
}

/* =========================================================
   HELPERS
========================================================= */

function money(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(
    Number(value) || 0
  )} đ`;
}

function orderMoney(orders: Order[]) {
  return orders.reduce(
    (total, order) =>
      total + Number(order.amount || 0),
    0
  );
}

function totalKpi(person: PersonData) {
  return Object.values(person.kpi).reduce(
    (total, value) =>
      total + Number(value || 0),
    0
  );
}

function totalPenalty(person: PersonData) {
  return person.penalties.reduce(
    (total, penalty) =>
      total + Number(penalty.amount || 0),
    0
  );
}

function isPageStaff(name: string) {
  return PAGE_STAFF.includes(
    name as (typeof PAGE_STAFF)[number]
  );
}

/* =========================================================
   ORDER EDITOR
========================================================= */

function OrderEditor({
  title,
  description,
  orders,
  onChange,
}: {
  title: string;
  description: string;
  orders: Order[];
  onChange: (orders: Order[]) => void;
}) {
  function addOrder() {
  const newOrder: Order = {
    id: `new-${Date.now()}`,
    order_code: `Đơn ${orders.length + 1}`,
    amount: 0,
  };

  onChange([
    ...orders,
    newOrder,
  ]);
}

 function updateOrder(
  index: number,
  field: keyof Order,
  value: string
) {
  const next = [...orders];

  if (field === "amount") {
    next[index] = {
      ...next[index],
      amount: Number(value) || 0,
    };
  }

  if (field === "order_code") {
    next[index] = {
      ...next[index],
      order_code: value,
    };
  }

  onChange(next);
}

  function deleteOrder(index: number) {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa đơn này?"
      )
    ) {
      return;
    }

    onChange(
      orders.filter(
        (_, i) => i !== index
      )
    );
  }

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <button
          className="primary-btn"
          onClick={addOrder}
        >
          + Thêm đơn
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          Chưa có đơn nào.
        </div>
      ) : (
        <div className="orders">
          {orders.map(
            (order, index) => (
              <div
                className="order-item"
                key={`${order.id}-${index}`}
              >
                <div className="order-index">
                  {index + 1}
                </div>

                <input
  value={order.order_code}
  onChange={(e) =>
    updateOrder(
      index,
      "order_code",
      e.target.value
    )
  }
  placeholder="Tên / mã đơn"
/>

                <input
                  type="number"
                  min="0"
                  value={order.amount}
                  onChange={(e) =>
                    updateOrder(
                      index,
                      "amount",
                      e.target.value
                    )
                  }
                  placeholder="Tiền"
                />

                <button
                  className="danger-btn"
                  onClick={() =>
                    deleteOrder(index)
                  }
                >
                  Xóa
                </button>
              </div>
            )
          )}
        </div>
      )}

      <div className="total-bar">
        <span>
          Tổng số:{" "}
          <b>{orders.length}</b>
        </span>

        <span>
          Tổng tiền:{" "}
          <b>
            {money(orderMoney(orders))}
          </b>
        </span>
      </div>
    </section>
  );
}

/* =========================================================
   READONLY ORDER
========================================================= */

function ReadonlyOrders({
  title,
  description,
  orders,
}: {
  title: string;
  description: string;
  orders: Order[];
}) {
  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <span className="readonly">
          🔒 CHỈ XEM
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          Chưa có đơn nào.
        </div>
      ) : (
        <div className="readonly-list">
          {orders.map(
            (order, index) => (
              <div
                className="readonly-item"
                key={`${order.id}-${index}`}
              >
                <span>
                  {index + 1}.{" "}
                  {order.id}
                </span>

                <b>
                  {money(order.amount)}
                </b>
              </div>
            )
          )}
        </div>
      )}

      <div className="total-bar">
        <span>
          Tổng số:{" "}
          <b>{orders.length}</b>
        </span>

        <span>
          Tổng tiền:{" "}
          <b>
            {money(orderMoney(orders))}
          </b>
        </span>
      </div>
    </section>
  );
}

/* =========================================================
   KPI EDITOR
========================================================= */

function KpiEditor({
  person,
  pageOnly,
  onChange,
}: {
  person: PersonData;
  pageOnly: boolean;
  onChange: (kpi: KpiData) => void;
}) {
  const fields = pageOnly
    ? KPI_FIELDS.filter(
        (field) =>
          field.key === "page"
      )
    : KPI_FIELDS;

  function update(
    key: KpiKey,
    value: string
  ) {
    onChange({
      ...person.kpi,
      [key]: Number(value) || 0,
    });
  }

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <h2>Điểm KPI</h2>
          <p>
            Admin được quyền cập nhật điểm.
          </p>
        </div>

        <span className="admin-badge">
          🔐 ADMIN
        </span>
      </div>

      <div className="kpi-grid">
        {fields.map((field) => (
          <div
            className="kpi-field"
            key={field.key}
          >
            <label>{field.label}</label>

            <input
              type="number"
              value={
                person.kpi[field.key]
              }
              onChange={(e) =>
                update(
                  field.key,
                  e.target.value
                )
              }
            />
          </div>
        ))}
      </div>

      <div className="highlight">
        <span>TỔNG ĐIỂM KPI</span>

        <strong>
          {pageOnly
            ? person.kpi.page
            : totalKpi(person)}
        </strong>
      </div>
    </section>
  );
}

/* =========================================================
   READONLY KPI
========================================================= */

function ReadonlyKpi({
  person,
  pageOnly,
}: {
  person: PersonData;
  pageOnly: boolean;
}) {
  const fields = pageOnly
    ? KPI_FIELDS.filter(
        (field) =>
          field.key === "page"
      )
    : KPI_FIELDS;

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <h2>Điểm KPI</h2>
          <p>
            Bạn chỉ có quyền xem.
          </p>
        </div>

        <span className="readonly">
          🔒 CHỈ XEM
        </span>
      </div>

      <div className="kpi-grid">
        {fields.map((field) => (
          <div
            className="kpi-readonly"
            key={field.key}
          >
            <span>{field.label}</span>

            <strong>
              {person.kpi[field.key]}
            </strong>
          </div>
        ))}
      </div>

      <div className="highlight">
        <span>TỔNG ĐIỂM KPI</span>

        <strong>
          {pageOnly
            ? person.kpi.page
            : totalKpi(person)}
        </strong>
      </div>
    </section>
  );
}

/* =========================================================
   PENALTY EDITOR
========================================================= */

function PenaltyEditor({
  penalties,
  onChange,
}: {
  penalties: Penalty[];
  onChange: (
    penalties: Penalty[]
  ) => void;
}) {
  function createId() {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }

  function addPenalty() {
    onChange([
      ...penalties,
      {
        id: createId(),
        error: "",
        amount: 0,
        form: "",
      },
    ]);
  }

  function updatePenalty(
    index: number,
    field: keyof Penalty,
    value: string
  ) {
    const next = [...penalties];

    if (field === "amount") {
      next[index] = {
        ...next[index],
        amount: Number(value) || 0,
      };
    } else {
      next[index] = {
        ...next[index],
        [field]: value,
      };
    }

    onChange(next);
  }

  function deletePenalty(
    index: number
  ) {
    if (
      !window.confirm(
        "Xóa khoản phạt này?"
      )
    ) {
      return;
    }

    onChange(
      penalties.filter(
        (_, i) => i !== index
      )
    );
  }

  const penaltyTotal =
    penalties.reduce(
      (sum, penalty) =>
        sum +
        Number(penalty.amount || 0),
      0
    );

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <h2>Phạt</h2>
          <p>
            Admin cập nhật lỗi, mức phạt
            và hình thức phạt.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={addPenalty}
        >
          + Thêm phạt
        </button>
      </div>

      {penalties.length === 0 ? (
        <div className="empty">
          Chưa có khoản phạt.
        </div>
      ) : (
        <div className="penalties">
          {penalties.map(
            (penalty, index) => (
              <div
                className="penalty"
                key={penalty.id}
              >
                <div className="penalty-number">
                  {index + 1}
                </div>

                <div>
                  <label>Lỗi phạt</label>

                  <input
                    value={penalty.error}
                    onChange={(e) =>
                      updatePenalty(
                        index,
                        "error",
                        e.target.value
                      )
                    }
                    placeholder="Ví dụ: Đi trễ"
                  />
                </div>

                <div>
                  <label>Mức phạt</label>

                  <input
                    type="number"
                    min="0"
                    value={penalty.amount}
                    onChange={(e) =>
                      updatePenalty(
                        index,
                        "amount",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label>
                    Hình thức phạt
                  </label>

                  <input
                    value={penalty.form}
                    onChange={(e) =>
                      updatePenalty(
                        index,
                        "form",
                        e.target.value
                      )
                    }
                    placeholder="Ví dụ: Trừ lương"
                  />
                </div>

                <button
                  className="danger-btn"
                  onClick={() =>
                    deletePenalty(index)
                  }
                >
                  Xóa
                </button>
              </div>
            )
          )}
        </div>
      )}

      <div className="total-bar">
        <span>
          Số lỗi:{" "}
          <b>{penalties.length}</b>
        </span>

        <span>
          Tổng phạt:{" "}
          <b>{money(penaltyTotal)}</b>
        </span>
      </div>
    </section>
  );
}

/* =========================================================
   READONLY PENALTY
========================================================= */

function ReadonlyPenalty({
  penalties,
}: {
  penalties: Penalty[];
}) {
  const penaltyTotal =
    penalties.reduce(
      (sum, penalty) =>
        sum +
        Number(penalty.amount || 0),
      0
    );

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <h2>Phạt</h2>
          <p>
            Thông tin phạt của bạn.
          </p>
        </div>

        <span className="readonly">
          🔒 CHỈ XEM
        </span>
      </div>

      {penalties.length === 0 ? (
        <div className="empty">
          Không có khoản phạt.
        </div>
      ) : (
        <div className="penalty-readonly-list">
          {penalties.map(
            (penalty, index) => (
              <div
                className="penalty-readonly"
                key={penalty.id}
              >
                <div>
                  <b>
                    {index + 1}.{" "}
                    {penalty.error ||
                      "Không có mô tả"}
                  </b>

                  <small>
                    Hình thức:{" "}
                    {penalty.form ||
                      "Chưa nhập"}
                  </small>
                </div>

                <strong>
                  {money(penalty.amount)}
                </strong>
              </div>
            )
          )}
        </div>
      )}

      <div className="total-bar">
        <span>Tổng phạt</span>

        <b>{money(penaltyTotal)}</b>
      </div>
    </section>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="stat-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function Home() {
  const supabase = createClient();

  const [database, setDatabase] =
    useState<Database>(
      createDatabase
    );

  const [currentUser, setCurrentUser] =
    useState<Account | null>(null);

  const [loginCode, setLoginCode] =
    useState("");

  const [selectedPerson, setSelectedPerson] =
    useState<string>("Q");

  const [activeTab, setActiveTab] =
    useState<
      "overview" |
      "orders" |
      "kpi" |
      "penalty"
    >("overview");

  const [loaded, setLoaded] =
    useState(false);

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
  async function loadData() {
    try {
      const [
        ordersResponse,
        kpiResponse,
        penaltiesResponse,
      ] = await Promise.all([
        fetch("/api/orders", {
          method: "GET",
          cache: "no-store",
        }),

        fetch("/api/kpi", {
          method: "GET",
          cache: "no-store",
        }),

        fetch("/api/staff-penalties", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      if (!ordersResponse.ok) {
        console.error(
          "Không thể tải đơn:",
          await ordersResponse.text()
        );
      }

      if (!kpiResponse.ok) {
        console.error(
          "Không thể tải KPI:",
          await kpiResponse.text()
        );
      }

      if (!penaltiesResponse.ok) {
        console.error(
          "Không thể tải phạt:",
          await penaltiesResponse.text()
        );
      }

      const orders = ordersResponse.ok
        ? await ordersResponse.json()
        : [];

      const kpiData = kpiResponse.ok
        ? await kpiResponse.json()
        : [];
        const penaltiesData = penaltiesResponse.ok
  ? await penaltiesResponse.json()
  : [];

      const nextDatabase = createDatabase();

/* ==================================================
   LOAD ORDERS VÀO DATABASE
   id       = ID thật trong bảng orders
   order_code = mã đơn hiển thị
================================================== */

if (Array.isArray(orders)) {
  for (const order of orders) {
    const staffName = String(
      order.staff_name ?? ""
    ).trim();

    if (!staffName) continue;

    const personName = STAFF.find(
      (name) =>
        name.trim().toLowerCase() ===
        staffName.toLowerCase()
    );

    if (!personName) {
      console.warn(
        "Không tìm thấy staff:",
        staffName
      );
      continue;
    }

    const normalizedOrder: Order = {
      id: String(order.id),
      order_code: String(
        order.order_code ?? ""
      ),
      amount: Number(
        order.amount ?? 0
      ),
    };

    /*
     * order_type = "page"
     * → đơn Trực Page
     *
     * Còn lại
     * → đơn Staff
     */
    if (
      String(order.order_type ?? "").toLowerCase() ===
      "page"
    ) {
      nextDatabase[personName].pageOrders.push(
        normalizedOrder
      );
    } else {
      nextDatabase[personName].staffOrders.push(
        normalizedOrder
      );
    }
  }
}

console.log(
  "ORDERS:",
  orders
);
/* ==================================================
   LOAD KPI VÀO DATABASE
================================================== */

if (Array.isArray(kpiData)) {
  for (const row of kpiData) {
    const staffName = String(
      row.staff_name ?? ""
    ).trim();

    if (!staffName) continue;

    const personName = STAFF.find(
      (name) =>
        name.trim().toLowerCase() ===
        staffName.toLowerCase()
    );

    if (!personName) {
      console.warn(
        "Không tìm thấy staff KPI:",
        staffName
      );
      continue;
    }

    nextDatabase[personName].kpi = {
      page: Number(row.page ?? 0),
      photo: Number(row.photo ?? 0),
      editPhoto: Number(row.edit_photo ?? 0),
      video: Number(row.video ?? 0),
      editVideo: Number(row.edit_video ?? 0),
      harem: Number(row.harem ?? 0),
      hostDan: Number(row.host_dan ?? 0),
      hostTreo: Number(row.host_treo ?? 0),
    };
  }
}

console.log(
  "KPI:",
  kpiData
);

console.log(
  "PENALTIES:",
  penaltiesData
);

console.log(
  "DATABASE:",
  nextDatabase
);

setDatabase(nextDatabase);

setLoaded(true);

      console.log(
        "KPI:",
        kpiData
      );

      console.log(
        "PENALTIES:",
        penaltiesData
      );

      console.log(
        "DATABASE:",
        nextDatabase
      );

      console.log(
        "========================="
      );

      setLoaded(true);
    } catch (error) {
      console.error(
        "Không thể tải dữ liệu:",
        error
      );

      setLoaded(true);
    }
  }

  loadData();
}, []);

  /* =======================================================
     SAVE
  ======================================================= */

  /* =======================================================
     LOGIN
  ======================================================= */

   async function login() {
    const code = loginCode.trim().toUpperCase();

    const account = LOGIN_ACCOUNTS[code];

    if (!account) {
      alert("Mã truy cập không đúng.");
      return;
    }

    try {
      // Admin vẫn đăng nhập bằng Supabase Auth
      if (account.role === "admin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: "cirari1720@gmail.com",
          password: "FoxxWxSx070503",
        });

        if (error) {
          console.error("Admin login error:", error);
          alert("Không thể đăng nhập Admin: " + error.message);
          return;
        }
      } else {
        // Staff đăng nhập bằng mã riêng
        const response = await fetch("/api/staff-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("Staff login error:", result);
          alert(result.error || "Không thể đăng nhập.");
          return;
        }

        console.log("Staff login:", result);
      }

      setCurrentUser(account);
      setLoginCode("");
      setActiveTab("overview");

      if (account.role === "admin") {
        setSelectedPerson("Q");
      } else {
        setSelectedPerson(account.name);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Có lỗi xảy ra khi đăng nhập.");
    }
  }
  /* =======================================================
     LOGOUT
  ======================================================= */

  function logout() {
    setCurrentUser(null);
    setLoginCode("");
    setActiveTab("overview");
  }

  /* =======================================================
     VIEWING
  ======================================================= */

  const viewingName =
    currentUser?.role === "admin"
      ? selectedPerson
      : currentUser?.name || "";

  const viewingPerson =
    normalizePerson(
      database[viewingName]
    );

  const isAdmin =
    currentUser?.role === "admin";

  const pagePerson =
    isPageStaff(viewingName);

  const staffOrders =
    viewingPerson.staffOrders;

  const pageOrders =
    viewingPerson.pageOrders;

  const allOrders = [
    ...staffOrders,
    ...pageOrders,
  ];

/* =======================================================
   UPDATE PERSON — ADMIN → SUPABASE
======================================================= */

async function updatePerson(
  updater: (person: PersonData) => PersonData
) {
  if (!isAdmin) {
    return;
  }

  const staffName = selectedPerson;

  const previousPerson = normalizePerson(
    database[staffName]
  );

  const updatedPerson = normalizePerson(
    updater(previousPerson)
  );

  /* ==========================================
     1. CẬP NHẬT UI NGAY
  ========================================== */

  setDatabase((previous) => ({
    ...previous,
    [staffName]: updatedPerson,
  }));

  try {
    /* ==========================================
       2. ORDERS — STAFF
    ========================================== */

    const oldStaffOrders =
      previousPerson.staffOrders ?? [];

    const newStaffOrders =
      updatedPerson.staffOrders ?? [];

    /*
     * Đồng bộ từng order với API.
     *
     * API /api/orders cần hỗ trợ:
     * POST = tạo
     * PUT = cập nhật
     * DELETE = xóa
     */

    const oldStaffMap = new Map(
      oldStaffOrders.map((order) => [
        order.id,
        order,
      ])
    );

    const newStaffMap = new Map(
      newStaffOrders.map((order) => [
        order.id,
        order,
      ])
    );

    /* ==========================================
       2A. TẠO / CẬP NHẬT ĐƠN STAFF
    ========================================== */

    for (const order of newStaffOrders) {
      const oldOrder =
        oldStaffMap.get(order.id);

      /* Đơn mới */
      if (!oldOrder) {
        const response = await fetch(
          "/api/orders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              order_date:
                new Date()
                  .toISOString()
                  .split("T")[0],

              order_code:
                order.id,

              staff_name:
                staffName,

              customer_name: "",

              amount:
                Number(order.amount || 0),

              tip: 0,

              note: "",
            }),
          }
        );

if (!response.ok) {
  throw new Error(
    "Không thể thêm đơn: " +
      (await response.text())
  );
}

const createdOrder = await response.json();

if (createdOrder?.id != null) {
  order.id = String(createdOrder.id);
}

continue;
}

/* Đơn cũ nhưng bị thay đổi */
      if (
        Number(oldOrder.amount || 0) !==
        Number(order.amount || 0)
      ) {
        const response = await fetch("/api/orders", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: String(order.id),
order_id: String(order.id),

    order_code: order.id,
    staff_name: staffName,
    amount: Number(order.amount || 0),
  }),
});

if (!response.ok) {
  throw new Error(
    "Không thể cập nhật đơn: " +
      (await response.text())
  );
}
      }
    }

    /* ==========================================
       2B. XÓA ĐƠN STAFF
    ========================================== */

    for (const oldOrder of oldStaffOrders) {
      if (
        !newStaffMap.has(oldOrder.id)
      ) {
        const response = await fetch(
          "/api/orders",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
  id: Number(oldOrder.id),
  order_id: Number(oldOrder.id),

  staff_name:
    staffName,
}),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Không thể xóa đơn: " +
              (await response.text())
          );
        }
      }
    }

    /* ==========================================
       3. ORDERS — TRỰC PAGE
    ========================================== */

    const oldPageOrders =
      previousPerson.pageOrders ?? [];

    const newPageOrders =
      updatedPerson.pageOrders ?? [];

    const oldPageMap = new Map(
      oldPageOrders.map((order) => [
        order.id,
        order,
      ])
    );

    const newPageMap = new Map(
      newPageOrders.map((order) => [
        order.id,
        order,
      ])
    );

    /* ==========================================
       3A. TẠO / CẬP NHẬT ĐƠN TRỰC
    ========================================== */

    for (const order of newPageOrders) {
      const oldOrder =
        oldPageMap.get(order.id);

      /* Đơn trực mới */
      if (!oldOrder) {
        const response = await fetch(
          "/api/orders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              order_date:
                new Date()
                  .toISOString()
                  .split("T")[0],

              order_code:
                order.id,

              staff_name:
                staffName,

              customer_name: "",

              amount:
                Number(order.amount || 0),

              tip: 0,

              note: "",

              order_type: "page",
            }),
          }
        );

if (!response.ok) {
  throw new Error(
    "Không thể thêm đơn trực: " +
      (await response.text())
  );
}

const createdOrder = await response.json();

if (createdOrder?.id != null) {
  order.id = String(createdOrder.id);
}

continue;
      }

      /* Đơn trực bị sửa */
      if (
        Number(oldOrder.amount || 0) !==
        Number(order.amount || 0)
      ) {
        const response = await fetch(
          "/api/orders",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
id: String(order.id),
order_id: String(order.id),
  order_code:
    order.order_code,

  staff_name:
    staffName,

  amount:
    Number(order.amount || 0),

  order_type: "page",
}),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Không thể cập nhật đơn trực: " +
              (await response.text())
          );
        }
      }
    }

    /* ==========================================
       3B. XÓA ĐƠN TRỰC
    ========================================== */

    for (const oldOrder of oldPageOrders) {
      if (
        !newPageMap.has(oldOrder.id)
      ) {
        const response = await fetch(
          "/api/orders",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
        body: JSON.stringify({
  id: Number(oldOrder.id),
  order_id: Number(oldOrder.id),

  staff_name:
    staffName,

  order_type: "page",
}),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Không thể xóa đơn trực: " +
              (await response.text())
          );
        }
      }
    }

    /* ==========================================
       4. KPI
    ========================================== */

    const oldKpi =
      previousPerson.kpi;

    const newKpi =
      updatedPerson.kpi;

    const kpiChanged =
      JSON.stringify(oldKpi) !==
      JSON.stringify(newKpi);

    if (kpiChanged) {
      const response = await fetch(
        "/api/kpi",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            staff_name:
              staffName,

            page:
              Number(newKpi.page || 0),

            photo:
              Number(newKpi.photo || 0),

            edit_photo:
              Number(
                newKpi.editPhoto || 0
              ),

            video:
              Number(newKpi.video || 0),

            edit_video:
              Number(
                newKpi.editVideo || 0
              ),

            harem:
              Number(newKpi.harem || 0),

            host_dan:
              Number(
                newKpi.hostDan || 0
              ),

            host_treo:
              Number(
                newKpi.hostTreo || 0
              ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Lưu KPI thất bại: " +
            (await response.text())
        );
      }
    }

    /* ==========================================
       5. PENALTIES
    ========================================== */

    const oldPenalties =
      previousPerson.penalties ?? [];

    const newPenalties =
      updatedPerson.penalties ?? [];

    const penaltiesChanged =
      JSON.stringify(oldPenalties) !==
      JSON.stringify(newPenalties);

    if (penaltiesChanged) {
      const response = await fetch(
        "/api/staff-penalties",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            staff_name:
              staffName,

            penalties:
              newPenalties.map(
                (penalty) => ({
                  id:
                    penalty.id,

                  error:
                    penalty.error,

                  amount:
                    Number(
                      penalty.amount || 0
                    ),

                  form:
                    penalty.form,
                })
              ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Lưu phạt thất bại: " +
            (await response.text())
        );
      }
    }

    /* ==========================================
       6. HOÀN TẤT
    ========================================== */

    console.log(
      "===== SUPABASE UPDATE SUCCESS ====="
    );

    console.log(
      "Staff:",
      staffName
    );

    console.log(
      "Updated:",
      updatedPerson
    );

  } catch (error) {
    /* ==========================================
       ROLLBACK UI
    ========================================== */

    console.error(
      "===== SUPABASE UPDATE ERROR =====",
      error
    );

    setDatabase((previous) => ({
      ...previous,
      [staffName]:
        previousPerson,
    }));

    alert(
      error instanceof Error
        ? error.message
        : "Không thể lưu dữ liệu lên Supabase."
    );
  }
}
/* =======================================================
   STATS
======================================================= */

const totalOrderMoney =
  orderMoney(allOrders);

const totalPenaltyMoney =
  totalPenalty(viewingPerson);

const totalKpiValue =
  pagePerson
    ? viewingPerson.kpi.page
    : totalKpi(viewingPerson);

  /* =======================================================
     LOGIN SCREEN
  ======================================================= */

  if (!currentUser) {
    return (
      <>
        <style jsx global>
          {styles}
        </style>

        <main className="login-page">
          <div className="login-card">
            <div className="login-logo">
              <img src="/bao-den.png" alt="Báo đen" />
            </div>

            <h1>
              TRA CỨU THÔNG TIN
            </h1>

            <p className="login-subtitle">
              Staff / Trực Page
            </p>

            <div className="login-field">
              <label>
                Mã truy cập
              </label>

              <input
                type="password"
                value={loginCode}
                onChange={(e) =>
                  setLoginCode(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter"
                  ) {
                    login();
                  }
                }}
                placeholder="Nhập mã truy cập"
              />
            </div>

            <button
              className="login-btn"
              onClick={login}
            >
              TRA CỨU
            </button>

            <p className="login-help">
              Nhập mã truy cập được cấp
              để xem thông tin.
            </p>
          </div>
        </main>
      </>
    );
  }

  /* =======================================================
     APP
  ======================================================= */

  return (
    <>
      <style jsx global>
        {styles}
      </style>

      <main className="app-page">
        <div className="container">

          {/* HEADER */}

          <header className="header">
            <div>
              <div className="brand">
                📊 TRA CỨU THÔNG TIN
              </div>

              <h1>
                {isAdmin
                  ? "Quản trị dữ liệu"
                  : `Xin chào, ${currentUser.name}`}
              </h1>

              <p>
                {isAdmin
                  ? "Admin có quyền chỉnh sửa dữ liệu"
                  : "Chế độ chỉ xem - không thể chỉnh sửa"}
              </p>
            </div>

            <div className="header-actions">
              {isAdmin ? (
                <span className="admin-badge">
                  🔐 ADMIN
                </span>
              ) : (
                <span className="readonly">
                  🔒 CHỈ XEM
                </span>
              )}

              <button
                className="logout"
                onClick={logout}
              >
                Đăng xuất
              </button>
            </div>
          </header>

          {/* ADMIN SELECT */}

          {isAdmin && (
            <section className="admin-panel">
              <div>
                <label>
                  Chọn người cần quản lý
                </label>

                <select
                  value={selectedPerson}
                  onChange={(e) => {
                    setSelectedPerson(
                      e.target.value
                    );
                    setActiveTab(
                      "overview"
                    );
                  }}
                >
                  {STAFF.map(
                    (name) => (
                      <option
                        key={name}
                        value={name}
                      >
                        {name}
                        {isPageStaff(name)
                          ? " — Staff + Trực"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>
            </section>
          )}

          {/* PROFILE */}

          <section className="profile">
            <div>
              <span className="profile-label">
                Đang tra cứu
              </span>

              <h2>{viewingName}</h2>

              <p>
                {pagePerson
                  ? "Staff + Trực Page"
                  : "Staff"}
              </p>
            </div>

            {pagePerson && (
              <div className="page-badge">
                PAGE
              </div>
            )}
          </section>

          {/* STATS */}

          <section className="stats">
            <StatCard
              title="Đơn đã đi"
              value={
                staffOrders.length
              }
            />

            <StatCard
              title={
                pagePerson
                  ? "Đơn đã trực"
                  : "Tổng đơn"
              }
              value={
                pagePerson
                  ? pageOrders.length
                  : staffOrders.length
              }
            />

            <StatCard
              title="Tổng KPI"
              value={totalKpiValue}
            />

            <StatCard
              title="Tổng phạt"
              value={money(
                totalPenaltyMoney
              )}
            />
          </section>

          {/* PAGE SUMMARY */}

          {pagePerson && (
            <section className="page-summary">
              <div>
                <span>Đơn đã đi</span>

                <strong>
                  {staffOrders.length}
                </strong>
              </div>

              <div>
                <span>Đơn đã trực</span>

                <strong>
                  {pageOrders.length}
                </strong>
              </div>

              <div>
                <span>
                  Tổng tất cả đơn
                </span>

                <strong>
                  {allOrders.length}
                </strong>
              </div>

              <div>
                <span>Tổng tiền</span>

                <strong>
                  {money(
                    totalOrderMoney
                  )}
                </strong>
              </div>
            </section>
          )}

          {/* TABS */}

          <nav className="tabs">
            <button
              className={
                activeTab === "overview"
                  ? "tab active"
                  : "tab"
              }
              onClick={() =>
                setActiveTab(
                  "overview"
                )
              }
            >
              Tổng quan
            </button>

            <button
              className={
                activeTab === "orders"
                  ? "tab active"
                  : "tab"
              }
              onClick={() =>
                setActiveTab(
                  "orders"
                )
              }
            >
              Đơn đã đi
            </button>

            <button
              className={
                activeTab === "kpi"
                  ? "tab active"
                  : "tab"
              }
              onClick={() =>
                setActiveTab("kpi")
              }
            >
              KPI
            </button>

            <button
              className={
                activeTab === "penalty"
                  ? "tab active"
                  : "tab"
              }
              onClick={() =>
                setActiveTab(
                  "penalty"
                )
              }
            >
              Phạt
            </button>
          </nav>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          {activeTab === "overview" && (
            <div className="content">
              <section className="card">
                <div className="section-title-row">
                  <div>
                    <h2>Tổng quan</h2>

                    <p>
                      {isAdmin
                        ? "Bạn đang quản lý dữ liệu của staff này."
                        : "Thông tin cá nhân của bạn."}
                    </p>
                  </div>

                  {isAdmin ? (
                    <span className="admin-badge">
                      🔐 ADMIN
                    </span>
                  ) : (
                    <span className="readonly">
                      🔒 CHỈ XEM
                    </span>
                  )}
                </div>

                <div className="overview-grid">
                  <div>
                    <span>
                      Đơn đã đi
                    </span>

                    <strong>
                      {staffOrders.length}
                    </strong>
                  </div>

                  {pagePerson && (
                    <div>
                      <span>
                        Đơn đã trực
                      </span>

                      <strong>
                        {pageOrders.length}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>
                      Tổng tiền đơn
                    </span>

                    <strong>
                      {money(
                        totalOrderMoney
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tổng KPI
                    </span>

                    <strong>
                      {totalKpiValue}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tổng phạt
                    </span>

                    <strong className="red">
                      {money(
                        totalPenaltyMoney
                      )}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="section-title-row">
                  <div>
                    <h2>
                      Trạng thái quyền
                    </h2>
                  </div>
                </div>

                <div className="permission-box">
                  {isAdmin ? (
                    <>
                      <div>
                        <b>
                          🔐 Admin
                        </b>

                        <span>
                          Có thể chỉnh sửa
                          tất cả dữ liệu.
                        </span>
                      </div>

                      <div>
                        <b>✓ Đơn</b>

                        <span>
                          Thêm / sửa / xóa
                          đơn đã đi và
                          đơn đã trực.
                        </span>
                      </div>

                      <div>
                        <b>✓ KPI</b>

                        <span>
                          Cập nhật điểm.
                        </span>
                      </div>

                      <div>
                        <b>✓ Phạt</b>

                        <span>
                          Cập nhật lỗi,
                          mức phạt,
                          hình thức.
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <b>
                          🔒 Staff
                        </b>

                        <span>
                          Chỉ được xem dữ
                          liệu của chính mình.
                        </span>
                      </div>

                      <div>
                        <b>
                          ✕ Chỉnh sửa
                        </b>

                        <span>
                          Không thể thay đổi
                          dữ liệu.
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          )}

          {
          /* =================================================
              ORDERS
          ================================================= */}

          {activeTab === "orders" && (
            <div className="content">

              {/* ĐƠN ĐÃ ĐI */}

              {isAdmin ? (
                <OrderEditor
                  title="Đơn đã đi"
                  description="Admin có thể thêm, sửa hoặc xóa đơn Staff đã đi."
                  orders={staffOrders}
                  onChange={(orders) => {
                    updatePerson(
                      (person) => ({
                        ...person,
                        staffOrders:
                          orders,
                      })
                    );
                  }}
                />
              ) : (
                <ReadonlyOrders
                  title="Đơn đã đi"
                  description="Danh sách các đơn Staff đã đi."
                  orders={staffOrders}
                />
              )}

              {/* ĐƠN ĐÃ TRỰC */}

              {pagePerson && (
                <>
                  {isAdmin ? (
                    <OrderEditor
                      title="Đơn đã trực"
                      description="Admin có thể thêm, sửa hoặc xóa đơn Page đã trực."
                      orders={pageOrders}
                      onChange={(orders) => {
                        updatePerson(
                          (person) => ({
                            ...person,
                            pageOrders:
                              orders,
                          })
                        );
                      }}
                    />
                  ) : (
                    <ReadonlyOrders
                      title="Đơn đã trực"
                      description="Danh sách các đơn Page đã trực."
                      orders={pageOrders}
                    />
                  )}
                </>
              )}

              {/* TỔNG */}

              <section className="card">
                <div className="section-title-row">
                  <div>
                    <h2>
                      Tổng đơn
                    </h2>

                    <p>
                      {pagePerson
                        ? "Bao gồm cả đơn đã đi và đơn đã trực."
                        : "Tổng số đơn đã đi."}
                    </p>
                  </div>
                </div>

                <div className="overview-grid">
                  <div>
                    <span>
                      Đơn đã đi
                    </span>

                    <strong>
                      {staffOrders.length}
                    </strong>
                  </div>

                  {pagePerson && (
                    <div>
                      <span>
                        Đơn đã trực
                      </span>

                      <strong>
                        {pageOrders.length}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>
                      Tổng đơn
                    </span>

                    <strong>
                      {allOrders.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tổng tiền
                    </span>

                    <strong>
                      {money(
                        totalOrderMoney
                      )}
                    </strong>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* =================================================
              KPI
          ================================================= */}

          {activeTab === "kpi" && (
            <div className="content">
              {isAdmin ? (
                <KpiEditor
                  person={viewingPerson}
                  pageOnly={pagePerson}
                  onChange={(kpi) => {
                    updatePerson(
                      (person) => ({
                        ...person,
                        kpi,
                      })
                    );
                  }}
                />
              ) : (
                <ReadonlyKpi
                  person={viewingPerson}
                  pageOnly={pagePerson}
                />
              )}
            </div>
          )}

          {/* =================================================
              PHẠT
          ================================================= */}

          {activeTab === "penalty" && (
            <div className="content">
              {isAdmin ? (
                <PenaltyEditor
                  penalties={
                    viewingPerson.penalties
                  }
                  onChange={(
                    penalties
                  ) => {
                    updatePerson(
                      (person) => ({
                        ...person,
                        penalties,
                      })
                    );
                  }}
                />
              ) : (
                <ReadonlyPenalty
                  penalties={
                    viewingPerson.penalties
                  }
                />
              )}
            </div>
          )}

          {/* FOOTER */}

          <footer>
            <span>
              Tra cứu thông tin KPI
            </span>

            <span>
              {isAdmin
                ? "Chế độ quản trị"
                : "Chế độ chỉ xem"}
            </span>
          </footer>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   CSS
========================================================= */

const styles = `
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  background: #f3f6fb;
  color: #111827;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

/* =========================
   LOGIN
========================= */

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    linear-gradient(
      135deg,
      #eef4ff,
      #f8fafc
    );
}

.login-card {
  width: min(
    100%,
    540px
  );
  background: white;
  border-radius: 28px;
  padding: 42px;
  box-shadow:
    0 25px 70px
    rgba(15, 23, 42, 0.14);
}

.login-logo {
  width: 68px;
  height: 68px;
  border-radius: 20px;
  background: #111827;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  margin: 0 auto 20px;
}

.login-card h1 {
  text-align: center;
  margin: 0;
  font-size: 30px;
  color: #111827;
}

.login-subtitle {
  text-align: center;
  color: #64748b;
  margin: 10px 0 32px;
}

.login-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.login-field input {
  width: 100%;
  height: 54px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 0 16px;
  outline: none;
}

.login-field input:focus {
  border-color: #2563eb;
  box-shadow:
    0 0 0 3px
    rgba(37, 99, 235, 0.12);
}

.login-btn {
  width: 100%;
  height: 54px;
  margin-top: 18px;
  border: 0;
  border-radius: 14px;
  background: #2563eb;
  color: white;
  font-weight: 800;
  font-size: 16px;
}

.login-btn:hover {
  background: #1d4ed8;
}

.login-help {
  text-align: center;
  color: #64748b;
  margin: 18px 0 0;
  font-size: 14px;
}

/* =========================
   APP
========================= */

.app-page {
  min-height: 100vh;
  padding: 28px 16px 50px;
}

.container {
  width: min(
    1100px,
    100%
  );
  margin: 0 auto;
}

/* =========================
   HEADER
========================= */

.header {
  background: #111827;
  color: white;
  border-radius: 24px;
  padding: 28px 30px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.brand {
  font-size: 14px;
  font-weight: 800;
  color: #93c5fd;
  letter-spacing: .5px;
}

.header h1 {
  margin: 8px 0 6px;
  font-size: 28px;
}

.header p {
  margin: 0;
  color: #cbd5e1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.logout {
  border: 1px solid
    rgba(255,255,255,.2);
  background: white;
  color: #111827;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 700;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 800;
}

.readonly {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #334155;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 800;
}

/* =========================
   ADMIN
========================= */

.admin-panel {
  margin-top: 18px;
  background: #111827;
  color: white;
  border-radius: 20px;
  padding: 18px 20px;
}

.admin-panel label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
}

.admin-panel select {
  width: 100%;
  max-width: 440px;
  height: 48px;
  border: 0;
  border-radius: 12px;
  padding: 0 14px;
  background: white;
  color: #111827;
  outline: none;
}

/* =========================
   PROFILE
========================= */

.profile {
  margin-top: 18px;
  background: white;
  border-radius: 20px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow:
    0 8px 30px
    rgba(15,23,42,.05);
}

.profile-label {
  color: #64748b;
  font-size: 13px;
}

.profile h2 {
  margin: 5px 0;
  font-size: 26px;
}

.profile p {
  margin: 0;
  color: #64748b;
}

.page-badge {
  background: #ede9fe;
  color: #6d28d9;
  font-weight: 800;
  border-radius: 999px;
  padding: 9px 15px;
}

/* =========================
   STATS
========================= */

.stats {
  margin-top: 18px;
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.stat-card span {
  display: block;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-card strong {
  display: block;
  color: #0f172a;
  font-size: 27px;
}

/* =========================
   PAGE SUMMARY
========================= */

.page-summary {
  margin-top: 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 18px;
  padding: 16px;
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 12px;
}

.page-summary div {
  background: white;
  border-radius: 14px;
  padding: 14px;
}

.page-summary span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.page-summary strong {
  display: block;
  margin-top: 5px;
  font-size: 20px;
}

/* =========================
   TABS
========================= */

.tabs {
  margin-top: 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 7px;
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 5px;
}

.tab {
  border: 0;
  background: transparent;
  border-radius: 12px;
  padding: 13px;
  font-weight: 800;
  color: #64748b;
}

.tab:hover {
  background: #f1f5f9;
}

.tab.active {
  background: #111827;
  color: white;
}

/* =========================
   CONTENT
========================= */

.content {
  margin-top: 18px;
  display: grid;
  gap: 18px;
}

.card {
  background: white;
  border-radius: 22px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow:
    0 8px 30px
    rgba(15,23,42,.04);
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.section-title-row h2 {
  margin: 0 0 6px;
  font-size: 21px;
}

.section-title-row p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.primary-btn {
  border: 0;
  background: #111827;
  color: white;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 800;
}

.primary-btn:hover {
  background: #1e293b;
}

.danger-btn {
  border: 0;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 10px;
  padding: 10px 13px;
  font-weight: 800;
}

.danger-btn:hover {
  background: #fecaca;
}

.empty {
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
}

/* =========================
   ORDERS
========================= */

.orders {
  display: grid;
  gap: 10px;
}

.order-item {
  display: grid;
  grid-template-columns:
    42px 1fr 180px auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.order-index {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.order-item input,
.penalty input {
  width: 100%;
  height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 12px;
  outline: none;
}

.order-item input:focus,
.penalty input:focus {
  border-color: #2563eb;
}

.total-bar {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 28px;
  color: #64748b;
}

.total-bar b {
  color: #111827;
}

.readonly-list {
  display: grid;
  gap: 8px;
}

.readonly-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.readonly-item strong {
  color: #2563eb;
}

/* =========================
   OVERVIEW
========================= */

.overview-grid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 12px;
}

.overview-grid > div {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}

.overview-grid span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.overview-grid strong {
  display: block;
  margin-top: 7px;
  font-size: 22px;
}

.red {
  color: #dc2626 !important;
}

/* =========================
   PERMISSION
========================= */

.permission-box {
  display: grid;
  gap: 10px;
}

.permission-box div {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 13px;
}

.permission-box b {
  min-width: 110px;
}

.permission-box span {
  color: #64748b;
}

/* =========================
   KPI
========================= */

.kpi-grid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 14px;
}

.kpi-field label,
.penalty label {
  display: block;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 7px;
  color: #475569;
}

.kpi-field input {
  width: 100%;
  height: 50px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 18px;
  font-weight: 800;
  outline: none;
}

.kpi-field input:focus {
  border-color: #2563eb;
}

.kpi-readonly {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}

.kpi-readonly span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.kpi-readonly strong {
  display: block;
  font-size: 25px;
  margin-top: 8px;
}

.highlight {
  margin-top: 20px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  padding: 20px;
}

.highlight span {
  display: block;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
}

.highlight strong {
  display: block;
  color: #1e3a8a;
  font-size: 34px;
  margin-top: 4px;
}

/* =========================
   PENALTY
========================= */

.penalties {
  display: grid;
  gap: 12px;
}

.penalty {
  display: grid;
  grid-template-columns:
    42px 1.4fr 180px 1fr auto;
  gap: 10px;
  align-items: end;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
}

.penalty-number {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #fee2e2;
  color: #b91c1c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  margin-bottom: 4px;
}

.penalty-readonly-list {
  display: grid;
  gap: 10px;
}

.penalty-readonly {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 16px;
  border: 1px solid #fecaca;
  background: #fff7f7;
  border-radius: 14px;
}

.penalty-readonly b {
  display: block;
}

.penalty-readonly small {
  display: block;
  color: #64748b;
  margin-top: 5px;
}

.penalty-readonly strong {
  color: #dc2626;
  white-space: nowrap;
}

/* =========================
   FOOTER
========================= */

footer {
  margin-top: 28px;
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 13px;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 900px) {
  .stats,
  .page-summary,
  .overview-grid,
  .kpi-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .order-item {
    grid-template-columns:
      42px 1fr 150px;
  }

  .order-item .danger-btn {
    grid-column: 2 / -1;
  }

  .penalty {
    grid-template-columns:
      42px 1fr 1fr;
  }

  .penalty > div:nth-child(4) {
    grid-column: 2 / -1;
  }

  .penalty > button {
    grid-column: 2 / -1;
  }
}

@media (max-width: 600px) {
  .app-page {
    padding: 15px 10px 30px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
    padding: 22px;
  }

  .header h1 {
    font-size: 23px;
  }

  .header-actions {
    justify-content: space-between;
  }

  .profile {
    padding: 18px;
  }

  .stats,
  .page-summary,
  .overview-grid,
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .tabs {
    overflow-x: auto;
  }

  .tab {
    min-width: 100px;
  }

  .card {
    padding: 18px;
  }

  .section-title-row {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-btn {
    width: 100%;
  }

  .order-item {
    grid-template-columns: 1fr;
  }

  .order-index {
    margin-bottom: -2px;
  }

  .order-item .danger-btn {
    grid-column: auto;
  }

  .penalty {
    grid-template-columns: 1fr;
  }

  .penalty-number {
    margin-bottom: 0;
  }

  .penalty > div:nth-child(4),
  .penalty > button {
    grid-column: auto;
  }

  .total-bar {
    flex-direction: column;
    gap: 8px;
  }

  .penalty-readonly {
    flex-direction: column;
    align-items: stretch;
  }

  footer {
    flex-direction: column;
    gap: 5px;
  }

  .login-card {
    padding: 28px 20px;
  }
}
`;