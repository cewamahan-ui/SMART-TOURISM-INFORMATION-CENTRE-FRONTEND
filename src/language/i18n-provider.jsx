import { createContext, useContext, useMemo, useState } from "react";
import { defaultLanguage, languages } from "./index";

const STORAGE_KEY = "sts_language";
const I18nContext = createContext(null);

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && languages[saved]) {
    return saved;
  }

  return defaultLanguage;
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, part) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }
    return acc[part];
  }, obj);
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = (next) => {
    const normalized = languages[next] ? next : defaultLanguage;
    setLanguageState(normalized);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, normalized);
      document.documentElement.lang = normalized;
    }
  };

  const value = useMemo(() => {
    const dict = languages[language]?.dict || languages[defaultLanguage].dict;

    return {
      language,
      setLanguage,
      availableLanguages: Object.entries(languages).map(([code, item]) => ({
        code,
        label: item.label,
      })),
      t: (key, fallback = key) => {
        const translated = getByPath(dict, key);
        return typeof translated === "string" ? translated : fallback;
      },
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
