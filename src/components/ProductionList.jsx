import { useEffect, useState ,useRef} from "react";
import { useNavigate } from "react-router-dom"; // for redirect
import "./ProductionList.css";
import { toPng } from "html-to-image"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const handleSendWhatsApp = () => {
  const doc = new jsPDF("p", "mm", "a4"); // portrait, mm, A4

  const monthName = new Date(yearNum, monthNum).toLocaleString("default", {
    month: "long",
  });
  const title = `Daily Production - ${monthName} ${yearNum}`;
  doc.setFontSize(14);
  doc.text(title, 14, 15);

  // Prepare table rows without status column
  const rows = displayedProductions.flatMap((prod) => {
    const formattedDate = formatDate(prod.date);
    const day = new Date(prod.date).getDay(); // 0 = Sunday
    const isSunday = day === 0;
    const isLeave = leaveDates.includes(prod.date);

    let partNames = "-";
    let productionCounts = "-";

    if (!prod.isMissing) {
      const allNone =
        Array.isArray(prod.DieId) &&
        prod.DieId.every((id) => {
          const die = dies.find((d) => d.DieId === id);
          return !die || !die.DieName || die.DieName.trim().toLowerCase() === "none";
        });

      if (!allNone) {
        // ✅ Create line-by-line content
        const partsArray = prod.DieId.map((id) => getDieName(id));
        const countsArray = Array.isArray(prod.overall_production)
          ? prod.overall_production.map((p) => String(p))
          : [];

        // join with new line and split to fit cell
        partNames = doc.splitTextToSize(partsArray.join("\n"), 80);
        productionCounts = doc.splitTextToSize(countsArray.join("\n"), 30);
      }
    }

    const mainRow = [formattedDate, partNames, productionCounts];

    // Sunday / Leave row below
    let noteRow = null;
    if (isSunday) {
      noteRow = ["", "(Sunday)", ""];
    } else if (isLeave) {
      noteRow = ["", "(Leave)", ""];
    }

    return noteRow ? [mainRow, noteRow] : [mainRow];
  });

  const headers = [["Date", "Part Names", "Production"]];

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 20,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "top",
    },
    columnStyles: {
      0: { cellWidth: 30 },  // Date
      1: { cellWidth: 100 }, // Part Names — gives more space for multiline
      2: { cellWidth: 50 },  // Production
    },
    headStyles: { fillColor: [22, 160, 133] },
    theme: "grid",
    pageBreak: "auto",
    didParseCell: (data) => {
      // Style Sunday/Leave rows
      if (data.row.raw[1]?.includes?.("(Sunday)") || data.row.raw[1]?.includes?.("(Leave)")) {
        data.cell.styles.fontStyle = "italic";
        data.cell.styles.textColor = [100, 100, 100];
      }
    },
  });

  // 📊 Summary Section
  const finalY = doc.lastAutoTable?.finalY || 20;
  doc.setFontSize(10);
  doc.text("📊 Summary", 14, finalY + 8);
  doc.text(`• Total Overtime: ${totalOvertime}`, 14, finalY + 16);
  doc.text(`• Total Overtime Pay: ${totalMonthyPay}`, 14, finalY + 24);
  doc.text(`• Final Pay (+13,000): ${finalPay}`, 14, finalY + 32);

  doc.save(`Daily_Production_${monthName}_${yearNum}.pdf`);
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
            Total overtime Pay: <b>{totalMonthyPay}</b>
          </p>
          <p>
            Final Pay (+13,000): <b>{finalPay}</b>
          </p>
        </div>
        {/* 🔹 Floating download button */}
<button
  className="floating-whatsapp-btn"
  onClick={handleSendWhatsApp}
  style={{
    position: "fixed",
    bottom: "80px",
    right: "20px",
    backgroundColor: "#25D366",
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    cursor: "pointer",
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width="28"
    height="28"
    fill="#fff"
  >
    <path d="M16 .4C7.4.4.4 7.4.4 16c0 2.8.7 5.5 2.1 7.9L.4 31.6l8-2.1C11 30.9 13.4 31.6 16 31.6c8.6 0 15.6-7 15.6-15.6S24.6.4 16 .4zm0 28.5c-2.3 0-4.6-.6-6.5-1.8l-.5-.3-4.7 1.3 1.3-4.6-.3-.5C4 20.9 3.3 18.5 3.3 16 3.3 8.6 8.6 3.3 16 3.3S28.7 8.6 28.7 16 23.4 28.9 16 28.9z"/>
    <path d="M24.1 19.8c-.4-.2-2.3-1.1-2.7-1.2-.4-.1-.7-.2-1 .2-.3.4-1 1.2-1.2 1.4-.2.2-.4.3-.8.1-1.4-.5-2.6-1.7-3.3-3.1-.1-.3 0-.5.1-.7.2-.2.4-.4.5-.6.2-.2.3-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.9-2.3-1.2-3.1-.3-.8-.6-.7-.9-.8H12c-.3 0-.7 0-1 .5-.4.4-1.3 1.2-1.3 3s1.3 3.4 1.5 3.6c.2.2 2.7 4 6.5 5.6.9.4 1.7.7 2.3.8.9.1 1.7.1 2.3-.3.6-.3 2-1.5 2.3-2.3.3-.8.3-1.5.2-1.7-.1-.1-.3-.2-.7-.4z"/>
  </svg>
</button>

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
