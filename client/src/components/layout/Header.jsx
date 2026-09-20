import React from 'react';
import { Plus, RefreshCw, ShieldCheck, LogOut, KeyRound, User } from 'lucide-react';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onNewOrder, onNewTransaction, onRefreshData, onOpenAuth }) {
  const { v } = useVocab();
  const { settings } = useSettings();
  const { user, isAuthenticated, isSuperAdmin, logout } = useAuth();

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
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
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
        {/* User Auth Profile Badge */}
        {isAuthenticated ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '20px',
            padding: '4px 10px 4px 6px',
            marginRight: '6px'
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: isSuperAdmin ? '#10b981' : '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              {isSuperAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#f8fafc' }}>
                {user?.name || user?.username || 'Admin'}
              </div>
              <div style={{ fontSize: '0.65rem', color: isSuperAdmin ? '#34d399' : '#a5b4fc', fontWeight: 600 }}>
                {user?.role || 'Super Admin'}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                marginLeft: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenAuth}
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              color: '#ffffff',
              marginRight: '6px'
            }}
          >
            <KeyRound size={14} color="#818cf8" />
            Super Admin Login
          </button>
        )}

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
