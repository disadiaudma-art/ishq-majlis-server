require('dotenv').config();
const dns = require('dns');

// Use reliable public DNS to prevent querySrv ECONNREFUSED on restricted local DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const registrationsRouter = require('./routes/registrations');

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/registrations', registrationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    event: 'ഇശ്ഖ് മജ്‌ലിസ് (Ishq Majlis 2026)',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.name || 'IshqMajlis',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://disadiaudma_db_user:9QG7VeJfA6V1Sxns@cluster0.dq7uu3v.mongodb.net/IshqMajlis?retryWrites=true&w=majority';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`✅ MongoDB connected successfully to database: ${mongoose.connection.name}`);
    app.listen(PORT, () => {
      console.log(`🚀 Ishq Majlis Server running on http://localhost:${PORT}`);
      console.log(`📋 Registrations API: http://localhost:${PORT}/api/registrations`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
