/**
 * Full country list + international dial prefixes for phone registration.
 * Data: country-telephone-data. Spanish labels: i18n-iso-countries (fallback EN / dataset name).
 */

import { allCountries } from "country-telephone-data";
import countries from "i18n-iso-countries";
import enLang from "i18n-iso-countries/langs/en.json";
import esLang from "i18n-iso-countries/langs/es.json";

countries.registerLocale(esLang);
countries.registerLocale(enLang);

/** @typedef {{ iso2: string, nameEs: string, dial: string }} PhonePrefixOption */

const resolveNameEs = (iso2Upper, englishFallback) => {
  const fromEs = countries.getName(iso2Upper, "es");
  if (fromEs) return fromEs;
  const fromEn = countries.getName(iso2Upper, "en");
  if (fromEn) return fromEn;
  return englishFallback;
};

/** @type {PhonePrefixOption[]} */
export const PHONE_COUNTRY_PREFIXES = allCountries
  .filter((c) => c?.dialCode != null && String(c.dialCode).trim() !== "")
  .map((c) => {
    const iso2 = String(c.iso2).toUpperCase();
    const dial = `+${String(c.dialCode).replace(/^\+/, "")}`;
    return {
      iso2,
      dial,
      nameEs: resolveNameEs(iso2, c.name),
    };
  })
  .sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es", { sensitivity: "base" }));

export const DEFAULT_PHONE_PREFIX_ISO2 = "CO";

/**
 * @param {string} iso2
 * @returns {PhonePrefixOption | undefined}
 */
export const getPhonePrefixByIso2 = (iso2) =>
  PHONE_COUNTRY_PREFIXES.find((p) => p.iso2 === String(iso2).toUpperCase());
