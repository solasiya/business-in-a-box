import React, { useState, Component } from 'react';
import { VocabProvider } from './context/VocabContext';
import { SettingsProvider } from './context/SettingsContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/Orders/OrdersPage';
import TransactionsPage from './pages/Transactions/TransactionsPage';
import NamesPage from './pages/Names/NamesPage';
import ItemsPage from './pages/Items/ItemsPage';
import AdminPage from './pages/Admin/AdminPage';

import OrderModal from './pages/Orders/OrderModal';
import TransactionModal from './pages/Transactions/TransactionModal';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          margin: '40px auto',
          maxWidth: '600px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f0f6fc',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>Something went wrong</h2>
          <p style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quickOrderModal, setQuickOrderModal] = useState({ open: false, type: 'invoice' });
  const [quickTxModal, setQuickTxModal] = useState({ open: false, type: 'income' });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshAll = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="app-container">
      {/* Dynamic Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Area */}
      <div className="main-content">
        {/* Top Header */}
        <Header
          onNewOrder={(type) => setQuickOrderModal({ open: true, type: type || 'invoice' })}
          onNewTransaction={(type) => setQuickTxModal({ open: true, type: type || 'income' })}
          onRefreshData={handleRefreshAll}
        />

        {/* Dynamic Page Body */}
        <main className="page-body" key={refreshKey}>
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              onNewOrder={(type) => setQuickOrderModal({ open: true, type })}
              onNewTransaction={(type) => setQuickTxModal({ open: true, type })}
            />
          )}

          {activeTab === 'orders' && <OrdersPage />}
          {activeTab === 'transactions' && <TransactionsPage />}
          {activeTab === 'names' && <NamesPage />}
          {activeTab === 'items' && <ItemsPage />}
          {activeTab === 'admin' && <AdminPage />}
        </main>
      </div>

      {/* Global Quick Modals */}
      {quickOrderModal.open && (
        <OrderModal
          isOpen={quickOrderModal.open}
          onClose={() => setQuickOrderModal({ open: false, type: 'invoice' })}
          defaultType={quickOrderModal.type}
          onSaved={handleRefreshAll}
        />
      )}

      {quickTxModal.open && (
        <TransactionModal
          isOpen={quickTxModal.open}
          onClose={() => setQuickTxModal({ open: false, type: 'income' })}
          defaultType={quickTxModal.type}
          onSaved={handleRefreshAll}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <VocabProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </VocabProvider>
    </ErrorBoundary>
  );
}
