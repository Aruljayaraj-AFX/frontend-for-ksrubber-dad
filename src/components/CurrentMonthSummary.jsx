import { useEffect, useState } from "react";

export default function MonthlySummary() {
  const [productions, setProductions] = useState([]);
  const [incomeData, setIncomeData] = useState({ total_income: 0, total_tea: 0, total_water: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [teaInput, setTeaInput] = useState(0);
  const [waterInput, setWaterInput] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const prodRes = await fetch(
          "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/daily-production/"
        );
        const incomeRes = await fetch(
          "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/monthly-income/"
        );

        if (!prodRes.ok) throw new Error("Failed to fetch daily production");
        if (!incomeRes.ok) throw new Error("Failed to fetch monthly income");

        const prodData = await prodRes.json();
        const incomeJson = await incomeRes.json();

        if (prodData.status === "success") {
          setProductions(prodData.data);
        } else {
          setError("Daily production API returned error");
        }

        setIncomeData({
          total_income: incomeJson.total_income || 0,
          total_tea: incomeJson.total_tea || 0,
          total_water: incomeJson.total_water || 0,
        });

        setTeaInput(incomeJson.total_tea || 0);
        setWaterInput(incomeJson.total_water || 0);
      } catch (err) {
        console.error(err);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateIncome = async () => {
    try {
      setUpdating(true);
      const res = await fetch(
        "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/monthly-income/current",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tea: teaInput,
            water: waterInput
          })
        }
      );

      if (!res.ok) throw new Error("Failed to update current month income");

      const data = await res.json();

      setIncomeData({
        total_income: incomeData.total_income,
        total_tea: data.data.tea,
        total_water: data.data.water
      });

    } catch (err) {
      console.error(err);
      setError("Error updating income");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const prev = new Date(year, month - 2);
    setSelectedMonth(prev.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const next = new Date(year, month); 
    setSelectedMonth(next.toISOString().slice(0, 7));
  };

  const filteredProductions = productions.filter(
    (prod) => prod.date.slice(0, 7) === selectedMonth
  );

  const totalOvertime = filteredProductions.reduce((sum, prod) => {
    return sum + prod.overtime.reduce((a, b) => a + (parseFloat(b) || 0), 0);
  }, 0);

  const totalMonthlyPay = filteredProductions.reduce(
    (sum, prod) => sum + (parseFloat(prod.monthy_pay) || 0),
    0
  );

  if (loading) return <p className="loading-msg">Loading summary...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>Hello! Arputharaj</h2>

        {/* Month selector + navigation */}
        <div className="month-nav">
          <button onClick={handlePrevMonth}>◀ Previous</button>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button onClick={handleNextMonth}>Next ▶</button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <h4>Total Overtime</h4>
          <p>{totalOvertime}</p>
        </div>
        <div className="summary-item">
          <h4>Total Monthly Pay</h4>
          <p>{totalMonthlyPay}</p>
        </div>

        {/* Editable Tea & Water */}
        <div className="summary-item">
          <h4>Tea</h4>
          <input 
            type="number" 
            value={teaInput} 
            onChange={(e) => setTeaInput(parseFloat(e.target.value))}
            disabled={updating}
          />
        </div>
        <div className="summary-item">
          <h4>Water</h4>
          <input 
            type="number" 
            value={waterInput} 
            onChange={(e) => setWaterInput(parseFloat(e.target.value))}
            disabled={updating}
          />
        </div>
        <div style={{ gridColumn: "span 2", marginTop: "10px" }}>
          <button onClick={handleUpdateIncome} disabled={updating}>
            {updating ? "Updating..." : "Update Current Month"}
          </button>
        </div>

        {/* Highlight Total Income */}
        <div className="summary-item highlight">
          <h4>Total Income</h4>
          <p>{incomeData.total_income}</p>
        </div>
      </div>

      {/* ✅ Inline Responsive CSS */}
      <style>{`
        .summary-container {
          padding: 16px;
          max-width: 900px;
          margin: 0 auto;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap; /* allow stacking on small screens */
          gap: 10px;
        }

        .month-nav {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .summary-item {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 8px;
          text-align: center;
        }

        .summary-item.highlight {
          background-color: #f2f8ff;
          border-color: #007bff;
        }

        input[type="month"], input[type="number"] {
          width: 100%;
          padding: 6px;
          border-radius: 6px;
          border: 1px solid #ccc;
        }

        button {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
        }

        button:disabled {
          background-color: #999;
          cursor: not-allowed;
        }

        /* ✅ Responsive rules */
        @media (max-width: 600px) {
          .summary-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .month-nav {
            width: 100%;
            justify-content: space-between;
          }

          h2 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}
