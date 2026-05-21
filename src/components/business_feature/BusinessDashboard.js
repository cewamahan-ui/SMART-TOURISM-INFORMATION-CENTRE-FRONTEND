import React, { Suspense, lazy, useMemo, useCallback } from "react";

// Code splitting for heavy subcomponents
const MetricsPanel = lazy(() => import("./MetricsPanel"));
const BookingsPanel = lazy(() => import("./BookingsPanel"));
const AttractionsPanel = lazy(() => import("./AttractionsPanel"));

function BusinessDashboard({ metrics, bookings, attractions, onStatusChange }) {
  // Memoize expensive calculations
  const sortedBookings = useMemo(() => {
    return bookings.slice().sort((a, b) => b.date - a.date);
  }, [bookings]);

  // Memoize callback to avoid unnecessary re-renders
  const handleStatusChange = useCallback((id, status) => {
    onStatusChange(id, status);
  }, [onStatusChange]);

  return (
    <div>
      <Suspense fallback={<div>Loading metrics...</div>}>
        <MetricsPanel metrics={metrics} />
      </Suspense>
      <Suspense fallback={<div>Loading bookings...</div>}>
        <BookingsPanel bookings={sortedBookings} />
      </Suspense>
      <Suspense fallback={<div>Loading attractions...</div>}>
        <AttractionsPanel attractions={attractions} onStatusChange={handleStatusChange} />
      </Suspense>
    </div>
  );
}

export default React.memo(BusinessDashboard);
