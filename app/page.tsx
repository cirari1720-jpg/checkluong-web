"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* =========================================================
   DANH SÃCH STAFF
========================================================= */

const STAFF = [
  "Q",
  "Zak",
  "Mthien",
  "Váº¹t",
  "Ginz",
  "Mika",
  "Pi",
  "Raev",
  "24",
  "Anwir",
  "Byw",
  "Cae",
  "Elis",
  "DÆ°Æ¡ng",
  "ED",
  "Má»",
  "HÃ n",
  "K",
  "Kz",
  "Min",
  "Mon",
  "Nam",
  "Pppp",
  "Sena",
  "Tia",
  "TÃ¨o",
  "Vi",
  "W",
  "Zá»‹t",
  "HoÃ ng Báº£o",
  "Haru",
] as const;

/*
  Má» vÃ  Tia:
  - Váº«n lÃ  Staff
  - Äá»“ng thá»i lÃ  Trá»±c Page
*/
const PAGE_STAFF = ["Má»", "Tia"] as const;

/* =========================================================
   KPI
========================================================= */

const KPI_FIELDS = [
  {
    key: "page",
    label: "ÄÃ³ng gÃ³p Page",
  },
  {
    key: "photo",
    label: "Máº£ng Chá»¥p áº¢nh",
  },
  {
    key: "editPhoto",
    label: "Máº£ng Edit áº¢nh",
  },
  {
    key: "video",
    label: "Máº£ng Quay Video",
  },
  {
    key: "editVideo",
    label: "Máº£ng Edit Video",
  },
  {
    key: "harem",
    label: "Máº£ng Harem Äi ChÆ¡i",
  },
  {
    key: "hostDan",
    label: "Máº£ng Host DÃ n",
  },
  {
    key: "hostTreo",
    label: "Máº£ng Host Treo",
  },
] as const;

type KpiKey = (typeof KPI_FIELDS)[number]["key"];

type KpiData = Record<KpiKey, number>;

/* =========================================================
   ORDER
========================================================= */

