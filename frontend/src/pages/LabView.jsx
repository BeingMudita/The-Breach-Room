import React from "react";

export default function LabView({ lab }) {
  // lab.url comes from backend and is e.g. "http://lab1:5000"
  // For the browser, we want to open the host-mapped port (we expose lab to host on 5001).
  // We'll transform known internal URLs to host URLs:
  const mapLabUrlToHost = (url) => {
    // Simple mapping for lab1 -> localhost:5001
    if (!url) return "";
    // naive: replace docker service hostname "lab1:5000" with "localhost:5001"
    return url.replace("http://lab1:5000", "http://localhost:5001");
  };

  const iframeUrl = mapLabUrlToHost(lab.url);

  return (
    <div>
      <h2>{lab.title}</h2>
      <p>{lab.description}</p>
      <div style={{ border: "1px solid #ccc", borderRadius: 6, overflow: "hidden", height: 520 }}>
        <iframe
          title={lab.id}
          src={iframeUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
      <p style={{ marginTop: 8 }}>
        Tip: open the lab in a new tab if the iframe blocks alerts: <a href={iframeUrl} target="_blank" rel="noreferrer">{iframeUrl}</a>
      </p>
    </div>
  );
}
