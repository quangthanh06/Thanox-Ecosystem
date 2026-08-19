import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Serve static assets with caching
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true,
}));

// Fallback to index.html for Single Page Application client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Thanox Production Server] Running on http://localhost:${PORT} and http://127.0.0.1:${PORT}`);
});
