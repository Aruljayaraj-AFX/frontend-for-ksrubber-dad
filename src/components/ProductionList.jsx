import { useEffect, useState } from "react";
import "./ProductionList.css";

export default function DailyProductionTable() {
  const [productions, setProductions] = useState([]);
  const [dies, setDies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduction, setSelectedProduction] = useState(null);

  // Fetch productions + dies
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch die list
        const dieRes = await fetch(
          "https://ksrubber-dadproject.onrender.com/afx/pro_ksrubber/v1/get_all_die"
        );
        if (dieRes.ok) {
          const dieData = await dieRes.json();
          if (dieData.status === "success") setDies(dieData.data);
        }

        // Fetch productions
        const prodRes = await fetch(
          "https://ksrubber-dadproject.onrender.com/afx/pro_ksrubber/v1/daily-production/"
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

  // ✅ Delete by sno
  const handleDelete = async (sno) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(
        `https://ksrubber-dadproject.onrender.com/afx/pro_ksrubber/v1/delete_production/${sno}`,
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

  if (loading) return <p>Loading daily production...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container">
      <div className="form-card table-card">
        <h2 className="form-title">Daily Production</h2>

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
              {productions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No production records found.
                  </td>
                </tr>
              ) : (
                productions.map((prod) => (
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
