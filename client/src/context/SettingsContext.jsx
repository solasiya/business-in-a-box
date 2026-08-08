import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useVocab } from './VocabContext';

const defaultSettings = {
  company: {
    name: "Web Pros Africa",
    tagline: "Empowering Africa Through Cloud, Code & Digital Innovation",
    address1: "12 Innovation Hub Boulevard, Victoria Island",
    address2: "Lagos & Nairobi, Africa",
    email: "billing@webpros.africa",
    phone: "+254 700 555 120 / +234 800 555 0199",
    website: "https://webpros.africa",
    taxNumber: "AFR-WPA-2026-904",
    logoUrl: "/logo.png"
  },
  tax: {
    useSalesTax: true,
    taxName: "Sales Tax / VAT",
    taxPercentage: 7.5
  },
  defaults: {
    defaultIncomeType: "Web & Cloud Engineering",
    defaultExpenseType: "Cloud Infrastructure",
    defaultItemType: "Service",
    defaultDueDays: 30,
    currencySymbol: "R",
    currencyCode: "ZAR",
    currencyName: "South African Rand (ZAR)"
  },
  orderMessages: {
    quote: "Thank you for choosing Web Pros Africa. This quote is valid for 30 calendar days from issue date.",
    invoice: "Payment is due within 30 days of invoice date. Thank you for your valued business with Web Pros Africa.",
    purchase: "Please confirm purchase order acceptance within 48 hours."
  },
  googleSheets: {
    sheetId: "",
    clientEmail: "",
    privateKey: "",
    connected: false,
    lastSynced: null
  }
};

const SettingsContext = createContext({
  settings: defaultSettings,
  loading: true,
  currencySymbol: 'R',
  formatMoney: (amt) => `R ${(amt || 0).toFixed(2)}`,
  refreshSettings: () => {},
  updateSettings: () => {}
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { setVocab } = useVocab();

  const currencySymbol = settings.defaults?.currencySymbol || 'R';

  const formatMoney = (amt) => {
    return `${currencySymbol} ${(parseFloat(amt) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const refreshSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res && res.data) {
        setSettings(res.data);
        if (res.data.vocabulary) {
          setVocab(res.data.vocabulary);
        }
      }
    } catch (err) {
      console.warn('Could not load settings from server:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (patch) => {
    const res = await api.updateSettings(patch);
    if (res && res.data) {
      setSettings(res.data);
      if (res.data.vocabulary) {
        setVocab(res.data.vocabulary);
      }
    }
    return res;
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, currencySymbol, formatMoney, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
