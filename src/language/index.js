import { en } from "./locales/en";
import { sw } from "./locales/sw";
import { fr } from "./locales/fr";
import { de } from "./locales/de";
import { es } from "./locales/es";
import { zh } from "./locales/zh";
import { ar } from "./locales/ar";
import { pt } from "./locales/pt";

export const languages = {
  en: { label: "English",    dict: en },
  sw: { label: "Swahili",    dict: sw },
  fr: { label: "Français",   dict: fr },
  de: { label: "Deutsch",    dict: de },
  es: { label: "Español",    dict: es },
  zh: { label: "中文",        dict: zh },
  ar: { label: "العربية",    dict: ar },
  pt: { label: "Português",  dict: pt },
};

export const defaultLanguage = "en";