type Order = {
  id: string;          // ID tháº­t trong database
  order_code: string;  // mÃ£ Ä‘Æ¡n hiá»ƒn thá»‹
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
   MÃƒ ÄÄ‚NG NHáº¬P
=========================================================

   Má»—i ngÆ°á»i cÃ³ má»™t mÃ£ riÃªng.

   STAFF:
   Q123       -> Q
   ZAK456     -> Zak
   MTHIEN789  -> Mthien
   VET111     -> Váº¹t
   GINZ222    -> Ginz
   ...

   PAGE:
   MO333      -> Má»
   TIA789     -> Tia

   ADMIN:
   ADMIN2026  -> Admin

   CÃ³ thá»ƒ tá»± Ä‘á»•i mÃ£ á»Ÿ Ä‘Ã¢y.
========================================================= */



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
  )} Ä‘`;
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
    order_code: `ÄÆ¡n ${orders.length + 1}`,
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
        "Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a Ä‘Æ¡n nÃ y?"
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
          + ThÃªm Ä‘Æ¡n
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          ChÆ°a cÃ³ Ä‘Æ¡n nÃ o.
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
  placeholder="TÃªn / mÃ£ Ä‘Æ¡n"
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
                  placeholder="Tiá»n"
                />

                <button
                  className="danger-btn"
                  onClick={() =>
                    deleteOrder(index)
                  }
                >
                  XÃ³a
                </button>
              </div>
            )
          )}
        </div>
      )}

      <div className="total-bar">
        <span>
          Tá»•ng sá»‘:{" "}
          <b>{orders.length}</b>
        </span>

        <span>
          Tá»•ng tiá»n:{" "}
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
          ðŸ”’ CHá»ˆ XEM
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          ChÆ°a cÃ³ Ä‘Æ¡n nÃ o.
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
          Tá»•ng sá»‘:{" "}
          <b>{orders.length}</b>
        </span>

        <span>
          Tá»•ng tiá»n:{" "}
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
          <h2>Äiá»ƒm KPI</h2>
          <p>
            Admin Ä‘Æ°á»£c quyá»n cáº­p nháº­t Ä‘iá»ƒm.
          </p>
        </div>

        <span className="admin-badge">
          ðŸ” ADMIN
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
        <span>Tá»”NG ÄIá»‚M KPI</span>

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
          <h2>Äiá»ƒm KPI</h2>
          <p>
            Báº¡n chá»‰ cÃ³ quyá»n xem.
          </p>
        </div>

        <span className="readonly">
          ðŸ”’ CHá»ˆ XEM
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
        <span>Tá»”NG ÄIá»‚M KPI</span>

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
          <h2>Pháº¡t</h2>
          <p>
            ThÃ´ng tin cÃ¡c khoáº£n pháº¡t.
          </p>
        </div>
      </div>

      {penalties.length === 0 ? (
        <div className="empty">
          ChÆ°a cÃ³ khoáº£n pháº¡t.
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
                  <label>Lá»—i pháº¡t</label>

                  <div className="readonly-field">
                    {penalty.error || "â€”"}
                  </div>
                </div>

                <div>
                  <label>Má»©c pháº¡t</label>

                  <div className="readonly-field">
                    {money(
                      Number(
                        penalty.amount || 0
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label>
                    HÃ¬nh thá»©c pháº¡t
                  </label>

                  <div className="readonly-field">
                    {penalty.form || "â€”"}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <div className="total-bar">
        <span>
          Sá»‘ lá»—i:{" "}
          <b>{penalties.length}</b>
        </span>

        <span>
          Tá»•ng pháº¡t:{" "}
          <b>{money(penaltyTotal)}</b>
        </span>
      </div>
    </section>
  );
}
function PenaltyEditor({
  penalties,
  onChange,
}: {
  penalties: Penalty[];
  onChange: (
    penalties: Penalty[]
  ) => void;
}) {
  const [draftPenalties, setDraftPenalties] =
    useState<Penalty[]>(penalties);

  useEffect(() => {
    setDraftPenalties(penalties);
  }, [penalties]);

  function createId() {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }

  function addPenalty() {
    const newPenalty: Penalty = {
      id: createId(),
      error: "",
      amount: 0,
      form: "",
    };

    const next = [
      ...draftPenalties,
      newPenalty,
    ];

    setDraftPenalties(next);

    /*
     * Chá»‰ cáº­p nháº­t giao diá»‡n ngay.
     * KhÃ´ng cáº§n API lÆ°u vÃ¬ khoáº£n pháº¡t
     * chÆ°a cÃ³ ná»™i dung lá»—i.
     */
    onChange(next);
  }

  function updatePenaltyLocal(
    index: number,
    field: keyof Penalty,
    value: string
  ) {
    const next = [...draftPenalties];

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

    setDraftPenalties(next);
  }

  function savePenalty() {
    /*
     * Chá»‰ gá»­i dá»¯ liá»‡u lÃªn parent khi
     * ngÆ°á»i dÃ¹ng Ä‘Ã£ nháº­p xong vÃ  rá»i Ã´.
     */
    onChange(
      draftPenalties.map((penalty) => ({
        ...penalty,
        error:
          penalty.error?.trim() ?? "",
        form:
          penalty.form?.trim() ?? "",
        amount:
          Number(penalty.amount || 0),
      }))
    );
  }

  function deletePenalty(
    index: number
  ) {
    if (
      !window.confirm(
        "XÃ³a khoáº£n pháº¡t nÃ y?"
      )
    ) {
      return;
    }

    const next =
      draftPenalties.filter(
        (_, i) => i !== index
      );

    setDraftPenalties(next);
    onChange(next);
  }

  const penaltyTotal =
    draftPenalties.reduce(
      (sum, penalty) =>
        sum +
        Number(penalty.amount || 0),
      0
    );

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <h2>Pháº¡t</h2>

          <p>
            Admin cáº­p nháº­t lá»—i, má»©c pháº¡t
            vÃ  hÃ¬nh thá»©c pháº¡t.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={addPenalty}
        >
          + ThÃªm pháº¡t
        </button>
      </div>

      {draftPenalties.length === 0 ? (
        <div className="empty">
          ChÆ°a cÃ³ khoáº£n pháº¡t.
        </div>
      ) : (
        <div className="penalties">
          {draftPenalties.map(
            (penalty, index) => (
              <div
                className="penalty"
                key={penalty.id}
              >
                <div className="penalty-number">
                  {index + 1}
                </div>

                <div>
                  <label>
                    Lá»—i pháº¡t
                  </label>

                  <input
                    value={penalty.error}
                    onChange={(e) =>
                      updatePenaltyLocal(
                        index,
                        "error",
                        e.target.value
                      )
                    }
                    onBlur={savePenalty}
                    placeholder="VÃ­ dá»¥: Äi trá»…"
                  />
                </div>

                <div>
                  <label>
                    Má»©c pháº¡t
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={penalty.amount}
                    onChange={(e) =>
                      updatePenaltyLocal(
                        index,
                        "amount",
                        e.target.value
                      )
                    }
                    onBlur={savePenalty}
                  />
                </div>

                <div>
                  <label>
                    HÃ¬nh thá»©c pháº¡t
                  </label>

                  <input
                    value={penalty.form}
                    onChange={(e) =>
                      updatePenaltyLocal(
                        index,
                        "form",
                        e.target.value
                      )
                    }
                    onBlur={savePenalty}
                    placeholder="VÃ­ dá»¥: Trá»« lÆ°Æ¡ng"
                  />
                </div>

                <button
                  type="button"
                  className="danger-btn"
                  onClick={() =>
                    deletePenalty(index)
                  }
                >
                  XÃ³a
                </button>
              </div>
            )
          )}
        </div>
      )}

      <div className="total-bar">
        <span>
          Sá»‘ lá»—i:{" "}
          <b>
            {draftPenalties.length}
          </b>
        </span>

        <span>
          Tá»•ng pháº¡t:{" "}
          <b>
            {money(penaltyTotal)}
          </b>
        </span>
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

    useEffect(() => {
  let cancelled = false;

  async function restoreSession() {
    try {
      const response = await fetch("/api/session", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (cancelled) return;

      if (response.ok && result?.authenticated && result?.user) {
        const account: Account = {
          role: result.user.role,
          name: result.user.name,
        };

        setCurrentUser(account);

        if (account.role === "admin") {
          setSelectedPerson("Q");
        } else {
          setSelectedPerson(account.name);
        }
      }
    } catch (error) {
      console.error("Session restore error:", error);
    }
  }

  restoreSession();

  return () => {
    cancelled = true;
  };
}, []);


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
  if (!currentUser) return;

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
          "KhÃ´ng thá»ƒ táº£i Ä‘Æ¡n:",
          await ordersResponse.text()
        );
      }

      if (!kpiResponse.ok) {
        console.error(
          "KhÃ´ng thá»ƒ táº£i KPI:",
          await kpiResponse.text()
        );
      }

      if (!penaltiesResponse.ok) {
        console.error(
          "KhÃ´ng thá»ƒ táº£i pháº¡t:",
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

      /* ==========================================
   PENALTIES
========================================== */

if (Array.isArray(penaltiesData)) {
  for (const personName of STAFF) {
    const staffPenalties =
      penaltiesData
        .filter(
          (penalty: any) =>
            String(
              penalty.staff_name ?? ""
            )
              .trim()
              .toLowerCase() ===
            personName
              .trim()
              .toLowerCase()
        )
        .map((penalty: any) => ({
          id: String(
            penalty.id ?? ""
          ),
          error: String(
            penalty.error ?? ""
          ),
          amount: Number(
            penalty.amount ?? 0
          ),
          form: String(
            penalty.form ?? ""
          ),
        }));

    nextDatabase[personName].penalties =
      staffPenalties;
  }
}

/* ==================================================
   LOAD ORDERS VÃ€O DATABASE
   id       = ID tháº­t trong báº£ng orders
   order_code = mÃ£ Ä‘Æ¡n hiá»ƒn thá»‹
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
        "KhÃ´ng tÃ¬m tháº¥y staff:",
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
     * â†’ Ä‘Æ¡n Trá»±c Page
     *
     * CÃ²n láº¡i
     * â†’ Ä‘Æ¡n Staff
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
   LOAD KPI VÃ€O DATABASE
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
        "KhÃ´ng tÃ¬m tháº¥y staff KPI:",
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

/* ==================================================
   LOAD PENALTIES VÃ€O DATABASE
================================================== */

if (Array.isArray(penaltiesData)) {
  for (const row of penaltiesData) {
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
        "KhÃ´ng tÃ¬m tháº¥y staff pháº¡t:",
        staffName
      );
      continue;
    }

    nextDatabase[personName].penalties =
      penaltiesData
        .filter(
          (penalty) =>
            String(
              penalty.staff_name ?? ""
            )
              .trim()
              .toLowerCase() ===
            personName
              .trim()
              .toLowerCase()
        )
        .map((penalty) => ({
          id: String(penalty.id),
          error: String(
            penalty.error ?? ""
          ),
          amount: Number(
            penalty.amount ?? 0
          ),
          form: String(
            penalty.form ?? ""
          ),
        }));
  }
}

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
        "KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u:",
        error
      );

      setLoaded(true);
    }
  }

loadData();

const refreshInterval = isAdmin
  ? null
  : setInterval(() => {
      loadData();
    }, 5000);

const handleVisibilityChange = () => {
  if (
    !isAdmin &&
    document.visibilityState ===
      "visible"
  ) {
    loadData();
  }
};

if (!isAdmin) {
  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );
}

return () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  if (!isAdmin) {
    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  }
};
}, [currentUser]);
  /* =======================================================
     SAVE
  ======================================================= */

  /* =======================================================
     LOGIN
  ======================================================= */

     async function login() {
    const code = loginCode.trim().toUpperCase();

    if (!code) {
      alert("Vui lÃ²ng nháº­p mÃ£ Ä‘Äƒng nháº­p.");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success || !result?.user) {
        console.error("Login error:", result);
        alert(result?.error || "MÃ£ Ä‘Äƒng nháº­p khÃ´ng há»£p lá»‡.");
        return;
      }

      const account: Account = {
        role: result.user.role,
        name: result.user.name,
      };

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
      alert("CÃ³ lá»—i xáº£y ra khi Ä‘Äƒng nháº­p.");
    }
  }
  /* =======================================================
     LOGOUT
  ======================================================= */

async function logout() {
  try {
    await fetch("/api/logout", {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    setCurrentUser(null);
    setLoginCode("");
    setActiveTab("overview");
    setSelectedPerson("Q");
  }
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
   UPDATE PERSON â€” ADMIN â†’ SUPABASE
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
     1. Cáº¬P NHáº¬T UI NGAY
  ========================================== */

  setDatabase((previous) => ({
    ...previous,
    [staffName]: updatedPerson,
  }));

  try {
    /* ==========================================
       2. ORDERS â€” STAFF
    ========================================== */

    const oldStaffOrders =
      previousPerson.staffOrders ?? [];

    const newStaffOrders =
      updatedPerson.staffOrders ?? [];

    /*
     * Äá»“ng bá»™ tá»«ng order vá»›i API.
     *
     * API /api/orders cáº§n há»— trá»£:
     * POST = táº¡o
     * PUT = cáº­p nháº­t
     * DELETE = xÃ³a
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
   2A. Táº O / Cáº¬P NHáº¬T ÄÆ N STAFF
========================================== */

for (const order of newStaffOrders) {
  const orderId =
    String(order.id ?? "").trim();

  /*
   * ==========================================
   * ID Táº M
   *
   * new-xxxxx chá»‰ tá»“n táº¡i trÃªn giao diá»‡n.
   * Tuyá»‡t Ä‘á»‘i khÃ´ng PUT.
   *
   * LuÃ´n POST Ä‘á»ƒ táº¡o Ä‘Æ¡n tháº­t trÃªn Supabase.
   * ==========================================
   */

  if (orderId.startsWith("new-")) {
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
            order.order_code,

          staff_name:
            staffName,

          customer_name:
            "",

          amount:
            Number(order.amount || 0),

          tip: 0,

          note: "",

          order_type:
            "staff",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        "KhÃ´ng thá»ƒ thÃªm Ä‘Æ¡n: " +
          (await response.text())
      );
    }

    const createdOrder =
      await response.json();

    if (
      createdOrder?.id != null
    ) {
      const realId =
        String(createdOrder.id);

      /*
       * QUAN TRá»ŒNG:
       * cáº­p nháº­t trá»±c tiáº¿p object Ä‘ang xá»­ lÃ½
       * Ä‘á»ƒ nhá»¯ng logic phÃ­a sau khÃ´ng cÃ²n
       * nhÃ¬n tháº¥y new-xxxxx.
       */
      order.id = realId;

      /*
       * Äá»“ng bá»™ láº¡i state React.
       */
      setDatabase((previous) => {
        const current =
          previous[staffName];

        if (!current) {
          return previous;
        }

        return {
          ...previous,

          [staffName]: {
            ...current,

            staffOrders:
              (
                current.staffOrders ?? []
              ).map((item) =>
                String(item.id) ===
                orderId
                  ? {
                      ...item,
                      id: realId,
                    }
                  : item
              ),
          },
        };
      });
    }

    /*
     * ÄÃ£ POST thÃ nh cÃ´ng.
     * KhÃ´ng Ä‘Æ°á»£c cháº¡y xuá»‘ng PUT.
     */
    continue;
  }

  /*
   * ==========================================
   * ID KHÃ”NG PHáº¢I ID Sá»
   *
   * KhÃ´ng cho phÃ©p PUT.
   * ==========================================
   */

  const numericOrderId =
    Number(order.id);

  if (
    !Number.isInteger(
      numericOrderId
    ) ||
    numericOrderId <= 0
  ) {
    throw new Error(
      `ID Ä‘Æ¡n khÃ´ng há»£p lá»‡: ${order.id}`
    );
  }

  /*
   * ==========================================
   * TÃŒM ÄÆ N CÅ¨
   * ==========================================
   */

  const oldOrder =
    oldStaffMap.get(order.id);

  /*
   * KhÃ´ng tá»“n táº¡i Ä‘Æ¡n cÅ© thÃ¬ bá» qua.
   * ÄÆ¡n má»›i pháº£i Ä‘i báº±ng POST á»Ÿ phÃ­a trÃªn.
   */
  if (!oldOrder) {
    continue;
  }

  /*
   * ==========================================
   * KIá»‚M TRA THAY Äá»”I
   * ==========================================
   */

  const amountChanged =
    Number(oldOrder.amount || 0) !==
    Number(order.amount || 0);

  const codeChanged =
    String(
      oldOrder.order_code ?? ""
    ) !==
    String(
      order.order_code ?? ""
    );

  if (
    !amountChanged &&
    !codeChanged
  ) {
    continue;
  }

  /*
   * ==========================================
   * UPDATE ÄÆ N CÅ¨
   * ==========================================
   */

  const response =
    await fetch(
      "/api/orders",
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          id: numericOrderId,

          order_id:
            numericOrderId,

          order_code:
            order.order_code,

          staff_name:
            staffName,

          amount:
            Number(
              order.amount || 0
            ),

          order_type:
            "staff",
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "KhÃ´ng thá»ƒ cáº­p nháº­t Ä‘Æ¡n: " +
        (await response.text())
    );
  }
}
  /* ==========================================
   2B. XÃ“A ÄÆ N STAFF
========================================== */

for (const oldOrder of oldStaffOrders) {
  const oldOrderId =
    String(oldOrder.id ?? "").trim();

  /*
   * ID táº¡m khÃ´ng tá»“n táº¡i trong Supabase.
   */
  if (
    oldOrderId.startsWith("new-")
  ) {
    continue;
  }

  /*
   * Náº¿u Ä‘Æ¡n cÅ© váº«n cÃ²n thÃ¬ khÃ´ng xÃ³a.
   */
  if (
    newStaffMap.has(oldOrder.id)
  ) {
    continue;
  }

  const numericOrderId =
    Number(oldOrder.id);

  /*
   * KhÃ´ng bao giá» DELETE vá»›i ID rÃ¡c.
   */
  if (
    !Number.isInteger(
      numericOrderId
    ) ||
    numericOrderId <= 0
  ) {
    continue;
  }

  const response =
    await fetch(
      "/api/orders",
      {
        method: "DELETE",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          id: numericOrderId,

          order_id:
            numericOrderId,

          staff_name:
            staffName,

          order_type:
            "staff",
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "KhÃ´ng thá»ƒ xÃ³a Ä‘Æ¡n: " +
        (await response.text())
    );
  }
}

    /* ==========================================
       3. ORDERS â€” TRá»°C PAGE
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
       3A. Táº O / Cáº¬P NHáº¬T ÄÆ N TRá»°C
    ========================================== */

    for (const order of newPageOrders) {
      const oldOrder =
        oldPageMap.get(order.id);

      /* ÄÆ¡n trá»±c má»›i */
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
    "KhÃ´ng thá»ƒ thÃªm Ä‘Æ¡n trá»±c: " +
      (await response.text())
  );
}

const createdOrder = await response.json();

if (createdOrder?.id != null) {
  const realId = String(createdOrder.id);
  const tempId = String(order.id);

  setDatabase((previous) => {
    const current = previous[staffName];

    if (!current) {
      return previous;
    }

    return {
      ...previous,
      [staffName]: {
        ...current,
        pageOrders: (current.pageOrders ?? []).map(
          (item) =>
            String(item.id) === tempId
              ? {
                  ...item,
                  id: realId,
                }
              : item
        ),
      },
    };
  });
}

continue;

      }

   /* ÄÆ¡n trá»±c bá»‹ sá»­a */
if (
  Number(oldOrder.amount || 0) !==
    Number(order.amount || 0) ||
  String(oldOrder.order_code ?? "") !==
    String(order.order_code ?? "")
) {
  const orderId =
    String(order.id ?? "").trim();

  /*
   * ID táº¡m khÃ´ng Ä‘Æ°á»£c PUT.
   */
  if (
    orderId.startsWith("new-")
  ) {
    continue;
  }

  const numericOrderId =
    Number(orderId);

  if (
    !Number.isInteger(
      numericOrderId
    ) ||
    numericOrderId <= 0
  ) {
    throw new Error(
      `ID Ä‘Æ¡n trá»±c khÃ´ng há»£p lá»‡: ${order.id}`
    );
  }

  const response =
    await fetch(
      "/api/orders",
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          id: numericOrderId,

          order_id:
            numericOrderId,

          order_code:
            order.order_code,

          staff_name:
            staffName,

          amount:
            Number(
              order.amount || 0
            ),

          order_type:
            "page",
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "KhÃ´ng thá»ƒ cáº­p nháº­t Ä‘Æ¡n trá»±c: " +
        (await response.text())
    );
  }
}
}

    /* ==========================================
   3B. XÃ“A ÄÆ N TRá»°C
========================================== */

for (const oldOrder of oldPageOrders) {
  const oldOrderId =
    String(oldOrder.id ?? "").trim();

  /*
   * ÄÆ¡n táº¡m chÆ°a cÃ³ trong Supabase.
   */
  if (
    oldOrderId.startsWith("new-")
  ) {
    continue;
  }

  if (
    newPageMap.has(oldOrder.id)
  ) {
    continue;
  }

  const numericOrderId =
    Number(oldOrder.id);

  if (
    !Number.isInteger(
      numericOrderId
    ) ||
    numericOrderId <= 0
  ) {
    continue;
  }

  const response =
    await fetch(
      "/api/orders",
      {
        method: "DELETE",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          id: numericOrderId,

          order_id:
            numericOrderId,

          staff_name:
            staffName,

          order_type:
            "page",
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      "KhÃ´ng thá»ƒ xÃ³a Ä‘Æ¡n trá»±c: " +
        (await response.text())
    );
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
          "LÆ°u KPI tháº¥t báº¡i: " +
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

/*
 * ID dáº¡ng sá»‘ = ID tháº­t trong Supabase.
 * ID cÃ³ dáº¥u "-" = ID táº¡m táº¡o trÃªn giao diá»‡n.
 */
function isRealPenaltyId(id: unknown) {
  return /^\d+$/.test(
    String(id ?? "")
  );
}

/* ==========================================
   5A. THÃŠM / Sá»¬A PHáº T
========================================== */

for (const penalty of newPenalties) {
  const penaltyId =
    String(penalty.id ?? "");

  const oldPenalty =
    oldPenalties.find(
      (old) =>
        String(old.id ?? "") ===
        penaltyId
    );

  const hasRealId =
    isRealPenaltyId(penaltyId);

  /*
   * ========================================
   * PHáº T Má»šI
   *
   * Náº¿u ID lÃ  ID táº¡m hoáº·c chÆ°a tá»“n táº¡i
   * trong danh sÃ¡ch cÅ© â†’ POST.
   * ========================================
   */
  if (!oldPenalty || !hasRealId) {
    /*
     * ChÆ°a nháº­p lá»—i thÃ¬ chÆ°a lÆ°u.
     */
    if (!penalty.error?.trim()) {
      continue;
    }

    const response = await fetch(
      "/api/staff-penalties",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          staff_name: staffName,

          error:
            penalty.error.trim(),

          amount:
            Number(
              penalty.amount || 0
            ),

          form:
            penalty.form?.trim() ?? "",
        }),
      }
    );

    const responseText =
      await response.text();

    if (!response.ok) {
      throw new Error(
        "KhÃ´ng thá»ƒ thÃªm pháº¡t: " +
          responseText
      );
    }

    let createdPenalty:
      | {
          id?: number | string;
        }
      | null = null;

    try {
      createdPenalty =
        JSON.parse(responseText);
    } catch {
      createdPenalty = null;
    }

    /*
     * ======================================
     * API Ä‘Ã£ táº¡o thÃ nh cÃ´ng.
     *
     * Láº¥y ID tháº­t cá»§a Supabase vÃ  thay
     * ID táº¡m trong database local.
     * ======================================
     */
    if (
      createdPenalty?.id != null
    ) {
      const realId = String(
        createdPenalty.id
      );

      /*
       * Cáº­p nháº­t ID tháº­t vÃ o object
       * Ä‘ang xá»­ lÃ½.
       */
      penalty.id = realId;

      /*
       * QUAN TRá»ŒNG:
       * database trÆ°á»›c Ä‘Ã³ Ä‘Ã£ lÆ°u ID táº¡m.
       * Pháº£i thay ID táº¡m báº±ng ID tháº­t.
       */
      setDatabase((previous) => {
        const current =
          previous[staffName];

        if (!current) {
          return previous;
        }

        return {
          ...previous,

          [staffName]: {
            ...current,

            penalties:
              (
                current.penalties ?? []
              ).map((item) =>
                String(item.id) ===
                penaltyId
                  ? {
                      ...item,
                      id: realId,
                    }
                  : item
              ),
          },
        };
      });
    }

    continue;
  }

  /*
   * ========================================
   * PHáº T CÅ¨ Bá»Š Sá»¬A
   * ========================================
   */

  const numericId =
    Number(oldPenalty.id);

  /*
   * PhÃ²ng trÆ°á»ng há»£p dá»¯ liá»‡u cÅ©
   * khÃ´ng há»£p lá»‡.
   */
  if (
    !Number.isInteger(numericId) ||
    numericId <= 0
  ) {
    continue;
  }

  const penaltyChanged =
    oldPenalty.error !==
      penalty.error ||
    Number(
      oldPenalty.amount || 0
    ) !==
      Number(
        penalty.amount || 0
      ) ||
    oldPenalty.form !==
      penalty.form;

  if (!penaltyChanged) {
    continue;
  }

  /*
   * KhÃ´ng cho lÆ°u khoáº£n pháº¡t
   * khÃ´ng cÃ³ ná»™i dung lá»—i.
   */
  if (!penalty.error?.trim()) {
    continue;
  }

  const response = await fetch(
    "/api/staff-penalties",
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        id: numericId,

        error:
          penalty.error.trim(),

        amount:
          Number(
            penalty.amount || 0
          ),

        form:
          penalty.form?.trim() ?? "",
      }),
    }
  );

  const responseText =
    await response.text();

  if (!response.ok) {
    throw new Error(
      "KhÃ´ng thá»ƒ cáº­p nháº­t pháº¡t: " +
        responseText
    );
  }
}

/* ==========================================
   5B. XÃ“A PHáº T
========================================== */

for (const oldPenalty of oldPenalties) {
  const oldId =
    String(oldPenalty.id ?? "");

  /*
   * Khoáº£n pháº¡t váº«n cÃ²n trÃªn giao diá»‡n
   * â†’ khÃ´ng xÃ³a.
   */
  const stillExists =
    newPenalties.some(
      (penalty) =>
        String(penalty.id ?? "") ===
        oldId
    );

  if (stillExists) {
    continue;
  }

  /*
   * ID táº¡m khÃ´ng thuá»™c database
   * â†’ khÃ´ng DELETE.
   */
  if (!isRealPenaltyId(oldId)) {
    continue;
  }

  const numericId =
    Number(oldId);

  if (
    !Number.isInteger(numericId) ||
    numericId <= 0
  ) {
    continue;
  }

  const response = await fetch(
    "/api/staff-penalties",
    {
      method: "DELETE",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        id: numericId,
      }),
    }
  );

  const responseText =
    await response.text();

  if (!response.ok) {
    throw new Error(
      "KhÃ´ng thá»ƒ xÃ³a pháº¡t: " +
        responseText
    );
  }
}

    /* ==========================================
       6. HOÃ€N Táº¤T
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
        : "KhÃ´ng thá»ƒ lÆ°u dá»¯ liá»‡u lÃªn Supabase."
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
              <img src="/bao-den.png" alt="BÃ¡o Ä‘en" />
            </div>

            <h1>
              TRA Cá»¨U THÃ”NG TIN
            </h1>

            <p className="login-subtitle">
              Staff / Trá»±c Page
            </p>

            <div className="login-field">
              <label>
                MÃ£ truy cáº­p
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
                placeholder="Nháº­p mÃ£ truy cáº­p"
              />
            </div>

            <button
              className="login-btn"
              onClick={login}
            >
              TRA Cá»¨U
            </button>

            <p className="login-help">
              Nháº­p mÃ£ truy cáº­p Ä‘Æ°á»£c cáº¥p
              Ä‘á»ƒ xem thÃ´ng tin.
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
                ðŸ“Š TRA Cá»¨U THÃ”NG TIN
              </div>

              <h1>
                {isAdmin
                  ? "Quáº£n trá»‹ dá»¯ liá»‡u"
                  : `Xin chÃ o, ${currentUser.name}`}
              </h1>

              <p>
                {isAdmin
                  ? "Admin cÃ³ quyá»n chá»‰nh sá»­a dá»¯ liá»‡u"
                  : "Cháº¿ Ä‘á»™ chá»‰ xem - khÃ´ng thá»ƒ chá»‰nh sá»­a"}
              </p>
            </div>

            <div className="header-actions">
              {isAdmin ? (
                <span className="admin-badge">
                  ðŸ” ADMIN
                </span>
              ) : (
                <span className="readonly">
                  ðŸ”’ CHá»ˆ XEM
                </span>
              )}

              <button
                className="logout"
                onClick={logout}
              >
                ÄÄƒng xuáº¥t
              </button>
            </div>
          </header>

          {/* ADMIN SELECT */}

          {isAdmin && (
            <section className="admin-panel">
              <div>
                <label>
                  Chá»n ngÆ°á»i cáº§n quáº£n lÃ½
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
                          ? " â€” Staff + Trá»±c"
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
                Äang tra cá»©u
              </span>

              <h2>{viewingName}</h2>

              <p>
                {pagePerson
                  ? "Staff + Trá»±c Page"
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
              title="ÄÆ¡n Ä‘Ã£ Ä‘i"
              value={
                staffOrders.length
              }
            />

            <StatCard
              title={
                pagePerson
                  ? "ÄÆ¡n Ä‘Ã£ trá»±c"
                  : "Tá»•ng Ä‘Æ¡n"
              }
              value={
                pagePerson
                  ? pageOrders.length
                  : staffOrders.length
              }
            />

            <StatCard
              title="Tá»•ng KPI"
              value={totalKpiValue}
            />

            <StatCard
              title="Tá»•ng pháº¡t"
              value={money(
                totalPenaltyMoney
              )}
            />
          </section>

          {/* PAGE SUMMARY */}

          {pagePerson && (
            <section className="page-summary">
              <div>
                <span>ÄÆ¡n Ä‘Ã£ Ä‘i</span>

                <strong>
                  {staffOrders.length}
                </strong>
              </div>

              <div>
                <span>ÄÆ¡n Ä‘Ã£ trá»±c</span>

                <strong>
                  {pageOrders.length}
                </strong>
              </div>

              <div>
                <span>
                  Tá»•ng táº¥t cáº£ Ä‘Æ¡n
                </span>

                <strong>
                  {allOrders.length}
                </strong>
              </div>

              <div>
                <span>Tá»•ng tiá»n</span>

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
              Tá»•ng quan
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
              ÄÆ¡n Ä‘Ã£ Ä‘i
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
              Pháº¡t
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
                    <h2>Tá»•ng quan</h2>

                    <p>
                      {isAdmin
                        ? "Báº¡n Ä‘ang quáº£n lÃ½ dá»¯ liá»‡u cá»§a staff nÃ y."
                        : "ThÃ´ng tin cÃ¡ nhÃ¢n cá»§a báº¡n."}
                    </p>
                  </div>

                  {isAdmin ? (
                    <span className="admin-badge">
                      ðŸ” ADMIN
                    </span>
                  ) : (
                    <span className="readonly">
                      ðŸ”’ CHá»ˆ XEM
                    </span>
                  )}
                </div>

                <div className="overview-grid">
                  <div>
                    <span>
                      ÄÆ¡n Ä‘Ã£ Ä‘i
                    </span>

                    <strong>
                      {staffOrders.length}
                    </strong>
                  </div>

                  {pagePerson && (
                    <div>
                      <span>
                        ÄÆ¡n Ä‘Ã£ trá»±c
                      </span>

                      <strong>
                        {pageOrders.length}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>
                      Tá»•ng tiá»n Ä‘Æ¡n
                    </span>

                    <strong>
                      {money(
                        totalOrderMoney
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tá»•ng KPI
                    </span>

                    <strong>
                      {totalKpiValue}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tá»•ng pháº¡t
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
                      Tráº¡ng thÃ¡i quyá»n
                    </h2>
                  </div>
                </div>

                <div className="permission-box">
                  {isAdmin ? (
                    <>
                      <div>
                        <b>
                          ðŸ” Admin
                        </b>

                        <span>
                          CÃ³ thá»ƒ chá»‰nh sá»­a
                          táº¥t cáº£ dá»¯ liá»‡u.
                        </span>
                      </div>

                      <div>
                        <b>âœ“ ÄÆ¡n</b>

                        <span>
                          ThÃªm / sá»­a / xÃ³a
                          Ä‘Æ¡n Ä‘Ã£ Ä‘i vÃ 
                          Ä‘Æ¡n Ä‘Ã£ trá»±c.
                        </span>
                      </div>

                      <div>
                        <b>âœ“ KPI</b>

                        <span>
                          Cáº­p nháº­t Ä‘iá»ƒm.
                        </span>
                      </div>

                      <div>
                        <b>âœ“ Pháº¡t</b>

                        <span>
                          Cáº­p nháº­t lá»—i,
                          má»©c pháº¡t,
                          hÃ¬nh thá»©c.
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <b>
                          ðŸ”’ Staff
                        </b>

                        <span>
                          Chá»‰ Ä‘Æ°á»£c xem dá»¯
                          liá»‡u cá»§a chÃ­nh mÃ¬nh.
                        </span>
                      </div>

                      <div>
                        <b>
                          âœ• Chá»‰nh sá»­a
                        </b>

                        <span>
                          KhÃ´ng thá»ƒ thay Ä‘á»•i
                          dá»¯ liá»‡u.
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

              {/* ÄÆ N ÄÃƒ ÄI */}

              {isAdmin ? (
                <OrderEditor
                  title="ÄÆ¡n Ä‘Ã£ Ä‘i"
                  description="Admin cÃ³ thá»ƒ thÃªm, sá»­a hoáº·c xÃ³a Ä‘Æ¡n Staff Ä‘Ã£ Ä‘i."
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
                  title="ÄÆ¡n Ä‘Ã£ Ä‘i"
                  description="Danh sÃ¡ch cÃ¡c Ä‘Æ¡n Staff Ä‘Ã£ Ä‘i."
                  orders={staffOrders}
                />
              )}

              {/* ÄÆ N ÄÃƒ TRá»°C */}

              {pagePerson && (
                <>
                  {isAdmin ? (
                    <OrderEditor
                      title="ÄÆ¡n Ä‘Ã£ trá»±c"
                      description="Admin cÃ³ thá»ƒ thÃªm, sá»­a hoáº·c xÃ³a Ä‘Æ¡n Page Ä‘Ã£ trá»±c."
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
                      title="ÄÆ¡n Ä‘Ã£ trá»±c"
                      description="Danh sÃ¡ch cÃ¡c Ä‘Æ¡n Page Ä‘Ã£ trá»±c."
                      orders={pageOrders}
                    />
                  )}
                </>
              )}

              {/* Tá»”NG */}

              <section className="card">
                <div className="section-title-row">
                  <div>
                    <h2>
                      Tá»•ng Ä‘Æ¡n
                    </h2>

                    <p>
                      {pagePerson
                        ? "Bao gá»“m cáº£ Ä‘Æ¡n Ä‘Ã£ Ä‘i vÃ  Ä‘Æ¡n Ä‘Ã£ trá»±c."
                        : "Tá»•ng sá»‘ Ä‘Æ¡n Ä‘Ã£ Ä‘i."}
                    </p>
                  </div>
                </div>

                <div className="overview-grid">
                  <div>
                    <span>
                      ÄÆ¡n Ä‘Ã£ Ä‘i
                    </span>

                    <strong>
                      {staffOrders.length}
                    </strong>
                  </div>

                  {pagePerson && (
                    <div>
                      <span>
                        ÄÆ¡n Ä‘Ã£ trá»±c
                      </span>

                      <strong>
                        {pageOrders.length}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>
                      Tá»•ng Ä‘Æ¡n
                    </span>

                    <strong>
                      {allOrders.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Tá»•ng tiá»n
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
              PHáº T
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
              Tra cá»©u thÃ´ng tin KPI
            </span>

            <span>
              {isAdmin
                ? "Cháº¿ Ä‘á»™ quáº£n trá»‹"
                : "Cháº¿ Ä‘á»™ chá»‰ xem"}
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
