import { useEffect, useState } from "react";
import "./ProductionList.css";

export default function DailyProductionTable() {
  const [productions, setProductions] = useState([]);
  const [dies, setDies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduction, setSelectedProduction] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Fetch productions + dies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dieRes = await fetch(
          "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/get_all_die"
        );
        if (dieRes.ok) {
          const dieData = await dieRes.json();
          if (dieData.status === "success") setDies(dieData.data);
        }

        const prodRes = await fetch(
          "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/daily-production/"
        );
        if (!prodRes.ok) throw new Error("Failed to fetch daily production");
        const prodData = await prodRes.json();
        if (prodData.status === "success") setProductions(prodData.data);
        else setError("API returned error");
      } catch (err) {
        console.error(err);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Map DieId → DieName
  const getDieName = (id) => {
    const found = dies.find((d) => d.DieId === id);
    return found ? found.DieName : id;
  };

  // Delete by sno
  const handleDelete = async (sno) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(
        `https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/delete_production/${sno}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.status === "success") {
        setProductions(productions.filter((p) => p.sno !== sno));
        setSelectedProduction(null);
      } else {
        alert("Delete failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting record.");
    }
  };

  // 🔎 Filtering logic
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentYear = new Date().getFullYear().toString(); // YYYY

  const filteredProductions = productions.filter((prod) => {
    const prodMonth = prod.date.slice(0, 7); // YYYY-MM
    const prodYear = prod.date.slice(0, 4); // YYYY

    // Check month filter
    if (selectedMonth) {
      return prodMonth === selectedMonth;
    }

    // Check year filter
    if (selectedYear) {
      return prodYear === selectedYear;
    }

    // Default → current month
    return prodMonth === currentMonth;
  }).filter((prod) => {
    // Check search filter
    return (
      searchTerm.trim() === "" ||
      prod.DieId.some((id) =>
        getDieName(id).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  // 📊 Summary calculation
  const totalOvertime = filteredProductions.reduce((sum, prod) => {
    return (
      sum +
      prod.overtime.reduce((a, b) => a + (parseFloat(b) || 0), 0)
    );
  }, 0);

  const totalMonthyPay = filteredProductions.reduce(
    (sum, prod) => sum + (parseFloat(prod.monthy_pay) || 0),
    0
  );

  const finalPay = totalMonthyPay + 13000;

  if (loading) return <p>Loading daily production...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container">
      <div className="form-card table-card">
        <h2 className="form-title">Daily Production</h2>

        {/* 🔎 Search & Filters */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search by Die Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedYear(""); // reset year when picking month
            }}
            className="month-input"
          />

          <input
            type="number"
            placeholder="Year (YYYY)"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedMonth(""); // reset month when picking year
            }}
            className="year-input"
          />
        </div>

        <div className="table-responsive">
          <table className="die-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Dies</th>
                <th>Overall Time (hr)</th>
                <th>Overtime</th>
                <th>Overall Production</th>
                <th>Prices</th>
                <th>Monthy Pay</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No production records found.
                  </td>
                </tr>
              ) : (
                filteredProductions.map((prod) => (
                  <tr
                    key={prod.sno}
                    onClick={() => setSelectedProduction(prod)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{prod.date}</td>
                    <td>
                      <ul className="cell-list">
                        {prod.DieId.map((id, i) => (
                          <li key={i}>{getDieName(id)}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="cell-list">
                        {prod.overall_time.map((t, i) => (
                          <li key={i}>{t ?? "-"}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="cell-list">
                        {prod.overtime.map((o, i) => (
                          <li key={i}>{o ?? "-"}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="cell-list">
                        {prod.overall_production.map((p, i) => (
                          <li key={i}>{p ?? "-"}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="cell-list">
                        {prod.price.map((p, i) => (
                          <li key={i}>{p ?? "-"}</li>
                        ))}
                      </ul>
                    </td>
                    <td>{prod.monthy_pay}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 📊 Summary */}
        <div className="summary-card">
          <h3>
            Summary for{" "}
            {selectedMonth
              ? selectedMonth
              : selectedYear
              ? selectedYear
              : currentMonth}
          </h3>
          <p>Total Overtime: <b>{totalOvertime}</b></p>
          <p>Total Monthly Pay: <b>{totalMonthyPay}</b></p>
          <p>Final Pay (+13,000): <b>{finalPay}</b></p>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProduction && (
        <div className="modal-overlay">
          <div className="modal-card">
            <button
              className="close-btn"
              onClick={() => setSelectedProduction(null)}
            >
              ×
            </button>
            <h3 className="modal-title">
              Production Detail - {selectedProduction.date}
            </h3>

            <div className="modal-details">
              <div className="detail-row">
                <span className="detail-label">Dies</span>
                <span className="detail-value">
                  <ul>
                    {selectedProduction.DieId.map((id, i) => (
                      <li key={i}>{getDieName(id)}</li>
                    ))}
                  </ul>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Overall Time (hr)</span>
                <span className="detail-value">
                  <ul>
                    {selectedProduction.overall_time.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Overtime</span>
                <span className="detail-value">
                  <ul>
                    {selectedProduction.overtime.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Overall Production</span>
                <span className="detail-value">
                  <ul>
                    {selectedProduction.overall_production.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Prices</span>
                <span className="detail-value">
                  <ul>
                    {selectedProduction.price.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Monthy Pay</span>
                <span className="detail-value">
                  {selectedProduction.monthy_pay}
                </span>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="delete-btn"
                onClick={() => handleDelete(selectedProduction.sno)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
