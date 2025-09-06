import { useState } from "react";
import "./AddDieForm.css";

export default function AddDieForm() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    material: "",
    cavity: "",
    weight: "",
    productionPerHour: "",
    price: "",
  });

  const [message, setMessage] = useState(""); // feedback message

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      DieName: form.name,
      CompanyName: form.company,
      Materials: form.material,
      Cavity: Number(form.cavity),
      Weight: Number(form.weight),
      Pro_hr_count: Number(form.productionPerHour),
      Price: Number(form.price),
    };

    try {
      const response = await fetch(
        "https://ksrubber-backend.onrender.com/afx/pro_ksrubber/v1/add_die",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add die");
      }

      const data = await response.json();
      console.log("API response:", data);

      // show success message
      setMessage(`Successfully Added! Die ID: ${data.DieId}`);
      // reset form
      setForm({
        name: "",
        company: "",
        material: "",
        cavity: "",
        weight: "",
        productionPerHour: "",
        price: "",
      });
    } catch (error) {
      console.error(error);
      setMessage("Error adding die. Please try again.");
    }
  };

  return (
    <div className="container">
      <div className="form-card">
        <h2 className="form-title">Add New Die</h2>
        <form onSubmit={handleSubmit}>
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
          <div className="form-group">
            <label htmlFor="cavity">Cavity</label>
            <input
              id="cavity"
              type="number"
              name="cavity"
              value={form.cavity}
              onChange={handleChange}
              placeholder="e.g. 4"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              id="weight"
              type="number"
              step="0.01"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="Enter weight"
            />
          </div>


          <div className="form-group">
            <label htmlFor="company">Company Name</label>
            <input
              id="company"
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Enter company name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="material">Material Name</label>
            <input
              id="material"
              type="text"
              name="material"
              value={form.material}
              onChange={handleChange}
              placeholder="Material"
            />
          </div>

          
          <div className="form-group">
            <label htmlFor="productionPerHour">Production per Hour</label>
            <input
              id="productionPerHour"
              type="number"
              name="productionPerHour"
              value={form.productionPerHour}
              onChange={handleChange}
              placeholder="Units per hour"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price per Unit</label>
            <input
              id="price"
              type="number"
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
