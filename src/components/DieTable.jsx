import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./DieTable.css";

export default function DieTable() {
  const { dieId } = useParams();
  const [dies, setDies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDie, setSelectedDie] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const itemsPerPage = 20;

  // Fetch all dies and sort: company alphabetically, die name natural order
  useEffect(() => {
    const fetchDies = async () => {
      try {
        const response = await fetch(
          "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/get_all_die"
        );
        if (!response.ok) throw new Error("Failed to fetch dies");
        const data = await response.json();
        if (data.status === "success") {
          const sortedDies = data.data.sort((a, b) => {
            const cmpCompany = a.CompanyName.localeCompare(b.CompanyName);
            if (cmpCompany !== 0) return cmpCompany;
            // Natural sort for die name
            return a.DieName.localeCompare(b.DieName, undefined, {
              numeric: true,
              sensitivity: "base",
            });
          });

          setDies(sortedDies);

          // Open modal if dieId exists in URL
          if (dieId) {
            const foundDie = sortedDies.find((d) => d.DieId === dieId);
            if (foundDie) setSelectedDie(foundDie);
            else setError("Die not found");
          }
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
    fetchDies();
  }, [dieId]);

  // Filter dies by search
  const filteredDies = dies.filter((die) =>
    die.DieName.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentDies = filteredDies.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredDies.length / itemsPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleRowClick = (die) => setSelectedDie(die);

  const handleDelete = async (dieId) => {
    if (!window.confirm("Are you sure you want to delete this die?")) return;
    try {
      const response = await fetch(
        `https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/delete_die/${dieId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete die");
      setDies(dies.filter((die) => die.DieId !== dieId));
      setSelectedDie(null);
      alert("Die deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting die.");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedDie) {
      setError("No die selected to update.");
      return;
    }
    try {
      const response = await fetch(
        `https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/edit_die/${selectedDie.DieId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(editData),
        }
      );

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok || result.status !== "success") {
        throw new Error(result?.message || "Update failed");
      }

      // Update local dies state
      setDies((prev) =>
        prev.map((d) => (d.DieId === selectedDie.DieId ? result.data : d))
      );

      setEditMode(false);
      setSelectedDie(null);
      setError("");
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Error saving changes. Please try again.");
    }
  };

  if (loading) return <p className="info-text">Loading dies...</p>;
  if (error) return <p className="info-text error">{error}</p>;

  return (
    <div className="container">
      <div className="form-card table-card">
        <h2 className="form-title">All Dies</h2>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by Die Name..."
            className="search-bar"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="table-responsive">
          <table className="die-table">
            <thead>
              <tr>
                <th>Die Name</th>
                <th>Company</th>
                <th>Material</th>
                <th>Cavity</th>
                <th>Weight (kg)</th>
                <th>Production/hr</th>
                <th>Price/unit</th>
              </tr>
            </thead>
            <tbody>
              {currentDies.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "1rem" }}>
                    No dies found.
                  </td>
                </tr>
              ) : (
                currentDies.map((die) => (
                  <tr
                    key={die.DieId}
                    onClick={() => handleRowClick(die)}
                    className="clickable-row"
                  >
                    <td>{die.DieName}</td>
                    <td>{die.CompanyName}</td>
                    <td>{die.Materials}</td>
                    <td>{die.Cavity}</td>
                    <td>{die.Weight}</td>
                    <td>{die.Pro_hr_count}</td>
                    <td>{die.Price}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={handlePrev} disabled={currentPage === 1}>
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={handleNext} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal for selected die */}
      {selectedDie && (
        <div className="modal-overlay" onClick={() => setSelectedDie(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedDie(null)}>
              ✖
            </button>

            <h3>{editMode ? "Edit Die" : `${selectedDie.DieName} Details`}</h3>

            {error && <p className="error-text">{error}</p>}

            {editMode ? (
              <>
                <div className="detail-item">
                  <strong>Die Name:</strong>
                  <input
                    value={editData.DieName}
                    onChange={(e) =>
                      setEditData({ ...editData, DieName: e.target.value })
                    }
                  />
                </div>
                <div className="detail-item">
                  <strong>Company:</strong>
                  <input
                    value={editData.CompanyName}
                    onChange={(e) =>
                      setEditData({ ...editData, CompanyName: e.target.value })
                    }
                  />
                </div>
                <div className="detail-item">
                  <strong>Material:</strong>
                  <input
                    value={editData.Materials}
                    onChange={(e) =>
                      setEditData({ ...editData, Materials: e.target.value })
                    }
                  />
                </div>
                <div className="detail-item">
                  <strong>Cavity:</strong>
                  <input
                    type="number"
                    value={editData.Cavity}
                    onChange={(e) =>
                      setEditData({ ...editData, Cavity: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="detail-item">
                  <strong>Weight (kg):</strong>
                  <input
                    type="number"
                    value={editData.Weight}
                    onChange={(e) =>
                      setEditData({ ...editData, Weight: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="detail-item">
                  <strong>Production/hr:</strong>
                  <input
                    type="number"
                    value={editData.Pro_hr_count}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        Pro_hr_count: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="detail-item">
                  <strong>Price/unit:</strong>
                  <input
                    type="number"
                    value={editData.Price}
                    onChange={(e) =>
                      setEditData({ ...editData, Price: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="detail-actions">
                  <button className="save-btn" onClick={handleSaveEdit}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="detail-item">
                  <strong>Company:</strong> {selectedDie.CompanyName}
                </div>
                <div className="detail-item">
                  <strong>Material:</strong> {selectedDie.Materials}
                </div>
                <div className="detail-item">
                  <strong>Cavity:</strong> {selectedDie.Cavity}
                </div>
                <div className="detail-item">
                  <strong>Weight:</strong> {selectedDie.Weight} kg
                </div>
                <div className="detail-item">
                  <strong>Production/hr:</strong> {selectedDie.Pro_hr_count}
                </div>
                <div className="detail-item">
                  <strong>Price/unit:</strong> {selectedDie.Price}
                </div>

                <div className="detail-actions">
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setEditData(selectedDie);
                      setEditMode(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(selectedDie.DieId)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
