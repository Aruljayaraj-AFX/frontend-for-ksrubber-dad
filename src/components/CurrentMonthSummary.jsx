import { useEffect, useState } from "react";

export default function MonthlySummary() {
  const [productions, setProductions] = useState([]);
  const [incomeData, setIncomeData] = useState({ total_income: 0, total_tea: 0, total_water: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // default current month YYYY-MM

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
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

      } catch (err) {
        console.error(err);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Month navigation
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const prev = new Date(year, month - 2); // JS months are 0-indexed
    setSelectedMonth(prev.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const next = new Date(year, month); 
    setSelectedMonth(next.toISOString().slice(0, 7));
  };

  // Filter productions by selected month
  const filteredProductions = productions.filter(
    (prod) => prod.date.slice(0, 7) === selectedMonth
  );

  // Calculate totals
  const totalOvertime = filteredProductions.reduce((sum, prod) => {
    return sum + prod.overtime.reduce((a, b) => a + (parseFloat(b) || 0), 0);
  }, 0);

  const totalMonthlyPay = filteredProductions.reduce(
    (sum, prod) => sum + (parseFloat(prod.monthy_pay) || 0),
    0
  );

  const finalPay = totalMonthlyPay + 13000;

  if (loading) return <p className="loading-msg">Loading summary...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>Hello! Arputharaj</h2>

        {/* Month selector + navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        <div className="summary-item">
          <h4>Salary Pay</h4>
          <p>13000</p>
        </div>
        <div className="summary-item highlight">
          <h4>Final Pay</h4>
          <p>{finalPay}</p>
        </div>
        <div className="summary-item">
          <h4>Total Income</h4>
          <p>{incomeData.total_income}</p>
        </div>
        <div className="summary-item">
          <h4>Tea</h4>
          <p>{incomeData.total_tea}</p>
        </div>
        <div className="summary-item">
          <h4>Water</h4>
          <p>{incomeData.total_water}</p>
        </div>
      </div>
    </div>
  );
}
