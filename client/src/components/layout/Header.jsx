import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';

export default function Header({ onNewOrder, onNewTransaction, onRefreshData }) {
  const { v } = useVocab();
  const { settings } = useSettings();

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <img
            src="/logo.png"
            alt="Web Pros Africa"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{settings.company?.name || 'Web Pros Africa'}</span>
            <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Verified</span>
          </h1>
          <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0 }}>
            {settings.company?.tagline || 'Empowering Africa Through Cloud, Code & Digital Innovation'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefreshData}
          title="Refresh live data"
        >
          <RefreshCw size={14} />
          Refresh
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNewTransaction('expense')}
        >
          <Plus size={14} />
          Record {v('expense_s', 'Expense')}
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNewTransaction('income')}
        >
          <Plus size={14} />
          Record {v('payment_s', 'Income')}
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => onNewOrder('invoice')}
        >
          <Plus size={14} />
          Create {v('invoice_s', 'Invoice')}
        </button>
      </div>
    </header>
  );
}
