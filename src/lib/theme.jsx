const THEME_STORAGE_KEY = "sts_theme";

export function getStoredTheme() {
    if (typeof window === "undefined") {
        return "light";
    }

    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" ? "dark" : "light";
}

export function applyTheme(theme) {
    if (typeof document === "undefined") {
        return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setStoredTheme(theme) {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    applyTheme(theme);
}

export function initializeTheme() {
    const theme = getStoredTheme();
    applyTheme(theme);
    return theme;
}
