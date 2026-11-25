import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app.js';
import store from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

// Serve built frontend in standalone production mode if dist exists
const distDir = path.resolve(__dirname, '../dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Xraptor Backend API running at http://localhost:${PORT} [DB: ${store.mode.toUpperCase()}]`);
});
