import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  ArrowLeftRight, 
  Users, 
  Package, 
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { v } = useVocab();
  const { settings } = useSettings();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      subtitle: 'Overview & Analytics'
    },
    {
      id: 'orders',
      label: 'Orders',
      dynamicLabel: `${v('quote_p', 'Quotes')}, ${v('invoice_p', 'Invoices')}, ${v('purchase_p', 'Purchases')}`,
      icon: FileText,
      subtitle: `${v('quote_p', 'Quotes')} & ${v('invoice_p', 'Invoices')}`
    },
    {
      id: 'transactions',
      label: 'Transactions',
      dynamicLabel: `${v('expense_p', 'Expenses')} & ${v('payment_p', 'Income')}`,
      icon: ArrowLeftRight,
      subtitle: `${v('expense_p', 'Expenses')} & ${v('payment_p', 'Income')}`
    },
    {
      id: 'names',
      label: 'Names',
      dynamicLabel: `${v('customer_p', 'Customers')}, ${v('vendor_p', 'Vendors')}, ${v('employee_p', 'Employees')}`,
      icon: Users,
      subtitle: 'Contacts Directory'
    },
    {
      id: 'items',
      label: v('item_p', 'Items'),
      dynamicLabel: `Catalog (${v('item_p', 'Items')})`,
      icon: Package,
      subtitle: 'Products & Services'
    },
    {
      id: 'admin',
      label: 'Admin & Settings',
      dynamicLabel: 'Admin & Settings',
      icon: SettingsIcon,
      subtitle: 'Vocabulary & Config'
    }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header with Web Pros Africa Logo */}
      <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255,255,255,0.2)',
            flexShrink: 0
          }}>
            <img
              src="/logo.png"
              alt="Web Pros Africa Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2 }}>
              {settings.company?.name || 'Web Pros Africa'}
            </h2>
            <p style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, marginTop: '2px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '160px' }}>
              Business in a Box
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        <div style={{ padding: '4px 12px 8px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} color={isActive ? '#818cf8' : 'currentColor'} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: isActive ? '#a5b4fc' : 'var(--text-muted)' }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
              {isActive && <ChevronRight size={15} color="#818cf8" />}
            </button>
          );
        })}
      </nav>

      {/* Vocabulary & Tax Status Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tax Status</span>
          <span className={`badge ${settings.tax?.useSalesTax ? 'badge-success' : 'badge-secondary'}`}>
            {settings.tax?.useSalesTax ? `${settings.tax?.taxPercentage}% ${settings.tax?.taxName || 'VAT'}` : 'Tax Disabled'}
          </span>
        </div>
      </div>
    </aside>
  );
}
