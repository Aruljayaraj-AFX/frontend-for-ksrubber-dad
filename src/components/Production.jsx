import { useEffect, useState } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import "./Production.css";

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Production({ prefillDate }) {
  const navigate = useNavigate();

  const [dies, setDies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDies, setSelectedDies] = useState([]);
  const [productionCounts, setProductionCounts] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [isHoliday, setIsHoliday] = useState(false); // Holiday checkbox state
  const [monthIncome, setMonthIncome] = useState(null);
  const [incomeFallback, setIncomeFallback] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [tea,settea] = useState(0);
  const [water,setwater] = useState(0);
  const [dailyIncome, setDailyIncome] = useState(0);


  // Update selectedDate if prefillDate comes from navigation
  useEffect(() => {
    if (prefillDate) {
      setSelectedDate(prefillDate);
    }
  }, [prefillDate]);

  // Automatically check Holiday if selected date is Sunday
  useEffect(() => {
    if (selectedDate) {
      const day = new Date(selectedDate).getDay();
      setIsHoliday(day === 0); // Sunday = 0
    }
  }, [selectedDate]);

  useEffect(() => {
    const fetchDies = async () => {
      try {
        const response = await fetch(
          "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/get_all_die"
        );
        if (!response.ok) throw new Error("Failed to fetch dies");
        const data = await response.json();
        if (data.status === "success") setDies(data.data);
        else setError("API returned error");
      } catch (err) {
        console.error(err);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchDies();
  }, []);

  // Include Cavity in options
  const options = dies.map((die) => ({
    value: die.DieId,
    label: `${die.DieName} (Cavity: ${die.Cavity})`,
  }));

  const handleProductionChange = (dieId, value) => {
    setProductionCounts((prev) => ({
      ...prev,
      [dieId]: value,
    }));
    setCanSubmit(false);
    setSubmitMessage(null);
  };

  const handleDateChange = (val) => {
    setSelectedDate(val);
    setCanSubmit(false);
    setSubmitMessage(null);
  };

  const handleDieSelection = (selected) => {
    setSelectedDies(selected.map((s) => s.value));
    setCanSubmit(false);
    setSubmitMessage(null);
  };

  const getPayload = () => {
    const die_ids = selectedDies;
    const counts = selectedDies.map((id) => Number(productionCounts[id] || 0));
    return { die_ids, production_counts: counts };
  };

  const handleCompute = async () => {
    if (!selectedDate) {
      alert("Please select a date first!");
      return;
    }

    const payload = {
      ...getPayload(),
      is_holiday: isHoliday, // optional for backend
    };

    // sub_flag = 1 if checkbox NOT selected, 0 if selected
    const subFlag = isHoliday ? 0 : 1;

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch(
        `https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/compute_production/?input_date=${selectedDate}&sub_flag=${subFlag}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (data.status === "success") {
        setResult(data);
        const backendDailyIncome = Number(data?.new_daily_pro?.daily_income || 0);

setDailyIncome(backendDailyIncome);

        const [year, month] = selectedDate.split("-");
        try {
          const incomeRes = await fetch(
            `https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/get_month_income/?year=${year}&month=${month}`
          );
          const incomeData = await incomeRes.json();

          if (incomeData.status === "success") {
            setMonthIncome(incomeData.data.income);
            setIncomeFallback(false);
          } else {
            setMonthIncome(0);
            setIncomeFallback(true);
          }
        } catch (err) {
          console.error("Income fetch failed:", err);
          setMonthIncome(0);
          setIncomeFallback(true);
        }

        setCanSubmit(true);

        // Scroll to results after compute
        setTimeout(() => {
          const resultsElement = document.querySelector(".results-box");
          if (resultsElement)
            resultsElement.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        alert("Failed: " + JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      alert("Error computing production");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedDies([]);
    setProductionCounts({});
    setResult(null);
    setMonthIncome(null);
    setIncomeFallback(false);
    setCanSubmit(false);
    setSelectedDate((prev) => prev || getTodayDate());
    setIsHoliday(false);
  };

  const handleSubmit = async () => {
  if (!selectedDate) {
    alert("Please select a date first!");
    return;
  }

  // sub_flag = 1 if checkbox NOT selected, 0 if selected
  const subFlag = isHoliday ? 0 : 1;

const payload = {
  DieIds: selectedDies,
  ProductionCounts: selectedDies.map((id) => Number(productionCounts[id] || 0)),
  production_date: selectedDate,
  sub_flag: isHoliday ? 0 : 1,
  tea : tea,
  water: water
};
  try {
    const res = await fetch(
      "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/calculate_production_hours",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (data.status === "success") {
      setSubmitMessage({
        type: "success",
        text: `✅ Successfully submitted! Updated income: ₹${data.updated_income}`,
      });
    } else {
      setSubmitMessage({
        type: "error",
        text: `❌ Error: ${data.message || "Unknown error"}`,
      });
    }
  } catch (err) {
    console.error(err);
    setSubmitMessage({
      type: "error",
      text: "❌ Submit failed",
    });
  } finally {
    setTimeout(() => {
      setSubmitMessage(null);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 2000);
  }
};


  if (loading) return <p className="info-text">Loading dies...</p>;
  if (error) return <p className="info-text error">{error}</p>;

  const monthlyPay = Number(result?.new_daily_pro?.monthy_pay || 0);
  const monthlyIncomeNum = Number(monthIncome || 0);
  const netTotal = monthlyPay + monthlyIncomeNum ;

  return (
    <div className="container">
      <div className="form-card table-card">
        <h2 className="form-title">All Dies</h2>

        {/* Date Input */}
        <div className="form-group date-group">
          <label>Select Date</label>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        {/* Holiday checkbox */}
        <div className="form-group holiday-group">
          <label>
            <input
              type="checkbox"
              checked={isHoliday}
              onChange={(e) => setIsHoliday(e.target.checked)}
            />
            Holiday
          </label>
        </div>

        {/* Multi-select dropdown */}
        <div className="form-group">
          <label>Select Multiple Dies</label>
          <Select
            isMulti
            options={options}
            value={options.filter((opt) => selectedDies.includes(opt.value))}
            onChange={handleDieSelection}
          />
        </div>

        {/* Selected dies input */}
        {selectedDies.length > 0 && (
          <div className="selected-dies">
            <h4>Production Counts</h4>
            {selectedDies.map((id) => {
              const die = dies.find((d) => d.DieId === id);
              return (
                <div key={id} className="production-input">
                  <label>{die?.DieName || id}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter production count"
                    value={productionCounts[id] || ""}
                    onChange={(e) =>
                      handleProductionChange(id, e.target.value)
                    }
                  />
                </div>
                
              );
            })}
            <div>
              <div className="production-input">
                <label>tea</label>
                <input
                  type="number"
                  placeholder="enter tea rupees"
                  value={tea}
                  onChange={(e) => settea(e.target.value)}
                  />
              </div>
              
              <div className="production-input">
                <label>water</label>
                <input
                  type="number"
                  placeholder="enter water rupees"
                  value={water}
                  onChange={(e)=>setwater(e.target.value)}
                  />
              </div>
            </div>

            <button
              className="submit-btn"
              onClick={handleCompute}
              disabled={submitting}
            >
              {submitting ? "Computing..." : "Compute"}
            </button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="results-box">
            <h4>Production Results ({result.new_daily_pro.date})</h4>
            {result.details.map((d, i) => {
              const dieObj = dies.find((die) => die.DieId === d.DieId);
              return (
                <div key={d.DieId} className="result-row">
                  <strong
                    className="clickable-die"
                    style={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      color: "#007bff",
                    }}
                    onClick={() => navigate(`/die-details/${d.DieId}`)}
                  >
                    {dieObj?.DieName || d.DieName}
                  </strong>{" "}
                  (Cavity: {dieObj?.Cavity || "-"})
                  <div>
                    Overall Time: {result.new_daily_pro.overall_time[i]} hrs
                  </div>
                  <div>
                    Overtime: {result.new_daily_pro.overtime[i]} hrs{" "}
                    {result.new_daily_pro.delete_index_hr &&
                      result.new_daily_pro.delete_index_hr[i] > 0 && (
                        <span className="delete-hr">
                          -{result.new_daily_pro.delete_index_hr[i]} hrs
                        </span>
                      )}
                  </div>
                  <div>Price: ₹{result.new_daily_pro.price[i]}</div>
                  <div>
                    <strong>Production Hr/Unit:</strong>{" "}
                    <span className="green-text">
                      {dieObj?.Pro_hr_count || 0} hrs/unit
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="final-summary">
              <strong>Overtime Pay:</strong> ₹{monthlyPay}
            </div>

            <div className="final-summary">
              <strong>Income:</strong> ₹{monthlyIncomeNum}{" "}
              {incomeFallback && <span className="fallback">(fixed)</span>}
            </div>
            <div className="final-summary net-total">
              <strong>Total Income:</strong>{" "}
              <span className={netTotal >= 0 ? "positive" : "negative"}>
                {netTotal >= 0
                  ? `₹${netTotal.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}`
                  : `-₹${Math.abs(netTotal).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}`}
              </span>
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Submit
            </button>

            {submitMessage && (
              <p
                className={
                  submitMessage.type === "success"
                    ? "success-message"
                    : "error-message"
                }
              >
                {submitMessage.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
