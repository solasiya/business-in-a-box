const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { defaultSeedData } = require('../services/seedData');

const DB_FILE = path.join(__dirname, 'data.json');

class DataStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.data = JSON.parse(JSON.stringify(defaultSeedData));
        this.persist();
      }
    } catch (err) {
      console.error('Error initializing DataStore from disk:', err);
      this.data = JSON.parse(JSON.stringify(defaultSeedData));
      this.persist();
    }
  }

  persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving data to disk:', err);
    }
  }

  // --- SETTINGS & VOCABULARY ---
  getSettings() {
    return this.data.settings;
  }

  updateSettings(patch) {
    this.data.settings = {
      ...this.data.settings,
      ...patch,
      vocabulary: {
        ...this.data.settings.vocabulary,
        ...(patch.vocabulary || {})
      },
      company: {
        ...this.data.settings.company,
        ...(patch.company || {})
      },
      tax: {
        ...this.data.settings.tax,
        ...(patch.tax || {})
      },
      defaults: {
        ...this.data.settings.defaults,
        ...(patch.defaults || {})
      },
      orderMessages: {
        ...this.data.settings.orderMessages,
        ...(patch.orderMessages || {})
      },
      googleSheets: {
        ...this.data.settings.googleSheets,
        ...(patch.googleSheets || {})
      }
    };
    this.persist();
    return this.data.settings;
  }

  // --- TYPES (Items, Expenses, Income) ---
  getItemTypes() {
    return this.data.item_types || [];
  }

  createItemType(typeData) {
    const newType = { id: `type-${Date.now()}`, ...typeData };
    this.data.item_types.push(newType);
    this.persist();
    return newType;
  }

  updateItemType(id, patch) {
    const index = this.data.item_types.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.data.item_types[index] = { ...this.data.item_types[index], ...patch };
    this.persist();
    return this.data.item_types[index];
  }

  deleteItemType(id) {
    const index = this.data.item_types.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.data.item_types.splice(index, 1);
    this.persist();
    return true;
  }

  getExpenseTypes() {
    return this.data.expense_types || [];
  }

  createExpenseType(typeData) {
    const newType = { id: `exp-${Date.now()}`, ...typeData };
    this.data.expense_types.push(newType);
    this.persist();
    return newType;
  }

  updateExpenseType(id, patch) {
    const index = this.data.expense_types.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.data.expense_types[index] = { ...this.data.expense_types[index], ...patch };
    this.persist();
    return this.data.expense_types[index];
  }

  deleteExpenseType(id) {
    const index = this.data.expense_types.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.data.expense_types.splice(index, 1);
    this.persist();
    return true;
  }

  getIncomeTypes() {
    return this.data.income_types || [];
  }

  createIncomeType(typeData) {
    const newType = { id: `inc-${Date.now()}`, ...typeData };
    this.data.income_types.push(newType);
    this.persist();
    return newType;
  }

  updateIncomeType(id, patch) {
    const index = this.data.income_types.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.data.income_types[index] = { ...this.data.income_types[index], ...patch };
    this.persist();
    return this.data.income_types[index];
  }

  deleteIncomeType(id) {
    const index = this.data.income_types.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.data.income_types.splice(index, 1);
    this.persist();
    return true;
  }

  // --- NAMES (Vendors, Employees, Customers) ---
  getNames(typeFilter) {
    let list = this.data.names || [];
    if (typeFilter) {
      list = list.filter(n => n.type.toLowerCase() === typeFilter.toLowerCase());
    }
    return list;
  }

  getNameById(id) {
    return this.data.names.find(n => n.id === id) || null;
  }

  createName(nameData) {
    const newName = {
      id: `name-${Date.now()}`,
      type: nameData.type || 'customer',
      name: nameData.name || '',
      companyName: nameData.companyName || '',
      email: nameData.email || '',
      phone: nameData.phone || '',
      address: nameData.address || '',
      notes: nameData.notes || '',
      createdAt: new Date().toISOString()
    };
    this.data.names.unshift(newName);
    this.persist();
    return newName;
  }

  updateName(id, patch) {
    const index = this.data.names.findIndex(n => n.id === id);
    if (index === -1) return null;
    this.data.names[index] = { ...this.data.names[index], ...patch };
    this.persist();
    return this.data.names[index];
  }

  deleteName(id) {
    const index = this.data.names.findIndex(n => n.id === id);
    if (index === -1) return false;
    this.data.names.splice(index, 1);
    this.persist();
    return true;
  }

  // --- ITEMS CATALOG ---
  getItems() {
    return this.data.items || [];
  }

  getItemById(id) {
    return this.data.items.find(i => i.id === id) || null;
  }

  createItem(itemData) {
    const newItem = {
      id: `item-${Date.now()}`,
      name: itemData.name || '',
      sku: itemData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      type: itemData.type || 'Product',
      unitPrice: parseFloat(itemData.unitPrice) || 0,
      description: itemData.description || '',
      taxable: itemData.taxable !== undefined ? Boolean(itemData.taxable) : true,
      hasLogo: itemData.hasLogo !== undefined ? Boolean(itemData.hasLogo) : true,
      logoUrl: itemData.logoUrl || '/logo.png',
      createdAt: new Date().toISOString()
    };
    this.data.items.unshift(newItem);
    this.persist();
    return newItem;
  }

  updateItem(id, patch) {
    const index = this.data.items.findIndex(i => i.id === id);
    if (index === -1) return null;
    this.data.items[index] = {
      ...this.data.items[index],
      ...patch,
      unitPrice: patch.unitPrice !== undefined ? parseFloat(patch.unitPrice) : this.data.items[index].unitPrice,
      taxable: patch.taxable !== undefined ? Boolean(patch.taxable) : this.data.items[index].taxable,
      hasLogo: patch.hasLogo !== undefined ? Boolean(patch.hasLogo) : this.data.items[index].hasLogo,
      logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : this.data.items[index].logoUrl
    };
    this.persist();
    return this.data.items[index];
  }

  deleteItem(id) {
    const index = this.data.items.findIndex(i => i.id === id);
    if (index === -1) return false;
    this.data.items.splice(index, 1);
    this.persist();
    return true;
  }

  // --- ORDERS (Quotes, Invoices, Purchases) ---
  getOrders(typeFilter, statusFilter) {
    let list = (this.data.orders || []).map(order => {
      const contact = this.getNameById(order.nameId);
      return {
        ...order,
        contactName: contact ? (contact.companyName ? `${contact.companyName} (${contact.name})` : contact.name) : 'Unknown Contact',
        contactEmail: contact ? contact.email : '',
        contactAddress: contact ? contact.address : ''
      };
    });

    if (typeFilter) {
      list = list.filter(o => o.orderType.toLowerCase() === typeFilter.toLowerCase());
    }
    if (statusFilter) {
      list = list.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return list;
  }

  getOrderById(id) {
    const order = this.data.orders.find(o => o.id === id);
    if (!order) return null;
    const contact = this.getNameById(order.nameId);
    return {
      ...order,
      contact: contact || null,
      contactName: contact ? (contact.companyName ? `${contact.companyName} (${contact.name})` : contact.name) : 'Unknown Contact'
    };
  }

  getNextOrderNumber(orderType) {
    const prefix = orderType === 'invoice' ? 'INV' : orderType === 'quote' ? 'QTE' : 'PO';
    const year = new Date().getFullYear();
    const existing = this.data.orders.filter(o => o.orderType === orderType);
    const count = existing.length + 1;
    return `${prefix}-${year}-${String(count).padStart(3, '0')}`;
  }

  calculateOrderTotals(lineItems, useSalesTax, taxPercentage) {
    let subtotal = 0;
    let taxableSubtotal = 0;

    const computedItems = (lineItems || []).map((item, idx) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const amount = Math.round(qty * price * 100) / 100;
      subtotal += amount;
      if (item.taxable !== false) {
        taxableSubtotal += amount;
      }
      return {
        id: item.id || `li-${Date.now()}-${idx}`,
        itemId: item.itemId || null,
        description: item.description || '',
        quantity: qty,
        unitPrice: price,
        amount,
        taxable: item.taxable !== false
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    const taxRate = useSalesTax ? (parseFloat(taxPercentage) || 0) / 100 : 0;
    const taxAmount = Math.round(taxableSubtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    return {
      lineItems: computedItems,
      subtotal,
      taxAmount,
      total
    };
  }

  createOrder(orderData) {
    const taxSettings = this.data.settings.tax;
    const useSalesTax = orderData.useSalesTax !== undefined ? Boolean(orderData.useSalesTax) : taxSettings.useSalesTax;
    const taxPercentage = orderData.taxPercentage !== undefined ? parseFloat(orderData.taxPercentage) : taxSettings.taxPercentage;
    const taxName = orderData.taxName || taxSettings.taxName || 'Sales Tax';

    const totals = this.calculateOrderTotals(orderData.lineItems, useSalesTax, taxPercentage);
    const defaultMsg = this.data.settings.orderMessages[orderData.orderType] || '';

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderData.orderNumber || this.getNextOrderNumber(orderData.orderType || 'invoice'),
      orderType: orderData.orderType || 'invoice',
      nameId: orderData.nameId || '',
      date: orderData.date || new Date().toISOString().split('T')[0],
      dueDate: orderData.dueDate || new Date(Date.now() + (this.data.settings.defaults.defaultDueDays || 30) * 86400000).toISOString().split('T')[0],
      status: orderData.status || 'Draft',
      notes: orderData.notes || '',
      customMessage: orderData.customMessage !== undefined ? orderData.customMessage : defaultMsg,
      useSalesTax,
      taxPercentage,
      taxName,
      lineItems: totals.lineItems,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      amountPaid: parseFloat(orderData.amountPaid) || 0,
      balanceDue: Math.max(0, totals.total - (parseFloat(orderData.amountPaid) || 0)),
      createdAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);
    this.persist();
    return this.getOrderById(newOrder.id);
  }

  updateOrder(id, patch) {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const current = this.data.orders[index];
    const useSalesTax = patch.useSalesTax !== undefined ? Boolean(patch.useSalesTax) : current.useSalesTax;
    const taxPercentage = patch.taxPercentage !== undefined ? parseFloat(patch.taxPercentage) : current.taxPercentage;
    const lineItems = patch.lineItems !== undefined ? patch.lineItems : current.lineItems;

    const totals = this.calculateOrderTotals(lineItems, useSalesTax, taxPercentage);
    const amountPaid = patch.amountPaid !== undefined ? parseFloat(patch.amountPaid) : current.amountPaid;
    const balanceDue = Math.max(0, Math.round((totals.total - amountPaid) * 100) / 100);

    let status = patch.status || current.status;
    if (balanceDue <= 0 && totals.total > 0) {
      status = 'Paid';
    } else if (amountPaid > 0 && amountPaid < totals.total && status === 'Paid') {
      status = 'Partially Paid';
    }

    this.data.orders[index] = {
      ...current,
      ...patch,
      useSalesTax,
      taxPercentage,
      lineItems: totals.lineItems,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      amountPaid,
      balanceDue,
      status,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return this.getOrderById(id);
  }

  deleteOrder(id) {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index === -1) return false;
    this.data.orders.splice(index, 1);
    this.persist();
    return true;
  }

  // --- TRANSACTIONS & RECONCILIATION ---
  getTransactions(typeFilter) {
    let list = (this.data.transactions || []).map(tx => {
      const contact = this.getNameById(tx.nameId);
      const linkedOrder = tx.orderId ? this.data.orders.find(o => o.id === tx.orderId) : null;
      return {
        ...tx,
        contactName: contact ? (contact.companyName ? `${contact.companyName} (${contact.name})` : contact.name) : 'N/A',
        orderNumber: linkedOrder ? linkedOrder.orderNumber : null,
        orderType: linkedOrder ? linkedOrder.orderType : null
      };
    });

    if (typeFilter) {
      list = list.filter(t => t.type.toLowerCase() === typeFilter.toLowerCase());
    }
    return list;
  }

  createTransaction(txData) {
    const newTx = {
      id: `tx-${Date.now()}`,
      type: txData.type || 'income', // income or expense
      date: txData.date || new Date().toISOString().split('T')[0],
      nameId: txData.nameId || null,
      incomeTypeId: txData.incomeTypeId || null,
      incomeTypeName: txData.incomeTypeName || '',
      expenseTypeId: txData.expenseTypeId || null,
      expenseTypeName: txData.expenseTypeName || '',
      amount: parseFloat(txData.amount) || 0,
      taxAmount: parseFloat(txData.taxAmount) || 0,
      orderId: txData.orderId || null,
      reference: txData.reference || '',
      notes: txData.notes || '',
      createdAt: new Date().toISOString()
    };

    // Auto-reconciliation: if transaction is linked to an invoice/order, update order paid amount
    if (newTx.orderId) {
      const order = this.data.orders.find(o => o.id === newTx.orderId);
      if (order) {
        const newPaid = Math.round(((order.amountPaid || 0) + newTx.amount) * 100) / 100;
        const newBalance = Math.max(0, Math.round((order.total - newPaid) * 100) / 100);
        order.amountPaid = newPaid;
        order.balanceDue = newBalance;
        if (newBalance <= 0) {
          order.status = 'Paid';
        } else if (newPaid > 0) {
          order.status = 'Partially Paid';
        }
      }
    }

    this.data.transactions.unshift(newTx);
    this.persist();
    return newTx;
  }

  deleteTransaction(id) {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index === -1) return false;
    const tx = this.data.transactions[index];

    // Revert reconciled amount if linked to an order
    if (tx.orderId) {
      const order = this.data.orders.find(o => o.id === tx.orderId);
      if (order) {
        order.amountPaid = Math.max(0, Math.round(((order.amountPaid || 0) - tx.amount) * 100) / 100);
        order.balanceDue = Math.max(0, Math.round((order.total - order.amountPaid) * 100) / 100);
        if (order.amountPaid === 0) {
          order.status = 'Sent';
        } else if (order.balanceDue > 0) {
          order.status = 'Partially Paid';
        }
      }
    }

    this.data.transactions.splice(index, 1);
    this.persist();
    return true;
  }

  // --- DASHBOARD ANALYTICS ---
  getDashboardStats() {
    const orders = this.data.orders || [];
    const transactions = this.data.transactions || [];

    const totalInvoices = orders.filter(o => o.orderType === 'invoice');
    const totalQuotes = orders.filter(o => o.orderType === 'quote');
    const totalPurchases = orders.filter(o => o.orderType === 'purchase');

    const outstandingInvoices = totalInvoices.filter(o => o.status !== 'Paid' && o.status !== 'Cancelled');
    const outstandingAmount = outstandingInvoices.reduce((sum, o) => sum + (o.balanceDue || 0), 0);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netProfit = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // Tax collected on invoices vs Tax paid on expenses
    const taxCollected = totalInvoices
      .filter(o => o.status === 'Paid')
      .reduce((sum, o) => sum + (o.taxAmount || 0), 0);

    const taxPaidOnExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.taxAmount || 0), 0);

    const netTaxOwed = Math.max(0, Math.round((taxCollected - taxPaidOnExpenses) * 100) / 100);

    // Recent activity
    const recentOrders = this.getOrders().slice(0, 5);
    const recentTransactions = this.getTransactions().slice(0, 5);

    // Monthly income vs expenses breakdown
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map((month, idx) => {
      const mStr = String(idx + 1).padStart(2, '0');
      const inc = transactions
        .filter(t => t.type === 'income' && t.date.startsWith(`${currentYear}-${mStr}`))
        .reduce((sum, t) => sum + t.amount, 0);
      const exp = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(`${currentYear}-${mStr}`))
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        month,
        income: Math.round(inc * 100) / 100,
        expense: Math.round(exp * 100) / 100,
        profit: Math.round((inc - exp) * 100) / 100
      };
    });

    return {
      outstandingAmount: Math.round(outstandingAmount * 100) / 100,
      outstandingCount: outstandingInvoices.length,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit,
      taxCollected: Math.round(taxCollected * 100) / 100,
      taxPaidOnExpenses: Math.round(taxPaidOnExpenses * 100) / 100,
      netTaxOwed,
      counts: {
        invoices: totalInvoices.length,
        quotes: totalQuotes.length,
        purchases: totalPurchases.length,
        customers: (this.data.names || []).filter(n => n.type === 'customer').length,
        vendors: (this.data.names || []).filter(n => n.type === 'vendor').length,
        employees: (this.data.names || []).filter(n => n.type === 'employee').length,
        items: (this.data.items || []).length
      },
      recentOrders,
      recentTransactions,
      monthlyData
    };
  }

  // --- GOOGLE SHEETS EXPORT / IMPORT ALL DATA ---
  getAllData() {
    return this.data;
  }

  loadAllData(newData) {
    this.data = { ...this.data, ...newData };
    this.persist();
  }
}

const store = new DataStore();
module.exports = store;
