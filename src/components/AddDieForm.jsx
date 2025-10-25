import { useState, useEffect } from "react";
import "./AddDieForm.css";

export default function AddDieForm() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    material: "",
    cavity: "",
    weight: "",
    productionPerHour: "",
    price: 38, // ✅ default price
  });

  const [companies, setCompanies] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [customCompany, setCustomCompany] = useState("");
  const [customMaterial, setCustomMaterial] = useState("");
  const [message, setMessage] = useState("");

  // 🔹 Fetch dies on mount
  const fetchDies = async () => {
    try {
      const response = await fetch(
        "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/get_all_die"
      );
      if (!response.ok) throw new Error("Failed to fetch dies");
      const data = await response.json();

      if (data.status === "success") {
        const dies = data.data;
        setCompanies([
          ...new Set(dies.map((d) => d.CompanyName).filter(Boolean)),
        ]);
        setMaterials([
          ...new Set(dies.map((d) => d.Materials).filter(Boolean)),
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDies();
  }, []);

  // 🔹 Auto scroll to bottom whenever message changes
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      DieName: form.name,
      CompanyName: form.company === "__custom__" ? customCompany : form.company,
      Materials: form.material === "__custom__" ? customMaterial : form.material,
      Cavity: Number(form.cavity),
      Weight: Number(form.weight),
      Pro_hr_count: Number(form.productionPerHour),
      Price: Number(form.price),
    };

    try {
      const response = await fetch(
        "https://ksrubber-backend.vercel.app/afx/pro_ksrubber/v1/add_die",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to add die");

      const data = await response.json();
      setMessage(`✅ Successfully Added! Die ID: ${data.DieId}`);

      // reset form (keep default price = 38)
      setForm({
        name: "",
        company: "",
        material: "",
        cavity: "",
        weight: "",
        productionPerHour: "",
        price: 38,
      });
      setCustomCompany("");
      setCustomMaterial("");

      // 🔹 Instead of reload → refresh dropdowns
      fetchDies();

      setTimeout(() => setMessage(""), 10000);
    } catch (error) {
      console.error(error);
      setMessage("❌ Error adding die. Please try again.");
    }
  };

  return (
    <div className="container">
      <div className="form-card">
        <h2 className="form-title">Add New Die</h2>
        <form onSubmit={handleSubmit}>
          {/* Die Name */}
          <div className="form-group">
            <label htmlFor="name">Die Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter die name"
              required
            />
          </div>

          {/* Cavity */}
          <div className="form-group">
            <label htmlFor="cavity">Cavity</label>
            <input
              id="cavity"
              type="number"
              min="0"
              name="cavity"
              value={form.cavity}
              onChange={handleChange}
              placeholder="e.g. 4"
              required
            />
          </div>

          {/* Weight */}
          <div className="form-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              id="weight"
              type="number"
              min="0"
              step="0.01"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="Enter weight"
            />
          </div>

          {/* Material */}
          <div className="form-group">
            <label htmlFor="material">Material Name</label>
            <select
              id="material"
              name="material"
              value={form.material}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Material --</option>
              {materials.map((m, i) => (
                <option key={i} value={m}>
                  {m}
                </option>
              ))}
              <option value="__custom__">Other (Type manually)</option>
            </select>

            {form.material === "__custom__" && (
              <input
                type="text"
                placeholder="Enter new material"
                value={customMaterial}
                onChange={(e) => setCustomMaterial(e.target.value)}
                required
              />
            )}
          </div>

          {/* Company */}
          <div className="form-group">
            <label htmlFor="company">Company Name</label>
            <select
              id="company"
              name="company"
              value={form.company}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Company --</option>
              {companies.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
              <option value="__custom__">Other (Type manually)</option>
            </select>

            {form.company === "__custom__" && (
              <input
                type="text"
                placeholder="Enter new company"
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                required
              />
            )}
          </div>

          {/* Production per Hour */}
          <div className="form-group">
            <label htmlFor="productionPerHour">Production per Hour</label>
            <input
              id="productionPerHour"
              type="number"
              min="0"
              name="productionPerHour"
              value={form.productionPerHour}
              onChange={handleChange}
              placeholder="Units per hour"
              required
            />
          </div>

          {/* Price */}
          <div className="form-group">
            <label htmlFor="price">Price per Unit</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="₹ per unit"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Save Die
          </button>
        </form>

        {message && <p className="success-message">{message}</p>}
      </div>
    </div>
  );
}
