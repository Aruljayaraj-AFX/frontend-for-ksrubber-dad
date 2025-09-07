import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

// Pages
import HomePage from "./pages/HomePage";
import ProductionPage from "./pages/ProductionPage";
import DiePage from "./pages/DiePage";
import ProductionDetailsPage from "./pages/ProductionDetailsPage";
import DieDetailsPage from "./pages/DieDetailsPage";

function App() {
  return (
    <Router>
      <nav className="navbar">
        <div className="navbar-logo">AFX</div>

        {/* Nav Links */}
        <ul className="navbar-links">
          <li>
            <Link to="/"><i className="fas fa-home"></i> Home</Link>
          </li>
          <li>
            <Link to="/production"><i className="fas fa-info-circle"></i> Production</Link>
          </li>
          <li>
            <Link to="/die"><i className="fas fa-cog"></i> Die</Link>
          </li>
          <li>
            <Link to="/production-details"><i className="fas fa-table"></i> Production Details</Link>
          </li>
          <li>
            <Link to="/die-details"><i className="fas fa-list"></i> Die Details</Link>
          </li>
        </ul>

        {/* Logout button */}
        <button className="logout-btn">Logout</button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
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
