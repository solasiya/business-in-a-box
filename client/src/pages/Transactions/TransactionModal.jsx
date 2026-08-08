import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { api } from '../../services/api';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';

export default function TransactionModal({ isOpen, onClose, defaultType = 'income', onSaved }) {
  const { v } = useVocab();
  const { settings, currencySymbol } = useSettings();

  const [type, setType] = useState(defaultType); // 'income' or 'expense'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nameId, setNameId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [orderId, setOrderId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [namesList, setNamesList] = useState([]);
  const [typesList, setTypesList] = useState({ incomeTypes: [], expenseTypes: [] });
  const [unsettledOrders, setUnsettledOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType || 'income');
      setDate(new Date().toISOString().split('T')[0]);
      setNameId('');
      setCategoryId('');
      setAmount('');
      setTaxAmount(0);
      setOrderId('');
      setReference('');
      setNotes('');
      setError(null);

      // Load supporting records
      api.getNames().then(res => setNamesList(res.data || [])).catch(console.error);
      api.getTypes().then(res => {
        if (res.data) {
          setTypesList(res.data);
          if (defaultType === 'income' && res.data.incomeTypes.length > 0) {
            setCategoryId(res.data.incomeTypes[0].id);
          } else if (defaultType === 'expense' && res.data.expenseTypes.length > 0) {
            setCategoryId(res.data.expenseTypes[0].id);
          }
        }
      }).catch(console.error);

      // Load orders for reconciliation
      api.getOrders().then(res => {
        if (res.data) {
          setUnsettledOrders(res.data.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled'));
        }
      }).catch(console.error);
    }
  }, [isOpen, defaultType]);

  // When order is selected for reconciliation, auto-fill contact & balance amount
  const handleOrderChange = (selectedOrdId) => {
    setOrderId(selectedOrdId);
    if (!selectedOrdId) return;
    const ord = unsettledOrders.find(o => o.id === selectedOrdId);
    if (ord) {
      if (ord.nameId) setNameId(ord.nameId);
      if (ord.balanceDue > 0) setAmount(String(ord.balanceDue));
      setNotes(`Reconciled payment against ${ord.orderNumber}`);
    }
  };

  // Contacts filtered by type
  const filteredContacts = namesList.filter(n => {
    if (type === 'expense') {
      return n.type === 'vendor' || n.type === 'employee';
    }
    return n.type === 'customer';
  });

  const currentCategories = type === 'income' ? typesList.incomeTypes : typesList.expenseTypes;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const catObj = currentCategories.find(c => c.id === categoryId);
      const payload = {
        type,
        date,
        nameId: nameId || null,
        incomeTypeId: type === 'income' ? categoryId : null,
        incomeTypeName: type === 'income' ? (catObj ? catObj.name : '') : '',
        expenseTypeId: type === 'expense' ? categoryId : null,
        expenseTypeName: type === 'expense' ? (catObj ? catObj.name : '') : '',
        amount: numAmt,
        taxAmount: parseFloat(taxAmount) || 0,
        orderId: orderId || null,
        reference,
        notes
      };

      await api.createTransaction(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'income' ? `Record ${v('payment_s', 'Payment / Income')}` : `Record ${v('expense_s', 'Expense')}`}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {error && (
          <div style={{
            background: 'var(--accent-danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: 'var(--accent-danger)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Transaction Type Switcher */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className={`btn btn-sm ${type === 'income' ? 'btn-success' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '9px 12px' }}
            onClick={() => {
              setType('income');
              if (typesList.incomeTypes.length > 0) setCategoryId(typesList.incomeTypes[0].id);
            }}
          >
            <ArrowUpRight size={15} />
            {v('payment_s', 'Income / Payment')}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '9px 12px' }}
            onClick={() => {
              setType('expense');
              if (typesList.expenseTypes.length > 0) setCategoryId(typesList.expenseTypes[0].id);
            }}
          >
            <ArrowDownLeft size={15} />
            {v('expense_s', 'Expense / Cost')}
          </button>
        </div>

        {/* Reconcile against Order */}
        <div className="form-group" style={{ margin: 0 }}>
          <label>Link / Reconcile to {type === 'income' ? v('invoice_s', 'Invoice') : v('purchase_s', 'Purchase Order')} (Optional)</label>
          <select
            className="select"
            value={orderId}
            onChange={(e) => handleOrderChange(e.target.value)}
          >
            <option value="">-- No linked order (Direct transaction) --</option>
            {unsettledOrders
              .filter(o => type === 'income' ? o.orderType === 'invoice' : o.orderType === 'purchase')
              .map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} • {o.contactName} • Balance Due: ${o.balanceDue?.toFixed(2)}
                </option>
              ))
            }
          </select>
        </div>

        <div className="grid-2">
          {/* Linked Contact */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Linked {type === 'income' ? v('customer_s', 'Customer') : v('vendor_s', 'Vendor')} *</label>
            <select
              className="select"
              value={nameId}
              onChange={(e) => setNameId(e.target.value)}
              required
            >
              <option value="">-- Select Contact --</option>
              {filteredContacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Type */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>{type === 'income' ? 'Income Category' : 'Expense Category'} *</label>
            <select
              className="select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {currentCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2">
          {/* Amount */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Total Amount ({currencySymbol || 'R'}) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Date */}
          <div className="form-group" style={{ margin: 0 }}>
            <label>Transaction Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {type === 'expense' && (
          <div className="form-group" style={{ margin: 0 }}>
            <label>Sales Tax / VAT Portion Paid ({currencySymbol || 'R'}) (For Deductions)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}

        <div className="form-group" style={{ margin: 0 }}>
          <label>Payment Reference / Transaction ID</label>
          <input
            type="text"
            className="input"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. ACH-90812, Wire Ref, Stripe ID, Receipt #"
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Notes & Memo</label>
          <input
            type="text"
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Description or audit notes..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={`btn ${type === 'income' ? 'btn-success' : 'btn-danger'}`} disabled={saving}>
            {saving ? 'Recording...' : `Record ${type === 'income' ? v('payment_s', 'Income') : v('expense_s', 'Expense')}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
