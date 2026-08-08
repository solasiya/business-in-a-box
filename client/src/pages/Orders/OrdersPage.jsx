import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Edit3, 
  Trash2, 
  Filter, 
  ExternalLink,
  CheckCircle,
  Clock,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';
import OrderModal from './OrderModal';
import PdfPreviewModal from '../../components/common/PdfPreviewModal';

export default function OrdersPage({ initialType = null }) {
  const { v } = useVocab();
  const { currencySymbol } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialType || 'all'); // 'all', 'quote', 'invoice', 'purchase'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [defaultOrderType, setDefaultOrderType] = useState('invoice');
  const [previewOrder, setPreviewOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders();
      if (res && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateNew = (type) => {
    setOrderToEdit(null);
    setDefaultOrderType(type || (activeTab === 'all' ? 'invoice' : activeTab));
    setModalOpen(true);
  };

  const handleEdit = (order) => {
    setOrderToEdit(order);
    setModalOpen(true);
  };

  const handleDelete = async (id, orderNumber) => {
    if (window.confirm(`Are you sure you want to delete ${orderNumber}?`)) {
      try {
        await api.deleteOrder(id);
        fetchOrders();
      } catch (err) {
        alert('Failed to delete order: ' + err.message);
      }
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.orderType === activeTab;
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || 
      (order.orderNumber && order.orderNumber.toLowerCase().includes(query)) ||
      (order.contactName && order.contactName.toLowerCase().includes(query)) ||
      (order.notes && order.notes.toLowerCase().includes(query));
    return matchesTab && matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="badge badge-success">Paid</span>;
      case 'Partially Paid':
        return <span className="badge badge-warning">Partially Paid</span>;
      case 'Sent':
        return <span className="badge badge-info">Sent</span>;
      case 'Draft':
        return <span className="badge badge-secondary">Draft</span>;
      case 'Overdue':
        return <span className="badge badge-danger">Overdue</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Orders & Billing</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Manage {v('quote_p', 'Quotes')}, {v('invoice_p', 'Invoices')}, and {v('purchase_p', 'Purchases')} with live PDF generation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => handleCreateNew('quote')}>
            <Plus size={15} />
            New {v('quote_s', 'Quote')}
          </button>
          <button className="btn btn-secondary" onClick={() => handleCreateNew('purchase')}>
            <Plus size={15} />
            New {v('purchase_s', 'Purchase')}
          </button>
          <button className="btn btn-primary" onClick={() => handleCreateNew('invoice')}>
            <Plus size={15} />
            New {v('invoice_s', 'Invoice')}
          </button>
        </div>
      </div>

      {/* Tabs for Quote / Invoice / Purchase */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Orders ({orders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          {v('invoice_p', 'Invoices')} ({orders.filter(o => o.orderType === 'invoice').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'quote' ? 'active' : ''}`}
          onClick={() => setActiveTab('quote')}
        >
          {v('quote_p', 'Quotes')} ({orders.filter(o => o.orderType === 'quote').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchase')}
        >
          {v('purchase_p', 'Purchases')} ({orders.filter(o => o.orderType === 'purchase').length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder={`Search ${v('invoice_p', 'invoices')}, ${v('quote_p', 'quotes')}, contacts...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="partially paid">Partially Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Balance</th>
              <th style={{ textAlign: 'center' }}>PDF</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No orders match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                let typeLabel = v('invoice_s', 'Invoice');
                if (order.orderType === 'quote') typeLabel = v('quote_s', 'Quote');
                if (order.orderType === 'purchase') typeLabel = v('purchase_s', 'Purchase');

                return (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {order.orderNumber}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {order.lineItems?.length || 0} line item(s)
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{typeLabel}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.contactName}</div>
                      {order.contactEmail && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.contactEmail}</div>
                      )}
                    </td>
                    <td>{order.date}</td>
                    <td>{order.dueDate || '—'}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {currencySymbol || 'R'} {(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', color: order.balanceDue > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                      {currencySymbol || 'R'} {(order.balanceDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px' }}
                        title="Generate & View Print PDF"
                        onClick={() => setPreviewOrder(order)}
                      >
                        <Download size={14} color="#818cf8" />
                        <span style={{ fontSize: '0.75rem' }}>PDF</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px' }}
                          title="Edit Order"
                          onClick={() => handleEdit(order)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', color: 'var(--accent-danger)' }}
                          title="Delete Order"
                          onClick={() => handleDelete(order.id, order.orderNumber)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <OrderModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          orderToEdit={orderToEdit}
          defaultType={defaultOrderType}
          onSaved={fetchOrders}
        />
      )}

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
