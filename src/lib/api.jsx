// Smart Tourism API client. Configure backend via VITE_API_BASE_URL.
const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";
const TOKEN_KEY = "sts_access_token";
export function getToken() {
    if (typeof window === "undefined")
        return null;
    return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
    if (typeof window === "undefined")
        return;
    if (token)
        localStorage.setItem(TOKEN_KEY, token);
    else
        localStorage.removeItem(TOKEN_KEY);
}
export async function api(path, init = {}) {
    const headers = new Headers(init.headers);
    if (init.json !== undefined) {
        headers.set("Content-Type", "application/json");
        init.body = JSON.stringify(init.json);
    }
    const token = getToken();
    if (token)
        headers.set("Authorization", `Bearer ${token}`);
    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    let res;
    try {
        res = await fetch(url, { ...init, headers });
    }
    catch (e) {
        throw {
            status: 0,
            message: "Cannot reach API. Is the backend running?",
        };
    }
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
        throw {
            status: res.status,
            message: (data && (data.message || data.error)) || res.statusText,
            details: data,
        };
    }
    return unwrapSuccessPayload(data);
}
function safeJson(t) {
    try {
        return JSON.parse(t);
    }
    catch {
        return t;
    }
}
function unwrapSuccessPayload(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return data;
    }
    if (data.success === true && Object.prototype.hasOwnProperty.call(data, "data")) {
        return data.data;
    }
    return data;
}
function normalizeSignupPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return payload;
    }
    const { full_name, username, ...rest } = payload;
    return {
        ...rest,
        ...(username || full_name ? { username: username ?? full_name } : {}),
    };
}
export const auth = {
    login: (email, password) => api("/api/v1/auth/login", {
        method: "POST",
        json: { email, password },
    }),
    register: (payload) => api("/api/v1/auth/signup", { method: "POST", json: normalizeSignupPayload(payload) }),
    me: () => api("/api/v1/auth/me"),
};

// ── Auth ────────────────────────────────────────────────────────────
export const authApi = {
    signup: (payload) => api("/api/v1/auth/signup", { method: "POST", json: normalizeSignupPayload(payload) }),
    login: (email, password) => api("/api/v1/auth/login", { method: "POST", json: { email, password } }),
    logout: (refreshToken, revokeAll = false) => api("/api/v1/auth/logout", { method: "POST", json: { refresh_token: refreshToken, revoke_all: revokeAll } }),
    me: () => api("/api/v1/auth/me", { method: "GET" }),
    refresh: () => api("/api/v1/auth/refresh", { method: "POST" }),
    passwordReset: (email) => api("/api/v1/auth/password-reset", { method: "POST", json: { email } }),
    passwordResetConfirm: (resetToken, newPassword) => api("/api/v1/auth/password-reset/confirm", { method: "POST", json: { reset_token: resetToken, new_password: newPassword } }),
    googleAuthorize: () => api("/api/v1/auth/authorize/google", { method: "GET" }),
    googleLogin: () => api("/api/v1/auth/login/google", { method: "GET" }),
};

// ── Destinations ────────────────────────────────────────────────────
export const destinationsApi = {
    list: () => api("/api/v1/destinations/", { method: "GET" }),
    get: (id) => api(`/api/v1/destinations/${id}`, { method: "GET" }),
    create: (payload) => api("/api/v1/destinations/", { method: "POST", json: payload }),
    update: (id, payload) => api(`/api/v1/destinations/${id}`, { method: "PATCH", json: payload }),
    delete: (id) => api(`/api/v1/destinations/${id}`, { method: "DELETE" }),
    translations: {
        list: () => api("/api/v1/destination-translations/", { method: "GET" }),
        get: (destinationId, locale) => api(`/api/v1/destination-translations/${destinationId}/${locale}`, { method: "GET" }),
        create: (payload) => api("/api/v1/destination-translations/", { method: "POST", json: payload }),
        update: (destinationId, locale, payload) => api(`/api/v1/destination-translations/${destinationId}/${locale}`, { method: "PATCH", json: payload }),
        delete: (destinationId, locale) => api(`/api/v1/destination-translations/${destinationId}/${locale}`, { method: "DELETE" }),
    },
    info: (destinationId) => api(`/api/public/destinations/${destinationId}/info`, { method: "GET" }),
};

