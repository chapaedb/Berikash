# Berikash 🛒

> **Save Money. Save Food.** — Connecting Ethiopian supermarkets with local shoppers through discounted near-expiry products.

## What is Berikash?

Berikash is a platform that connects supermarkets in Addis Ababa with consumers by making discounted products nearing their expiration dates visible to the wider community. Instead of only in-store shoppers discovering clearance items, Berikash extends those promotions to digital channels — web and Telegram.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **Frontend** | React (Vite), Vanilla CSS |
| **Bot** | Telegraf (Telegram Bot API) |
| **Auth** | JWT, bcrypt |
| **Jobs** | node-cron (auto-expiry) |

## Project Structure

```
Berikash/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── src/
│   │   ├── config/            # DB, env validation, constants
│   │   ├── controllers/       # Auth, Store, Product, Search, Admin
│   │   ├── middleware/         # Auth guard, error handler, upload, validation
│   │   ├── models/            # User, Store, Product, Category (Mongoose)
│   │   ├── routes/            # Route aggregator + domain routes
│   │   ├── services/          # Telegram bot, cron jobs
│   │   └── utils/             # ApiError, helpers, validators, seeders
│   └── uploads/               # Local file storage (gitignored)
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, ProductCard, StoreDashboard, AuthModal
│   │   ├── context/           # AuthContext (JWT state management)
│   │   ├── services/          # Axios API client
│   │   └── App.jsx            # Main SPA with tab navigation
│   └── index.html
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Telegram Bot Token (optional, from [@BotFather](https://t.me/BotFather))

### Setup

```bash
# Clone
git clone https://github.com/chapaedb/Berikash.git
cd Berikash

# Backend
cd backend
npm install
cp .env.example .env   # Edit with your MongoDB URI and secrets
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables (`backend/.env`)

```env
MONGO_URI=mongodb://127.0.0.1:27017/berikash
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register user | Public |
| POST | `/api/v1/auth/login` | Login | Public |
| GET | `/api/v1/auth/me` | Get profile | JWT |
| GET | `/api/v1/stores` | List verified stores | Public |
| GET | `/api/v1/stores/nearby` | Geo-based nearby stores | Public |
| POST | `/api/v1/stores` | Register store | Store Owner |
| GET | `/api/v1/search` | Search deals | Public |
| GET | `/api/v1/search/trending` | Top discounts | Public |
| POST | `/api/v1/products` | Post deal | Store Owner |
| GET | `/api/v1/categories` | All categories | Public |
| GET | `/api/v1/admin/stats` | Platform analytics | Admin |

## License

MIT
