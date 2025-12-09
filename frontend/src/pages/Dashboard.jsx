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
    // Fetch progress when user is available OR when refreshKey changes
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
      <ul style={{ listStyle: "none", padding: 0 }}>
        {labs.map((lab) => {
          const labProg = progress[lab.id];
          const completed = labProg ? labProg.completed : false;
          return (
            <li key={lab.id} style={{ marginBottom: 12, border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{lab.title}</h3>
                  <p style={{ marginTop: 6 }}>{lab.description}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  {loadingProg ? (
                    <div>Loading status…</div>
                  ) : (
                    <>
                      {completed ? (
                        <span style={{ display: "inline-block", padding: "6px 10px", background: "#e6ffed", borderRadius: 6, color: "#04660d" }}>
                          ✅ Completed
                        </span>
                      ) : (
                        <span style={{ display: "inline-block", padding: "6px 10px", background: "#fff3cd", borderRadius: 6, color: "#6a4a00" }}>
                          ⏳ Not completed
                        </span>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => onSelectLab(lab)}>Launch lab</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
