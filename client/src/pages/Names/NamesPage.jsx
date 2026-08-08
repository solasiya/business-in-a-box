import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Trash2,
  Building,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { api } from '../../services/api';
import { useVocab } from '../../context/VocabContext';
import NameModal from './NameModal';

export default function NamesPage({ initialType = null }) {
  const { v } = useVocab();
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialType || 'all'); // all, customer, vendor, employee
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);
  const [defaultContactType, setDefaultContactType] = useState('customer');

  const fetchNames = async () => {
    try {
      setLoading(true);
      const res = await api.getNames();
      if (res && res.data) {
        setNames(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch names:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNames();
  }, []);

  const handleCreateNew = (type) => {
    setContactToEdit(null);
    setDefaultContactType(type || (activeTab === 'all' ? 'customer' : activeTab));
    setModalOpen(true);
  };

  const handleEdit = (contact) => {
    setContactToEdit(contact);
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.deleteName(id);
        fetchNames();
      } catch (err) {
        alert('Failed to delete contact: ' + err.message);
      }
    }
  };

  const filteredNames = names.filter(n => {
    const matchesTab = activeTab === 'all' || n.type === activeTab;
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query ||
      (n.name && n.name.toLowerCase().includes(query)) ||
      (n.companyName && n.companyName.toLowerCase().includes(query)) ||
      (n.email && n.email.toLowerCase().includes(query)) ||
      (n.phone && n.phone.toLowerCase().includes(query)) ||
      (n.address && n.address.toLowerCase().includes(query));
    return matchesTab && matchesQuery;
  });

  const getContactBadge = (type) => {
    if (type === 'vendor') return <span className="badge badge-warning">{v('vendor_s', 'Vendor')}</span>;
    if (type === 'employee') return <span className="badge badge-info">{v('employee_s', 'Employee')}</span>;
    return <span className="badge badge-success">{v('customer_s', 'Customer')}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Contacts Directory (Names)</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Manage {v('customer_p', 'Customers')}, {v('vendor_p', 'Vendors')}, and {v('employee_p', 'Employees')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => handleCreateNew('vendor')}>
            <Plus size={15} />
            New {v('vendor_s', 'Vendor')}
          </button>
          <button className="btn btn-secondary" onClick={() => handleCreateNew('employee')}>
            <Plus size={15} />
            New {v('employee_s', 'Employee')}
          </button>
          <button className="btn btn-primary" onClick={() => handleCreateNew('customer')}>
            <Plus size={15} />
            New {v('customer_s', 'Customer')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Contacts ({names.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          {v('customer_p', 'Customers')} ({names.filter(n => n.type === 'customer').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'vendor' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendor')}
        >
          {v('vendor_p', 'Vendors')} ({names.filter(n => n.type === 'vendor').length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
          onClick={() => setActiveTab('employee')}
        >
          {v('employee_p', 'Employees')} ({names.filter(n => n.type === 'employee').length})
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
        <input
          type="text"
          className="input"
          style={{ paddingLeft: '36px' }}
          placeholder="Search by name, company, email, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Contact Cards Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading directory...
        </div>
      ) : filteredNames.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No contact records match your search criteria.
        </div>
      ) : (
        <div className="grid-3">
          {filteredNames.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{c.name || c.companyName}</h3>
                  {c.companyName && c.name && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Building size={13} />
                      <span>{c.companyName}</span>
                    </div>
                  )}
                </div>
                {getContactBadge(c.type)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {c.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} color="#818cf8" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="#10b981" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.775rem' }}>{c.address}</span>
                  </div>
                )}
              </div>

              {c.notes && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-surface)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {c.notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: 'auto' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleEdit(c)}
                  title="Edit Contact"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent-danger)' }}
                  onClick={() => handleDelete(c.id, c.name || c.companyName)}
                  title="Delete Contact"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <NameModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          contactToEdit={contactToEdit}
          defaultType={defaultContactType}
          onSaved={fetchNames}
        />
      )}
    </div>
  );
}
