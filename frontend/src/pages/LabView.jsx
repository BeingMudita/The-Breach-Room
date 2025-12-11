import React, { useState } from "react";
import { getIdToken } from "../firebase";

export default function LabView({ lab, user, onCompleted }) {
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("vuln"); // "vuln" or "fixed"

  const mapLabUrlToHost = (url, mode = "vuln") => {
    if (!url) return "";
    // Map internal container URLs to host URLs (host ports: 5001 lab1, 5002 lab2)
    if (url.startsWith("http://lab1:5000")) {
      return url.replace("http://lab1:5000", mode === "fixed" ? "http://localhost:5001/fixed" : "http://localhost:5001/");
    }
    if (url.startsWith("http://lab2:5000")) {
      return url.replace("http://lab2:5000", mode === "fixed" ? "http://localhost:5002/fixed" : "http://localhost:5002/");
    }
    // default: return url
    return url;
  };

  const iframeUrl = mapLabUrlToHost(lab.url, mode);

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
          lab_id: lab.id,
          completed: true,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      await res.json();
      setStatusMsg("Progress saved ✅");
      if (typeof onCompleted === "function") onCompleted();
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
      <p style={{ maxWidth: 760 }}>{lab.description}</p>

      <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
        <div>
          <label style={{ marginRight: 8 }}>
            <input type="radio" checked={mode === "vuln"} onChange={() => setMode("vuln")} /> Vulnerable demo
          </label>
          <label>
            <input type="radio" checked={mode === "fixed"} onChange={() => setMode("fixed")} /> Fixed / Safe demo
          </label>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => window.open(iframeUrl, "_blank")} style={{ marginRight: 8 }}>
            Open in new tab
          </button>
          <button onClick={markCompleted} disabled={busy}>{busy ? "Saving..." : "Mark completed"}</button>
        </div>
      </div>

      <div style={{ border: "1px solid #ccc", borderRadius: 6, overflow: "hidden", height: 520 }}>
        <iframe
          title={lab.id}
          src={iframeUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>

      <p style={{ marginTop: 10, color: "#555", fontSize: 14 }}>
        Tip: Use the <strong>vulnerable demo</strong> to experiment and find the weakness; switch to the
        <strong> fixed demo</strong> to see the secure code and explanation.
      </p>
    </div>
  );
}
