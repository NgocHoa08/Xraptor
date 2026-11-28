import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import app, { container } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = container.config.port;

// Serve built frontend in standalone production mode if dist exists
const distDir = path.resolve(__dirname, '../dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const gatewayMode = container.services.paymentGatewayFactory.getCapabilities().vnpayMode;

app.listen(PORT, () => {
  console.log(
    `🚀 Xraptor API (Clean Architecture) running at http://localhost:${PORT} [DB: ${container.config.dbMode.toUpperCase()} | Payment: ${gatewayMode}]`
  );
});
