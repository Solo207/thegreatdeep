const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.resolve(__dirname, '../client/dist');

// API routes
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Serve static files from ../client/dist
app.use(express.static(distPath));

// Catch-all returns index.html for any non-API path
app.get('{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

