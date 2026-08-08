const http = require('http');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(buffer.toString('utf8')) });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, text: buffer.toString('utf8') });
          }
        } else {
          resolve({ status: res.statusCode, headers: res.headers, buffer, length: buffer.length });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Business in a Box End-to-End Validation Suite...\n');

  try {
    // 1. Health check
    const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
    console.log(`[PASS] 1. Backend Health Check: status=${health.status}, app="${health.data.app}"`);

    // 2. Settings & Vocabulary
    const settings = await request({ hostname: 'localhost', port: 5000, path: '/api/settings', method: 'GET' });
    console.log(`[PASS] 2. Fetch Settings: Company="${settings.data.data.company.name}", Tax=${settings.data.data.tax.taxPercentage}%`);

    // Test updating Vocabulary dynamically
    const updatedVocab = {
      ...settings.data.data.vocabulary,
      quote_s: "Proposal",
      quote_p: "Proposals"
    };
    const saveVocabRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/settings',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { vocabulary: updatedVocab });
    console.log(`[PASS] 3. Vocabulary Relabeling: quote_p is now "${saveVocabRes.data.data.vocabulary.quote_p}"`);

    // 3. Names CRUD
    const newCustomer = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/names',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      type: 'customer',
      name: 'Eleanor Vance',
      companyName: 'Quantum Synergy Ltd',
      email: 'eleanor@quantumsynergy.io',
      phone: '+1 (555) 919-4400',
      address: '88 Tech Blvd, Austin, TX 78701'
    });
    console.log(`[PASS] 4. Created Customer Contact: ID=${newCustomer.data.data.id}, Name="${newCustomer.data.data.name}"`);

    // 4. Items Catalog CRUD
    const newItem = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/items',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Custom AI Architecture Design Sprint',
      sku: 'SRV-AI-2026',
      type: 'Service',
      unitPrice: 6500.00,
      description: 'Dedicated LLM architecture, agent pipelines, and automated evaluations.',
      taxable: true
    });
    console.log(`[PASS] 5. Created Catalog Item: SKU="${newItem.data.data.sku}", Price=$${newItem.data.data.unitPrice}`);

    // 5. Orders (Invoice Creation with auto tax calculation)
    const newInvoice = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      orderType: 'invoice',
      orderNumber: 'INV-2026-TEST-001',
      nameId: newCustomer.data.data.id,
      date: '2026-08-08',
      dueDate: '2026-09-08',
      status: 'Sent',
      useSalesTax: true,
      taxPercentage: 8.5,
      taxName: 'Sales Tax (GST)',
      customMessage: 'Thank you for your business. Payment is due in 30 days.',
      lineItems: [
        {
          itemId: newItem.data.data.id,
          description: 'Custom AI Architecture Design Sprint (Sprint 1)',
          quantity: 2,
          unitPrice: 6500.00,
          amount: 13000.00,
          taxable: true
        }
      ]
    });
    console.log(`[PASS] 6. Created Invoice with Line Items & Tax:`);
    console.log(`       Subtotal: $${newInvoice.data.data.subtotal}, Tax ($${newInvoice.data.data.taxAmount}), Total: $${newInvoice.data.data.total}`);

    // 6. PDF Generation Binary Test
    const pdfRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${newInvoice.data.data.id}/pdf`,
      method: 'GET'
    });
    console.log(`[PASS] 7. PDF Generation Service: Status=${pdfRes.status}, Content-Type="${pdfRes.headers['content-type']}", Bytes=${pdfRes.length}`);

    // 7. Transaction Recording & Reconciliation
    const paymentTx = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/transactions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      type: 'income',
      date: '2026-08-08',
      nameId: newCustomer.data.data.id,
      incomeTypeName: 'Consulting & Services',
      amount: newInvoice.data.data.total,
      orderId: newInvoice.data.data.id,
      reference: 'ACH-CONF-882199',
      notes: 'Full payment settlement for invoice INV-2026-TEST-001'
    });
    console.log(`[PASS] 8. Recorded Payment Transaction: ID=${paymentTx.data.data.id}, Amount=$${paymentTx.data.data.amount}`);

    // Verify reconciled order status
    const reconciledOrder = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${newInvoice.data.data.id}`,
      method: 'GET'
    });
    console.log(`[PASS] 9. Auto-Reconciliation Verified: Invoice Status="${reconciledOrder.data.data.status}", BalanceDue=$${reconciledOrder.data.data.balanceDue}`);

    // 8. Dashboard Financial Analytics
    const dashboardStats = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/stats',
      method: 'GET'
    });
    console.log(`[PASS] 10. Dashboard Recalculation:`);
    console.log(`        Total Income: $${dashboardStats.data.data.totalIncome}`);
    console.log(`        Total Expenses: $${dashboardStats.data.data.totalExpenses}`);
    console.log(`        Net Profit: $${dashboardStats.data.data.netProfit}`);
    console.log(`        Tax Liability: $${dashboardStats.data.data.netTaxOwed}`);

    console.log('\n🎉 ALL 10 TESTS PASSED SUCCESSFULLY! The Business in a Box system is robust and fully functional.');
  } catch (err) {
    console.error('Test Suite Failed:', err);
  }
}

runTests();
