# Artory - AI-Powered Art Learning & Community Platform

Artory is a full-stack MERN application designed to be an AI-powered art learning and community platform. It provides artists with tools to learn, share their work, participate in competitions, and interact with an AI mentor, all within a modern, visually striking interface.

## 🚀 Key Features

- **AI-Powered Mentorship**: Get personalized feedback and guidance on your artwork from an integrated AI mentor using OpenAI.
- **3D Explore Gallery**: Immersive 3D artwork discovery experience built with Framer Motion and use-gesture.
- **Real-Time Community & Chat**: Direct messaging, group chats, and community channels with real-time updates powered by Socket.io.
- **Competitions & Lightbox View**: Participate in art competitions, submit artworks, and view submissions in full resolution using a custom lightbox viewer.
- **Camera-Based Identity Verification**: Secure identity verification flow capturing photos directly from the user's device camera.
- **Admin Dashboard**: Comprehensive moderation tools for user, community, and competition management.
- **Responsive Modern UI**: Beautiful dark-themed aesthetic with smooth animations and dynamic layouts using Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS, clsx, tailwind-merge
- **Animations & Interaction**: Framer Motion, @use-gesture/react
- **Routing**: React Router DOM
- **Real-time**: Socket.io-client
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Framework**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Real-time**: Socket.io
- **AI Integration**: OpenAI API
- **File Uploads**: Multer, Cloudinary

## 📦 Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- Cloudinary Account (for image uploads)
- OpenAI API Key (for AI Mentorship features)

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd artory1
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Seed Sample Data (MongoDB Atlas / Local)**
   Populate the database with sample users (Admin, Artist, Buyer), mock products, and a demo order.
   ```bash
   cd ../server
   npm run seed:data
   ```

## 🔐 Environment Variables

You need to create `.env` files in both the `client` and `server` directories.

**`server/.env`**
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/artory?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🎨 New E-Commerce & Production Hardening Features

We have completed an enterprise-grade extension to Artory's backend database structure and service layers:

### 1. Robust Mongoose Connection Setup (`server/config/db.js`)
- **Auto-Reconnect & State Handling**: Retries database connections with exponential backoffs (up to 5 retries).
- **Graceful Shutdown**: Automatically closes MongoDB active socket streams upon receiving `SIGINT` or `SIGTERM` signals.
- **Enhanced Console Messaging**: Structured logs indicating current cluster states with custom emojis.

### 2. Global Request Validation & Error Interception
- **Custom Schema Validator (`server/middleware/validate.js`)**: Intercepts payloads strictly at the router layer. Supports validation of body, query, and params.
- **Centralized Error Handler (`server/middleware/errorHandler.js`)**: Captures bad JSON requests, invalid MongoDB ObjectIds (`CastError`), duplicates (`11000`), validation rule breaches, and JWT token expirations, converting them into structured JSON error payloads.

### 3. Granular Access Control
- **Dynamic Role-Based Access Control (`server/middleware/auth.js`)**: The `authorizeRoles(...roles)` middleware lets you restrict routes dynamically (e.g. `protect`, `authorizeRoles('admin', 'mentor')`).

### 4. Advanced Schemas & Models
- **`User`** (`server/models/User.js`): User accounts supporting roles (`user`, `mentor`, `admin`).
- **`Admin`** (`server/models/Admin.js`): Handles fine-grained metadata, department assignments (`billing`, `content`), security tiers, and specific administrative log settings.
- **`Product`** (`server/models/Product.js`): E-commerce features tracking title, stock availability, category, price, and artist ownership. Employs text indexing over `title`, `description`, and `tags` for highly optimized query and search APIs.
- **`Order`** (`server/models/Order.js`): Handles transaction details, locking down historical purchase prices, delivery stages, and billing indicators.

---

## 🛍️ New API Reference

All requests and responses use JSON. Routes marked with 🔒 require a Bearer token in the `Authorization` header.

### 📦 Product Endpoints (`/api/products`)
* **`GET /api/products`** - Get all products. Supports pagination, keyword text search (`q`), category filters, and price ranges (`minPrice`/`maxPrice`).
* **`GET /api/products/:id`** - Retrieve single product details, populating artist metadata.
* **`POST /api/products`** 🔒 - List a new product for sale (Validator schema enforced).
* **`PUT /api/products/:id`** 🔒 - Update product listing (Enforces ownership or admin role).
* **`DELETE /api/products/:id`** 🔒 - Delete product listing (Enforces ownership or admin role).

### 🛒 Order Endpoints (`/api/orders`)
* **`POST /api/orders`** 🔒 - Place a new order. Features concurrency-safe stock deduction checks (preventing race conditions) with automated rollback should item processing fail.
* **`GET /api/orders/my-orders`** 🔒 - Customer's historical purchases with pagination.
* **`GET /api/orders/:id`** 🔒 - Order overview. Restricts access to the buying user or admins.
* **`GET /api/orders`** 🔒 - (Admin only) Detailed log of all marketplace operations.
* **`PUT /api/orders/:id/status`** 🔒 - (Admin only) Updates order delivery phase. Transitioning to `cancelled` triggers automatic restocking of items.

---

## 🚀 Running the Application

To run the application locally, you'll need two terminal windows.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## 📂 Project Structure

```
artory1/
├── client/                 # React Frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application views/routes
│   │   ├── services/       # API integration
│   │   └── ...
│   └── package.json
└── server/                 # Node.js/Express Backend
    ├── config/             # Database and service configurations
    ├── controllers/        # Request handlers
    ├── middleware/         # Custom Express middleware (e.g., auth, validation, errors)
    ├── models/             # Mongoose schemas (User, Admin, Product, Order)
    ├── routes/             # API route definitions
    ├── scripts/            # Database seed and backfill scripts
    ├── socket/             # Socket.io event handlers
    └── package.json
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
