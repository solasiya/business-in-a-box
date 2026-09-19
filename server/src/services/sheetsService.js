const { google } = require('googleapis');
const store = require('../db/store');

/**
 * Google Sheets Service for Business in a Box
 */
class GoogleSheetsService {
  getAuth(credentials) {
    if (!credentials.clientEmail || !credentials.privateKey) {
      throw new Error('Service Account client email and private key are required');
    }

    const formattedKey = credentials.privateKey.replace(/\\n/g, '\n');
    return new google.auth.JWT({
      email: credentials.clientEmail,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }

  /**
   * Test connection to a Google Sheet
   */
  async testConnection(sheetId, credentials) {
    try {
      if (!sheetId) {
        return { success: false, error: 'Sheet ID is required' };
      }

      if (!credentials.clientEmail || !credentials.privateKey) {
        return {
          success: false,
          error: 'Google Service Account credentials (Client Email and Private Key) are required.'
        };
      }

      const auth = this.getAuth(credentials);
      const sheets = google.sheets({ version: 'v4', auth });
      const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });

      return {
        success: true,
        title: res.data.properties.title,
        sheetCount: res.data.sheets.length,
        message: `Successfully connected to Google Sheet: "${res.data.properties.title}"`
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to authenticate with Google Sheets API'
      };
    }
  }

