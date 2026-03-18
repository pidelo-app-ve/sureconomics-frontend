import { useContext } from "react";
import { I18nContext } from "./useI18nContext";

export default function useI18n() {
  const ctx = useContext(I18nContext);
  return ctx;
}

