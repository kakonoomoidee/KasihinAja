import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PublicProfile from "./pages/PublicProfile";
import Dashboard from "./pages/Dashboard";
import AlertOverlay from "./pages/AlertOverlay";
import MilestoneOverlay from "./pages/MilestoneOverlay";

/**
 * Top-level application router mounting distinct modes seamlessly.
 *
 * @returns {React.ReactElement} The active router tree matching contexts.
 */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/overlay/alert/:streamerAddress" element={<AlertOverlay />} />
        <Route path="/overlay/milestone/:streamerAddress" element={<MilestoneOverlay />} />
        <Route path="/overlay/:streamerAddress" element={<AlertOverlay />} />
        <Route path="/:streamerAddress" element={<PublicProfile />} />
      </Routes>
    </Router>
  );
}
