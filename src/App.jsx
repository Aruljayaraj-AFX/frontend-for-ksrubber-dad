import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

// Pages
import HomePage from "./pages/HomePage";
import ProductionPage from "./pages/ProductionPage";
import DiePage from "./pages/DiePage";
import ProductionDetailsPage from "./pages/ProductionDetailsPage";
import DieDetailsPage from "./pages/DieDetailsPage";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <Router>
      <nav className="navbar">
        {/* Logo */}
        <div className="navbar-logo">AFX</div>

        {/* Hamburger */}
        <div
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Links */}
        <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <li>
            <Link to="/" onClick={() => setMenuOpen(false)}>
              <i className="fas fa-home"></i> Home
            </Link>
          </li>
          <li>
            <Link to="/production" onClick={() => setMenuOpen(false)}>
              <i className="fas fa-info-circle"></i> Production
            </Link>
          </li>
          <li>
            <Link to="/die" onClick={() => setMenuOpen(false)}>
              <i className="fas fa-cog"></i> Die
            </Link>
          </li>
          <li>
            <Link to="/production-details" onClick={() => setMenuOpen(false)}>
              <i className="fas fa-table"></i> Production Details
            </Link>
          </li>
          <li>
            <Link to="/die-details" onClick={() => setMenuOpen(false)}>
              <i className="fas fa-list"></i> Die Details
            </Link>
          </li>
        </ul>

        {/* Logout button */}
        <button className="logout-btn">Logout</button>
      </nav>

      {/* Main content */}
      <main className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/die" element={<DiePage />} />
          <Route path="/production-details" element={<ProductionDetailsPage />} />
          <Route path="/die-details" element={<DieDetailsPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
