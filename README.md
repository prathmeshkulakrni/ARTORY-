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

## 🔐 Environment Variables

You need to create `.env` files in both the `client` and `server` directories.

**`server/.env`**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/artory
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
    ├── middleware/         # Custom Express middleware (e.g., auth)
    ├── models/             # Mongoose schemas
    ├── routes/             # API route definitions
    ├── socket/             # Socket.io event handlers
    └── package.json
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
