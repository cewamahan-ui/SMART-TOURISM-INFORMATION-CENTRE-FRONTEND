import React from "react";
import { FixedSizeList as List } from "react-window";

function Row({ index, style, data }) {
  const booking = data[index];
  return (
    <div style={style} className="booking-row">
      <span>{booking.reference_number}</span>
      <span>{booking.status}</span>
      <span>${booking.total_cost}</span>
    </div>
  );
}

function BookingsPanel({ bookings }) {
  // Virtualize large lists for performance
  return (
    <div className="bookings-panel">
      <h2>Recent Bookings</h2>
      <List
        height={300}
        itemCount={bookings.length}
        itemSize={40}
        width={"100%"}
        itemData={bookings}
      >
        {Row}
      </List>
    </div>
  );
}

export default React.memo(BookingsPanel);
