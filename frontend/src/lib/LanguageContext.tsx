import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language, type TranslationKey } from "./i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "mo-expressway-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start in English like the server render, then switch to the saved language
  // after hydration; reading localStorage here would make the first browser
  // render differ from the server HTML (React error #418).
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "sw") setLangState(saved);
    } catch {
      // storage blocked: keep English
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