// ── Attractions ────────────────────────────────────────────────────
export const attractionsApi = {
    list: (params) => {
        const qs = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
        return api(`/api/v1/attractions/${qs}`, { method: "GET" });
    },
    get: (id) => api(`/api/v1/attractions/${id}`, { method: "GET" }),
    create: (payload) => api("/api/v1/attractions/", { method: "POST", json: payload }),
    update: (id, payload) => api(`/api/v1/attractions/${id}`, { method: "PATCH", json: payload }),
    delete: (id) => api(`/api/v1/attractions/${id}`, { method: "DELETE" }),
    translations: {
        list: () => api("/api/v1/attraction-translations/", { method: "GET" }),
        get: (attractionId, locale) => api(`/api/v1/attraction-translations/${attractionId}/${locale}`, { method: "GET" }),
        create: (payload) => api("/api/v1/attraction-translations/", { method: "POST", json: payload }),
        update: (attractionId, locale, payload) => api(`/api/v1/attraction-translations/${attractionId}/${locale}`, { method: "PATCH", json: payload }),
        delete: (attractionId, locale) => api(`/api/v1/attraction-translations/${attractionId}/${locale}`, { method: "DELETE" }),
    },
    amenities: {
        list: (attractionId) => api(`/api/v1/attraction-amenities/`, { method: "GET" }),
        create: (payload) => api("/api/v1/attraction-amenities/", { method: "POST", json: payload }),
        delete: (attractionId, amenityId) => api(`/api/v1/attraction-amenities/${attractionId}/${amenityId}`, { method: "DELETE" }),
    },
};

// ── Amenities ────────────────────────────────────────────────────
export const amenitiesApi = {
    list: () => api("/api/v1/amenities/", { method: "GET" }),
    get: (id) => api(`/api/v1/amenities/${id}`, { method: "GET" }),
    create: (payload) => api("/api/v1/amenities/", { method: "POST", json: payload }),
    update: (id, payload) => api(`/api/v1/amenities/${id}`, { method: "PATCH", json: payload }),
    delete: (id) => api(`/api/v1/amenities/${id}`, { method: "DELETE" }),
};

// ── Itineraries ────────────────────────────────────────────────────
export const itinerariesApi = {
    list: () => api("/api/v1/itineraries", { method: "GET" }),
    get: (id) => api(`/api/v1/itineraries/${id}`, { method: "GET" }),
    create: (payload) => api("/api/v1/itineraries", { method: "POST", json: payload }),
    update: (id, payload) => api(`/api/v1/itineraries/${id}`, { method: "PATCH", json: payload }),
    delete: (id) => api(`/api/v1/itineraries/${id}`, { method: "DELETE" }),
    publish: (id) => api(`/api/v1/itineraries/${id}/publish`, { method: "POST" }),
    generateQr: (id) => api(`/api/v1/itineraries/${id}/qr`, { method: "POST" }),
    getPublic: (token) => api(`/api/v1/public/itineraries/${token}`, { method: "GET" }),
    generate: (payload) => api("/api/v1/itineraries/generate", { method: "POST", json: payload }),
};

// ── Bookings ────────────────────────────────────────────────────
export const bookingsApi = {
    list: () => api("/api/v1/bookings", { method: "GET" }),
    get: (id) => api(`/api/v1/bookings/${id}`, { method: "GET" }),
    create: (payload) => api("/api/v1/bookings", { method: "POST", json: payload }),
    cancel: (id) => api(`/api/v1/bookings/${id}/cancel`, { method: "PATCH" }),
    generateQr: (id) => api(`/api/v1/bookings/${id}/qr`, { method: "POST" }),
    adminList: () => api("/api/v1/admin/bookings", { method: "GET" }),
    createTour: (payload) => api("/api/v1/bookings/tour", { method: "POST", json: payload }),
};

