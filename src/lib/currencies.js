export const CURRENCIES = {
  USD: { rate: 1,      symbol: "$",     name: "US Dollar",         flag: "🇺🇸" },
  KES: { rate: 130,    symbol: "KSh",   name: "Kenyan Shilling",   flag: "🇰🇪" },
  EUR: { rate: 0.92,   symbol: "€",     name: "Euro",              flag: "🇪🇺" },
  GBP: { rate: 0.79,   symbol: "£",     name: "British Pound",     flag: "🇬🇧" },
  JPY: { rate: 149,    symbol: "¥",     name: "Japanese Yen",      flag: "🇯🇵" },
  AUD: { rate: 1.53,   symbol: "A$",    name: "Australian Dollar", flag: "🇦🇺" },
  CAD: { rate: 1.36,   symbol: "C$",    name: "Canadian Dollar",   flag: "🇨🇦" },
  CHF: { rate: 0.88,   symbol: "Fr",    name: "Swiss Franc",       flag: "🇨🇭" },
  CNY: { rate: 7.24,   symbol: "¥",     name: "Chinese Yuan",      flag: "🇨🇳" },
  INR: { rate: 83,     symbol: "₹",     name: "Indian Rupee",      flag: "🇮🇳" },
  AED: { rate: 3.67,   symbol: "د.إ",   name: "UAE Dirham",        flag: "🇦🇪" },
  ZAR: { rate: 18.5,   symbol: "R",     name: "South African Rand",flag: "🇿🇦" },
  TZS: { rate: 2530,   symbol: "TSh",   name: "Tanzanian Shilling",flag: "🇹🇿" },
  UGX: { rate: 3700,   symbol: "USh",   name: "Ugandan Shilling",  flag: "🇺🇬" },
  NGN: { rate: 1550,   symbol: "₦",     name: "Nigerian Naira",    flag: "🇳🇬" },
  EGP: { rate: 48,     symbol: "E£",    name: "Egyptian Pound",    flag: "🇪🇬" },
  SAR: { rate: 3.75,   symbol: "﷼",     name: "Saudi Riyal",       flag: "🇸🇦" },
  BRL: { rate: 4.97,   symbol: "R$",    name: "Brazilian Real",    flag: "🇧🇷" },
};

export const CURRENCY_OPTIONS = Object.keys(CURRENCIES);

export const CURRENCY_RATES = Object.fromEntries(
  Object.entries(CURRENCIES).map(([code, { rate }]) => [code, rate])
);

export function formatPrice(amountUsd, currency = "USD", opts = {}) {
  const { maximumFractionDigits = 0 } = opts;
  const rate = CURRENCY_RATES[currency] ?? 1;
  const converted = amountUsd * rate;
  const symbol = CURRENCIES[currency]?.symbol ?? currency;
  return `${symbol} ${converted.toLocaleString(undefined, { maximumFractionDigits })}`;
}
