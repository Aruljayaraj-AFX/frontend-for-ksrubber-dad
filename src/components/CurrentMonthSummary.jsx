import { useEffect, useState } from "react";

export default function MonthlySummary() {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [teaInput, setTeaInput] = useState(0);
  const [waterInput, setWaterInput] = useState(0);

  const [settingIncome, setSettingIncome] = useState(0);
  const [settingIncomeInput, setSettingIncomeInput] = useState(0);

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
          fetch("https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/daily-production/"),
          fetch("https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/monthly-income/"),
          fetch("https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/get-setting-income"),
        ]);

        const prodData = await prodRes.json();
        const incomeData = await incomeRes.json();
        const settingData = await settingRes.json();

        setProductions(prodData.data || []);
        setTeaInput(incomeData.total_tea || 0);
        setWaterInput(incomeData.total_water || 0);
        setSettingIncome(settingData.income || 0);
        setSettingIncomeInput(settingData.income || 0);

      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ---------------- MONTH FILTER ---------------- */
  const filteredProductions = productions.filter(
    (p) => p.date.slice(0, 7) === selectedMonth
  );

  const totalOvertime = filteredProductions.reduce(
    (sum, p) =>
      sum + p.overtime.reduce((a, b) => a + (parseFloat(b) || 0), 0),
    0
  );

  const totalMonthlyPay = filteredProductions.reduce(
    (sum, p) => sum + (parseFloat(p.monthy_pay) || 0),
    0
  );

  const totalIncome =
    settingIncome + totalMonthlyPay - teaInput - waterInput;

  /* ---------------- SAVE HANDLERS ---------------- */
  const saveExpenses = async () => {
    try {
      setSavingExpenses(true);

      await fetch(
        "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/monthly-income/current",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tea: teaInput, water: waterInput }),
        }
      );

      setEditExpenses(false);
    } catch {
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
      setSettingIncome(data.income);
      setEditBaseIncome(false);

    } catch {
      setError("Failed to update base income");
    } finally {
      setSavingBaseIncome(false);
    }
  };

  if (loading) return <p>⏳ Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  /* ---------------- UI ---------------- */
  return (
    <div className="summary-container">
      <h2>Hello! Arputharaj</h2>

      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      />

      <div className="summary-grid">

        <div className="summary-item">
          <h4>Total Overtime</h4>
          <p>{totalOvertime.toFixed(2)}</p>
        </div>

        <div className="summary-item">
          <h4>Total Monthly Pay</h4>
          <p>{totalMonthlyPay.toFixed(2)}</p>
        </div>

        {/* BASE INCOME */}
        <div className="summary-item">
          <h4>Base Income</h4>

          {!editBaseIncome ? (
            <>
              <p>₹ {settingIncome.toFixed(2)}</p>
              <button onClick={() => setEditBaseIncome(true)}>Edit</button>
            </>
          ) : (
            <>
              <input
                type="number"
                value={settingIncomeInput}
                onChange={(e) =>
                  setSettingIncomeInput(Number(e.target.value) || 0)
                }
              />
              <button onClick={saveBaseIncome} disabled={savingBaseIncome}>
                {savingBaseIncome ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditBaseIncome(false)}>Cancel</button>
            </>
          )}
        </div>

        {/* EXPENSES */}
        <div className="summary-item">
          <h4>Expenses</h4>

          {!editExpenses ? (
            <>
              <p>Tea: ₹ {teaInput}</p>
              <p>Water: ₹ {waterInput}</p>
              <button onClick={() => setEditExpenses(true)}>Edit</button>
            </>
          ) : (
            <>
              <input
                type="number"
                placeholder="Tea"
                value={teaInput}
                onChange={(e) => setTeaInput(Number(e.target.value) || 0)}
              />
              <input
                type="number"
                placeholder="Water"
                value={waterInput}
                onChange={(e) => setWaterInput(Number(e.target.value) || 0)}
              />
              <button onClick={saveExpenses} disabled={savingExpenses}>
                {savingExpenses ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditExpenses(false)}>Cancel</button>
            </>
          )}
        </div>

        {/* TOTAL */}
        <div className="summary-item highlight">
          <h4>Total Income</h4>
          <p>₹ {totalIncome.toFixed(2)}</p>
        </div>

      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .summary-container {
          padding: clamp(12px, 3vw, 20px);
          max-width: 1000px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Arial, sans-serif;
          min-height: 100vh;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-header h2 {
          margin: 0;
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          color: #1a1a1a;
        }

        .month-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .month-nav button {
          min-width: 44px;
          min-height: 44px;
          padding: 8px 12px;
          font-size: 1.1rem;
        }

        .month-nav input {
          min-width: 140px;
          min-height: 44px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
          gap: 16px;
        }

        .summary-item {
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          text-align: center;
          background-color: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          transition: all 0.2s ease;
        }

        .summary-item:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .summary-item h4 {
          margin: 0 0 12px 0;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-item .value {
          margin: 0;
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 700;
          color: #1a1a1a;
        }

        .summary-item .value.large {
          font-size: clamp(1.75rem, 5vw, 2.5rem);
          color: #007bff;
        }

        .summary-item.highlight {
          background: linear-gradient(135deg, #e3f2fd 0%, #f8fbff 100%);
          border-color: #007bff;
          border-width: 2px;
        }

        .update-btn-container {
          grid-column: 1 / -1;
          padding: 16px;
        }

        input[type="month"],
        input[type="number"] {
          width: 100%;
          padding: 12px 14px;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          transition: border-color 0.2s;
          background-color: #fafafa;
        }

        input:focus {
          border-color: #007bff;
          outline: none;
          background-color: #fff;
        }

        input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        button {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,123,255,0.3);
          min-height: 44px;
        }

        button:hover:not(:disabled) {
          background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,123,255,0.4);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
          box-shadow: none;
        }

        .loading-msg, .error-msg {
          text-align: center;
          padding: 24px;
          font-weight: 500;
          font-size: clamp(0.95rem, 2.5vw, 1.1rem);
          border-radius: 12px;
          margin: 20px;
        }

        .error-msg {
          color: #c00;
          background: #fee;
          border: 2px solid #fcc;
        }

        /* Tablet optimization */
        @media (min-width: 601px) and (max-width: 900px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .update-btn-container {
            grid-column: 1 / -1;
          }
        }

        /* Mobile optimization */
        @media (max-width: 600px) {
          .summary-container {
            padding: 12px;
          }

          .summary-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .summary-header h2 {
            text-align: center;
          }

          .month-nav {
            justify-content: center;
            width: 100%;
          }

          .month-nav button {
            flex: 0 0 auto;
            min-width: 48px;
          }

          .month-nav input {
            flex: 1;
            min-width: 0;
          }

          .summary-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .summary-item {
            padding: 16px;
          }

          .update-btn-container button {
            width: 100%;
          }
        }

        /* Extra small screens */
        @media (max-width: 380px) {
          .summary-header h2 {
            font-size: 1.1rem;
          }

          .month-nav button {
            min-width: 42px;
            padding: 8px;
          }

          .summary-item {
            padding: 14px;
          }

          input[type="number"],
          input[type="month"] {
            padding: 10px 12px;
          }
        }

        /* Print styles */
        @media print {
          .month-nav button,
          .update-btn-container {
            display: none;
          }

          .summary-item {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}