// ── QR Codes ────────────────────────────────────────────────────
export const qrCodesApi = {
    adminList: () => api("/api/v1/admin/qr-codes", { method: "GET" }),
    adminGet: (id) => api(`/api/v1/admin/qr-codes/${id}`, { method: "GET" }),
    adminRegenerate: (id) => api(`/api/v1/admin/qr-codes/${id}/regenerate`, { method: "POST" }),
    adminRevoke: (id) => api(`/api/v1/admin/qr-codes/${id}/revoke`, { method: "POST" }),
    scan: (token) => api(`/api/v1/public/qr/${token}/scan`, { method: "GET" }),
};

// ── Roles & Permissions ────────────────────────────────────────────────────
export const rbacApi = {
    roles: {
        list: () => api("/api/v1/roles", { method: "GET" }),
        get: (id) => api(`/api/v1/roles/${id}`, { method: "GET" }),
        create: (payload) => api("/api/v1/roles", { method: "POST", json: payload }),
        update: (id, payload) => api(`/api/v1/roles/${id}`, { method: "PUT", json: payload }),
        delete: (id) => api(`/api/v1/roles/${id}`, { method: "DELETE" }),
    },
    permissions: {
        list: () => api("/api/v1/permissions", { method: "GET" }),
        get: (id) => api(`/api/v1/permissions/${id}`, { method: "GET" }),
        create: (payload) => api("/api/v1/permissions", { method: "POST", json: payload }),
        update: (id, payload) => api(`/api/v1/permissions/${id}`, { method: "PUT", json: payload }),
        delete: (id) => api(`/api/v1/permissions/${id}`, { method: "DELETE" }),
    },
    rolePermissions: {
        create: (payload) => api("/api/v1/role-permissions", { method: "POST", json: payload }),
    },
    userRoles: {
        list: () => api("/api/v1/user-roles", { method: "GET" }),
        create: (payload) => api("/api/v1/user-roles", { method: "POST", json: payload }),
        getByUser: (userId) => api(`/api/v1/user/${userId}/roles`, { method: "GET" }),
    },
};

// ── Business ────────────────────────────────────────────────────
export const businessApi = {
    profiles: {
        // GET /api/v1/business/profiles returns {"profile": {...}} or [] (single profile per user)
        list: () => api("/api/v1/business/profiles", { method: "GET" }),
        get: (id) => api(`/api/v1/business/profiles/${id}`, { method: "GET" }),
        // PATCH /api/v1/business/profiles (no ID) — uses JWT identity; fields: business_name, business_type, address, description, phone, email
        update: (payload) => api("/api/v1/business/profiles", { method: "PATCH", json: payload }),
        updateById: (id, payload) => api(`/api/v1/business/profiles/${id}`, { method: "PATCH", json: payload }),
        delete: (id) => api(`/api/v1/business/profiles/${id}`, { method: "DELETE" }),
    },
    bookings: {
        // GET /api/v1/business/bookings — bookings for the current user's business profile's attractions
        list: () => api("/api/v1/business/bookings", { method: "GET" }),
    },
    registrations: {
        // POST /api/v1/business/ submits a registration request — profile is created ONLY after admin approval
        // Required: business_name (string), business_type (hotel|restaurant|tour_operator|transport|attraction|other)
        // Optional: registration_doc (object)
        submit: (payload) => api("/api/v1/business/", { method: "POST", json: payload }),
        // GET /api/v1/business/registrations returns {"registration": {...}} or []
        list: () => api("/api/v1/business/registrations", { method: "GET" }),
        get: (id) => api(`/api/v1/business/registrations/${id}`, { method: "GET" }),
        update: (id, payload) => api(`/api/v1/business/registrations/${id}`, { method: "PATCH", json: payload }),
        delete: (id) => api(`/api/v1/business/registrations/registration/${id}`, { method: "DELETE" }),
    },
    admin: {
        profiles: () => api("/api/v1/admin/business/business_profiles/profiles", { method: "GET" }),
        getProfile: (id) => api(`/api/v1/admin/business/business_profiles/profiles/${id}`, { method: "GET" }),
        registrations: () => api("/api/v1/admin/business/business_profiles/registrations", { method: "GET" }),
        getRegistration: (id) => api(`/api/v1/admin/business/business_profiles/registrations/${id}`, { method: "GET" }),
        updateRegistration: (id, payload) => api(`/api/v1/admin/business/business_profiles/registrations/${id}`, { method: "PATCH", json: payload }),
    },
};

