import { businessApi, attractionsApi, feedbackApi, destinationsApi } from "@/lib/api";

// GET /api/v1/business/profiles
// Returns {"profile": {...}} when found, or [] when not found
export async function getBusinessProfile() {
  try {
    const result = await businessApi.profiles.list();
    if (Array.isArray(result)) return null;         // [] means no profile
    if (result?.profile) return result.profile;     // {"profile": {...}}
    return null;
  } catch {
    return null;
  }
}

// GET /api/v1/business/registrations
// Returns {"registration": {...}} or []
export async function getRegistrationStatus() {
  try {
    const result = await businessApi.registrations.list();
    if (Array.isArray(result)) return null;
    if (result?.registration) return result.registration;
    return null;
  } catch {
    return null;
  }
}

export async function getDestinations() {
  try {
    const result = await destinationsApi.list();
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  } catch {
    return [];
  }
}

// Fetch attractions owned by this business profile
// include_all=true lets the owner see draft/pending attractions too
export async function getAttractions(businessProfileId) {
  try {
    const result = await attractionsApi.list({ include_all: "true", per_page: 100 });
    let items = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
    if (businessProfileId) {
      return items.filter((a) => String(a.business_owner_id) === String(businessProfileId));
    }
    return items;
  } catch {
    return [];
  }
}

export async function getAttractionReviews(attractionId) {
  try {
    const result = await feedbackApi.reviews.list({ target_type: "attraction", target_id: attractionId });
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  } catch {
    return [];
  }
}

// Bookings FOR this business owner's attractions (not the owner's own tourist bookings)
export async function getBusinessBookings() {
  try {
    const result = await businessApi.bookings.list();
    if (Array.isArray(result?.bookings)) return result.bookings;
    if (Array.isArray(result)) return result;
    return [];
  } catch {
    return [];
  }
}
