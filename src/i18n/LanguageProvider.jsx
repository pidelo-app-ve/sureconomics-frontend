import { useEffect, useMemo, useState } from "react";
import { SUPPORTED_LANGS, translations } from "./translations";
import { I18nContext } from "./useI18nContext";

const getLangFromQuery = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("lang");
    if (!raw) return null;
    return SUPPORTED_LANGS.includes(raw) ? raw : null;
  } catch {
    return null;
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => getLangFromQuery() ?? "es");

  useEffect(() => {
    const onPopState = () => {
      const next = getLangFromQuery();
      if (next && next !== lang) setLang(next);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [lang]);

  const t = useMemo(() => {
    const translate = (key) => {
      const dict = translations[lang] ?? translations.es;
      return dict[key] ?? translations.es[key] ?? key;
    };
    return translate;
  }, [lang]);

  const handleSetLang = (nextLang) => {
    if (!SUPPORTED_LANGS.includes(nextLang)) return;
    setLang(nextLang);

    // Update URL query parameter (keeps routes untouched).
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", nextLang);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

