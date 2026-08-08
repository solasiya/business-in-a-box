import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const defaultVocab = {
  quote_s: "Quote",
  quote_p: "Quotes",
  invoice_s: "Invoice",
  invoice_p: "Invoices",
  purchase_s: "Purchase",
  purchase_p: "Purchases",
  expense_s: "Expense",
  expense_p: "Expenses",
  payment_s: "Payment / Income",
  payment_p: "Payments & Income",
  item_s: "Item",
  item_p: "Items",
  vendor_s: "Vendor",
  vendor_p: "Vendors",
  employee_s: "Employee",
  employee_p: "Employees",
  customer_s: "Customer",
  customer_p: "Customers"
};

const VocabContext = createContext({
  vocab: defaultVocab,
  v: (key, fallback) => fallback || key,
  setVocab: () => {},
  refreshVocab: () => {}
});

export function VocabProvider({ children }) {
  const [vocab, setVocab] = useState(defaultVocab);

  const refreshVocab = async () => {
    try {
      const res = await api.getSettings();
      if (res && res.data && res.data.vocabulary) {
        setVocab(res.data.vocabulary);
      }
    } catch (err) {
      console.warn('Could not load vocabulary settings:', err.message);
    }
  };

  useEffect(() => {
    refreshVocab();
  }, []);

  const v = (key, fallback) => {
    if (vocab && vocab[key]) {
      return vocab[key];
    }
    return fallback || key;
  };

  return (
    <VocabContext.Provider value={{ vocab, v, setVocab, refreshVocab }}>
      {children}
    </VocabContext.Provider>
  );
}

export function useVocab() {
  return useContext(VocabContext);
}
