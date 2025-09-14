import { useEffect, useState ,useRef} from "react";
import { useNavigate } from "react-router-dom"; // for redirect
import "./ProductionList.css";
import { toPng } from "html-to-image";  

export default function DailyProductionTable() {
  const [productions, setProductions] = useState([]);
  const [dies, setDies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [leaveDates, setLeaveDates] = useState([]); // Track leave rows

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);


  const navigate = useNavigate();
  const tableRef = useRef(); 
  const summaryRef = useRef(null);

  const handleDownloadSummary = () => {
  if (!summaryRef.current) return;

  toPng(summaryRef.current)
    .then((dataUrl) => {
      const link = document.createElement("a");
      link.download = "summary.png";
      link.href = dataUrl;
      link.click();
    })
    .finally(() => setShowDownloadPopup(false));
};

  const handleDownloadPng = () => {
  if (!tableRef.current) return;

  const rows = tableRef.current.querySelectorAll("tr");
  const hidden = [];
  const added = [];

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("th, td"));

    // CASE: Leave / No data rows → 2 cells only
    if (cells.length === 2 && cells[1].colSpan === 6) {
      // keep only date, create fake Dies + Production cells
      const fakeDies = document.createElement("td");
      fakeDies.textContent = cells[1].textContent === "Leave" ? "Leave" : "No data";
      const fakeProd = document.createElement("td");
      fakeProd.textContent = "-";
      row.insertBefore(fakeDies, cells[1].nextSibling);
      row.insertBefore(fakeProd, fakeDies.nextSibling);
      cells[1].style.display = "none"; // hide big colSpan cell
      hidden.push(cells[1]);
      added.push(fakeDies, fakeProd);
    }

    // CASE: normal data rows → hide other columns (index 3+)
    cells.forEach((cell, i) => {
      if (cells.length > 3 && ![0, 1, 2].includes(i)) {
        hidden.push(cell);
        cell.style.display = "none";
      }
    });
  });

  toPng(tableRef.current)
    .then((dataUrl) => {
      const link = document.createElement("a");
      link.download = "production.png";
      link.href = dataUrl;
      link.click();
    })
    .catch((err) => console.error("PNG export failed", err))
    .finally(() => {
      // Restore all hidden/added cells
      hidden.forEach((cell) => (cell.style.display = ""));
      added.forEach((cell) => cell.remove());
    });
};


  // 🔹 Fetch productions
  const fetchProductions = async () => {
    try {
      const prodRes = await fetch(
        "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/daily-production/"
      );
      if (!prodRes.ok) throw new Error("Failed to fetch daily production");
      const prodData = await prodRes.json();
      if (prodData.status === "success") setProductions(prodData.data);
    } catch (err) {
      console.error(err);
      setError("Error fetching productions");
    }
  };

  // 🔹 Initial data load
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

        await fetchProductions();
      } catch (err) {
        console.error(err);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔹 Map DieId → DieName
  const getDieName = (id) => {
    const found = dies.find((d) => d.DieId === id);
    return found ? found.DieName : id;
  };

  // 🔹 Delete by sno
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

  // 🔹 Generate all days of month
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
  if (yearNum === currentYear && monthNum === currentMonth) {
    allDates = allDates.filter((d) => new Date(d) <= today);
  }

  // 🔹 Map productions by date
  const productionMap = {};
  productions.forEach((p) => (productionMap[p.date] = p));

  // 🔹 Merge: ensure all dates show
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

  // 🔹 Summary calculation
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

  // 🔹 Date formatting
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // 🔹 Handle empty row click
  const handleEmptyRowClick = async (date) => {
    const choice = window.confirm(
      "Click OK to enter data, Cancel to mark as Leave"
    );

    if (choice) {
      navigate(`/production?date=${date}`);
    } else {
      try {
        const payload = {
          DieIds: ["KSD223adbd2"], // 👈 static die for leave
          ProductionCounts: [0],
          production_date: date,
          sub_flag: 1,
        };

        const response = await fetch(
          "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/add_daily_production",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json();
        if (data.status === "success") {
          await fetchProductions();
          setLeaveDates((prev) => [...prev, date]);
        } else {
          alert("Failed to mark leave");
        }
      } catch (err) {
        console.error(err);
        alert("Error marking leave");
      }
    }
  };

  if (loading) return <p>Loading daily production...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container">
      <div className="form-card table-card">
        <h2 className="form-title">Daily Production</h2>

        {/* 🔹 Filters */}
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

        {/* 🔹 Table */}
        <div className="table-responsive" ref={tableRef}>
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
              {displayedProductions.map((prod) => {
                const isHoliday =
                  !prod.isMissing &&
                  Array.isArray(prod.overtime) &&
                  Array.isArray(prod.overall_time) &&
                  prod.overtime.every((o, i) => o === prod.overall_time[i]);

                // Case: Missing row
                if (prod.isMissing) {
                  return (
                    <tr
                      key={prod.date}
                      className={`missing-row ${
                        leaveDates.includes(prod.date) ? "leave-row" : ""
                      }`}
                      onClick={() => handleEmptyRowClick(prod.date)}
                    >
                      <td>
                        {formatDate(prod.date)}
                        {new Date(prod.date).getDay() === 0 && (
                          <div className="sunday-note">Sunday</div>
                        )}
                      </td>
                      <td colSpan="6">
                        {leaveDates.includes(prod.date)
                          ? "Leave"
                          : "No data entered"}
                      </td>
                    </tr>
                  );
                }

                // Case: All DieNames = none → Leave
                const allNone =
                  Array.isArray(prod.DieId) &&
                  prod.DieId.every((id) => {
                    const die = dies.find((d) => d.DieId === id);
                    return (
                      !die || !die.DieName || die.DieName.toLowerCase() === "none"
                    );
                  });

                if (allNone) {
                  return (
                    <tr
                      key={prod.sno}
                      className="leave-row neutral-row"
                      onClick={() => setSelectedProduction(prod)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{formatDate(prod.date)}</td>
                      <td colSpan="6">Leave</td>
                    </tr>
                  );
                }

                // Case: Normal production row
                return (
                  <tr
                    key={prod.sno}
                    onClick={() => setSelectedProduction(prod)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      {formatDate(prod.date)}
                      {(new Date(prod.date).getDay() === 0 || isHoliday) && (
                        <div
                          className={`sunday-note ${
                            isHoliday ? "holiday-note" : ""
                          }`}
                        >
                          {isHoliday ? "Holiday" : "Sunday"}
                        </div>
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 🔹 Summary */}
        <div className="summary-card" ref={summaryRef}>
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
        {/* 🔹 Floating download button */}
<button
  className="floating-download-btn"
  onClick={() => setShowDownloadPopup(true)}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="#fff"
    viewBox="0 0 24 24"
    width="28"
    height="28"
  >
    <path d="M16.988 15.408c-.272-.136-1.616-.8-1.864-.888-.248-.092-.432-.136-.616.136-.184.272-.712.888-.872 1.072-.16.184-.32.208-.592.072-.272-.136-1.152-.424-2.192-1.352-.81-.72-1.356-1.608-1.516-1.88-.16-.272-.017-.416.12-.552.124-.124.272-.32.408-.48.136-.16.184-.272.272-.456.092-.184.044-.344-.02-.48-.064-.136-.616-1.488-.84-2.04-.224-.544-.448-.472-.616-.48-.16-.008-.344-.008-.528-.008s-.48.072-.728.344c-.248.272-.952.928-.952 2.264s.976 2.624 1.112 2.808c.136.184 1.92 2.928 4.656 4.104.652.28 1.16.448 1.556.576.652.208 1.248.176 1.72.108.524-.08 1.616-.656 1.848-1.288.232-.632.232-1.176.16-1.288-.072-.112-.264-.184-.536-.32zm-4.988 6.592c-1.664 0-3.296-.448-4.72-1.296l-3.288 1.04.984-3.208c-.896-1.504-1.368-3.224-1.368-4.984 0-5.504 4.48-9.984 9.984-9.984 2.664 0 5.176 1.04 7.064 2.92 1.88 1.88 2.92 4.392 2.92 7.064 0 5.504-4.48 9.984-9.984 9.984z" />
  </svg>
</button>

{/* 🔹 Download popup */}
{showDownloadPopup && (
  <div className="popup-overlay">
    <div className="popup-card">
      <h4>Select Download Option</h4>
      <button onClick={handleDownloadPng}>📋 Table (Date/Dies/Production)</button>
      <button onClick={handleDownloadSummary}>📑 Summary Only</button>
      <button onClick={() => setShowDownloadPopup(false)}>❌ Cancel</button>
    </div>
  </div>
)}

      </div>

      {/* 🔹 Modal */}
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

            {/* ✅ Show Leave info if DieName = none */}
            {selectedProduction.DieId &&
            selectedProduction.DieId.every(
              (id) => getDieName(id).toLowerCase() === "none"
            ) ? (
              <div className="modal-details">
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">Leave</span>
                </div>
              </div>
            ) : (
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
            )}

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
