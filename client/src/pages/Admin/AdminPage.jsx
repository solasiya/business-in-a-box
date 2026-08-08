import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Languages, 
  Building, 
  Percent, 
  Sliders, 
  MessageSquare, 
  ListOrdered, 
  Database,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useVocab } from '../../context/VocabContext';
import { api } from '../../services/api';

export default function AdminPage() {
  const { settings, updateSettings, refreshSettings } = useSettings();
  const { vocab, refreshVocab } = useVocab();

  const [activeAdminTab, setActiveAdminTab] = useState('vocab'); // 'vocab', 'company', 'tax', 'defaults', 'messages', 'types', 'sheets'

  // Local Form States
  const [vocabForm, setVocabForm] = useState(vocab);
  const [companyForm, setCompanyForm] = useState(settings.company || {});
  const [taxForm, setTaxForm] = useState(settings.tax || {});
  const [defaultsForm, setDefaultsForm] = useState(settings.defaults || {});
  const [messagesForm, setMessagesForm] = useState(settings.orderMessages || {});
  const [sheetsForm, setSheetsForm] = useState(settings.googleSheets || {});

  // Dynamic Type Lists
  const [itemTypes, setItemTypes] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCategory, setNewTypeCategory] = useState('items');

  // Status indicators
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sheetTesting, setSheetTesting] = useState(false);
  const [sheetExporting, setSheetExporting] = useState(false);
  const [sheetStatusMsg, setSheetStatusMsg] = useState(null);

  useEffect(() => {
    if (settings) {
      setVocabForm(settings.vocabulary || vocab);
      setCompanyForm(settings.company || {});
      setTaxForm(settings.tax || {});
      setDefaultsForm(settings.defaults || {});
      setMessagesForm(settings.orderMessages || {});
      setSheetsForm(settings.googleSheets || {});
    }
  }, [settings, vocab]);

  const loadTypes = async () => {
    try {
      const res = await api.getTypes();
      if (res && res.data) {
        setItemTypes(res.data.itemTypes || []);
        setExpenseTypes(res.data.expenseTypes || []);
        setIncomeTypes(res.data.incomeTypes || []);
      }
    } catch (err) {
      console.error('Failed to load types:', err);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const triggerSaveNotification = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Save Vocabulary
  const handleSaveVocab = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings({ vocabulary: vocabForm });
      await refreshVocab();
      triggerSaveNotification();
    } catch (err) {
      alert('Failed to save vocabulary: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Company Info
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings({ company: companyForm });
      triggerSaveNotification();
    } catch (err) {
      alert('Failed to save company information: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Tax Info
  const handleSaveTax = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings({ tax: taxForm });
      triggerSaveNotification();
    } catch (err) {
      alert('Failed to save tax settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Defaults
  const handleSaveDefaults = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings({ defaults: defaultsForm });
      triggerSaveNotification();
    } catch (err) {
      alert('Failed to save defaults: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Messages
  const handleSaveMessages = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings({ orderMessages: messagesForm });
      triggerSaveNotification();
    } catch (err) {
      alert('Failed to save order messages: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Save Google Sheets Config
  const handleSaveSheetsConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings({ googleSheets: sheetsForm });
      triggerSaveNotification();
    } catch (err) {
      alert('Failed to save Google Sheets settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Test Google Sheet Connection
  const handleTestSheets = async () => {
    try {
      setSheetTesting(true);
      setSheetStatusMsg(null);
      const res = await api.testGoogleSheets(sheetsForm);
      if (res.success) {
        setSheetStatusMsg({ type: 'success', text: res.message || 'Connected successfully!' });
      } else {
        setSheetStatusMsg({ type: 'error', text: res.error || 'Connection failed.' });
      }
    } catch (err) {
      setSheetStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSheetTesting(false);
    }
  };

  // Export to Google Sheets
  const handleExportSheets = async () => {
    try {
      setSheetExporting(true);
      setSheetStatusMsg(null);
      const res = await api.exportToGoogleSheets(sheetsForm);
      if (res.success) {
        setSheetStatusMsg({ type: 'success', text: res.message });
        refreshSettings();
      } else {
        setSheetStatusMsg({ type: 'error', text: res.error });
      }
    } catch (err) {
      setSheetStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSheetExporting(false);
    }
  };

  // Add Type item
  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    try {
      if (newTypeCategory === 'items') {
        await api.createItemType({ name: newTypeName.trim(), description: 'User defined item category' });
      } else if (newTypeCategory === 'expenses') {
        await api.createExpenseType({ name: newTypeName.trim(), description: 'User defined expense category' });
      } else if (newTypeCategory === 'income') {
        await api.createIncomeType({ name: newTypeName.trim(), description: 'User defined income category' });
      }
      setNewTypeName('');
      loadTypes();
    } catch (err) {
      alert('Failed to add type: ' + err.message);
    }
  };

  const handleDeleteType = async (category, id) => {
    if (window.confirm('Delete this type category?')) {
      try {
        if (category === 'items') await api.deleteItemType(id);
        else if (category === 'expenses') await api.deleteExpenseType(id);
        else if (category === 'income') await api.deleteIncomeType(id);
        loadTypes();
      } catch (err) {
        alert('Failed to delete category: ' + err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Save Feedback */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin & Settings</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Configure system vocabulary, company branding, tax rules, templates, and Google Sheets synchronization
          </p>
        </div>

        {saveSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent-success-bg)',
            color: 'var(--accent-success)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <CheckCircle size={16} />
            <span>Settings Saved & Propagated System-Wide!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'vocab', label: 'Vocabulary Relabeling', icon: Languages },
          { id: 'company', label: 'Company & Letterhead', icon: Building },
          { id: 'tax', label: 'Tax Configuration', icon: Percent },
          { id: 'defaults', label: 'Application Defaults', icon: Sliders },
          { id: 'messages', label: 'Order PDF Messages', icon: MessageSquare },
          { id: 'types', label: 'Category Types', icon: ListOrdered },
          { id: 'sheets', label: 'Google Sheets Database', icon: Database }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`tab-btn ${activeAdminTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveAdminTab(t.id)}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: VOCABULARY RELABELING */}
      {activeAdminTab === 'vocab' && (
        <form onSubmit={handleSaveVocab} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>System-Wide Vocabulary Engine</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Relabel core terms across the entire application in real time. Changes immediately update all navigation links, table headers, form labels, and PDF documents.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {[
              { id: 'quote', defaultS: 'Quote', defaultP: 'Quotes', note: 'e.g. Proposals, Estimates, Bids' },
              { id: 'invoice', defaultS: 'Invoice', defaultP: 'Invoices', note: 'e.g. Bills, Receipts, Sales Orders' },
              { id: 'purchase', defaultS: 'Purchase', defaultP: 'Purchases', note: 'e.g. Purchase Orders, POs, Buy Orders' },
              { id: 'expense', defaultS: 'Expense', defaultP: 'Expenses', note: 'e.g. Costs, Outgoings, Expenditures' },
              { id: 'payment', defaultS: 'Payment / Income', defaultP: 'Payments & Income', note: 'e.g. Revenue, Receipts, Inflow' },
              { id: 'item', defaultS: 'Item', defaultP: 'Items', note: 'e.g. Inventory, Products, Services, Catalog' },
              { id: 'vendor', defaultS: 'Vendor', defaultP: 'Vendors', note: 'e.g. Suppliers, Contractors, Partners' },
              { id: 'employee', defaultS: 'Employee', defaultP: 'Employees', note: 'e.g. Staff, Team Members, Personnel' },
              { id: 'customer', defaultS: 'Customer', defaultP: 'Customers', note: 'e.g. Clients, Buyers, Accounts' }
            ].map(term => (
              <div
                key={term.id}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#818cf8' }}>
                    {term.defaultP} Concept
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{term.note}</span>
                </div>

                <div className="grid-2">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Singular Label</label>
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: '0.85rem', padding: '7px 10px' }}
                      value={vocabForm[`${term.id}_s`] || ''}
                      onChange={(e) => setVocabForm({ ...vocabForm, [`${term.id}_s`]: e.target.value })}
                      placeholder={term.defaultS}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Plural Label</label>
                    <input
                      type="text"
                      className="input"
                      style={{ fontSize: '0.85rem', padding: '7px 10px' }}
                      value={vocabForm[`${term.id}_p`] || ''}
                      onChange={(e) => setVocabForm({ ...vocabForm, [`${term.id}_p`]: e.target.value })}
                      placeholder={term.defaultP}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Apply Vocabulary Changes'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: COMPANY INFORMATION */}
      {activeAdminTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Company Information & PDF Letterhead</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Used on generated PDF quotes, invoices, and purchase orders.
            </p>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Company Legal / Trading Name *</label>
              <input
                type="text"
                className="input"
                value={companyForm.name || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="e.g. Apex Velocity Solutions Inc."
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Tagline / Subtitle</label>
              <input
                type="text"
                className="input"
                value={companyForm.tagline || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
                placeholder="e.g. Enterprise Modern Management Suite"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Address Line 1</label>
              <input
                type="text"
                className="input"
                value={companyForm.address1 || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, address1: e.target.value })}
                placeholder="500 Howard Street, Suite 1200"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Address Line 2 (City, State, Zip, Country)</label>
              <input
                type="text"
                className="input"
                value={companyForm.address2 || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, address2: e.target.value })}
                placeholder="San Francisco, CA 94105, USA"
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Billing & Contact Email</label>
              <input
                type="email"
                className="input"
                value={companyForm.email || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                placeholder="billing@company.com"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Phone Number</label>
              <input
                type="tel"
                className="input"
                value={companyForm.phone || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                placeholder="+1 (415) 555-0199"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Tax Registration / EIN / VAT #</label>
              <input
                type="text"
                className="input"
                value={companyForm.taxNumber || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, taxNumber: e.target.value })}
                placeholder="e.g. US-88-2940182"
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Website URL</label>
            <input
              type="url"
              className="input"
              value={companyForm.website || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
              placeholder="https://www.company.com"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Company Details'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TAX CONFIGURATION */}
      {activeAdminTab === 'tax' && (
        <form onSubmit={handleSaveTax} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Tax Information & Rules</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Configure automatic sales tax calculation across orders and invoices.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={taxForm.useSalesTax || false}
                onChange={(e) => setTaxForm({ ...taxForm, useSalesTax: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Enable Automatic Sales Tax on Orders & Invoices</span>
            </label>

            {taxForm.useSalesTax && (
              <div className="grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Tax Name (e.g. Sales Tax, GST, VAT, HST)</label>
                  <input
                    type="text"
                    className="input"
                    value={taxForm.taxName || ''}
                    onChange={(e) => setTaxForm({ ...taxForm, taxName: e.target.value })}
                    placeholder="Sales Tax (GST)"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Tax Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input"
                    value={taxForm.taxPercentage !== undefined ? taxForm.taxPercentage : ''}
                    onChange={(e) => setTaxForm({ ...taxForm, taxPercentage: parseFloat(e.target.value) || 0 })}
                    placeholder="8.5"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Tax Configuration'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: APPLICATION DEFAULTS */}
      {activeAdminTab === 'defaults' && (
        <form onSubmit={handleSaveDefaults} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Application Defaults</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Set standard pre-selected options for new orders, invoices, and transactions.
            </p>
          </div>

          <div className="grid-3" style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Currency Symbol</label>
              <input
                type="text"
                className="input"
                value={defaultsForm.currencySymbol || 'R'}
                onChange={(e) => setDefaultsForm({ ...defaultsForm, currencySymbol: e.target.value })}
                placeholder="R"
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>e.g. R (Rand), $, €, £</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Currency ISO Code</label>
              <input
                type="text"
                className="input"
                value={defaultsForm.currencyCode || 'ZAR'}
                onChange={(e) => setDefaultsForm({ ...defaultsForm, currencyCode: e.target.value })}
                placeholder="ZAR"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Currency Display Name</label>
              <input
                type="text"
                className="input"
                value={defaultsForm.currencyName || 'South African Rand (ZAR)'}
                onChange={(e) => setDefaultsForm({ ...defaultsForm, currencyName: e.target.value })}
                placeholder="South African Rand (ZAR)"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Default Payment Due Period (Days)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={defaultsForm.defaultDueDays || 30}
                onChange={(e) => setDefaultsForm({ ...defaultsForm, defaultDueDays: parseInt(e.target.value) || 30 })}
                placeholder="30"
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Net 15, Net 30, Net 60, etc.</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Default Catalog Item Type</label>
              <select
                className="select"
                value={defaultsForm.defaultItemType || 'Service'}
                onChange={(e) => setDefaultsForm({ ...defaultsForm, defaultItemType: e.target.value })}
              >
                {itemTypes.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Default Income Category</label>
              <select
                className="select"
                value={defaultsForm.defaultIncomeType || ''}
                onChange={(e) => setDefaultsForm({ ...defaultsForm, defaultIncomeType: e.target.value })}
              >
                {incomeTypes.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Default Expense Category</label>
              <select
                className="select"
                value={defaultsForm.defaultExpenseType || ''}
                onChange={(e) => setDefaultsForm({ ...defaultsForm, defaultExpenseType: e.target.value })}
              >
                {expenseTypes.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Defaults'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: ORDER CUSTOM MESSAGES */}
      {activeAdminTab === 'messages' && (
        <form onSubmit={handleSaveMessages} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Order Custom Messages (PDF Footers)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Standard terms, conditions, and payment instructions automatically inserted into generated PDF documents.
            </p>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>{vocab.quote_s || 'Quote'} Footer & Acceptance Terms</label>
            <textarea
              className="textarea"
              rows="3"
              value={messagesForm.quote || ''}
              onChange={(e) => setMessagesForm({ ...messagesForm, quote: e.target.value })}
              placeholder="e.g. Thank you for considering our proposal. This quote is valid for 30 days..."
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>{vocab.invoice_s || 'Invoice'} Footer & Remittance Instructions</label>
            <textarea
              className="textarea"
              rows="3"
              value={messagesForm.invoice || ''}
              onChange={(e) => setMessagesForm({ ...messagesForm, invoice: e.target.value })}
              placeholder="e.g. Payment is due within 30 days of invoice date. Wire and ACH details..."
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>{vocab.purchase_s || 'Purchase'} Order Terms & Delivery Instructions</label>
            <textarea
              className="textarea"
              rows="3"
              value={messagesForm.purchase || ''}
              onChange={(e) => setMessagesForm({ ...messagesForm, purchase: e.target.value })}
              placeholder="e.g. Please confirm purchase order acceptance within 48 hours..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Document Messages'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: CATEGORY TYPES */}
      {activeAdminTab === 'types' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Add Type Card */}
          <form onSubmit={handleAddType} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label>Add New Category Type</label>
              <input
                type="text"
                className="input"
                placeholder="Category name..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0, width: '220px' }}>
              <label>Module / Concept</label>
              <select
                className="select"
                value={newTypeCategory}
                onChange={(e) => setNewTypeCategory(e.target.value)}
              >
                <option value="items">Item Types ({vocab.item_p || 'Items'})</option>
                <option value="expenses">Expense Types ({vocab.expense_p || 'Expenses'})</option>
                <option value="income">Income Types ({vocab.payment_p || 'Income'})</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              Add Category
            </button>
          </form>

          {/* Three Column List */}
          <div className="grid-3">
            {/* Item Types */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#818cf8' }}>
                {vocab.item_s || 'Item'} Types
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {itemTypes.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.name}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-danger)', padding: '4px' }}
                      onClick={() => handleDeleteType('items', t.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Types */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#ef4444' }}>
                {vocab.expense_s || 'Expense'} Types
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {expenseTypes.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.name}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-danger)', padding: '4px' }}
                      onClick={() => handleDeleteType('expenses', t.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Types */}
            <div className="card">
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#10b981' }}>
                {vocab.payment_s || 'Income'} Types
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {incomeTypes.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.name}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-danger)', padding: '4px' }}
                      onClick={() => handleDeleteType('income', t.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: GOOGLE SHEETS DATABASE */}
      {activeAdminTab === 'sheets' && (
        <form onSubmit={handleSaveSheetsConfig} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Google Sheets Database Integration</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Connect your live Google Sheet spreadsheet to automatically synchronize or export Orders, Transactions, Contacts, and Catalog items into cloud tabs.
            </p>
          </div>

          {sheetStatusMsg && (
            <div style={{
              background: sheetStatusMsg.type === 'success' ? 'var(--accent-success-bg)' : 'var(--accent-danger-bg)',
              border: `1px solid ${sheetStatusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              color: sheetStatusMsg.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {sheetStatusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{sheetStatusMsg.text}</span>
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label>Google Spreadsheet ID *</label>
            <input
              type="text"
              className="input"
              value={sheetsForm.sheetId || ''}
              onChange={(e) => setSheetsForm({ ...sheetsForm, sheetId: e.target.value })}
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Found in your Google Sheet URL: https://docs.google.com/spreadsheets/d/<strong>[SPREADSHEET_ID]</strong>/edit
            </span>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Google Service Account Client Email</label>
            <input
              type="email"
              className="input"
              value={sheetsForm.clientEmail || ''}
              onChange={(e) => setSheetsForm({ ...sheetsForm, clientEmail: e.target.value })}
              placeholder="service-account@project-id.iam.gserviceaccount.com"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Service Account Private Key (JSON / PEM format)</label>
            <textarea
              className="textarea"
              rows="3"
              value={sheetsForm.privateKey || ''}
              onChange={(e) => setSheetsForm({ ...sheetsForm, privateKey: e.target.value })}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
            />
          </div>

          {sheetsForm.lastSynced && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Last synchronized with Google Sheets: {new Date(sheetsForm.lastSynced).toLocaleString()}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTestSheets}
                disabled={sheetTesting || !sheetsForm.sheetId}
              >
                <RefreshCw size={15} className={sheetTesting ? 'animate-spin' : ''} />
                {sheetTesting ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportSheets}
                disabled={sheetExporting || !sheetsForm.sheetId}
              >
                <Database size={15} />
                {sheetExporting ? 'Exporting...' : 'Export Local Data to Sheet'}
              </button>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Google Sheets Config'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
