import React, { useState, useEffect } from 'react';
import { AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { api } from '../../services/api';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';

export default function ItemModal({ isOpen, onClose, itemToEdit, onSaved }) {
  const { v } = useVocab();
  const { currencySymbol } = useSettings();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [type, setType] = useState('Product');
  const [unitPrice, setUnitPrice] = useState('');
  const [description, setDescription] = useState('');
  const [taxable, setTaxable] = useState(true);
  const [hasLogo, setHasLogo] = useState(true);
  const [logoUrl, setLogoUrl] = useState('/logo.png');

  const [itemTypes, setItemTypes] = useState(['Product', 'Service', 'Fee', 'Discount']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.getTypes().then(res => {
        if (res.data && res.data.itemTypes) {
          setItemTypes(res.data.itemTypes.map(t => t.name));
        }
      }).catch(console.error);

      if (itemToEdit) {
        setName(itemToEdit.name || '');
        setSku(itemToEdit.sku || '');
        setType(itemToEdit.type || 'Product');
        setUnitPrice(String(itemToEdit.unitPrice || 0));
        setDescription(itemToEdit.description || '');
        setTaxable(itemToEdit.taxable !== undefined ? itemToEdit.taxable : true);
        setHasLogo(itemToEdit.hasLogo !== undefined ? itemToEdit.hasLogo : true);
        setLogoUrl(itemToEdit.logoUrl || '/logo.png');
      } else {
        setName('');
        setSku(`WPA-${Math.floor(1000 + Math.random() * 9000)}`);
        setType('Product');
        setUnitPrice('');
        setDescription('');
        setTaxable(true);
        setHasLogo(true);
        setLogoUrl('/logo.png');
      }
      setError(null);
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        type,
        unitPrice: parseFloat(unitPrice) || 0,
        description: description.trim(),
        taxable,
        hasLogo,
        logoUrl: hasLogo ? (logoUrl || '/logo.png') : ''
      };

      if (itemToEdit) {
        await api.updateItem(itemToEdit.id, payload);
      } else {
        await api.createItem(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? `Edit ${v('item_s', 'Item')} • ${itemToEdit.name}` : `New ${v('item_s', 'Catalog Item')}`}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        <div className="form-group" style={{ margin: 0 }}>
          <label>Item Name *</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Web Pros Africa Cloud Hosting Enterprise"
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>SKU / Item Code</label>
            <input
              type="text"
              className="input"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. WPA-HOST-001"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Item Type</label>
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {itemTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Standard Unit Price ({currencySymbol || 'R'}) *</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0, justifyContent: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '24px' }}>
              <input
                type="checkbox"
                checked={taxable}
                onChange={(e) => setTaxable(e.target.checked)}
              />
              <span>Subject to Sales Tax / VAT</span>
            </label>
          </div>
        </div>

        {/* Product Logo Branding Section */}
        <div style={{
          background: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={hasLogo}
                onChange={(e) => setHasLogo(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>Carry Web Pros Africa Official Logo</span>
            </label>
            {hasLogo && (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> Branded Product
              </span>
            )}
          </div>

          {hasLogo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
              <div style={{
                width: '60px',
                height: '48px',
                borderRadius: '8px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                flexShrink: 0
              }}>
                <img
                  src={logoUrl || '/logo.png'}
                  alt="Product Logo Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Logo Asset URL</label>
                <input
                  type="text"
                  className="input"
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="/logo.png or custom image URL"
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Description & Scope</label>
          <textarea
            className="textarea"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description inserted into line items and quotes..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : itemToEdit ? 'Save Changes' : `Create ${v('item_s', 'Item')}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
