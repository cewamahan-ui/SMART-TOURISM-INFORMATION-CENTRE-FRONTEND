import React from "react";

function MetricsPanel({ metrics }) {
  // Only re-render if metrics change
  return (
    <div className="metrics-panel">
      <h2>Business Metrics</h2>
      <ul>
        <li>Registrations: {metrics.registrations}</li>
        <li>Bookings: {metrics.bookings}</li>
        <li>Revenue: ${metrics.revenue}</li>
      </ul>
    </div>
  );
}

export default React.memo(MetricsPanel);
