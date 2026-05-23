import { ATTRACTION_IMAGES } from "@/lib/media-assets";

export const FALLBACK_IMAGES = ATTRACTION_IMAGES;


const FALLBACK = [
    {
        kind: "Lodge",
        name: "Tsavo Savannah Resort",
        location: "Tsavo East",
        price: 1250,
        rating: 4.8,
        fee: "KES 1250 per night",
        address: "Tsavo East, Kenya",
        image: ATTRACTION_IMAGES[0],
        category: "nature",
        description: "A premium safari resort with wide savannah views, private suites, and easy access to Tsavo game-drive circuits.",
        highlights: ["Private game drives", "Sunset deck dinners", "Spa and wellness"],
    },
    {
        kind: "Lodge",
        name: "Mara River Camp",
        location: "Maasai Mara",
        price: 980,
        rating: 4.7,
        fee: "USD 980 per night",
        address: "Mara Triangle, Maasai Mara",
        image: ATTRACTION_IMAGES[1],
        category: "nature",
        description: "A low-impact tented sanctuary set near river crossings and prime wildlife observation points in the Maasai Mara ecosystem.",
        highlights: ["Guided walking safaris", "Big-five game drives", "Bush breakfast"],
    },
    {
        kind: "Expedition",
        name: "Great Migration Crossing Watch",
        location: "Mara Triangle",
        price: 3200,
        rating: 4.9,
        fee: "USD 3200 per group",
        address: "Mara Triangle viewing point",
        image: ATTRACTION_IMAGES[2],
        category: "wildlife",
        description: "Witness dramatic wildebeest crossings with expert trackers and photography-ready lookout points.",
        highlights: ["Migration briefing", "Tracker-led drives", "Photo support"],
    },
    {
        kind: "Expedition",
        name: "Mara Balloon Safari",
        location: "Maasai Mara Conservancies",
        price: 540,
        rating: 4.9,
        fee: "USD 540 per person",
        address: "Maasai Mara Conservancies",
        image: ATTRACTION_IMAGES[3],
        category: "adventure",
        description: "Sunrise hot-air balloon journey above rolling savannah followed by a premium bush breakfast.",
        highlights: ["Sunrise launch", "Aerial wildlife viewing", "Breakfast in the bush"],
    },
    {
        kind: "Expedition",
        name: "Lake Nakuru Birding Drive",
        location: "Lake Nakuru National Park",
        price: 420,
        rating: 4.6,
        fee: "USD 420 per person",
        address: "Lake Nakuru National Park",
        image: ATTRACTION_IMAGES[4],
        category: "wildlife",
        description: "A specialist drive focused on flamingo shores, rhino habitat, and seasonal birdlife activity.",
        highlights: ["Birding specialist guide", "Rhino tracking zones", "Small-group format"],
    },
    {
        kind: "Conservation",
        name: "Mamba Village Conservation Day",
        location: "Mamba Village, Mombasa",
        price: 180,
        rating: 4.4,
        fee: "KES 180 entry",
        address: "Mamba Village, Mombasa",
        image: ATTRACTION_IMAGES[0],
        category: "nature",
        description: "Spend a day with local conservation educators supporting wildlife awareness and habitat stewardship programs.",
        highlights: ["Conservation centre visit", "Community workshop", "Impact briefing"],
    },
];

export function arrayify(v) {
    if (!v)
        return [];
    if (Array.isArray(v))
        return v;
    if (Array.isArray(v.items))
        return v.items;
    if (Array.isArray(v.data))
        return v.data;
    if (Array.isArray(v.results))
        return v.results;
    return [];
}

export function collectCategoryText(item) {
    const values = [item.category, item.type, item.kind, item.theme];
    if (Array.isArray(item.categories)) {
        values.push(...item.categories);
    }
    if (Array.isArray(item.tags)) {
        values.push(...item.tags);
    }
    return values.filter(Boolean).join(" ");
}

export function buildAttractionSlug(item, index = 0) {
    const explicitId = item.id || item.attraction_id || item.destination_id;
    if (explicitId) {
        return String(explicitId);
    }

    const raw = `${item.kind || "item"}-${item.name || item.title || "experience"}-${item.location || item.region || index}`;
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `attraction-${index}`;
}

function toGallery(item, index) {
    const fromItem = [
        item.image,
        item.image_url,
        item.cover_image,
        ...(Array.isArray(item.media_urls) ? item.media_urls : []),
        ...(Array.isArray(item.images) ? item.images : []),
        ...(Array.isArray(item.gallery) ? item.gallery : []),
    ].filter(Boolean);

    const fallbackSet = [
        FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
        FALLBACK_IMAGES[(index + 1) % FALLBACK_IMAGES.length],
        FALLBACK_IMAGES[(index + 2) % FALLBACK_IMAGES.length],
    ];

    const merged = [...fromItem, ...fallbackSet];
    return [...new Set(merged)].slice(0, 5);
}

function withMeta(item, index, isFallback = false) {
    const slug = buildAttractionSlug(item, index);
    const name = item.name || item.title || "Untitled Experience";
    const location = item.destination_name || item.location || item.region || item.city || "Kenya";
    const description =
        item.description ||
        item.details ||
        item.long_description ||
        `${name} is a curated ${String(item.kind || "attraction").toLowerCase()} experience in ${location}, designed for immersive and safe exploration.`;

    return {
        ...item,
        _slug: slug,
        _name: name,
        _location: location,
        _description: description,
        _gallery: toGallery(item, index),
        _highlights: Array.isArray(item.highlights) && item.highlights.length > 0
            ? item.highlights
            : [
                "Guided by local experts",
                "Flexible schedule options",
                "Suitable for individual or group travel",
            ],
        _isFallback: isFallback,
    };
}

export function normalizeExploreItems(destinationsData, attractionsData) {
    const fromApi = [
        ...arrayify(destinationsData).map((d, i) => ({ kind: "Destination", ...d, _i: i })),
        ...arrayify(attractionsData).map((d, i) => ({ kind: "Attraction", ...d, _i: i + 100 })),
    ];

    if (fromApi.length === 0) {
        return FALLBACK.map((item, i) => withMeta(item, i, true));
    }

    return fromApi.map((item, i) => withMeta(item, i, false));
}
