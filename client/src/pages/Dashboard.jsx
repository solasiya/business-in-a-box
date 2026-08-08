import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Download, 
  CheckCircle,
  Percent,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useVocab } from '../context/VocabContext';
import { useSettings } from '../context/SettingsContext';
import PdfPreviewModal from '../components/common/PdfPreviewModal';

export default function Dashboard({ onNavigate, onNewOrder, onNewTransaction }) {
  const { v } = useVocab();
  const { settings, currencySymbol, formatMoney } = useSettings();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewOrder, setPreviewOrder] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amt) => {
    return `${currencySymbol || 'R'} ${(amt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && !stats) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Clock size={32} className="animate-spin" style={{ margin: '0 auto 16px', opacity: 0.7 }} />
        <p>Loading analytics and financials...</p>
      </div>
    );
  }

  const {
    outstandingAmount = 0,
    outstandingCount = 0,
    totalIncome = 0,
    totalExpenses = 0,
    netProfit = 0,
    netTaxOwed = 0,
    recentOrders = [],
    recentTransactions = [],
    monthlyData = []
  } = stats || {};

  // Maximum value for charting scaling
  const maxBarValue = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Metric Cards */}
      <div className="grid-4">
        {/* Outstanding Invoices */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Outstanding {v('invoice_p', 'Invoices')}
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-warning-bg)' }}>
              <AlertCircle size={18} color="#f59e0b" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
              {formatCurrency(outstandingAmount)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {outstandingCount} unpaid / partial {v('invoice_p', 'invoices')}
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total {v('payment_p', 'Income')}
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-success-bg)' }}>
              <ArrowUpRight size={18} color="#10b981" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
              {formatCurrency(totalIncome)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Settled payments received
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total {v('expense_p', 'Expenses')}
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-danger-bg)' }}>
              <ArrowDownLeft size={18} color="#ef4444" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>
              {formatCurrency(totalExpenses)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Operating & vendor expenditures
            </div>
          </div>
        </div>

        {/* Net Tax Owed */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {settings.tax?.taxName || 'Tax'} Liability
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-info-bg)' }}>
              <Percent size={18} color="#06b6d4" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06b6d4' }}>
              {formatCurrency(netTaxOwed)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Collected tax minus tax paid
            </div>
          </div>
        </div>
      </div>

      {/* Financial Performance Chart (Income vs Expense) */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Income vs Expenses (Monthly Breakdown)</h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
              Net operating performance for calendar year {new Date().getFullYear()}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></span>
              <span>{v('payment_p', 'Income')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }}></span>
              <span>{v('expense_p', 'Expenses')}</span>
            </div>
          </div>
        </div>

        {/* Custom Visual Bar Chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '12px', paddingTop: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
          {monthlyData.map((m, idx) => {
            const incHeight = maxBarValue > 0 ? (m.income / maxBarValue) * 160 : 0;
            const expHeight = maxBarValue > 0 ? (m.expense / maxBarValue) * 160 : 0;
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', justifyContent: 'center' }}>
                  {/* Income bar */}
                  <div
                    title={`${m.month} Income: $${m.income.toFixed(2)}`}
                    style={{
                      width: '45%',
                      maxWidth: '24px',
                      height: `${Math.max(incHeight, 4)}px`,
                      background: m.income > 0 ? 'linear-gradient(180deg, #34d399 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                  />
                  {/* Expense bar */}
                  <div
                    title={`${m.month} Expense: $${m.expense.toFixed(2)}`}
                    style={{
                      width: '45%',
                      maxWidth: '24px',
                      height: `${Math.max(expHeight, 4)}px`,
                      background: m.expense > 0 ? 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {m.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Recent Transactions */}
      <div className="grid-2">
        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Recent {v('quote_p', 'Quotes')}, {v('invoice_p', 'Invoices')} & {v('purchase_p', 'Purchases')}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('orders')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentOrders.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '16px 0' }}>No recent orders found.</p>
            ) : (
              recentOrders.map((order) => {
                let badgeClass = 'badge-secondary';
                if (order.status === 'Paid') badgeClass = 'badge-success';
                else if (order.status === 'Sent' || order.status === 'Partially Paid') badgeClass = 'badge-warning';
                else if (order.status === 'Overdue') badgeClass = 'badge-danger';

                return (
                  <div
                    key={order.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={18} color="#818cf8" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.orderNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {order.contactName} • {order.date}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{formatCurrency(order.total)}</div>
                        <span className={`badge ${badgeClass}`}>{order.status}</span>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px' }}
                        title="Download / View PDF"
                        onClick={() => setPreviewOrder(order)}
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Recent {v('expense_p', 'Expenses')} & {v('payment_p', 'Income')}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('transactions')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentTransactions.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '16px 0' }}>No recent transactions found.</p>
            ) : (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        background: isIncome ? 'var(--accent-success-bg)' : 'var(--accent-danger-bg)'
                      }}>
                        {isIncome ? <ArrowUpRight size={16} color="#10b981" /> : <ArrowDownLeft size={16} color="#ef4444" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {tx.incomeTypeName || tx.expenseTypeName || (isIncome ? v('payment_s', 'Income') : v('expense_s', 'Expense'))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {tx.contactName} • {tx.date}
                          {tx.orderNumber ? ` • Linked ${tx.orderNumber}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: isIncome ? '#10b981' : '#ef4444'
                      }}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                      {tx.reference && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {tx.reference}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {previewOrder && (
        <PdfPreviewModal
          isOpen={Boolean(previewOrder)}
          onClose={() => setPreviewOrder(null)}
          order={previewOrder}
        />
      )}
    </div>
  );
}