  /**
   * Export all local database records into Google Sheet tabs
   */
  async exportToSheets(sheetId, credentials) {
    try {
      const auth = this.getAuth(credentials);
      const sheets = google.sheets({ version: 'v4', auth });

      const allData = store.getAllData();

      // Ensure required tabs exist (cached after first check to avoid rate limits)
      if (!this.verifiedSheets) this.verifiedSheets = {};
      if (!this.verifiedSheets[sheetId]) {
        try {
          const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
          const existingTitles = sheetMeta.data.sheets.map(s => s.properties.title);

          const requiredTabs = ['Names', 'Items', 'Orders', 'Transactions', 'Settings'];
          const requests = [];

          for (const tab of requiredTabs) {
            if (!existingTitles.includes(tab)) {
              requests.push({
                addSheet: {
                  properties: { title: tab }
                }
              });
            }
          }

          if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: sheetId,
              resource: { requests }
            });
          }
          this.verifiedSheets[sheetId] = true;
        } catch (metaErr) {
          if (metaErr.status === 429 || (metaErr.message && metaErr.message.includes('Quota exceeded'))) {
            console.warn('Google Sheets API Rate Limit (429) encountered. Auto-sync will resume shortly.');
            return { success: false, error: 'Google Sheets rate limit reached. Auto-sync will retry automatically.' };
          }
        }
      }

      // Format data for Names
      const namesHeader = ['ID', 'Type', 'Name', 'Company Name', 'Email', 'Phone', 'Address', 'Notes'];
      const namesRows = (allData.names || []).map(n => [
        n.id || '', n.type || '', n.name || '', n.companyName || '', n.email || '', n.phone || '', n.address || '', n.notes || ''
      ]);

      // Format data for Items
      const itemsHeader = ['ID', 'SKU', 'Name', 'Type', 'Unit Price', 'Description', 'Taxable'];
      const itemsRows = (allData.items || []).map(i => [
        i.id || '', i.sku || '', i.name || '', i.type || '', i.unitPrice || 0, i.description || '', i.taxable ? 'YES' : 'NO'
      ]);

      // Format data for Orders (including serialized lineItems in col 13)
      const ordersHeader = ['ID', 'Order Number', 'Type', 'Name ID', 'Date', 'Due Date', 'Status', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance Due', 'LineItemsJSON'];
      const ordersRows = (allData.orders || []).map(o => [
        o.id || '', o.orderNumber || '', o.orderType || '', o.nameId || '', o.date || '', o.dueDate || '', o.status || '', o.subtotal || 0, o.taxAmount || 0, o.total || 0, o.amountPaid || 0, o.balanceDue || 0, JSON.stringify(o.lineItems || [])
      ]);

      // Format data for Transactions
      const txHeader = ['ID', 'Type', 'Date', 'Name ID', 'Category Type', 'Amount', 'Tax Amount', 'Order ID', 'Reference', 'Notes'];
      const txRows = (allData.transactions || []).map(t => [
        t.id || '', t.type || '', t.date || '', t.nameId || '', t.incomeTypeName || t.expenseTypeName || '', t.amount || 0, t.taxAmount || 0, t.orderId || '', t.reference || '', t.notes || ''
      ]);

      // Format Settings
      const settingsHeader = ['Key', 'Value'];
      const settingsRows = [
        ['Company Name', allData.settings?.company?.name || ''],
        ['Company Email', allData.settings?.company?.email || ''],
        ['Tax Name', allData.settings?.tax?.taxName || ''],
        ['Tax Rate %', allData.settings?.tax?.taxPercentage || 0],
        ['Last Exported', new Date().toISOString()],
        ['FullSettingsJSON', JSON.stringify(allData.settings || {})]
      ];

      // Update all tabs
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: [
            { range: 'Names!A1', values: [namesHeader, ...namesRows] },
            { range: 'Items!A1', values: [itemsHeader, ...itemsRows] },
            { range: 'Orders!A1', values: [ordersHeader, ...ordersRows] },
            { range: 'Transactions!A1', values: [txHeader, ...txRows] },
            { range: 'Settings!A1', values: [settingsHeader, ...settingsRows] }
          ]
        }
      });

      // Update settings with active connection status
      const updatedGsConfig = {
        sheetId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
        connected: true,
        lastSynced: new Date().toISOString()
      };

      store.updateSettings({
        googleSheets: updatedGsConfig
      });

      return {
        success: true,
        data: updatedGsConfig,
        message: 'Successfully exported and synchronized database to Google Sheets!'
      };
    } catch (err) {
      console.error('Export to Google Sheets failed:', err);
      return {
        success: false,
        error: err.message || 'Export to Google Sheets failed'
      };
    }
  }

  /**
   * Import database records from Google Sheet tabs into local memory/store
   */
  async importFromSheets(sheetId, credentials) {
    try {
      if (!sheetId || !credentials.clientEmail || !credentials.privateKey) {
        return { success: false, error: 'Sheet ID and Service Account credentials required to import.' };
      }

      const auth = this.getAuth(credentials);
      const sheets = google.sheets({ version: 'v4', auth });

      // Fetch all ranges
      const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges: ['Names!A1:Z1000', 'Items!A1:Z1000', 'Orders!A1:Z1000', 'Transactions!A1:Z1000', 'Settings!A1:Z100']
      });

      const valueRanges = res.data.valueRanges || [];
      const getRangeValues = (title) => {
        const found = valueRanges.find(r => r.range && r.range.startsWith(title));
        return (found && found.values) ? found.values : [];
      };

      // 1. Parse Names
      const namesRows = getRangeValues('Names');
      const names = [];
      if (namesRows.length > 1) {
        for (let i = 1; i < namesRows.length; i++) {
          const row = namesRows[i];
          if (row[0]) {
            names.push({
              id: row[0],
              type: row[1] || 'customer',
              name: row[2] || '',
              companyName: row[3] || '',
              email: row[4] || '',
              phone: row[5] || '',
              address: row[6] || '',
              notes: row[7] || ''
            });
          }
        }
      }

      // 2. Parse Items
      const itemsRows = getRangeValues('Items');
      const items = [];
      if (itemsRows.length > 1) {
        for (let i = 1; i < itemsRows.length; i++) {
          const row = itemsRows[i];
          if (row[0]) {
            items.push({
              id: row[0],
              sku: row[1] || '',
              name: row[2] || '',
              type: row[3] || 'Service',
              unitPrice: parseFloat(row[4]) || 0,
              description: row[5] || '',
              taxable: row[6] === 'YES' || row[6] === 'true' || row[6] === true
            });
          }
        }
      }

      // 3. Parse Orders
      const ordersRows = getRangeValues('Orders');
      const orders = [];
      if (ordersRows.length > 1) {
        for (let i = 1; i < ordersRows.length; i++) {
          const row = ordersRows[i];
          if (row[0]) {
            let lineItems = [];
            if (row[12]) {
              try {
                lineItems = JSON.parse(row[12]);
              } catch (_) {}
            }

            orders.push({
              id: row[0],
              orderNumber: row[1] || '',
              orderType: row[2] || 'invoice',
              nameId: row[3] || '',
              date: row[4] || '',
              dueDate: row[5] || '',
              status: row[6] || 'Draft',
              subtotal: parseFloat(row[7]) || 0,
              taxAmount: parseFloat(row[8]) || 0,
              total: parseFloat(row[9]) || 0,
              amountPaid: parseFloat(row[10]) || 0,
              balanceDue: parseFloat(row[11]) || 0,
              lineItems
            });
          }
        }
      }

      // 4. Parse Transactions
      const txRows = getRangeValues('Transactions');
      const transactions = [];
      if (txRows.length > 1) {
        for (let i = 1; i < txRows.length; i++) {
          const row = txRows[i];
          if (row[0]) {
            const isIncome = row[1] === 'income';
            transactions.push({
              id: row[0],
              type: row[1] || 'income',
              date: row[2] || '',
              nameId: row[3] || '',
              incomeTypeName: isIncome ? row[4] : undefined,
              expenseTypeName: !isIncome ? row[4] : undefined,
              amount: parseFloat(row[5]) || 0,
              taxAmount: parseFloat(row[6]) || 0,
              orderId: row[7] || '',
              reference: row[8] || '',
              notes: row[9] || ''
            });
          }
        }
      }

      // 5. Parse Settings
      const settingsRows = getRangeValues('Settings');
      let importedSettings = null;
      for (const row of settingsRows) {
        if (row[0] === 'FullSettingsJSON' && row[1]) {
          try {
            importedSettings = JSON.parse(row[1]);
          } catch (_) {}
        }
      }

      const currentSettings = store.getSettings();
      const updatedGsConfig = {
        sheetId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
        connected: true,
        lastSynced: new Date().toISOString()
      };

      const finalSettings = importedSettings ? {
        ...importedSettings,
        googleSheets: updatedGsConfig
      } : {
        ...currentSettings,
        googleSheets: updatedGsConfig
      };

      const existingData = store.getAllData();
      store.loadAllData({
        ...existingData,
        names: names.length > 0 ? names : existingData.names,
        items: items.length > 0 ? items : existingData.items,
        orders: orders.length > 0 ? orders : existingData.orders,
        transactions: transactions.length > 0 ? transactions : existingData.transactions,
        settings: finalSettings
      });

      return {
        success: true,
        data: updatedGsConfig,
        stats: {
          contacts: names.length,
          items: items.length,
          orders: orders.length,
          transactions: transactions.length
        },
        message: `Successfully imported and restored database from Google Sheets! (${names.length} contacts, ${items.length} items, ${orders.length} orders, ${transactions.length} transactions)`
      };
    } catch (err) {
      console.error('Import from Google Sheets failed:', err);
      return {
        success: false,
        error: err.message || 'Import from Google Sheets failed'
      };
    }
  }
}

const sheetsService = new GoogleSheetsService();
module.exports = sheetsService;