// ── Transport ────────────────────────────────────────────────────
export const transportApi = {
    routes: {
        list: () => api("/api/v1/transport/routes/", { method: "GET" }),
        get: (id) => api(`/api/v1/transport/routes/${id}`, { method: "GET" }),
        create: (payload) => api("/api/v1/transport/routes/", { method: "POST", json: payload }),
        update: (id, payload) => api(`/api/v1/transport/routes/${id}`, { method: "PATCH", json: payload }),
        delete: (id) => api(`/api/v1/transport/routes/${id}`, { method: "DELETE" }),
        active: () => api("/api/v1/transport/routes/active", { method: "GET" }),
        nearby: () => api("/api/v1/transport/routes/nearby", { method: "GET" }),
    },
    schedules: {
        list: () => api("/api/v1/transport/schedules/", { method: "GET" }),
        get: (id) => api(`/api/v1/transport/schedules/${id}`, { method: "GET" }),
        create: (payload) => api("/api/v1/transport/schedules/", { method: "POST", json: payload }),
        delete: (id) => api(`/api/v1/transport/schedules/${id}`, { method: "DELETE" }),
        updateSeats: (id, payload) => api(`/api/v1/transport/schedules/${id}/seats`, { method: "PUT", json: payload }),
        search: (query) => api(`/api/v1/transport/schedules/search?q=${query}`, { method: "GET" }),
    },
    stations: {
        list: () => api("/api/v1/transport/stations/", { method: "GET" }),
        get: (id) => api(`/api/v1/transport/stations/${id}`, { method: "GET" }),
        create: (payload) => api("/api/v1/transport/stations/", { method: "POST", json: payload }),
        update: (id, payload) => api(`/api/v1/transport/stations/${id}`, { method: "PATCH", json: payload }),
        delete: (id) => api(`/api/v1/transport/stations/${id}`, { method: "DELETE" }),
        getDestinations: (id) => api(`/api/v1/transport/stations/${id}/destinations`, { method: "GET" }),
        getRoutes: (id) => api(`/api/v1/transport/stations/${id}/routes`, { method: "GET" }),
        nearby: () => api("/api/v1/transport/stations/nearby", { method: "GET" }),
        search: (query) => api(`/api/v1/transport/stations/search?q=${query}`, { method: "GET" }),
    },
};

// ── Payments ────────────────────────────────────────────────────
export const paymentsApi = {
    stripe: {
        createIntent: (payload) => api("/api/v1/payments/stripe/create-payment-intent", { method: "POST", json: payload }),
        getStatus: (intentId) => api(`/api/v1/payments/stripe/payment-status/${intentId}`, { method: "GET" }),
        webhook: (payload) => api("/api/v1/payments/stripe/webhook", { method: "POST", json: payload }),
    },
    mpesa: {
        pay: (payload) => api("/api/v1/payments/pay/mpesa", { method: "POST", json: payload }),
        callback: (payload) => api("/api/v1/payments/callback/mpesa", { method: "POST", json: payload }),
        getStatus: (reference) => api(`/api/v1/payments/status/${reference}`, { method: "GET" }),
    },
};

