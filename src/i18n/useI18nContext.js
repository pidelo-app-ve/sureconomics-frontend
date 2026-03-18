import { createContext } from "react";

export const I18nContext = createContext({
  lang: "es",
  setLang: () => {},
  t: (key) => key,
});

