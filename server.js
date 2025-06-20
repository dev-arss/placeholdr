const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.set('trust proxy', 1); // Trust first proxy

// Rate limiter
app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
}));

// Font loading
const fontRegular = fs.readFileSync(path.join(__dirname, 'fonts', 'bell-mt.ttf')).toString('base64');
const fontBold = fs.readFileSync(path.join(__dirname, 'fonts', 'bell-mt-bold.ttf')).toString('base64');
const fontItalic = fs.readFileSync(path.join(__dirname, 'fonts', 'bell-mt-italic.ttf')).toString('base64');

const fontStyleBlock = `
<style>
  @font-face {
    font-family: "Bell MT";
    src: url("data:font/ttf;base64,${fontRegular}") format("truetype");
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: "Bell MT";
    src: url("data:font/ttf;base64,${fontBold}") format("truetype");
    font-weight: bold;
    font-style: normal;
  }
  @font-face {
    font-family: "Bell MT";
    src: url("data:font/ttf;base64,${fontItalic}") format("truetype");
    font-weight: normal;
    font-style: italic;
  }
</style>
`;

// Input schema using Zod
const schema = z.object({
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontSize: z.number().min(1).max(200).optional(),
  fontFamily: z.string().optional(),
  width: z.number().min(1).max(2000),
  height: z.number().min(1).max(2000),
  format: z.enum(['svg', 'png', 'jpg', 'jpeg']).optional(),
  filename: z.string().optional(),
  texts: z.array(z.object({
    content: z.string().min(1).max(1000),
    fontSize: z.number().min(1).max(200).optional(),
    x: z.string().optional(),
    y: z.string().optional()
  }))
});

// Decode entities and handle formatting
function decodeEntities(text) {
  return text
    .replace(/&mdash;/g, '—')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/<em>(.*?)<\/em>/g, '<tspan font-style="italic">$1</tspan>')
    .replace(/<strong>(.*?)<\/strong>/g, '<tspan font-weight="bold">$1</tspan>');
}

app.post('/generate', async (req, res) => {
  let parsed;
  try {
    parsed = schema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid input', details: err.errors });
  }

  // Check API key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API key' });
  }

  const {
    bgColor = '#000000',
    textColor = '#ffffff',
    texts = [],
    fontFamily = 'Bell MT',
    fontSize = 48,
    width,
    height,
    format = 'svg',
    filename = 'output'
  } = parsed;

  const svgTexts = texts.map(t => {
    const x = t.x || '50%';
    const y = t.y || '50%';
    const content = decodeEntities(t.content || '');
    const size = t.fontSize || fontSize; // fallback to global fontSize
    return `<text x="${x}" y="${y}" text-anchor="left" fill="${textColor}" font-family="${fontFamily}" font-size="${size}" dominant-baseline="middle">${content}</text>`;
  }).join('\n');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  ${fontStyleBlock}
  <rect width="100%" height="100%" fill="${bgColor}" />
  ${svgTexts}
</svg>`.trim();

  if (format === 'svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  }

  try {
    const buffer = Buffer.from(svg);
    const image = sharp(buffer).resize(width, height);
    const imgBuffer = await image.toFormat(format).toBuffer();
    res.setHeader('Content-Type', `image/${format}`);
    res.send(imgBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to render image' });
  }
});

// All other routes forbidden
app.all('*', (req, res) => {
  res.status(403).json({ error: 'Forbidden' });
});

// Start server
app.listen(3000, () => console.log('Server running at http://localhost:3000'));
