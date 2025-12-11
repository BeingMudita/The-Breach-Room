import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import LabView from "./pages/LabView";
import { auth, loginWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getIdToken } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);

  // user stats
  const [stats, setStats] = useState({ xp: 0, streak: 0, level: 0 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        window.__FIREBASE_UID = u.uid;
        // fetch stats after sign in
        try {
          const token = await getIdToken();
          const res = await fetch(`http://localhost:8000/user/stats/${u.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setStats(data.stats || { xp: 0, streak: 0, level: 0 });
          }
        } catch (e) {
          console.error("Failed to fetch stats", e);
        }
      } else {
        window.__FIREBASE_UID = null;
        setStats({ xp:0, streak:0, level:0 });
      }
    });
    return () => unsub();
  }, []);

  // refresh stats when progressRefreshKey increments
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const token = await getIdToken();
        const res = await fetch(`http://localhost:8000/user/stats/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || { xp: 0, streak: 0, level: 0 });
        }
      } catch (e) {
        console.error("Failed to refresh stats", e);
      }
    })();
  }, [progressRefreshKey]);

  const handleLogin = async () => {
    try { await loginWithGoogle(); } catch (err) { console.error(err); }
  };
  const handleLogout = async () => { await logout(); setSelectedLab(null); setStats({ xp:0, streak:0, level:0 }); };

  const handleLabCompleted = () => {
    setProgressRefreshKey(k => k + 1);
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: "20vh" }}>
        <h1 style={{ fontFamily: "Boldonse, Poppins, serif", color: "#355e3b" }}>The Breach Room</h1>
        <p>Sign in to access your gamified secure-coding trainer</p>
        <button onClick={handleLogin}>Sign in with Google</button>
      </div>
    );
  }

  // derive xp progress %
  const xp = stats.xp || 0;
  const level = stats.level || Math.floor(xp/100);
  const xpForLevel = (xp % 100);
  const xpPercent = Math.min(100, Math.round((xpForLevel / 100) * 100));

  return (
    <div className="app-root">
      <div className="header">
        <div className="brand">
          <div className="title">The Breach Room</div>
          <div className="subtitle">Learn secure coding by doing — gamified</div>
        </div>

        <div className="stats-bar">
          <div className="streak-badge card">
            🔥 {stats.streak || 0} day streak
          </div>

          <div>
            <div style={{ fontSize:12, color:"#444", marginBottom:6 }}>Level {level} • XP {xp}</div>
            <div className="xp-container card" style={{ width:260 }}>
              <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>

          <div style={{ marginLeft: 12 }}>
            <button className="secondary" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      {!selectedLab && <Dashboard onSelectLab={setSelectedLab} user={user} refreshKey={progressRefreshKey} />}
      {selectedLab && (
        <div>
          <button onClick={() => setSelectedLab(null)} style={{ marginBottom: 10 }}>
            ← Back to dashboard
          </button>
          <LabView lab={selectedLab} user={user} onCompleted={handleLabCompleted} />
        </div>
      )}
    </div>
  );
}
