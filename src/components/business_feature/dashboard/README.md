# Business Dashboard Feature

This folder contains all code for the business owner dashboard. It is focused on features for users who manage attractions (not admin routes).

## Key Features
- View and manage own business profile
- View and manage own attractions
- View bookings for own attractions
- Register a new business
- Edit business details
- Add/edit/delete attractions
- View metrics (bookings, revenue, etc.)

## API Endpoints Used
- `/api/v1/business/profiles` (GET, PATCH)
- `/api/v1/business/registrations` (GET, POST)
- `/api/v1/attractions` (GET, POST, PATCH, DELETE)
- `/api/v1/bookings` (filtered by business/attraction)

## Not included
- No admin-only endpoints or features.
- No global user management.

---

Add all dashboard-related components, hooks, and logic for business owners here.