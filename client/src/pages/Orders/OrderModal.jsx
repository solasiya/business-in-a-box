import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Check, AlertCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { api } from '../../services/api';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';

export default function OrderModal({ isOpen, onClose, orderToEdit, defaultType = 'invoice', onSaved }) {
  const { v } = useVocab();
  const { settings, currencySymbol } = useSettings();

  const [orderType, setOrderType] = useState(defaultType);
  const [orderNumber, setOrderNumber] = useState('');
  const [nameId, setNameId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [useSalesTax, setUseSalesTax] = useState(true);
  const [taxPercentage, setTaxPercentage] = useState(8.5);
  const [taxName, setTaxName] = useState('Sales Tax');
  const [amountPaid, setAmountPaid] = useState(0);

  const [lineItems, setLineItems] = useState([
    { id: 'li-1', itemId: '', description: '', quantity: 1, unitPrice: 0, taxable: true }
  ]);

  const [namesList, setNamesList] = useState([]);
  const [itemsCatalog, setItemsCatalog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load Names & Catalog Items
  useEffect(() => {
    if (isOpen) {
      api.getNames().then(res => setNamesList(res.data || [])).catch(console.error);
      api.getItems().then(res => setItemsCatalog(res.data || [])).catch(console.error);
    }
  }, [isOpen]);

  // Initialize or populate form
  useEffect(() => {
    if (orderToEdit) {
      setOrderType(orderToEdit.orderType || 'invoice');
      setOrderNumber(orderToEdit.orderNumber || '');
      setNameId(orderToEdit.nameId || '');
      setDate(orderToEdit.date || new Date().toISOString().split('T')[0]);
      setDueDate(orderToEdit.dueDate || '');
      setStatus(orderToEdit.status || 'Draft');
      setNotes(orderToEdit.notes || '');
      setCustomMessage(orderToEdit.customMessage || '');
      setUseSalesTax(orderToEdit.useSalesTax !== undefined ? orderToEdit.useSalesTax : true);
      setTaxPercentage(orderToEdit.taxPercentage !== undefined ? orderToEdit.taxPercentage : settings.tax?.taxPercentage || 8.5);
      setTaxName(orderToEdit.taxName || settings.tax?.taxName || 'Sales Tax');
      setAmountPaid(orderToEdit.amountPaid || 0);
      setLineItems(orderToEdit.lineItems && orderToEdit.lineItems.length > 0 ? orderToEdit.lineItems : [
        { id: 'li-1', itemId: '', description: '', quantity: 1, unitPrice: 0, taxable: true }
      ]);
    } else {
      const type = defaultType || 'invoice';
      setOrderType(type);
      setOrderNumber('');
      setNameId('');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      const dueDays = settings.defaults?.defaultDueDays || 30;
      const due = new Date(Date.now() + dueDays * 86400000).toISOString().split('T')[0];
      setDueDate(due);
      setStatus(type === 'quote' ? 'Sent' : 'Draft');
      setNotes('');
      setCustomMessage(settings.orderMessages?.[type] || '');
      setUseSalesTax(settings.tax?.useSalesTax !== undefined ? settings.tax.useSalesTax : true);
      setTaxPercentage(settings.tax?.taxPercentage || 8.5);
      setTaxName(settings.tax?.taxName || 'Sales Tax');
      setAmountPaid(0);
      setLineItems([
        { id: 'li-1', itemId: '', description: '', quantity: 1, unitPrice: 0, taxable: true }
      ]);
    }
    setError(null);
  }, [orderToEdit, defaultType, isOpen, settings]);

  // Line item handlers
  const handleItemSelect = (index, selectedItemId) => {
    const selectedCatalogItem = itemsCatalog.find(i => i.id === selectedItemId);
    const updated = [...lineItems];
    if (selectedCatalogItem) {
      updated[index] = {
        ...updated[index],
        itemId: selectedCatalogItem.id,
        description: selectedCatalogItem.name + (selectedCatalogItem.description ? ` - ${selectedCatalogItem.description}` : ''),
        unitPrice: selectedCatalogItem.unitPrice,
        taxable: selectedCatalogItem.taxable !== undefined ? selectedCatalogItem.taxable : true
      };
    } else {
      updated[index] = {
        ...updated[index],
        itemId: '',
        description: '',
        unitPrice: 0,
        taxable: true
      };
    }
    setLineItems(updated);
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: `li-${Date.now()}`, itemId: '', description: '', quantity: 1, unitPrice: 0, taxable: true }
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
  };

  // Calculations
  let subtotal = 0;
  let taxableSubtotal = 0;
  lineItems.forEach(item => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseFloat(item.unitPrice) || 0;
    const amt = q * p;
    subtotal += amt;
    if (item.taxable !== false) {
      taxableSubtotal += amt;
    }
  });

  const taxRate = useSalesTax ? (parseFloat(taxPercentage) || 0) / 100 : 0;
  const taxAmount = Math.round(taxableSubtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const balanceDue = Math.max(0, Math.round((total - (parseFloat(amountPaid) || 0)) * 100) / 100);

  // Filter contacts based on order type (Purchases -> Vendors, Quotes/Invoices -> Customers)
  const filteredContacts = namesList.filter(n => {
    if (orderType === 'purchase') {
      return n.type === 'vendor';
    }
    return n.type === 'customer' || n.type === 'vendor';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameId) {
      setError('Please select a linked contact.');
      return;
    }
    if (lineItems.length === 0 || lineItems.every(li => !li.description)) {
      setError('Please add at least one line item with a description.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        orderType,
        orderNumber: orderNumber.trim() || undefined,
        nameId,
        date,
        dueDate,
        status,
        notes,
        customMessage,
        useSalesTax,
        taxPercentage: parseFloat(taxPercentage) || 0,
        taxName,
        lineItems,
        amountPaid: parseFloat(amountPaid) || 0
      };

      if (orderToEdit) {
        await api.updateOrder(orderToEdit.id, payload);
      } else {
        await api.createOrder(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save order.');
    } finally {
      setSaving(false);
    }
  };

  const getDocTypeLabel = () => {
    if (orderType === 'quote') return v('quote_s', 'Quote');
    if (orderType === 'purchase') return v('purchase_s', 'Purchase');
    return v('invoice_s', 'Invoice');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={orderToEdit ? `Edit ${getDocTypeLabel()} • ${orderToEdit.orderNumber}` : `Create New ${getDocTypeLabel()}`}
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

        {/* Order Type Selector */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { id: 'invoice', label: v('invoice_s', 'Invoice') },
            { id: 'quote', label: v('quote_s', 'Quote') },
            { id: 'purchase', label: v('purchase_s', 'Purchase') }
          ].map(t => (
            <button
              type="button"
              key={t.id}
              onClick={() => {
                setOrderType(t.id);
                setCustomMessage(settings.orderMessages?.[t.id] || '');
              }}
              className={`btn btn-sm ${orderType === t.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px 12px' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid Meta Information */}
        <div className="grid-3">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Order Number (Auto or Custom)</label>
            <input
              type="text"
              className="input"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. INV-2026-001"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Linked {orderType === 'purchase' ? v('vendor_s', 'Vendor') : v('customer_s', 'Customer')} *</label>
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

          <div className="form-group" style={{ margin: 0 }}>
            <label>Status</label>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Issue Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Payment Due Date</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.85rem' }}>Line Items</label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addLineItem}
            >
              <Plus size={13} />
              Add Item
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lineItems.map((li, index) => {
              const lineAmt = (parseFloat(li.quantity) || 0) * (parseFloat(li.unitPrice) || 0);
              return (
                <div
                  key={li.id || index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '170px 1fr 70px 100px 90px 40px',
                    gap: '8px',
                    alignItems: 'center',
                    background: 'var(--bg-surface)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {/* Preset Catalog Picker */}
                  <select
                    className="select"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={li.itemId || ''}
                    onChange={(e) => handleItemSelect(index, e.target.value)}
                  >
                    <option value="">-- Custom Item --</option>
                    {itemsCatalog.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({currencySymbol || 'R'} {item.unitPrice})
                      </option>
                    ))}
                  </select>

                  {/* Description */}
                  <input
                    type="text"
                    className="input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    placeholder="Description or task details..."
                    value={li.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    required
                  />

                  {/* Quantity */}
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className="input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px', textAlign: 'center' }}
                    placeholder="Qty"
                    value={li.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                    required
                  />

                  {/* Unit Price */}
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px', textAlign: 'right' }}
                    placeholder="Price"
                    value={li.unitPrice}
                    onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                    required
                  />

                  {/* Total */}
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>
                    {currencySymbol || 'R'} {lineAmt.toFixed(2)}
                  </div>

                  {/* Delete Row */}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px', color: 'var(--accent-danger)' }}
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length <= 1}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals & Tax Box */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* Tax Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useSalesTax}
                onChange={(e) => setUseSalesTax(e.target.checked)}
              />
              <span style={{ fontSize: '0.85rem' }}>Apply {taxName} ({taxPercentage}%)</span>
            </label>

            {useSalesTax && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input"
                  style={{ width: '130px', fontSize: '0.75rem', padding: '4px 8px' }}
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  placeholder="Tax Label"
                />
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  style={{ width: '70px', fontSize: '0.75rem', padding: '4px 8px' }}
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                  placeholder="%"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
              </div>
            )}
          </div>

          {/* Breakdown summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '220px', textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>{currencySymbol || 'R'} {subtotal.toFixed(2)}</span>
            </div>
            {useSalesTax && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{taxName}:</span>
                <span style={{ fontWeight: 600 }}>{currencySymbol || 'R'} {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-primary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
              <span>Total:</span>
              <span>{currencySymbol || 'R'} {total.toFixed(2)}</span>
            </div>

            {orderType === 'invoice' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  style={{ width: '100px', fontSize: '0.8rem', padding: '3px 6px', textAlign: 'right' }}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Custom Message / Terms Footer */}
        <div className="form-group" style={{ margin: 0 }}>
          <label>Document Footer & Terms (Included on Generated PDF)</label>
          <textarea
            className="textarea"
            rows="2"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Custom payment instructions, terms, or warranty..."
          />
        </div>

        {/* Internal Notes */}
        <div className="form-group" style={{ margin: 0 }}>
          <label>Internal Notes (Private)</label>
          <input
            type="text"
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Private notes for team..."
          />
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : orderToEdit ? 'Save Changes' : `Create ${getDocTypeLabel()}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
