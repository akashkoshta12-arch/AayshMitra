import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../constants/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('hi'); // Default Hindi for seniors

  useEffect(() => {
    const loadSavedLanguage = async () => {
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedLang) {
        setLang(savedLang);
      }
    };
    loadSavedLanguage();
  }, []);

  const changeLanguage = async (newLang) => {
    setLang(newLang);
    await AsyncStorage.setItem('app_language', newLang);
  };

  const t = translations[lang] || translations.hi;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};