const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { config, validateEnv } = require('./config/env');
const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

validateEnv();

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Liveness probe (used by CI smoke test; no auth, no DB).
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

// Auth routes live under /auth; everything else under /api.
app.use('/auth', require('./routes/authRoutes'));
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

// Don't bind a port when imported (e.g. CI smoke `require('./app')`).
if (require.main === module) {
  // firebaseAdmin is imported here so any init failure surfaces at boot,
  // not on the first request. Skipped under CI (no service-account creds).
  if (process.env.CI !== 'true') {
    require('./firebaseAdmin');
  }
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}

module.exports = app;
