import React, { useEffect, useState } from "react";
import { getIdToken } from "../firebase";

export default function Dashboard({ onSelectLab, user, refreshKey }) {
  const [labs, setLabs] = useState([]);
  const [progress, setProgress] = useState({});
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingProg, setLoadingProg] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function loadLabs() {
      setLoadingLabs(true);
      try {
        const res = await fetch("http://localhost:8000/labs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLabs(data);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoadingLabs(false);
      }
    }
    loadLabs();
  }, []);

  useEffect(() => {
    async function loadProgress() {
      if (!user) return;
      setLoadingProg(true);
      try {
        const token = await getIdToken();
        const res = await fetch(`http://localhost:8000/progress/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProgress(data.progress || {});
      } catch (e) {
        console.error("Failed to load progress", e);
        setProgress({}); // fallback
      } finally {
        setLoadingProg(false);
      }
    }
    loadProgress();
  }, [user, refreshKey]);

  if (loadingLabs) return <p>Loading labs…</p>;
  if (err) return <p style={{ color: "red" }}>Error: {err}</p>;

  return (
    <div>
      <h2>Available Labs</h2>

      <div className="labs-grid">
        {labs.map((lab) => {
          const labProg = progress[lab.id];
          const completed = labProg ? !!labProg.completed : false;

          return (
            <div className="card lab-card" key={lab.id}>
              <h3>{lab.title}</h3>
              <p>{lab.description}</p>
              <div style={{ marginTop: 10 }}>
                {completed ? <span>✅ Completed</span> : <span>⏳ Not completed</span>}
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => onSelectLab(lab)}>Launch lab</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
