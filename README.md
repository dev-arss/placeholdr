# Secure Placeholder Image API

This service allows safe image generation with API key, rate limiting, and resource caps to prevent abuse.

## 📦 Install
```bash
npm install
```

## 🚀 Run
```bash
node server.js
```

## 🔐 Use

Set `API_KEY` in Render environment or local `.env`.

Request with:
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: mysecret" \
  -o image.png \
  -d '{
    "text": "Hello<br>Secure World!",
    "filename": "secure",
    "format": "png"
  }'
```