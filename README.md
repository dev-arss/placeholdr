
# 🖼️ Image Generator API

A secure Node.js API to dynamically generate stylized quote images (SVG, PNG, JPG) with rich text formatting, custom fonts, and layout positioning. Built for production with rate limiting, input validation, and API key protection.

---

## 🚀 Features

- Generate quote images with customizable:
  - Background color
  - Text color
  - Font family, size, style (`<strong>`, `<em>`)
  - Placement (`x`, `y`)
  - Format: `svg` (default), `png`, `jpg`, `jpeg`
- Multiple lines of text
- Special character support: `&mdash;`, `&ldquo;`, etc.
- API key authentication via header
- Built-in font: **Bell MT** with bold and italic
- Secured with input validation, rate limiting, and restricted routes

---

## 🛠️ Requirements

- Node.js (v16+ recommended)
- npm

---

## 📦 Installation

```bash
git clone https://github.com/yourusername/image-generator-api.git
cd image-generator-api
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the root:

```env
API_KEY=your_secure_key
```

---

## 📁 Folder Structure

```
project/
├── fonts/
│   ├── BellMT.ttf
│   ├── BellMT-Bold.ttf
│   ├── BellMT-Italic.ttf
├── .env
├── server.js
├── package.json
├── README.md
```

> 💡 Ensure all Bell MT font files are present inside the `fonts` folder.

---

## ▶️ Start the Server

```bash
node server.js
```

Server will start on: `http://localhost:3000`

---

## 📤 API Endpoint

### `POST /generate`

Generate an image with the specified parameters.

### 🔐 Headers

```http
x-api-key: your_secure_key
Content-Type: application/json
```

### 📝 JSON Body

```json
{
  "bgColor": "#1a1a1a",
  "textColor": "#ffffff",
  "width": 1080,
  "height": 1080,
  "fontFamily": "BellMT",
  "fontSize": 48,
  "format": "png",
  "texts": [
    {
      "content": "Healing isn’t <em>linear</em>.",
      "fontSize": "36",
      "x": "50%",
      "y": "40%"
    },
    {
      "content": "Neither is <strong>growth</strong>.",
      "x": "50%",
      "y": "60%"
    }
  ]
}
```

> ⚠️ `content` supports:
> - `<strong>` → bold  
> - `<em>` → italic  
> - Entities like `&mdash;`, `&ldquo;`, etc.  
> - Multiple `texts[]` to position different lines

---

## 📥 Sample Request

```bash
curl -X POST http://localhost:3000/generate   -H "x-api-key: your_secure_key"   -H "Content-Type: application/json"   -d @request.json --output output.png
```

---

## 📸 Output

- If `format: svg`, response is raw SVG text (`Content-Type: image/svg+xml`)
- If `format: png|jpg|jpeg`, response is a binary image (`Content-Type: image/png`)

---

## 🔒 Security

- ✅ Input validation via `zod`
- ✅ Rate limiting: max 20 requests/min per IP
- ✅ API key protection (`x-api-key` header)
- ✅ Max JSON size: 10KB
- ✅ All other paths return 403 Forbidden
- ✅ Helmet headers + no `x-powered-by`

---

## 📜 License

MIT — free to use, customize, and share.
