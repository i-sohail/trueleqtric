// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const leadsRoutes = require('./routes/leads');
const quotationsRoutes = require('./routes/quotations');
const salespoRoutes = require('./routes/salespo');
const procurementRoutes = require('./routes/procurement');
const inventoryRoutes = require('./routes/inventory');
const deliveryRoutes = require('./routes/delivery');
const arRoutes = require('./routes/ar');
const apRoutes = require('./routes/ap');
const customersRoutes = require('./routes/customers');
const vendorsRoutes = require('./routes/vendors');
const catalogRoutes = require('./routes/catalog');
const pricingRoutes = require('./routes/pricing');
const bglcRoutes = require('./routes/bglc');
const tendersRoutes = require('./routes/tenders');
const documentsRoutes = require('./routes/documents');
const paymentScheduleRoutes = require('./routes/paymentSchedule');
const prodTrackingRoutes = require('./routes/prodTracking');
const commissionsRoutes = require('./routes/commissions');
const vendorScoresRoutes = require('./routes/vendorScores');
const creditMonitorRoutes = require('./routes/creditMonitor');
const cashFlowRoutes = require('./routes/cashFlow');
const analyticsRoutes = require('./routes/analytics');
const listsRoutes = require('./routes/lists');
const sellersRoutes = require('./routes/sellers');
const tasksRoutes = require('./routes/tasks');
const reportsRoutes = require('./routes/reports');
const trashRoutes = require('./routes/trash');
const accessRoutes = require('./routes/access');

const app = express();

// Connect to Prisma Database
const prisma = require('./utils/prisma');

prisma.$connect()
  .then(() => {
    logger.info('🐘 Connected to Supabase PostgreSQL Database');
  })
  .catch((error) => {
    logger.error('❌ Failed to connect to Database. Please check DATABASE_URL environment variable.', error);
    // On Vercel, we don't want to exit(1) as it causes FUNCTION_INVOCATION_FAILED
  });

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/salespo', salespoRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/ar', arRoutes);
app.use('/api/ap', apRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/bglc', bglcRoutes);
app.use('/api/tenders', tendersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/payment-schedules', paymentScheduleRoutes);
app.use('/api/prod-tracking', prodTrackingRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/vendor-scores', vendorScoresRoutes);
app.use('/api/credit-monitor', creditMonitorRoutes);
app.use('/api/cash-flow', cashFlowRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/access', accessRoutes);

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Trueleqtric server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
