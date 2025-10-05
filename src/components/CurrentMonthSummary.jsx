import { useEffect, useState } from "react";

export default function MonthlySummary() {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // default current month YYYY-MM

  // Fetch productions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await fetch(
          "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/daily-production/"
        );
        if (!prodRes.ok) throw new Error("Failed to fetch daily production");

        const prodData = await prodRes.json();
        if (prodData.status === "success") {
          setProductions(prodData.data);
        } else {
          setError("API returned error");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Navigate to previous month
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const prev = new Date(year, month - 2); // month-2 because JS months 0-indexed
    setSelectedMonth(prev.toISOString().slice(0, 7));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const next = new Date(year, month); // month is 0-indexed in JS Date
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
          <h4>salary Pay</h4>
          <p>13000</p>
        </div>
        <div className="summary-item highlight">
          <h4>Final Pay</h4>
          <p>{finalPay}</p>
        </div>
      </div>
    </div>
  );
}
