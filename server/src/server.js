const express = require('express');
const cors = require('cors');
const path = require('path');

const settingsRoute = require('./routes/settings');
const typesRoute = require('./routes/types');
const namesRoute = require('./routes/names');
const itemsRoute = require('./routes/items');
const ordersRoute = require('./routes/orders');
const transactionsRoute = require('./routes/transactions');
const dashboardRoute = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/settings', settingsRoute);
app.use('/api/types', typesRoute);
app.use('/api/names', namesRoute);
app.use('/api/items', itemsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/transactions', transactionsRoute);
app.use('/api/dashboard', dashboardRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'Business in a Box Backend' });
});

// Serve frontend in production if built
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, err => {
    if (err) {
      res.status(200).send('Business in a Box Backend API Server Running. Please start or build client.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Business in a Box server listening on http://localhost:${PORT}`);
});
