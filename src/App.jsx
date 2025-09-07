import { useState, useEffect, useRef } from "react";
import "./App.css";

import Production from "./components/Production";
import AddDieForm from "./components/AddDieForm";
import DieTable from "./components/DieTable";
import ProductionList from "./components/ProductionList";
import CurrentMonthSummary from "./components/CurrentMonthSummary";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("home");
  const navRef = useRef(null);

  // ✅ Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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
      case "home":
      default:
        return <CurrentMonthSummary />;
    }
  };

  // ✅ Helper to change component & close menu
  const handleNavClick = (component) => {
    setActiveComponent(component);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar" ref={navRef}>
        <div className="navbar-logo">AFX</div>

        {/* Hamburger for mobile */}
        <div
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Nav Links */}
        <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <li onClick={() => handleNavClick("home")}>
            <a href="#"><i className="fas fa-home"></i> Home</a>
          </li>
          <li onClick={() => handleNavClick("production")}>
            <a href="#"><i className="fas fa-info-circle"></i> Production</a>
          </li>
          <li onClick={() => handleNavClick("die")}>
            <a href="#"><i className="fas fa-cog"></i> Die</a>
          </li>
          <li onClick={() => handleNavClick("productionDetails")}>
            <a href="#"><i className="fas fa-table"></i> Production Details</a>
          </li>
          <li onClick={() => handleNavClick("dieDetails")}>
            <a href="#"><i className="fas fa-list"></i> Die Details</a>
          </li>
        </ul>

        {/* Logout button */}
        <button className="logout-btn">Logout</button>
      </nav>

      {/* Main Content */}
      <main className="main-content">{renderComponent()}</main>
    </>
  );
}

export default App;
