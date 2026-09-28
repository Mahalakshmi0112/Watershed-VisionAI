import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  getTranslation,
  translateStructureType,
  translateCondition,
  translatePriorityTier
} from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  tStruct: (type: string) => string;
  tCond: (cond: string) => string;
  tTier: (tier: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('wv_language');
    return saved === 'ta' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('wv_language', language);
    // Set document lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'en' ? 'ta' : 'en'));
  };

  const t = (key: string, fallback?: string): string => {
    return getTranslation(key, language, fallback);
  };

  const tStruct = (type: string): string => {
    return translateStructureType(type, language);
  };

  const tCond = (cond: string): string => {
    return translateCondition(cond, language);
  };

  const tTier = (tier: string): string => {
    return translatePriorityTier(tier, language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        tStruct,
        tCond,
        tTier
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
