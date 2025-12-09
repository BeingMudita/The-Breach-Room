import React, { useState } from "react";
import { getIdToken } from "../firebase";

export default function LabView({ lab, user }) {
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const mapLabUrlToHost = (url) => {
    if (!url) return "";
    return url.replace("http://lab1:5000", "http://localhost:5001");
  };

  const iframeUrl = mapLabUrlToHost(lab.url);

  const markCompleted = async () => {
  if (!user) {
    setStatusMsg("You must be signed in.");
    return;
  }
  setBusy(true);
  setStatusMsg("");
  try {
    const idToken = await getIdToken();
    const res = await fetch("http://localhost:8000/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        // user_id is optional; backend uses verified uid
        lab_id: lab.id,
        completed: true,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    const data = await res.json();
    setStatusMsg("Progress saved ✅");
  } catch (err) {
    console.error("Save failed", err);
    setStatusMsg("Save failed: " + (err.message || err));
  } finally {
    setBusy(false);
  }
};

  return (
    <div>
      <h2>{lab.title}</h2>
      <p>{lab.description}</p>

      <div style={{ marginBottom: 8 }}>
        <button onClick={() => window.open(iframeUrl, "_blank")} style={{ marginRight: 8 }}>
          Open lab in new tab
        </button>
        <button onClick={markCompleted} disabled={busy}>
          {busy ? "Saving..." : "Mark completed"}
        </button>
        <span style={{ marginLeft: 12 }}>{statusMsg}</span>
      </div>

      <div style={{ border: "1px solid #ccc", borderRadius: 6, overflow: "hidden", height: 520 }}>
        <iframe
          title={lab.id}
          src={iframeUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    </div>
  );
}
