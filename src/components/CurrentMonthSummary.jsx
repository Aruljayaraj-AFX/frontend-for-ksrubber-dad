import { useEffect, useState } from "react";

export default function CurrentMonthSummary() {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // 🔹 Scroll to bottom on mount
  useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // 🔹 Scroll again when productions or error changes
  useEffect(() => {
    if (productions.length > 0 || error) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [productions, error]);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const filteredProductions = productions.filter(
    (prod) => prod.date.slice(0, 7) === currentMonth
  );

  const totalOvertime = filteredProductions.reduce((sum, prod) => {
    return (
      sum + prod.overtime.reduce((a, b) => a + (parseFloat(b) || 0), 0)
    );
  }, 0);

  const totalMonthyPay = filteredProductions.reduce(
    (sum, prod) => sum + (parseFloat(prod.monthy_pay) || 0),
    0
  );

  const finalPay = totalMonthyPay + 13000;

  if (loading) return <p className="loading-msg">Loading summary...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>Hello! Arputharaj</h2>
        <span className="summary-month">{currentMonth}</span>
      </div>
      <div className="summary-grid">
        <div className="summary-item">
          <h4>Total Overtime</h4>
          <p>{totalOvertime}</p>
        </div>
        <div className="summary-item">
          <h4>Total Monthly Pay</h4>
          <p>{totalMonthyPay}</p>
        </div>
        <div className="summary-item highlight">
          <h4>Final Pay (+13,000)</h4>
          <p>{finalPay}</p>
        </div>
      </div>
    </div>
  );
}
