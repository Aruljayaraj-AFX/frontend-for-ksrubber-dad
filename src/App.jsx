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

  // Components order for swipe navigation
  const componentOrder = ["home", "production", "die", "productionDetails", "dieDetails"];

  // Swipe tracking
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Close menu when clicking outside
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

  // Handle swipe gesture
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const threshold = 50; // minimum distance for swipe

    const currentIndex = componentOrder.indexOf(activeComponent);

    if (deltaX < -threshold && currentIndex < componentOrder.length - 1) {
      // Swipe left → next component
      setActiveComponent(componentOrder[currentIndex + 1]);
    } else if (deltaX > threshold && currentIndex > 0) {
      // Swipe right → previous component
      setActiveComponent(componentOrder[currentIndex - 1]);
    }
  };

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

  const handleNavClick = (component) => {
    setActiveComponent(component);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar" ref={navRef}>
        <div className="navbar-logo">AFX</div>

        <div
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

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

        <button className="logout-btn">Logout</button>
      </nav>

      {/* Main Content with swipe handlers */}
      <main
        className="main-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {renderComponent()}
      </main>
    </>
  );
}

export default App;