// ── Kiosk ────────────────────────────────────────────────────
export const kioskApi = {
    admin: {
        list: () => api("/api/v1/admin/kiosks", { method: "GET" }),
        get: (id) => api(`/api/v1/admin/kiosks/${id}`, { method: "GET" }),
        create: (payload) => api("/api/v1/admin/kiosks", { method: "POST", json: payload }),
        update: (id, payload) => api(`/api/v1/admin/kiosks/${id}`, { method: "PATCH", json: payload }),
        getAnalytics: (id) => api(`/api/v1/admin/kiosks/${id}/analytics`, { method: "GET" }),
        contentSync: (id) => api(`/api/v1/admin/kiosks/${id}/content-sync`, { method: "POST" }),
        decommission: (id) => api(`/api/v1/admin/kiosks/${id}/decommission`, { method: "POST" }),
    },
    getContent: (kioskId, contentType) => api(`/api/v1/kiosks/${kioskId}/content/${contentType}`, { method: "GET" }),
    recordHealthEvent: (kioskId, payload) => api(`/api/v1/kiosks/${kioskId}/health-events`, { method: "POST", json: payload }),
    heartbeat: (kioskId) => api(`/api/v1/kiosks/${kioskId}/heartbeat`, { method: "POST" }),
};

// ── Sessions ────────────────────────────────────────────────────
export const sessionsApi = {
    create: (kioskId, payload) => api(`/api/v1/kiosks/${kioskId}/sessions`, { method: "POST", json: payload }),
    end: (sessionId) => api(`/api/v1/sessions/${sessionId}/end`, { method: "POST" }),
    recordEvent: (sessionId, payload) => api(`/api/v1/sessions/${sessionId}/events`, { method: "POST", json: payload }),
    updateState: (sessionId, payload) => api(`/api/v1/sessions/${sessionId}/state`, { method: "PATCH", json: payload }),
    transfer: {
        initiate: (sessionId, payload) => api(`/api/v1/sessions/${sessionId}/transfer`, { method: "POST", json: payload }),
        getStatus: (sessionId) => api(`/api/v1/sessions/${sessionId}/transfer-status`, { method: "GET" }),
        getByToken: (token) => api(`/api/v1/sessions/transfer/${token}`, { method: "GET" }),
    },
    handoff: {
        initiate: (sessionId, payload) => api(`/api/v1/sessions/${sessionId}/handoff`, { method: "POST", json: payload }),
        getStatus: (sessionId) => api(`/api/v1/sessions/${sessionId}/handoff-status`, { method: "GET" }),
        getByToken: (token) => api(`/api/v1/handoff/${token}`, { method: "GET" }),
    },
};

// ── Audit Logs ────────────────────────────────────────────────────
export const auditApi = {
    list: () => api("/api/v1/audit-logs", { method: "GET" }),
    get: (id) => api(`/api/v1/audit-logs/${id}`, { method: "GET" }),
    create: (payload) => api("/api/v1/audit-logs", { method: "POST", json: payload }),
    delete: (id) => api(`/api/v1/audit-logs/${id}`, { method: "DELETE" }),
    getByAction: (action) => api(`/api/v1/audit-logs/action/${action}`, { method: "GET" }),
    getByEntity: (entityType, entityId) => api(`/api/v1/audit-logs/entity/${entityType}/${entityId}`, { method: "GET" }),
    getByUser: (userId) => api(`/api/v1/audit-logs/user/${userId}`, { method: "GET" }),
};

// ── Users ────────────────────────────────────────────────────
export const usersApi = {
    get: (id) => api(`/api/v1/users/${id}`, { method: "GET" }),
    update: (id, payload) => api(`/api/v1/users/${id}`, { method: "PATCH", json: payload }),
    delete: (id) => api(`/api/v1/users/${id}`, { method: "DELETE" }),
    getActivity: (id) => api(`/api/v1/users/${id}/activity`, { method: "GET" }),
    admin: {
        list: () => api("/api/v1/admin/users", { method: "GET" }),
        update: (id, payload) => api(`/api/v1/admin/users/${id}`, { method: "PATCH", json: payload }),
        getAnalytics: () => api("/api/v1/admin/analytics", { method: "GET" }),
        recordAnalyticsSnapshot: (payload) => api("/api/v1/admin/analytics/snapshot", { method: "POST", json: payload }),
    },
};

