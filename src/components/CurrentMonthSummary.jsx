import { useEffect, useState } from "react";


export default function MonthlySummary() {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [teaInput, setTeaInput] = useState(0);
  const [teaInputc, setTeaInputc] = useState(0);
  const [waterInput, setWaterInput] = useState(0);
  const [waterInputc, setWaterInputc] = useState(0);

  const [settingIncome, setSettingIncome] = useState(0);
  const [settingIncomeInput, setSettingIncomeInput] = useState(0);

  const [monthIncome, setMonthIncome] = useState(0); // fetched from get_month_income

  const [editExpenses, setEditExpenses] = useState(false);
  const [editBaseIncome, setEditBaseIncome] = useState(false);

  const [savingExpenses, setSavingExpenses] = useState(false);
  const [savingBaseIncome, setSavingBaseIncome] = useState(false);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [prodRes, incomeRes, settingRes] = await Promise.all([
          fetch(
            "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/daily-production/"
          ),
          fetch(
            "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/monthly-income/"
          ),
          fetch(
            "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/get-setting-income"
          ),
        ]);

        const prodData = await prodRes.json();
        const incomeData = await incomeRes.json();
        const settingData = await settingRes.json();

        setProductions(prodData.data || []);
        setTeaInput(incomeData.total_tea || 0);
        setWaterInput(incomeData.total_water || 0);

        // parse setting income - support multiple shapes
        const parsedSettingIncome =
          (settingData && typeof settingData.income === "number" && settingData.income) ||
          (settingData && settingData.data && typeof settingData.data.income === "number" && settingData.data.income) ||
          0;
        setSettingIncome(parsedSettingIncome);
        setSettingIncomeInput(parsedSettingIncome);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ---------------- MONTH INCOME FETCH ---------------- */
  useEffect(() => {
    const fetchMonthIncome = async () => {
      if (!selectedMonth) return setMonthIncome(0);
      const [yearStr, monthStr] = selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // API expects 1-based month

      try {
        const url = `https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/get_month_income/?year=${year}&month=${month}`;
        const res = await fetch(url);
        if (!res.ok) {
          setMonthIncome(0);
          return;
        }
        const data = await res.json();
        if (data && data.status === "success" && data.data && typeof data.data.income === "number") {
          setMonthIncome(data.data.income);
        } else if (data && typeof data.income === "number") {
          setMonthIncome(data.income);
        } else {
          setMonthIncome(0);
        }
      } catch (err) {
        console.error("Error fetching month income:", err);
        setMonthIncome(0);
      }
    };

    fetchMonthIncome();
  }, [selectedMonth]);

  /* ---------------- MONTH FILTER & CALCS ---------------- */
  const filteredProductions = productions.filter(
    (p) => p.date && p.date.slice(0, 7) === selectedMonth
  );

  const totalOvertime = filteredProductions.reduce(
    (sum, p) =>
      sum + (Array.isArray(p.overtime) ? p.overtime.reduce((a, b) => a + (parseFloat(b) || 0), 0) : 0),
    0
  );

  const totalMonthlyPay = filteredProductions.reduce(
    (sum, p) => sum + (parseFloat(p.monthy_pay) || 0),
    0
  );

  // Without leave salary = base income + total monthly pay
  const withoutLeaveSalary = settingIncome + totalMonthlyPay;

  // Loss = withoutLeaveSalary - monthIncome
  const lossAmount = withoutLeaveSalary - (monthIncome || 0);

  const totalIncome =
    settingIncome + totalMonthlyPay ;

  const percentCovered = (() => {
    if (withoutLeaveSalary <= 0) return 0;
    if (!monthIncome || monthIncome <= 0) return 0;
    const v = (monthIncome / withoutLeaveSalary) * 100;
    return Math.min(100, Math.max(0, v));
  })();

  /* ---------------- SAVE HANDLERS ---------------- */
  const saveExpenses = async () => {
    try {
      setSavingExpenses(true);

      const res = await fetch(  
        "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/monthly-income/current",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tea: teaInputc, water: waterInputc}),
        }
      );

      setEditExpenses(false);
      const data = await res.json();
      setTeaInput(data.data.tea );
      setWaterInput(data.data.water);
      
    } catch (err) {
      console.error(err);
      setError("Failed to update expenses");
    } finally {
      setSavingExpenses(false);
    }
  };

  const saveBaseIncome = async () => {
    try {
      setSavingBaseIncome(true);

      const res = await fetch(
        `https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/setting-income?income=${settingIncomeInput}`,
        { method: "PUT" }
      );

      const data = await res.json();
      const newIncome =
        (data && typeof data.income === "number" && data.income) ||
        (data && data.data && typeof data.data.income === "number" && data.data.income) ||
        settingIncomeInput;

      setSettingIncome(newIncome);
      setEditBaseIncome(false);
    } catch (err) {
      console.error(err);
      setError("Failed to update base income");
    } finally {
      setSavingBaseIncome(false);
    }
  };

  const formatCurrency = (v) =>
    `₹ ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) return <div className="loading-shell">⏳ Loading...</div>;
  if (error) return <div className="error-shell">{error}</div>;

  /* ---------------- UI ---------------- */
  return (
    <div className="ms-root">
      <header className="ms-header">
        <div className="ms-header-left">
          <div className="brand">
            <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden focusable="false">
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0" stopColor="#00b894" />
                  <stop offset="1" stopColor="#0984e3" />
                </linearGradient>
              </defs>
              <rect rx="6" width="24" height="24" fill="url(#g1)" />
              <path d="M6 16 L10 8 L14 12 L18 6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="brand-text">
              <h1>KS Rubber — Monthly</h1>
              <small>Production & income summary</small>
            </div>
          </div>
        </div>

        <div className="ms-header-right">
          <label className="month-picker">
            <input
              aria-label="Select month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </label>
        </div>
      </header>

      <main className="ms-main">
        <section className="kpi-grid">
          <article className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Total Overtime</div>
              <div className="kpi-icon">⏱</div>
            </div>
            <div className="kpi-value">{totalOvertime.toFixed(2)} hrs</div>
            <div className="kpi-sub">Hours accumulated this month</div>
          </article>

          <article className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Overtime Pay</div>
              <div className="kpi-icon">💰</div>
            </div>
            <div className="kpi-value">{formatCurrency(totalMonthlyPay)}</div>
            <div className="kpi-sub">Sum of monthly pay entries</div>
          </article>

          <article className="kpi-card">
            <div className="kpi-top">
              <div className="kpi-title">Base Income</div>
              <div className="kpi-icon">🏷️</div>
            </div>

            {!editBaseIncome ? (
              <>
                <div className="kpi-value">{formatCurrency(settingIncome)}</div>
                <div className="kpi-actions">
                  <button className="btn-ghost" onClick={() => setEditBaseIncome(true)}>Edit</button>
                </div>
              </>
            ) : (
              <>
                <div className="edit-row">
                  <input
                    type="number"
                    value={settingIncomeInput}
                    onChange={(e) => setSettingIncomeInput(Number(e.target.value) || 0)}
                    aria-label="Edit base income"
                  />
                  <div className="edit-actions">
                    <button className="btn-primary" onClick={saveBaseIncome} disabled={savingBaseIncome}>
                      {savingBaseIncome ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-ghost" onClick={() => setEditBaseIncome(false)}>Cancel</button>
                  </div>
                </div>
              </>
            )}

            <div className="kpi-sub">Monthly salary setting</div>
          </article>

          <article className="kpi-card expenses">
            <div className="kpi-top">
              <div className="kpi-title">Expenses</div>
              <div className="kpi-icon">🍵</div>
            </div>

            {!editExpenses ? (
              <>
                <div className="kpi-value small-values">
                  <div>Tea: <strong>{formatCurrency(teaInput)}</strong></div>
                  <div>Water: <strong>{formatCurrency(waterInput)}</strong></div>
                </div>
                <div className="kpi-actions">
                  <button className="btn-ghost" onClick={() => setEditExpenses(true)}>Add</button>
                </div>
              </>
            ) : (
              <>
                <div className="edit-row vertical">

  <div className="field">
    <label>Tea</label>
    <input
      type="number"
      placeholder="Enter tea amount"
      defaultValue={0}
      onChange={(e) => setTeaInputc(Number(e.target.value) || 0)}
    />
  </div>

  <div className="field">
    <label>Water</label>
    <input
      type="number"
      placeholder="Enter water amount"
      defaultValue={0}
      onChange={(e) => setWaterInputc(Number(e.target.value) || 0)}
    />
  </div>

  <div className="edit-actions">
    <button
      className="btn-primary"
      onClick={saveExpenses}
      disabled={savingExpenses}
    >
      {savingExpenses ? "Saving..." : "Save"}
    </button>

    <button
      className="btn-ghost"
      onClick={() => setEditExpenses(false)}
    >
      Cancel
    </button>
  </div>

</div>

              </>
            )}

            <div className="kpi-sub">Small recurring costs</div>
          </article>
        </section>

        <section className="summary-cards">
          <div className="card left">
            <div className="card-header">
              <h3>Without-Leave Salary</h3>
              <span className="muted">Base + Overtime Pay</span>
            </div>
            <div className="card-body">
              <div className="big-money">{formatCurrency(withoutLeaveSalary)}</div>
              <div className="muted">Base: {formatCurrency(settingIncome)}  •  Overtime: {formatCurrency(totalMonthlyPay)}</div>
            </div>
          </div>

          <div className="card right highlight-month">
            <div className="card-header">
              <h3>Month Income (server)</h3>
              <span className="badge">Source</span>
            </div>
            <div className="card-body">
              <div className="big-money green">{formatCurrency(monthIncome)}</div>
              <div className="muted">Value returned by get_month_income API</div>

              <div className="progress-block">
                <div className="progress-label">Coverage</div>
                <div className="progress-bar" title={`${percentCovered.toFixed(1)}% covered`}>
                  <div className="progress-fill" style={{ width: `${percentCovered}%` }} />
                </div>
                <div className="progress-stats">
                  <span>{percentCovered.toFixed(1)}%</span>
                  <span className="muted">{formatCurrency(withoutLeaveSalary)} target</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card loss-card">
            <div className="card-header">
              <h3>Loss / Shortfall</h3>
              <span className="muted">Without-Leave - Month Income</span>
            </div>
            <div className="card-body">
              <div className="big-money red">{formatCurrency(lossAmount)}</div>
              <div className="muted">Positive = shortfall; Negative = surplus</div>

              <div className="loss-details">
                <div><strong>Tea</strong> {formatCurrency(teaInput)}</div>
                <div><strong>Water</strong> {formatCurrency(waterInput)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="final-row">
          <div className="left-info">
            <h4>Net Total</h4>
            <p className="muted">Base + Overtime Pay - Expenses</p>
            <div className="final-money">{formatCurrency(totalIncome)}</div>
          </div>

          <div className="actions">
            <button className="btn-primary" onClick={() => window.print()}>Print / Export</button>
            <button className="btn-ghost" onClick={() => {
              // quick refresh
              setLoading(true);
              setTimeout(() => { // keep simple - could re-fetch
                setLoading(false);
              }, 600);
            }}>Refresh</button>
          </div>
        </section>
      </main>

      <style>{`
        :root {
          --bg: #f6f9fb;
          --card: #ffffff;
          --muted: #7b8a93;
          --accent: linear-gradient(90deg,#00b894,#0984e3);
          --glass: rgba(255,255,255,0.7);
        }

        .ms-root {
          min-height: 100vh;
          background: radial-gradient(1200px 400px at 10% 10%, rgba(9,132,227,0.06), transparent 8%),
                      radial-gradient(900px 300px at 90% 90%, rgba(0,184,148,0.04), transparent 8%),
                      var(--bg);
          padding: clamp(18px, 3vw, 36px);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #0f1724;
        }

        /* Header */
        .ms-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:20px;
          margin-bottom:20px;
        }

        .brand {
          display:flex;
          gap:12px;
          align-items:center;
        }

        .brand-text h1 {
          margin:0;
          font-size: clamp(1.05rem, 2.5vw, 1.35rem);
          letter-spacing: -0.2px;
        }
        .brand-text small { color: var(--muted); display:block; margin-top:2px; }

        .month-picker input {
          padding:10px 12px;
          border-radius:10px;
          border: none;
          background: #fff;
          box-shadow: 0 6px 18px rgba(15,23,36,0.06);
          font-weight:600;
        }

        /* Main grid */
        .ms-main { margin-top:12px; }

        .kpi-grid {
          display:grid;
          grid-template-columns: repeat(4, 1fr);
          gap:16px;
          margin-bottom:18px;
        }

        .kpi-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.85));
          border-radius:12px;
          padding:16px;
          box-shadow: 0 8px 24px rgba(12,18,24,0.06);
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          min-height:110px;
        }

        .kpi-top { display:flex; justify-content:space-between; align-items:center; }
        .kpi-title { color:var(--muted); font-weight:700; font-size:0.9rem;}
        .kpi-icon { font-size:18px; }

        .kpi-value { font-size:1.25rem; font-weight:800; margin-top:10px; color:#0b1220; }
        .kpi-sub { font-size:0.82rem; color:var(--muted); margin-top:6px; }

        .kpi-card.expenses .kpi-title { display:flex; gap:8px; align-items:center; }

        .kpi-actions { margin-top:10px; display:flex; gap:8px; justify-content:flex-end; }
        .edit-row { display:flex; gap:8px; align-items:center; }
        .edit-row.vertical { flex-direction:column; align-items:stretch; }
        .edit-row input { padding:8px 10px; border-radius:8px; border:1px solid #e6eef6; background:#fff; }

        .btn-primary {
          background: linear-gradient(90deg,#00b894,#0984e3);
          color:#fff;
          border:none;
          padding:8px 12px;
          border-radius:8px;
          cursor:pointer;
          font-weight:700;
        }
        .btn-ghost {
          background:transparent;
          border:1px solid rgba(15,23,36,0.06);
          padding:8px 12px;
          border-radius:8px;
          cursor:pointer;
          color:#0f1724;
          font-weight:700;
        }

        .summary-cards {
          display:grid;
          grid-template-columns: 1fr 420px 320px;
          gap:16px;
          margin-bottom:18px;
        }

        .card {
          background: var(--card);
          border-radius:12px;
          padding:16px;
          box-shadow: 0 8px 24px rgba(12,18,24,0.06);
        }

        .card-header { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:8px; }
        .card-header h3 { margin:0; font-size:1rem; }
        .card-header .badge { background:#eef9f3; color:#085f35; padding:6px 10px; border-radius:999px; font-weight:700; font-size:0.78rem; }

        .card-body .big-money { font-size:1.6rem; font-weight:800; margin:8px 0; }
        .card-body .big-money.green { color:#1b7f3a; }
        .card-body .big-money.red { color:#c62828; }

        .progress-block { margin-top:12px; }
        .progress-label { font-size:0.8rem; color:var(--muted); margin-bottom:6px; }
        .progress-bar { height:10px; background:#eef6f2; border-radius:999px; overflow:hidden; }
        .progress-fill { height:100%; background: linear-gradient(90deg,#00b894,#0984e3); transition:width 600ms ease; }

        .progress-stats { display:flex; justify-content:space-between; margin-top:8px; font-weight:700; font-size:0.9rem; color:#0f1724; }

        .loss-card { border:1px solid rgba(198,40,40,0.08); background: linear-gradient(180deg,#fff7f7,#fff) }

        .final-row {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:16px;
          margin-top:6px;
        }
        .left-info h4 { margin:0; font-size:1rem; }
        .left-info .muted { color:var(--muted); margin-top:6px; }
        .final-money { font-size:1.6rem; font-weight:900; margin-top:8px; }

        .actions { display:flex; gap:8px; align-items:center; }

        /* Small screens */
        @media (max-width: 1100px) {
          .summary-cards { grid-template-columns: 1fr; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .kpi-grid { grid-template-columns: 1fr; }
          .brand-text h1 { font-size:1rem; }
          .ms-root { padding:14px; }
          .ms-header { flex-direction:column; align-items:flex-start; gap:10px; }
          .final-row { flex-direction:column; align-items:stretch; }
          .actions { justify-content:flex-end; }
        }

        /* Loading / error */
        .loading-shell, .error-shell {
          padding: 32px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(12,18,24,0.06);
          text-align:center;
        }

        /* Print adjustments */
        @media print {
          .ms-header, .actions, .btn-primary, .btn-ghost { display:none; }
          .ms-root { padding: 8px; background: #fff; }
        }
      `}</style>
    </div>
  );
}