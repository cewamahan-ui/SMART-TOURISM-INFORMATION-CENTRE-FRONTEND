import React from "react";

function AttractionsPanel({ attractions, onStatusChange }) {
  return (
    <div className="attractions-panel">
      <h2>Attractions</h2>
      <ul>
        {attractions.map((a) => (
          <li key={a.id}>
            {a.name} - {a.status}
            <button onClick={() => onStatusChange(a.id, "approved")}>Approve</button>
            <button onClick={() => onStatusChange(a.id, "rejected")}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default React.memo(AttractionsPanel);