// ── Favorites ────────────────────────────────────────────────────
export const favoritesApi = {
    list: () => api("/api/v1/favourites", { method: "GET" }),
    add: (attractionId) => api("/api/v1/favourites", { method: "POST", json: { attraction_id: attractionId } }),
    remove: (attractionId) => api(`/api/v1/favourites/${attractionId}`, { method: "DELETE" }),
};

// ── Notifications ────────────────────────────────────────────────────
export const notificationsApi = {
    list: () => api("/api/v1/notifications", { method: "GET" }),
    markAsRead: (id) => api(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),
    preferences: {
        get: (userId) => api(`/api/v1/users/${userId}/notification-preferences`, { method: "GET" }),
        update: (userId, payload) => api(`/api/v1/users/${userId}/notification-preferences`, { method: "PATCH", json: payload }),
    },
};

// ── Events ────────────────────────────────────────────────────
export const eventsApi = {
    list: () => api("/api/v1/events", { method: "GET" }),
    get: (id) => api(`/api/v1/events/${id}`, { method: "GET" }),
    recordAnalytics: (payload) => api("/api/v1/analytics/events", { method: "POST", json: payload }),
};

// ── Tour Packages ────────────────────────────────────────────────────
export const tourPackagesApi = {
    list: () => api("/api/v1/tour-packages", { method: "GET" }),
    get: (id) => api(`/api/v1/tour-packages/${id}`, { method: "GET" }),
};

// ── Public API ────────────────────────────────────────────────────
export const publicApi = {
    welcome: () => api("/api/public/welcome", { method: "GET" }),
    accommodations: () => api("/api/public/accommodations", { method: "GET" }),
    attractions: () => api("/api/public/attractions", { method: "GET" }),
    emergencyContacts: () => api("/api/public/emergency-contacts", { method: "GET" }),
    map: () => api("/api/public/map", { method: "GET" }),
    search: (query) => api(`/api/public/search?q=${query}`, { method: "GET" }),
    kioskSessionReset: (payload) => api("/api/public/kiosk/session/reset", { method: "POST", json: payload }),
    sessionQr: (payload) => api("/api/public/session/qr", { method: "POST", json: payload }),
};

// ── Recommendations ────────────────────────────────────────────────────
export const recommendationsApi = {
    get: () => api("/api/v1/recommendations", { method: "GET" }),
};

// ── Navigation ────────────────────────────────────────────────────
export const navigationApi = {
    getRoute: (query) => api(`/api/v1/navigation/route?q=${query}`, { method: "GET" }),
};

// ── Accommodations ────────────────────────────────────────────────────
export const accommodationsApi = {
    getRooms: (accommodationId) => api(`/api/v1/accommodations/${accommodationId}/rooms`, { method: "GET" }),
};

// ── Feedback & Reviews ────────────────────────────────────────────────────
export const feedbackApi = {
    reviews: {
        list: (params) => {
            const qs = params ? `?${new URLSearchParams(params)}` : "";
            return api(`/api/v1/feedback/reviews${qs}`, { method: "GET" });
        },
        create: (payload) => api("/api/v1/feedback/reviews", { method: "POST", json: payload }),
    },
    media: {
        list: (params) => {
            const qs = params ? `?${new URLSearchParams(params)}` : "";
            return api(`/api/v1/feedback/gallery${qs}`, { method: "GET" });
        },
    },
};

// Legacy exports for backward compatibility
export const destinations = {
    list: () => api("/api/v1/destinations"),
};
export const attractions = {
    list: () => api("/api/v1/attractions"),
    get: (id) => api(`/api/v1/attractions/${id}`),
};
export const itineraries = {
    list: () => api("/api/v1/itineraries"),
    create: (payload) => api("/api/v1/itineraries", { method: "POST", json: payload }),
};
export const bookings = {
    list: () => api("/api/v1/bookings"),
    create: (payload) => api("/api/v1/bookings", { method: "POST", json: payload }),
};
