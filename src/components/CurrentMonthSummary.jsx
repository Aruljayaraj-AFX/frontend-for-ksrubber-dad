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

        const [prodRes, incomeRes] = await Promise.all([
          fetch("https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/daily-production/"),
          fetch("https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/monthly-income/"),
        ]);

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
          body: JSON.stringify({ tea: teaInput, water: waterInput }),
        }
      );

      if (!res.ok) throw new Error("Failed to update current month income");
      const data = await res.json();

      setIncomeData({
        total_income: incomeData.total_income,
        total_tea: data.data.tea,
        total_water: data.data.water,
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

  if (loading) return <p className="text-center py-6 text-gray-600">Loading summary...</p>;
  if (error) return <p className="text-center py-6 text-red-500">{error}</p>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Hello! Arputharaj</h2>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="px-2 py-1 border rounded-md text-sm hover:bg-gray-100"
          >
            ◀
          </button>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border px-2 py-1 rounded-md text-sm"
          />
          <button
            onClick={handleNextMonth}
            className="px-2 py-1 border rounded-md text-sm hover:bg-gray-100"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <h4 className="text-lg font-semibold text-gray-700">Total Overtime</h4>
          <p className="text-xl font-bold mt-1">{totalOvertime}</p>
        </div>

        <div className="bg-white shadow rounded-xl p-4 text-center">
          <h4 className="text-lg font-semibold text-gray-700">Total Monthly Pay</h4>
          <p className="text-xl font-bold mt-1">{totalMonthlyPay}</p>
        </div>

        <div className="bg-white shadow rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-700">Tea</h4>
          <input
            type="number"
            value={teaInput}
            onChange={(e) => setTeaInput(parseFloat(e.target.value))}
            className="w-full mt-2 border rounded-md p-2 text-center"
            disabled={updating}
          />
        </div>

        <div className="bg-white shadow rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-700">Water</h4>
          <input
            type="number"
            value={waterInput}
            onChange={(e) => setWaterInput(parseFloat(e.target.value))}
            className="w-full mt-2 border rounded-md p-2 text-center"
            disabled={updating}
          />
        </div>

        <div className="sm:col-span-2 text-center mt-2">
          <button
            onClick={handleUpdateIncome}
            disabled={updating}
            className={`px-4 py-2 rounded-md font-medium text-white transition ${
              updating ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {updating ? "Updating..." : "Update Current Month"}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:col-span-2 text-center mt-2">
          <h4 className="text-lg font-semibold text-blue-700">Total Income</h4>
          <p className="text-2xl font-bold text-blue-900 mt-1">{incomeData.total_income}</p>
        </div>
      </div>
    </div>
  );
}
