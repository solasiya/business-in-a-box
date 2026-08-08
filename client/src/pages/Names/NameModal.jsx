import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { api } from '../../services/api';
import { useVocab } from '../../context/VocabContext';

export default function NameModal({ isOpen, onClose, contactToEdit, defaultType = 'customer', onSaved }) {
  const { v } = useVocab();

  const [type, setType] = useState(defaultType); // customer, vendor, employee
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contactToEdit) {
      setType(contactToEdit.type || 'customer');
      setName(contactToEdit.name || '');
      setCompanyName(contactToEdit.companyName || '');
      setEmail(contactToEdit.email || '');
      setPhone(contactToEdit.phone || '');
      setAddress(contactToEdit.address || '');
      setNotes(contactToEdit.notes || '');
    } else {
      setType(defaultType || 'customer');
      setName('');
      setCompanyName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
    setError(null);
  }, [contactToEdit, defaultType, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() && !companyName.trim()) {
      setError('Please provide at least a contact name or company name.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        type,
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim()
      };

      if (contactToEdit) {
        await api.updateName(contactToEdit.id, payload);
      } else {
        await api.createName(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save contact record.');
    } finally {
      setSaving(false);
    }
  };

  const getTypeLabel = (t) => {
    if (t === 'vendor') return v('vendor_s', 'Vendor');
    if (t === 'employee') return v('employee_s', 'Employee');
    return v('customer_s', 'Customer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contactToEdit ? `Edit ${getTypeLabel(contactToEdit.type)}` : `New ${getTypeLabel(type)}`}
      maxWidth="550px"
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

        {/* Contact Type selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'customer', label: v('customer_s', 'Customer') },
            { id: 'vendor', label: v('vendor_s', 'Vendor') },
            { id: 'employee', label: v('employee_s', 'Employee') }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              className={`btn btn-sm ${type === t.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px' }}
              onClick={() => setType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Contact Name *</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>{type === 'employee' ? 'Title / Role' : 'Company / Organization'}</label>
            <input
              type="text"
              className="input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={type === 'employee' ? 'e.g. Lead Designer' : 'e.g. Acme Corp LLC'}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Phone Number</label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Address / Location</label>
          <textarea
            className="textarea"
            rows="2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address, city, state, zip code..."
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label>Notes & Payment Terms</label>
          <input
            type="text"
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special billing instructions or notes..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : contactToEdit ? 'Save Contact' : `Create ${getTypeLabel(type)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
