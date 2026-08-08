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
          error: 'Google Service Account credentials (Client Email and Private Key) are required to test live sheet connection.'
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
   * Export all local data into Google Sheet tabs
   */
  async exportToSheets(sheetId, credentials) {
    try {
      const auth = this.getAuth(credentials);
      const sheets = google.sheets({ version: 'v4', auth });

      const allData = store.getAllData();

      // Ensure sheets exist
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

      // Format data for Names
      const namesHeader = ['ID', 'Type', 'Name', 'Company Name', 'Email', 'Phone', 'Address', 'Notes'];
      const namesRows = (allData.names || []).map(n => [
        n.id, n.type, n.name, n.companyName, n.email, n.phone, n.address, n.notes
      ]);

      // Format data for Items
      const itemsHeader = ['ID', 'SKU', 'Name', 'Type', 'Unit Price', 'Description', 'Taxable'];
      const itemsRows = (allData.items || []).map(i => [
        i.id, i.sku, i.name, i.type, i.unitPrice, i.description, i.taxable ? 'YES' : 'NO'
      ]);

      // Format data for Orders
      const ordersHeader = ['ID', 'Order Number', 'Type', 'Name ID', 'Date', 'Due Date', 'Status', 'Subtotal', 'Tax', 'Total', 'Paid', 'Balance Due'];
      const ordersRows = (allData.orders || []).map(o => [
        o.id, o.orderNumber, o.orderType, o.nameId, o.date, o.dueDate, o.status, o.subtotal, o.taxAmount, o.total, o.amountPaid, o.balanceDue
      ]);

      // Format data for Transactions
      const txHeader = ['ID', 'Type', 'Date', 'Name ID', 'Category Type', 'Amount', 'Tax Amount', 'Order ID', 'Reference', 'Notes'];
      const txRows = (allData.transactions || []).map(t => [
        t.id, t.type, t.date, t.nameId, t.incomeTypeName || t.expenseTypeName, t.amount, t.taxAmount, t.orderId || '', t.reference, t.notes
      ]);

      // Format Settings
      const settingsHeader = ['Key', 'Value'];
      const settingsRows = [
        ['Company Name', allData.settings.company.name],
        ['Company Email', allData.settings.company.email],
        ['Tax Name', allData.settings.tax.taxName],
        ['Tax Rate %', allData.settings.tax.taxPercentage],
        ['Last Exported', new Date().toISOString()]
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

      // Update settings with last synced
      store.updateSettings({
        googleSheets: {
          ...allData.settings.googleSheets,
          lastSynced: new Date().toISOString()
        }
      });

      return {
        success: true,
        message: 'Successfully exported and synced all database records to Google Sheets!'
      };
    } catch (err) {
      console.error('Export to sheets failed:', err);
      return {
        success: false,
        error: err.message || 'Export to Google Sheets failed'
      };
    }
  }
}

const sheetsService = new GoogleSheetsService();
module.exports = sheetsService;
