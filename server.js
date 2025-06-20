require("dotenv").config();
const express = require('express');
const { createCanvas, registerFont } = require('canvas');
const rateLimit = require('express-rate-limit');

registerFont('./fonts/bell-mt.ttf', { family: 'Bell MT' });

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY

app.use(express.json());

// 1. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' }
});
app.use(limiter);

// 2. Block all non-POST (except '/')
app.use((req, res, next) => {
  if (req.path !== '/' && req.method !== 'POST') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// 3. API Key Middleware
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/generate') {
    const userKey = req.headers['x-api-key'];
    if (!apiKey || !userKey || userKey !== apiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  next();
});

// 4. Image Generator Endpoint
app.post('/generate', (req, res) => {
  try {
    const {
      fontFamily = 'Arial',
      fontSize = 24,
      textColor = '#000000',
      bgColor = '#ffffff',
      text = 'Hello<br>World!',
      placement = 'center',
      width = 800,
      height = 400,
      format = 'svg',
      filename = 'image'
    } = req.body;

    const safeWidth = Math.min(width, 1000);
    const safeHeight = Math.min(height, 1000);
    const safeFontSize = Math.min(Math.max(fontSize, 8), 72);
    const isSVG = format.toLowerCase() === 'svg';

    const canvas = createCanvas(safeWidth, safeHeight, isSVG ? 'svg' : undefined);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, safeWidth, safeHeight);

    ctx.font = `${safeFontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;

    const lines = text.split(/<br\s*\/?>/i);
    const lineHeight = safeFontSize * 1.2;
    const textHeight = lines.length * lineHeight;
    const padding = 20;

    let x = 0, y = 0;

    switch (placement) {
      case 'top-left':
        x = padding;
        y = padding + safeFontSize;
        ctx.textAlign = 'left';
        break;
      case 'top-right':
        x = safeWidth - padding;
        y = padding + safeFontSize;
        ctx.textAlign = 'right';
        break;
      case 'bottom-left':
        x = padding;
        y = safeHeight - textHeight - padding + safeFontSize;
        ctx.textAlign = 'left';
        break;
      case 'bottom-right':
        x = safeWidth - padding;
        y = safeHeight - textHeight - padding + safeFontSize;
        ctx.textAlign = 'right';
        break;
      case 'center':
      default:
        x = safeWidth / 2;
        y = (safeHeight - textHeight) / 2 + safeFontSize;
        ctx.textAlign = 'center';
        break;
    }

    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lineHeight);
    });

    let contentType = '';
    let ext = format.toLowerCase();
    let buffer;

    if (ext === 'svg') {
      contentType = 'image/svg+xml';
      buffer = canvas.toBuffer('image/svg+xml');
    } else if (ext === 'jpeg' || ext === 'jpg') {
      contentType = 'image/jpeg';
      ext = 'jpg';
      buffer = canvas.toBuffer('image/jpeg');
    } else {
      contentType = 'image/png';
      ext = 'png';
      buffer = canvas.toBuffer('image/png');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${ext}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Placeholder Image API is running securely.');
});

app.listen(port, () => {
  console.log(`Secure Image API running on port ${port}`);
});