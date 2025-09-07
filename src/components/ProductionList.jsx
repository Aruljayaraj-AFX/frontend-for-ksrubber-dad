import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ⬅️ for redirect
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

  const navigate = useNavigate(); // ⬅️ navigation hook

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
        setProductions((prev) => prev.filter((p) => p.sno !== sno));
        setSelectedProduction(null);
      } else {
        alert("Delete failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting record.");
    }
  };

  // Generate all days of month
  const getDaysInMonth = (year, month) => {
    const days = [];
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      days.push(dateStr);
    }
    return days;
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  let yearNum, monthNum;

  if (selectedMonth) {
    yearNum = parseInt(selectedMonth.slice(0, 4), 10);
    monthNum = parseInt(selectedMonth.slice(5, 7), 10) - 1;
  } else if (selectedYear) {
    yearNum = parseInt(selectedYear, 10);
    monthNum = 0;
  } else {
    yearNum = currentYear;
    monthNum = currentMonth;
  }

  let allDates = getDaysInMonth(yearNum, monthNum);

  // Restrict to today if current month
  if (yearNum === currentYear && monthNum === currentMonth) {
    allDates = allDates.filter((d) => new Date(d) <= today);
  }

  // Map productions by date
  const productionMap = {};
  productions.forEach((p) => (productionMap[p.date] = p));

  // Merge: ensure all dates show
  const displayedProductions = allDates
    .map((date) =>
      productionMap[date]
        ? { ...productionMap[date], isMissing: false }
        : { date, isMissing: true }
    )
    .filter((prod) => {
      if (searchTerm.trim() !== "" && !prod.isMissing) {
        return prod.DieId.some((id) =>
          getDieName(id).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    });

  // Summary calculation
  const totalOvertime = displayedProductions.reduce((sum, prod) => {
    if (prod.isMissing || !Array.isArray(prod.overtime)) return sum;
    return (
      sum + prod.overtime.reduce((a, b) => a + (parseFloat(b) || 0), 0)
    );
  }, 0);

  const totalMonthyPay = displayedProductions.reduce((sum, prod) => {
    if (prod.isMissing || !prod.monthy_pay) return sum;
    return sum + (parseFloat(prod.monthy_pay) || 0);
  }, 0);

  const finalPay = totalMonthyPay + 13000;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (loading) return <p>Loading daily production...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container">
      <div className="form-card table-card">
        <h2 className="form-title">Daily Production</h2>

        {/* Filters */}
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
              setSelectedYear("");
            }}
            className="month-input"
          />
          <input
            type="number"
            placeholder="Year (YYYY)"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedMonth("");
            }}
            className="year-input"
          />
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="die-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Dies</th>
                <th>Overall Production</th>
                <th>Overall Time (hr)</th>
                <th>Overtime</th>
                <th>Prices</th>
                <th>Monthly Pay</th>
              </tr>
            </thead>
            <tbody>
              {displayedProductions.map((prod) =>
                prod.isMissing ? (
                  <tr
                    key={prod.date}
                    className="missing-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/production?date=${prod.date}`)}
                  >
                    <td>
                      {formatDate(prod.date)}
                      {new Date(prod.date).getDay() === 0 && (
                        <div className="sunday-note">Sunday</div>
                      )}
                    </td>
                    <td colSpan="6">No data entered</td>
                  </tr>
                ) : (
                  <tr
                    key={prod.sno}
                    onClick={() => setSelectedProduction(prod)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      {formatDate(prod.date)}
                      {new Date(prod.date).getDay() === 0 && (
                        <div className="sunday-note">Sunday</div>
                      )}
                    </td>
                    <td>
                      <ul className="cell-list">
                        {prod.DieId.map((id, i) => (
                          <li key={i}>{getDieName(id)}</li>
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
                        {prod.price.map((p, i) => (
                          <li key={i}>{p ?? "-"}</li>
                        ))}
                      </ul>
                    </td>
                    <td>{prod.monthy_pay}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="summary-card">
          <h3>
            Summary for{" "}
            {selectedMonth ||
              selectedYear ||
              `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
          </h3>
          <p>
            Total Overtime: <b>{totalOvertime}</b>
          </p>
          <p>
            Total Monthly Pay: <b>{totalMonthyPay}</b>
          </p>
          <p>
            Final Pay (+13,000): <b>{finalPay}</b>
          </p>
        </div>
      </div>

      {/* Modal */}
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
              Production Detail - {formatDate(selectedProduction.date)}
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
                <span className="detail-label">Monthly Pay</span>
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
