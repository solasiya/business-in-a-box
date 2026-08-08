import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  Tag, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { useVocab } from '../../context/VocabContext';
import { useSettings } from '../../context/SettingsContext';
import ItemModal from './ItemModal';

export default function ItemsPage() {
  const { v } = useVocab();
  const { currencySymbol } = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.getItems();
      if (res && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch catalog items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreateNew = () => {
    setItemToEdit(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setItemToEdit(item);
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.deleteItem(id);
        fetchItems();
      } catch (err) {
        alert('Failed to delete item: ' + err.message);
      }
    }
  };

  const typesList = ['all', ...Array.from(new Set(items.map(i => i.type)))];

  const filteredItems = items.filter(item => {
    const matchesType = typeFilter === 'all' || item.type.toLowerCase() === typeFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.sku && item.sku.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query));
    return matchesType && matchesQuery;
  });

  const getTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'service':
        return <span className="badge badge-info">Service</span>;
      case 'product':
        return <span className="badge badge-success">Product</span>;
      case 'fee':
        return <span className="badge badge-warning">Fee</span>;
      case 'discount':
        return <span className="badge badge-danger">Discount</span>;
      default:
        return <span className="badge badge-secondary">{type}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{v('item_p', 'Items')} & Products Catalog</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Manage branded products and services carrying the official Web Pros Africa logo
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleCreateNew}>
          <Plus size={15} />
          New {v('item_s', 'Item')}
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
            placeholder={`Search ${v('item_p', 'items')}, SKUs, descriptions...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: '160px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {typesList.map(t => (
            <option key={t} value={t}>
              {t === 'all' ? 'All Types' : t}
            </option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Branding</th>
              <th>SKU</th>
              <th>Name & Description</th>
              <th>Type</th>
              <th>Taxable</th>
              <th style={{ textAlign: 'right' }}>Standard Price</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading catalog items...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No items match your search.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id}>
                  {/* Branding / Logo column */}
                  <td style={{ width: '70px' }}>
                    {item.hasLogo !== false ? (
                      <div
                        title="Carries Web Pros Africa Logo"
                        style={{
                          width: '42px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        <img
                          src={item.logoUrl || '/logo.png'}
                          alt="Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  <td>
                    <code style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                      {item.sku || '—'}
                    </code>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{item.name}</span>
                      {item.hasLogo !== false && (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          <Sparkles size={10} /> Logo
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '420px', marginTop: '2px' }}>
                        {item.description}
                      </div>
                    )}
                  </td>

                  <td>{getTypeBadge(item.type)}</td>

                  <td>
                    {item.taxable ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#10b981' }}>
                        <CheckCircle size={14} /> Yes
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <XCircle size={14} /> No
                      </span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                    {currencySymbol || 'R'} {(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px' }}
                        title="Edit Item"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '6px', color: 'var(--accent-danger)' }}
                        title="Delete Item"
                        onClick={() => handleDelete(item.id, item.name)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <ItemModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          itemToEdit={itemToEdit}
          onSaved={fetchItems}
        />
      )}
    </div>
  );
}
