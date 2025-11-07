import React, { useEffect, useState } from "react";

export default function Dashboard({ onSelectLab }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("http://localhost:8000/labs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLabs(data);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading labs…</p>;
  if (err) return <p style={{ color: "red" }}>Error: {err}</p>;

  return (
    <div>
      <h2>Available Labs</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {labs.map((lab) => (
          <li key={lab.id} style={{ marginBottom: 12, border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
            <h3 style={{ margin: 0 }}>{lab.title}</h3>
            <p style={{ marginTop: 6 }}>{lab.description}</p>
            <button onClick={() => onSelectLab(lab)} aria-label={`Open ${lab.title}`}>
              Launch lab
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
