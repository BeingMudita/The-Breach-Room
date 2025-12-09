import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import LabView from "./pages/LabView";
import { auth, loginWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (u) {
      console.log("SIGNED IN UID:", u.uid);
      // expose for quick console checks
      window.__FIREBASE_UID = u.uid;
    } else {
      console.log("SIGNED OUT");
      window.__FIREBASE_UID = null;
    }
  });
  return () => unsub();
}, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSelectedLab(null);
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: "20vh" }}>
        <h1>The Breach Room — Trainer</h1>
        <p>Sign in to access your training dashboard</p>
        <button onClick={handleLogin}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className="app-root" style={{ fontFamily: "Inter, Arial", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>The Breach Room — Trainer</h1>
        <div>
          <span style={{ marginRight: 12 }}>👤 {user.displayName}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {!selectedLab && <Dashboard onSelectLab={setSelectedLab} />}
      {selectedLab && (
        <div>
          <button onClick={() => setSelectedLab(null)} style={{ marginBottom: 10 }}>
            ← Back to dashboard
          </button>
           <LabView lab={selectedLab} user={user} />
        </div>
      )}
    </div>
  );
}
