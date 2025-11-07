import React, { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import LabView from "./pages/LabView";

export default function App() {
  const [selectedLab, setSelectedLab] = useState(null);

  return (
    <div className="app-root" style={{ fontFamily: "Inter, Arial", padding: 20 }}>
      <h1>The Breach Room — Trainer</h1>
      {!selectedLab && <Dashboard onSelectLab={setSelectedLab} />}
      {selectedLab && (
        <div>
          <button onClick={() => setSelectedLab(null)} style={{ marginBottom: 10 }}>
            ← Back to dashboard
          </button>
          <LabView lab={selectedLab} />
        </div>
      )}
    </div>
  );
}
