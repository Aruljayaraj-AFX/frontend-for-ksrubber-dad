import { useState } from "react";
import "./App.css";

import Production from "./components/Production";
import AddDieForm from "./components/AddDieForm";
import DieTable from "./components/DieTable";
import ProductionList from "./components/ProductionList";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState(""); // Track which component to show

  const renderComponent = () => {
    switch (activeComponent) {
      case "production":
        return <Production />;
      case "die":
        return <AddDieForm />;
      case "productionDetails":
        return <ProductionList />;
      case "dieDetails":
        return <DieTable />;
      default:
        return <div className="empty-state"></div>;
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">AFX</div>

        {/* Hamburger for mobile/tablet */}
        <div
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Nav links */}
        <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <li onClick={() => setActiveComponent("production")}>
            <a href="#">
              <i className="fas fa-info-circle"></i> Production
            </a>
          </li>
          <li onClick={() => setActiveComponent("die")}>
            <a href="#">
              <i className="fas fa-cog"></i> Die
            </a>
          </li>
          <li onClick={() => setActiveComponent("productionDetails")}>
            <a href="#">
              <i className="fas fa-table"></i> Production Details
            </a>
          </li>
          <li onClick={() => setActiveComponent("dieDetails")}>
            <a href="#">
              <i className="fas fa-list"></i> Die Details
            </a>
          </li>
        </ul>

        {/* Logout button */}
        <button className="logout-btn">Logout</button>
      </nav>

      {/* Main content */}
      <main className="main-content">{renderComponent()}</main>
    </>
  );
}

export default App;
