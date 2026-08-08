import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { api } from '../../services/api';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';
import TransactionModal from './TransactionModal';

export default function TransactionsPage({ initialType = null }) {
  const { v } = useVocab();
  const { currencySymbol } = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialType || 'all'); // 'all', 'income', 'expense'
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [defaultModalType, setDefaultModalType] = useState('income');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions();
      if (res && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleOpenNew = (type) => {
    setDefaultModalType(type);
    setModalOpen(true);
  };

  const handleDelete = async (id, ref) => {
    if (window.confirm(`Are you sure you want to delete this transaction? Any reconciled order balance will be automatically adjusted.`)) {
      try {
        await api.deleteTransaction(id);
        fetchTransactions();
      } catch (err) {
        alert('Failed to delete transaction: ' + err.message);
      }
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesTab = activeTab === 'all' || tx.type === activeTab;
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query ||
      (tx.contactName && tx.contactName.toLowerCase().includes(query)) ||
      (tx.incomeTypeName && tx.incomeTypeName.toLowerCase().includes(query)) ||
      (tx.expenseTypeName && tx.expenseTypeName.toLowerCase().includes(query)) ||
      (tx.reference && tx.reference.toLowerCase().includes(query)) ||
      (tx.orderNumber && tx.orderNumber.toLowerCase().includes(query)) ||
      (tx.notes && tx.notes.toLowerCase().includes(query));
    return matchesTab && matchesQuery;
  });

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Transactions & Cash Flow</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Track recorded {v('expense_p', 'expenses')} and {v('payment_p', 'income payments')} with invoice reconciliation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => handleOpenNew('expense')}>
            <Plus size={15} />
            Record {v('expense_s', 'Expense')}
          </button>
          <button className="btn btn-success" onClick={() => handleOpenNew('income')}>
            <Plus size={15} />
            Record {v('payment_s', 'Income')}
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid-3">
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Inflow</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>+{currencySymbol || 'R'} {totalIncome.toFixed(2)}</div>
          </div>
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-success-bg)' }}>
            <TrendingUp size={20} color="#10b981" />
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Outflow</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>-{currencySymbol || 'R'} {totalExpense.toFixed(2)}</div>
          </div>
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-danger-bg)' }}>
            <TrendingDown size={20} color="#ef4444" />
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Operating Balance</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: netBalance >= 0 ? '#6366f1' : '#ef4444' }}>
              {currencySymbol || 'R'} {netBalance.toFixed(2)}
            </div>
          </div>
          <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.12)' }}>
            <DollarSign size={20} color="#6366f1" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Transactions ({transactions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          {v('payment_p', 'Income & Payments')} ({transactions.filter(t => t.type === 'income').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
        >
          {v('expense_p', 'Expenses & Costs')} ({transactions.filter(t => t.type === 'expense').length})
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
        <input
          type="text"
          className="input"
          style={{ paddingLeft: '36px' }}
          placeholder="Search by contact, category, reference, or note..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th>Category</th>
              <th>Contact</th>
              <th>Reconciliation / Order</th>
              <th>Reference</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading transactions...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No transactions match your search.
                </td>
              </tr>
            ) : (
              filteredTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                return (
                  <tr key={tx.id}>
                    <td>
                      <span className={`badge ${isIncome ? 'badge-success' : 'badge-danger'}`}>
                        {isIncome ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                        {isIncome ? v('payment_s', 'Income') : v('expense_s', 'Expense')}
                      </span>
                    </td>
                    <td>{tx.date}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{tx.incomeTypeName || tx.expenseTypeName || 'General'}</div>
                      {tx.notes && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{tx.notes}</div>}
                    </td>
                    <td>{tx.contactName}</td>
                    <td>
                      {tx.orderNumber ? (
                        <span className="badge badge-info">
                          <FileText size={12} />
                          {tx.orderNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unlinked</span>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                        {tx.reference || '—'}
                      </code>
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: isIncome ? '#10b981' : '#ef4444'
                    }}>
                      {isIncome ? '+' : '-'}{currencySymbol || 'R'} {tx.amount?.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', color: 'var(--accent-danger)' }}
                        title="Delete Transaction"
                        onClick={() => handleDelete(tx.id, tx.reference)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Modal */}
      {modalOpen && (
        <TransactionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultType={defaultModalType}
          onSaved={fetchTransactions}
        />
      )}
    </div>
  );
}
